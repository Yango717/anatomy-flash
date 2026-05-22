const express = require('express');
const router = express.Router();
const quizService = require('../services/quizService');

// Get quiz questions for a unit
router.get('/units/:unitId/quiz', (req, res) => {
  try {
    const quiz = quizService.getQuiz(req.params.unitId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '该单元暂无测验' }, timestamp: new Date().toISOString() });
    }
    // Hide answers from client
    const questions = (quiz.questions || []).map((q) => ({
      id: q.id,
      type: q.type,
      stem: q.stem,
      blankCount: q.blanks.length,
      hints: q.blanks.map((b) => ({ index: b.index, hint: b.hint })),
      relatedContent: q.relatedContent,
      difficulty: q.difficulty,
    }));
    res.json({ success: true, data: { ...quiz, questions }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'QUIZ_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Submit quiz answers
router.post('/units/:unitId/quiz/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' }, timestamp: new Date().toISOString() });
    }
    const result = await quizService.submitQuiz(1, req.params.unitId, answers);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'QUIZ_SUBMIT_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Generate auto-review from weak points
router.get('/units/:unitId/review/generate', async (req, res) => {
  try {
    const review = await quizService.generateReview(req.params.unitId);
    res.json({ success: true, data: review, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REVIEW_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Complete review
router.post('/units/:unitId/review/complete', async (req, res) => {
  try {
    await quizService.completeReview(1, req.params.unitId);
    res.json({ success: true, data: { reviewed: true }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REVIEW_COMPLETE_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
