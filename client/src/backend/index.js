// Browser-side API — replaces the entire Express backend
// All functions return data objects directly (same shape as previous json.data)

import { getDB, all, getOne, runQuery, saveToIDB, debouncedSave } from '../db/database';
import * as content from '../services/contentService';
import { nextReview } from '../services/spacedRepetition';

let initialized = false;
let initError = null;

export async function init() {
  if (initialized) return;
  if (initError) throw initError;

  console.log('[AnatomyFlash] Starting init...');

  try {
    console.log('[AnatomyFlash] Loading chapters.json...');
    await content.loadChapters();
    console.log('[AnatomyFlash] Chapters loaded OK');
  } catch (e) {
    initError = e;
    console.error('[AnatomyFlash] Content load failed:', e);
    throw e;
  }

  try {
    console.log('[AnatomyFlash] Initializing SQLite...');
    await getDB();
    console.log('[AnatomyFlash] SQLite initialized OK');
  } catch (e) {
    console.warn('[AnatomyFlash] DB init failed:', e.message);
  }

  initialized = true;
  console.log('[AnatomyFlash] Init complete');
}

// ---------- helpers ----------

function unitPrefix(unitId) {
  return (unitId || '').replace(/-part-.*$/, '');
}

function nowISO() {
  return new Date().toISOString();
}

// ---------- content ----------

export async function getChapters() {
  await init();
  return content.getChapters();
}

export async function getChapter(chapterId) {
  await init();
  return content.getChapter(chapterId);
}

export async function getChapterSections(chapterId) {
  await init();
  return content.getChapterMeta(chapterId);
}

export async function getUnitContent(unitId) {
  await init();
  return content.getUnitContent(unitId);
}

export async function search(query) {
  await init();
  return content.search(query);
}

// ---------- quiz ----------

export async function getQuiz(unitId) {
  await init();
  const subId = unitPrefix(unitId);
  const quiz = await content.fetchJSON(subId, 'quiz.json');
  if (!quiz?.questions) return { questions: [], unitId };
  return {
    questions: quiz.questions.map(q => ({ id: q.id, type: q.type, stem: q.stem, blankCount: q.blankCount, hints: q.hints, relatedContent: q.relatedContent, difficulty: q.difficulty })),
    unitId
  };
}

export async function submitQuiz(unitId, answers) {
  await init();
  const subId = unitPrefix(unitId);
  const quiz = await content.fetchJSON(subId, 'quiz.json');
  if (!quiz?.questions) throw { code: 'NOT_FOUND', message: 'Quiz not found' };

  let totalScore = 0;
  const wrongAnswers = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const userAnswer = answers[i] || [];
    const correct = (q.answers || []).map(a => (a || '').trim().toLowerCase());
    let blankCorrect = 0;
    const blanksWrong = [];

    for (let j = 0; j < correct.length; j++) {
      const ua = (userAnswer[j] || '').trim().toLowerCase();
      if (ua === correct[j]) blankCorrect++;
      else blanksWrong.push(j);
    }
    const score = correct.length > 0 ? blankCorrect / correct.length : 0;
    totalScore += score;

    const isCorrect = blanksWrong.length === 0;
    runQuery(
      `INSERT INTO quiz_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, blanks_wrong, score) VALUES (1, ?, ?, 'fill_blank', ?, ?, ?, ?, ?)`,
      [unitId, q.id, JSON.stringify(userAnswer), JSON.stringify(correct), isCorrect ? 1 : 0, JSON.stringify(blanksWrong), score]
    );

    if (!isCorrect) {
      const existing = getOne(`SELECT id FROM weak_points WHERE user_id = 1 AND unit_id = ? AND question_id = ?`, [unitId, q.id]);
      if (existing) {
        runQuery(`UPDATE weak_points SET wrong_count = wrong_count + 1, last_wrong_at = datetime('now') WHERE id = ?`, [existing.id]);
      } else {
        runQuery(`INSERT INTO weak_points (user_id, unit_id, question_id, related_content, wrong_count, last_wrong_at) VALUES (1, ?, ?, ?, 1, datetime('now'))`, [unitId, q.id, q.relatedContent || '']);
      }
      wrongAnswers.push({ questionId: q.id, stem: q.stem, userAnswer, correctAnswer: correct, blanksWrong });
    }
  }

  const pct = quiz.questions.length > 0 ? Math.round((totalScore / quiz.questions.length) * 100) : 0;

  // Advance to phase 2
  const prog = getOne(`SELECT id FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  if (prog) {
    runQuery(`UPDATE unit_progress SET current_phase = 2, phase_2_completed_at = datetime('now'), last_accessed_at = datetime('now') WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  } else {
    runQuery(`INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_2_completed_at) VALUES (1, ?, 2, datetime('now'))`, [unitId]);
  }

  debouncedSave();
  return { score: pct, correctCount: quiz.questions.length - wrongAnswers.length, totalCount: quiz.questions.length, wrongAnswers };
}

