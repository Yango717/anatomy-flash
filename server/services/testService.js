const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getDB, get: getOne, run: runQuery } = require('../db/database');
const { findInChapters } = require('./fileUtils');
const { nextReview } = require('./spacedRepetition');

function getTest(unitId) {
  const subPrefix = unitId.replace(/-part-.*/, '');
  const result = findInChapters(config.contentDir, 'test.json', subPrefix);
  return result ? JSON.parse(result) : null;
}

async function submitTest(userId, unitId, answers) {
  await getDB();
  const testData = getTest(unitId);
  if (!testData?.questions) throw new Error('Test not found');

  const questions = testData.questions;
  let totalPoints = 0;
  let maxPoints = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAns = (answers[i] || '').toString().trim();
    let isCorrect = false;
    let score = 0;
    const qMaxScore = q.type === 'term_explanation' ? 1 : 1;

    if (q.type === 'multiple_choice') {
      isCorrect = userAns.toUpperCase() === q.answer.toUpperCase();
      score = isCorrect ? 1 : 0;
    } else if (q.type === 'true_false') {
      const userBool = userAns === 'true' || userAns === '✓' || userAns === '对';
      isCorrect = userBool === q.answer;
      score = isCorrect ? 1 : 0;
    } else if (q.type === 'term_explanation') {
      if (userAns.length > 0) {
        const mustHits = q.scoringCriteria?.mustInclude || [];
        const bonusWords = q.scoringCriteria?.bonusWords || [];
        const lower = userAns.toLowerCase();
        let mustScore = mustHits.length > 0
          ? mustHits.filter((w) => lower.includes(w.toLowerCase())).length / mustHits.length
          : 0.5;
        let bonusScore = bonusWords.length > 0
          ? bonusWords.filter((w) => lower.includes(w.toLowerCase())).length * 0.1
          : 0;
        score = Math.min(1, mustScore * 0.8 + bonusScore);
        isCorrect = score >= 0.6;
      }
    }

    totalPoints += score;
    maxPoints += qMaxScore;

    runQuery(
      'INSERT INTO test_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score, max_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, unitId, q.id, q.type, userAns, String(q.answer), isCorrect ? 1 : 0, score, qMaxScore]
    );

    // Wrong answers → error book
    if (!isCorrect) {
      const unitPath = buildUnitPath(unitId);
      runQuery(
        `INSERT INTO error_book (user_id, unit_id, unit_path, question_id, question_type,
         question_stem, user_answer, correct_answer, explanation, mastery_level,
         next_review_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [userId, unitId, unitPath, q.id, q.type, q.stem, userAns,
         String(q.answer), q.explanation || '', nextReview(0)]
      );
    }
  }

  // Update progress to phase 4
  const totalQuestions = questions.length;
  const existing = getOne('SELECT id FROM unit_progress WHERE user_id = ? AND unit_id = ?', [userId, unitId]);
  if (existing) {
    runQuery('UPDATE unit_progress SET current_phase = 4, phase_4_completed_at = datetime(\'now\'), last_accessed_at = datetime(\'now\') WHERE user_id = ? AND unit_id = ?', [userId, unitId]);
  } else {
    runQuery('INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_4_completed_at) VALUES (?, ?, 4, datetime(\'now\'))', [userId, unitId]);
  }

  return {
    score: totalQuestions > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
    totalPoints,
    maxPoints,
    totalQuestions,
    correctCount: Math.round(totalPoints),
    wrongCount: totalQuestions - Math.round(totalPoints),
  };
}

function buildUnitPath(unitId) {
  // Parse unitId to create readable path
  const match = unitId.match(/^(sub-\d+-\d+-\d+)-part-(.+)$/);
  if (!match) return unitId;
  const chapterDirs = fs.readdirSync(config.contentDir).filter((d) =>
    d.startsWith('chapter-') && fs.statSync(path.join(config.contentDir, d)).isDirectory()
  );
  for (const chDir of chapterDirs) {
    const metaPath = path.join(config.contentDir, chDir, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    for (const section of meta.sections || []) {
      for (const sub of section.subsections || []) {
        if (sub.id === match[1]) {
          return `${meta.title} > ${section.title} > ${sub.title}`;
        }
      }
    }
  }
  return unitId;
}

function getFinalExam(unitId) {
  const subPrefix = unitId.replace(/-part-.*/, '');
  const result = findInChapters(config.contentDir, 'finalexam.json', subPrefix);
  return result ? JSON.parse(result) : null;
}

async function submitFinalExam(userId, unitId, answers) {
  await getDB();
  const examData = getFinalExam(unitId);
  if (!examData?.questions) throw new Error('Final exam not found');

  const questions = examData.questions;
  let totalPoints = 0;
  let maxPoints = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAns = (answers[i] || '').toString().trim();
    let isCorrect = false;
    let score = 0;

    if (q.type === 'multiple_choice') {
      isCorrect = userAns.toUpperCase() === q.answer.toUpperCase();
      score = isCorrect ? 1 : 0;
    } else if (q.type === 'true_false') {
      isCorrect = (userAns === 'true' || userAns === '✓') === q.answer;
      score = isCorrect ? 1 : 0;
    }

    totalPoints += score;
    maxPoints += 1;

    runQuery(
      'INSERT INTO final_exam_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, unitId, q.id, q.type, userAns, String(q.answer), isCorrect ? 1 : 0, score]
    );

    // Also optionally add to error book
    if (!isCorrect) {
      const unitPath = buildUnitPath(unitId);
      runQuery(
        "INSERT INTO error_book (user_id, unit_id, unit_path, question_id, question_type, question_stem, user_answer, correct_answer, explanation, mastery_level, next_review_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
        [userId, unitId, unitPath, q.id, q.type, q.stem, userAns, String(q.answer), q.explanation || '', nextReview(0)]
      );
    }
  }

  // Update progress to phase 5
  const existing = getOne('SELECT id FROM unit_progress WHERE user_id = ? AND unit_id = ?', [userId, unitId]);
  if (existing) {
    runQuery("UPDATE unit_progress SET current_phase = 5, phase_5_completed_at = datetime('now') WHERE user_id = ? AND unit_id = ?", [userId, unitId]);
  } else {
    runQuery("INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_5_completed_at) VALUES (?, ?, 5, datetime('now'))", [userId, unitId]);
  }

  return {
    score: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
    totalPoints,
    maxPoints,
    totalQuestions: questions.length,
    correctCount: Math.round(totalPoints),
    wrongCount: questions.length - Math.round(totalPoints),
  };
}

module.exports = { getTest, submitTest, getFinalExam, submitFinalExam };
