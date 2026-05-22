const express = require('express');
const router = express.Router();
const testService = require('../services/testService');

// Get test questions for a unit (without answers)
router.get('/units/:unitId/test', (req, res) => {
  try {
    const test = testService.getTest(req.params.unitId);
    if (!test) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '该单元暂无测试题' }, timestamp: new Date().toISOString() });
    }
    const questions = test.questions.map((q) => ({
      id: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options, // MCQ
      difficulty: q.difficulty,
    }));
    res.json({ success: true, data: { ...test, questions }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TEST_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Submit test answers
router.post('/units/:unitId/test/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' }, timestamp: new Date().toISOString() });
    }
    const result = await testService.submitTest(1, req.params.unitId, answers);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TEST_SUBMIT_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Get final exam questions
router.get('/units/:unitId/finalexam', (req, res) => {
  try {
    const exam = testService.getFinalExam(req.params.unitId);
    if (!exam) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '该单元暂无真题' }, timestamp: new Date().toISOString() });
    }
    const questions = exam.questions.map((q) => ({
      id: q.id, type: q.type, stem: q.stem, options: q.options,
    }));
    res.json({ success: true, data: { ...exam, questions }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'EXAM_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Submit final exam answers
router.post('/units/:unitId/finalexam/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' }, timestamp: new Date().toISOString() });
    }
    const result = await testService.submitFinalExam(1, req.params.unitId, answers);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'EXAM_SUBMIT_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