export async function generateReview(unitId) {
  await init();
  const subId = unitPrefix(unitId);
  const quiz = await content.fetchJSON(subId, 'quiz.json');
  const weakPoints = all(`SELECT * FROM weak_points WHERE user_id = 1 AND unit_id = ? AND reviewed = 0 ORDER BY last_wrong_at DESC`, [unitId]);
  if (weakPoints.length === 0) return { skip: true, message: '暂无薄弱点需要复习' };

  const items = weakPoints.map(wp => {
    const q = quiz?.questions?.find(q => q.id === wp.question_id);
    return q ? { questionId: q.id, type: q.type, stem: q.stem, answers: q.answers, relatedContent: wp.related_content, wrongCount: wp.wrong_count } : null;
  }).filter(Boolean);

  return { skip: items.length === 0, items, totalCount: items.length };
}

export async function completeReview(unitId) {
  await init();
  const wpIds = all(`SELECT id FROM weak_points WHERE user_id = 1 AND unit_id = ? AND reviewed = 0`, [unitId]);
  const ids = wpIds.map(r => r.id);
  runQuery(`UPDATE weak_points SET reviewed = 1, reviewed_at = datetime('now') WHERE user_id = 1 AND unit_id = ? AND reviewed = 0`, [unitId]);
  runQuery(`INSERT INTO review_sessions (user_id, unit_id, weak_point_ids, total_items, completed, completed_at) VALUES (1, ?, ?, ?, 1, datetime('now'))`, [unitId, JSON.stringify(ids), ids.length]);

  const prog = getOne(`SELECT id FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  if (prog) {
    runQuery(`UPDATE unit_progress SET current_phase = 3, phase_3_completed_at = datetime('now'), last_accessed_at = datetime('now') WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  } else {
    runQuery(`INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_3_completed_at) VALUES (1, ?, 3, datetime('now'))`, [unitId]);
  }
  debouncedSave();
  return { success: true };
}

// ---------- test ----------

function judgeAnswer(q, userAnswer) {
  const ua = (userAnswer || '').trim();
  if (q.type === 'multiple_choice') {
    const ca = (q.answer || q.correctAnswer || '').trim();
    return { correct: ua.toLowerCase() === ca.toLowerCase(), score: ua.toLowerCase() === ca.toLowerCase() ? 1 : 0 };
  }
  if (q.type === 'true_false') {
    const pos = ['true', '✓', '对'];
    const neg = ['false', '✗', '错'];
    const isPos = pos.some(p => ua.includes(p));
    const isNeg = neg.some(p => ua.includes(p));
    const caPos = pos.some(p => (q.answer || q.correctAnswer || '').includes(p));
    return { correct: isPos === caPos, score: isPos === caPos ? 1 : 0 };
  }
  if (q.type === 'term_explanation') {
    const criteria = q.scoringCriteria;
    if (!criteria) return { correct: null, score: null }; // self-check
    const mustInclude = criteria.mustInclude || [];
    const bonusWords = criteria.bonusWords || [];
    const mustScore = mustInclude.length > 0 ? mustInclude.filter(k => ua.includes(k)).length / mustInclude.length : 0.5;
    const bonusScore = bonusWords.filter(k => ua.includes(k)).length * 0.1;
    const score = Math.min(1, mustScore * 0.8 + bonusScore);
    return { correct: score >= 0.6, score };
  }
  if (q.type === 'short_answer' || q.type === 'essay') {
    return { correct: null, score: null }; // self-check
  }
  // fallback
  const ca = (q.answer || q.correctAnswer || '').trim();
  return { correct: ua === ca, score: ua === ca ? 1 : 0 };
}

export async function getTest(unitId) {
  await init();
  const subId = unitPrefix(unitId);
  const test = await content.fetchJSON(subId, 'test.json');
  if (!test?.questions) return { questions: [], unitId };
  // Strip answers
  const questions = test.questions.map(q => {
    const { answer, answers, correctAnswer, scoringCriteria, explanation, ...rest } = q;
    return rest;
  });
  return { questions, unitId };
}

