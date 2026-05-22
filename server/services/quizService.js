const config = require('../config');
const { getDB, all, get: getOne, run: runQuery } = require('../db/database');
const { findInChapters } = require('./fileUtils');

function getQuiz(unitId) {
  const subPrefix = unitId.replace(/-part-.*/, '');
  const result = findInChapters(config.contentDir, 'quiz.json', subPrefix);
  return result ? JSON.parse(result) : null;
}

// Submit quiz answers and return results
async function submitQuiz(userId, unitId, answers) {
  await getDB();
  const quizData = getQuiz(unitId);
  if (!quizData?.questions) throw new Error('Quiz not found');

  const questions = quizData.questions;
  let totalScore = 0;
  let correctCount = 0;
  const wrongAnswers = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAns = answers[i] || [];
    const correctAnswers = q.blanks.map((b) => b.answer);

    let blanksWrong = [];
    let blankCorrect = 0;

    for (let j = 0; j < q.blanks.length; j++) {
      const userVal = (userAns[j] || '').trim().toLowerCase();
      const correctVal = q.blanks[j].answer.trim().toLowerCase();
      if (userVal === correctVal) {
        blankCorrect++;
      } else {
        blanksWrong.push(j);
      }
    }

    const isAllCorrect = blanksWrong.length === 0;
    const questionScore = q.blanks.length > 0 ? blankCorrect / q.blanks.length : 0;
    totalScore += questionScore;
    if (isAllCorrect) correctCount++;

    // Record attempt
    runQuery(
      'INSERT INTO quiz_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, blanks_wrong, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, unitId, q.id, q.type, JSON.stringify(userAns), JSON.stringify(correctAnswers), isAllCorrect ? 1 : 0, JSON.stringify(blanksWrong), questionScore]
    );

    // Record weak points for wrong answers
    if (!isAllCorrect) {
      const existing = getOne(
        'SELECT id FROM weak_points WHERE user_id = ? AND unit_id = ? AND question_id = ?',
        [userId, unitId, q.id]
      );
      if (existing) {
        runQuery(
          'UPDATE weak_points SET wrong_count = wrong_count + 1, last_wrong_at = datetime(\'now\') WHERE id = ?',
          [existing.id]
        );
      } else {
        runQuery(
          'INSERT INTO weak_points (user_id, unit_id, question_id, related_content, wrong_count, last_wrong_at) VALUES (?, ?, ?, ?, 1, datetime(\'now\'))',
          [userId, unitId, q.id, q.relatedContent || '']
        );
      }

      wrongAnswers.push({
        questionId: q.id,
        stem: q.stem,
        userAnswer: userAns,
        correctAnswer: correctAnswers,
        blanksWrong,
        relatedContent: q.relatedContent,
        hint: q.blanks[blanksWrong[0]]?.hint || '',
      });
    }
  }

  // Update phase to 2 (quizzed)
  const existingProgress = getOne('SELECT id FROM unit_progress WHERE user_id = ? AND unit_id = ?', [userId, unitId]);
  if (existingProgress) {
    runQuery('UPDATE unit_progress SET current_phase = 2, phase_2_completed_at = datetime(\'now\'), last_accessed_at = datetime(\'now\') WHERE user_id = ? AND unit_id = ?', [userId, unitId]);
  } else {
    runQuery('INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_2_completed_at) VALUES (?, ?, 2, datetime(\'now\'))', [userId, unitId]);
  }

  return {
    score: Math.round((totalScore / questions.length) * 100),
    totalQuestions: questions.length,
    correctCount,
    wrongAnswers,
    hasWeakPoints: wrongAnswers.length > 0,
  };
}

// Get weak points for a unit (for Phase 3 review)
async function getWeakPoints(unitId) {
  await getDB();
  const rows = all(
    "SELECT * FROM weak_points WHERE user_id = 1 AND unit_id = ? AND reviewed = 0 ORDER BY last_wrong_at DESC",
    [unitId]
  );
  return rows.map((r) => {
    let blanksWrong = [];
    if (r.blanks_wrong) {
      try { blanksWrong = JSON.parse(r.blanks_wrong); } catch {}
    }
    return { ...r, blanksWrong };
  });
}

// Generate auto-review content from weak points
async function generateReview(unitId) {
  const weakPoints = await getWeakPoints(unitId);
  if (weakPoints.length === 0) return { skip: true };

  const quizData = getQuiz(unitId);
  if (!quizData) return { skip: false, items: [] };

  const reviewItems = weakPoints.map((wp) => {
    const question = quizData.questions.find((q) => q.id === wp.question_id);
    return {
      weakPointId: wp.id,
      questionStem: question?.stem || '',
      correctAnswer: question?.blanks.map((b) => b.answer).join('、'),
      hint: question?.blanks[wp.blanksWrong[0]]?.hint || '',
      relatedContent: question?.relatedContent || '',
      wrongCount: wp.wrong_count,
    };
  });

  return { skip: false, items: reviewItems, totalCount: reviewItems.length };
}

// Complete review - mark weak points as reviewed
async function completeReview(userId, unitId) {
  await getDB();
  runQuery(
    'UPDATE weak_points SET reviewed = 1, reviewed_at = datetime(\'now\') WHERE user_id = ? AND unit_id = ? AND reviewed = 0',
    [userId, unitId]
  );
  runQuery(
    'UPDATE unit_progress SET current_phase = 3, phase_3_completed_at = datetime(\'now\'), last_accessed_at = datetime(\'now\') WHERE user_id = ? AND unit_id = ?',
    [userId, unitId]
  );
  // Record review session
  const weakPoints = all("SELECT id FROM weak_points WHERE user_id = ? AND unit_id = ?", [userId, unitId]);
  runQuery(
    'INSERT INTO review_sessions (user_id, unit_id, weak_point_ids, total_items, completed, completed_at) VALUES (?, ?, ?, ?, 1, datetime(\'now\'))',
    [userId, unitId, JSON.stringify(weakPoints.map((w) => w.id)), weakPoints.length]
  );
}

module.exports = { getQuiz, submitQuiz, getWeakPoints, generateReview, completeReview };