export async function submitTest(unitId, answers) {
  await init();
  const subId = unitPrefix(unitId);
  const test = await content.fetchJSON(subId, 'test.json');
  if (!test?.questions) throw { code: 'NOT_FOUND', message: 'Test not found' };

  let totalScore = 0, totalMax = 0;
  const results = [];
  const unitPath = content.buildUnitPath(unitId);

  for (let i = 0; i < test.questions.length; i++) {
    const q = test.questions[i];
    const ua = answers[i] || '';
    const { correct, score } = judgeAnswer(q, ua);
    const maxScore = 1;
    totalMax += maxScore;
    totalScore += score ?? 0;

    runQuery(
      `INSERT INTO test_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score, max_score) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [unitId, q.id, q.type, ua, q.answer || q.correctAnswer || '', correct === true ? 1 : 0, score ?? 0, maxScore]
    );

    if (correct === false) {
      runQuery(
        `INSERT INTO error_book (user_id, unit_id, unit_path, question_id, question_type, question_stem, user_answer, correct_answer, explanation, mastery_level, next_review_due) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [unitId, unitPath, q.id, q.type, q.stem || '', ua, q.answer || q.correctAnswer || '', q.explanation || '', nextReview(0)]
      );
    }

    results.push({ questionId: q.id, correct, score: score ?? 0 });
  }

  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const prog = getOne(`SELECT id FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  if (prog) {
    runQuery(`UPDATE unit_progress SET current_phase = 4, phase_4_completed_at = datetime('now'), last_accessed_at = datetime('now') WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  } else {
    runQuery(`INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_4_completed_at) VALUES (1, ?, 4, datetime('now'))`, [unitId]);
  }

  debouncedSave();
  return { score: pct, results, totalCount: test.questions.length };
}

export async function getFinalExam(unitId) {
  await init();
  const subId = unitPrefix(unitId);
  const exam = await content.fetchJSON(subId, 'finalexam.json');
  if (!exam?.questions) return { questions: [], unitId };
  const questions = exam.questions.map(q => {
    const { answer, answers, correctAnswer, explanation, ...rest } = q;
    return rest;
  });
  return { questions, unitId };
}

export async function submitFinalExam(unitId, answers) {
  await init();
  const subId = unitPrefix(unitId);
  const exam = await content.fetchJSON(subId, 'finalexam.json');
  if (!exam?.questions) throw { code: 'NOT_FOUND', message: 'Final exam not found' };

  let totalScore = 0;
  const results = [];
  const unitPath = content.buildUnitPath(unitId);

  for (let i = 0; i < exam.questions.length; i++) {
    const q = exam.questions[i];
    const ua = answers[i] || '';
    const { correct, score } = judgeAnswer(q, ua);
    totalScore += score ?? 0;

    runQuery(
      `INSERT INTO final_exam_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      [unitId, q.id, q.type, ua, q.answer || q.correctAnswer || '', correct === true ? 1 : 0, score ?? 0]
    );

    if (correct === false) {
      runQuery(
        `INSERT INTO error_book (user_id, unit_id, unit_path, question_id, question_type, question_stem, user_answer, correct_answer, explanation, mastery_level, next_review_due) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [unitId, unitPath, q.id, q.type, q.stem || '', ua, q.answer || q.correctAnswer || '', q.explanation || '', nextReview(0)]
      );
    }

    results.push({ questionId: q.id, correct, score: score ?? 0 });
  }

  const pct = exam.questions.length > 0 ? Math.round((totalScore / exam.questions.length) * 100) : 0;

  const prog = getOne(`SELECT id FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  if (prog) {
    runQuery(`UPDATE unit_progress SET current_phase = 5, phase_5_completed_at = datetime('now'), last_accessed_at = datetime('now') WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  } else {
    runQuery(`INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_5_completed_at) VALUES (1, ?, 5, datetime('now'))`, [unitId]);
  }

  debouncedSave();
  return { score: pct, results, totalCount: exam.questions.length };
}

// ---------- progress ----------

export async function getProgressOverview() {
  await init();
  const data = await content.loadChapters();
  let totalUnits = 0;
  const chapterProgress = [];
  const allUnitIds = [];

  for (const ch of data.chapters) {
    let chUnits = 0;
    for (const sec of ch.sections) {
      for (const sub of sec.subsections) {
        for (const part of sub.parts) {
          const uid = `${sub.id}-part-${part.id}`;
          allUnitIds.push(uid);
          chUnits++;
          totalUnits++;
        }
      }
    }
    const progressRows = all(`SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1 AND unit_id LIKE ?`, [`${ch.chapterId}%`]);
    const errorUnits = new Set(all(`SELECT DISTINCT unit_id FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND unit_id LIKE ?`, [`${ch.chapterId}%`]).map(r => r.unit_id));
    let completed = 0;
    for (const row of progressRows) {
      if (row.current_phase >= 5 && !errorUnits.has(row.unit_id)) completed++;
    }
    chapterProgress.push({ chapterId: ch.chapterId, title: ch.title, totalUnits: chUnits, completedUnits: completed, pct: chUnits > 0 ? Math.round((completed / chUnits) * 100) : 0 });
  }

  const progressRows = all(`SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1`);
  const errorUnits = new Set(all(`SELECT DISTINCT unit_id FROM error_book WHERE user_id = 1 AND is_resolved = 0`).map(r => r.unit_id));
  const phases = [0, 0, 0, 0, 0, 0]; // 0-5
  progressRows.forEach(r => { if (r.current_phase >= 0 && r.current_phase <= 5) phases[r.current_phase]++; });

  let completedCount = 0;
  for (const row of progressRows) {
    if (row.current_phase >= 5 && !errorUnits.has(row.unit_id)) completedCount++;
  }

  const errorTotal = getOne(`SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0`)?.c || 0;
  const dueErrors = getOne(`SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now')`)?.c || 0;
  const recentAttempts = getOne(`SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = 1 AND created_at >= datetime('now', '-7 days')`)?.c || 0;

  return {
    totalUnits, completedCount, phases,
    errorTotal, dueErrors, recentAttempts,
    chapterProgress
  };
}

export async function getChapterProgress(chapterId) {
  await init();
  const data = await content.loadChapters();
  const ch = data.chapters.find(c => c.chapterId === chapterId);
  if (!ch) throw { code: 'NOT_FOUND', message: 'Chapter not found' };

  const units = [];
  for (const sec of ch.sections) {
    for (const sub of sec.subsections) {
      for (const part of sub.parts) {
        const uid = `${sub.id}-part-${part.id}`;
        const prog = getOne(`SELECT current_phase FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [uid]);
        const errors = all(`SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND unit_id = ? AND is_resolved = 0`, [uid])[0]?.c || 0;
        units.push({
          unitId: uid,
          title: part.title || sub.title,
          subId: sub.id,
          sectionId: sec.id,
          phase: prog?.current_phase || 0,
          hasErrors: errors > 0
        });
      }
    }
  }
  return { chapterId, units };
}

// ---------- learning ----------

export async function getUnitProgress(unitId) {
  await init();
  const row = getOne(`SELECT * FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  return row || { unitId, currentPhase: 0 };
}

export async function completePhase(unitId, phaseNum) {
  await init();
  const p = parseInt(phaseNum);
  const existing = getOne(`SELECT id FROM unit_progress WHERE user_id = 1 AND unit_id = ?`, [unitId]);
  if (existing) {
    runQuery(`UPDATE unit_progress SET current_phase = ?, phase_${p}_completed_at = datetime('now'), last_accessed_at = datetime('now') WHERE user_id = 1 AND unit_id = ?`, [p, unitId]);
  } else {
    runQuery(`INSERT INTO unit_progress (user_id, unit_id, current_phase, phase_${p}_completed_at) VALUES (1, ?, ?, datetime('now'))`, [unitId, p]);
  }
  debouncedSave();
  return { unitId, currentPhase: p };
}

export async function getNotes(unitId) {
  await init();
  return all(`SELECT * FROM user_notes WHERE user_id = 1 AND unit_id = ? ORDER BY updated_at DESC`, [unitId]);
}

export async function createNote(unitId, text) {
  await init();
  runQuery(`INSERT INTO user_notes (user_id, unit_id, note_text) VALUES (1, ?, ?)`, [unitId, text]);
  debouncedSave();
  return { success: true };
}

export async function deleteNote(noteId) {
  await init();
  runQuery(`DELETE FROM user_notes WHERE id = ? AND user_id = 1`, [noteId]);
  debouncedSave();
  return { success: true };
}

// ---------- practice ----------

export async function getPracticeQuestions(chapter, sub) {
  await init();

  const collectFromPool = async () => {
    let allQ = [];
    if (chapter) {
      const pool = await content.getPracticePool(chapter);
      allQ = pool.questions || [];
    } else {
      const pools = await content.getAllPracticePools();
      allQ = pools.flatMap(p => p.questions || []);
    }
    if (sub) allQ = allQ.filter(q => (q.unitId || '').startsWith(sub));
    return allQ;
  };

  let questions = await collectFromPool();

  // Fallback: if pool returns < 10 questions, try subsection files
  if (questions.length < 10) {
    const data = await content.loadChapters();
    const chapters = chapter ? data.chapters.filter(c => c.chapterId === chapter) : data.chapters;
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        for (const subsec of sec.subsections) {
          if (sub && !subsec.id.startsWith(sub)) continue;
          if (questions.length >= 10) break;
          try {
            const quiz = await content.fetchJSON(subsec.id, 'quiz.json');
            if (quiz?.questions) questions.push(...quiz.questions.map(q => ({ ...q, unitId: `${subsec.id}-part-${subsec.parts[0]?.id || ''}` })));
            const test = await content.fetchJSON(subsec.id, 'test.json');
            if (test?.questions) questions.push(...test.questions.map(q => ({ ...q, unitId: `${subsec.id}-part-${subsec.parts[0]?.id || ''}` })));
          } catch {}
        }
      }
    }
  }

  // Strip answers for non-practice display (practice shows them after submission)
  const stripped = questions.map(q => {
    const { answer, answers, correctAnswer, ...rest } = q;
    if (['term_explanation', 'short_answer', 'essay'].includes(q.type)) {
      return rest; // No answer for self-check types
    }
    return { ...rest, answer, answers, correctAnswer }; // keep for judging
  });

  return { questions: stripped, total: stripped.length };
}

export async function submitPractice(unitId, questionId, type, answer) {
  await init();
  const ua = (answer || '').trim();
  let isCorrect = null;
  let correctAnswer = '';
  let stem = '';

  // Find the question in practice pools or subsection files
  const allPools = await content.getAllPracticePools();
  let q = null;
  for (const pool of allPools) {
    q = (pool.questions || []).find(qq => qq.id === questionId);
    if (q) break;
  }

  if (!q && unitId) {
    const subId = unitPrefix(unitId);
    const quiz = await content.fetchJSON(subId, 'quiz.json');
    q = (quiz?.questions || []).find(qq => qq.id === questionId);
    if (!q) {
      const test = await content.fetchJSON(subId, 'test.json');
      q = (test?.questions || []).find(qq => qq.id === questionId);
    }
  }

  if (!q) {
    // Can't find question — record anyway
    runQuery(`INSERT INTO quiz_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score) VALUES (1, ?, ?, ?, ?, '', 1, 1)`, [unitId, questionId, type || 'fill_blank', ua]);
    debouncedSave();
    return { isCorrect: true, correctAnswer: '' };
  }

  stem = q.stem || '';
  correctAnswer = q.answer || q.correctAnswer || (q.answers ? q.answers.join(', ') : '');

  // Judge based on type
  if (type === 'fill_blank') {
    const correct = (q.answers || []).map(a => (a || '').trim().toLowerCase());
    const userBlanks = ua.split(',').map(a => a.trim().toLowerCase());
    const allCorrect = correct.length === userBlanks.length && correct.every((c, i) => c === userBlanks[i]);
    isCorrect = allCorrect;
  } else if (type === 'multiple_choice') {
    isCorrect = ua.toLowerCase() === (q.answer || q.correctAnswer || '').toLowerCase();
  } else if (type === 'true_false') {
    const pos = ['true', '✓', '对'];
    const uaIsPos = pos.some(p => ua.includes(p));
    const caIsPos = pos.some(p => (q.answer || q.correctAnswer || '').includes(p));
    isCorrect = uaIsPos === caIsPos;
  } else if (['term_explanation', 'short_answer', 'essay'].includes(type)) {
    isCorrect = null;
  } else {
    isCorrect = ua === (q.answer || q.correctAnswer || '').trim();
  }

  runQuery(
    `INSERT INTO quiz_attempts (user_id, unit_id, question_id, question_type, user_answer, correct_answer, is_correct, score) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [unitId, questionId, type || 'fill_blank', ua, correctAnswer, isCorrect === true ? 1 : 0, isCorrect === true ? 1 : 0]
  );

  if (isCorrect === false) {
    const existing = getOne(`SELECT id FROM error_book WHERE user_id = 1 AND question_id = ? AND is_resolved = 0`, [questionId]);
    if (existing) {
      runQuery(`UPDATE error_book SET user_answer = ?, mastery_level = MAX(0, mastery_level - 1), next_review_due = datetime('now'), updated_at = datetime('now') WHERE id = ?`, [ua, existing.id]);
    } else {
      runQuery(
        `INSERT INTO error_book (user_id, unit_id, question_id, question_type, question_stem, user_answer, correct_answer, explanation, mastery_level, next_review_due, created_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
        [unitId, questionId, type, stem, ua, correctAnswer, q.explanation || '']
      );
    }
  }

  debouncedSave();
  return { isCorrect, correctAnswer };
}

// ---------- errorbook ----------

export async function getErrorBook() {
  await init();
  return all(`SELECT * FROM error_book WHERE user_id = 1 ORDER BY created_at DESC`);
}

export async function getErrorBookDue() {
  await init();
  return all(`SELECT * FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now') ORDER BY next_review_due ASC`);
}

export async function getErrorBookStats() {
  await init();
  const total = getOne(`SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0`)?.c || 0;
  const byType = all(`SELECT question_type, COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0 GROUP BY question_type`);
  return { total, byType };
}

export async function updateErrorMastery(id, masteryLevel) {
  await init();
  runQuery(`UPDATE error_book SET mastery_level = ?, times_reviewed = times_reviewed + 1, next_review_due = ?, updated_at = datetime('now') WHERE id = ? AND user_id = 1`, [masteryLevel, nextReview(masteryLevel), id]);
  debouncedSave();
  return { success: true };
}

export async function resolveError(id) {
  await init();
  runQuery(`UPDATE error_book SET is_resolved = 1, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = 1`, [id]);
  debouncedSave();
  return { success: true };
}

// ---------- recommend ----------

export async function getRecommend() {
  await init();
  const data = await content.loadChapters();
  const recommendations = [];

  // 1. Due errors (highest priority)
  const dueErrors = all(`SELECT DISTINCT unit_id FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now') LIMIT 3`);
  if (dueErrors.length > 0) {
    for (const de of dueErrors) {
      const path = content.buildUnitPath(de.unit_id);
      recommendations.push({ type: 'error', title: '复习错题', message: path || de.unit_id, unitId: de.unit_id, path });
    }
  }

  // 2. Ebbinghaus review
  const intervals = [1, 2, 4, 7, 15, 30];
  const learned = all(`SELECT unit_id, current_phase, phase_1_completed_at FROM unit_progress WHERE user_id = 1 AND current_phase >= 1 AND current_phase < 5`);
  for (const lu of learned) {
    if (!lu.phase_1_completed_at) continue;
    const daysPassed = Math.floor((Date.now() - new Date(lu.phase_1_completed_at).getTime()) / 86400000);
    if (intervals.some(iv => daysPassed >= iv && daysPassed < iv + 1)) {
      const path = content.buildUnitPath(lu.unit_id);
      recommendations.push({ type: 'review', title: '艾宾浩斯复习', message: path || lu.unit_id, unitId: lu.unit_id, path, daysPassed });
    }
  }

  // 3. Next unlearned unit
  if (recommendations.length < 3) {
    const allProg = all(`SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1`);
    const progMap = new Map(allProg.map(p => [p.unit_id, p.current_phase]));
    for (const ch of data.chapters) {
      if (recommendations.length >= 5) break;
      for (const sec of ch.sections) {
        for (const sub of sec.subsections) {
          for (const part of sub.parts) {
            const uid = `${sub.id}-part-${part.id}`;
            const phase = progMap.get(uid) || 0;
            if (phase === 0 || phase < 5) {
              const path = content.buildUnitPath(uid);
              recommendations.push({ type: 'learn', title: phase === 0 ? '开始学习' : '继续学习', message: path || uid, unitId: uid, path });
              if (recommendations.length >= 5) break;
            }
          }
        }
      }
    }
  }

  return recommendations.slice(0, 5);
}

// ---------- countdown ----------

export async function getCountdown() {
  await init();
  const name = getOne(`SELECT value FROM settings WHERE key = 'countdown_name'`);
  const target = getOne(`SELECT value FROM settings WHERE key = 'countdown_target'`);
  return { name: name?.value || '距离解剖学期末考试', target: target?.value || '' };
}

export async function updateCountdown(name, target) {
  await init();
  if (name) {
    runQuery(`INSERT INTO settings (key, value, updated_at) VALUES ('countdown_name', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`, [name]);
  }
  if (target) {
    runQuery(`INSERT INTO settings (key, value, updated_at) VALUES ('countdown_target', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`, [target]);
  }
  debouncedSave();
  return { success: true };
}
