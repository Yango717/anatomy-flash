const express = require('express');
const router = express.Router();
const { getDB, all, get: getOne, run: runQuery } = require('../db/database');
const { nextReview } = require('../services/spacedRepetition');

// List error book entries with filtering
router.get('/errorbook', async (_req, res) => {
  try {
    await getDB();
    const rows = all(
      'SELECT * FROM error_book WHERE user_id = 1 ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Get errors due for review today
router.get('/errorbook/due', async (_req, res) => {
  try {
    await getDB();
    const rows = all(
      "SELECT * FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now') ORDER BY next_review_due ASC"
    );
    res.json({ success: true, data: rows, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Get error book stats
router.get('/errorbook/stats', async (_req, res) => {
  try {
    await getDB();
    const total = all("SELECT COUNT(*) as count FROM error_book WHERE user_id = 1 AND is_resolved = 0")[0]?.count || 0;
    const byType = all("SELECT question_type, COUNT(*) as count FROM error_book WHERE user_id = 1 AND is_resolved = 0 GROUP BY question_type");
    res.json({
      success: true,
      data: { totalErrors: total, byType },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Update mastery level
router.put('/errorbook/:id/mastery', async (req, res) => {
  try {
    await getDB();
    const level = req.body.masteryLevel || 1;
    runQuery("UPDATE error_book SET mastery_level = ?, times_reviewed = times_reviewed + 1, next_review_due = ?, updated_at = datetime('now') WHERE id = ? AND user_id = 1", [level, nextReview(level), req.params.id]);
    res.json({ success: true, data: { updated: true }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

// Resolve an error
router.put('/errorbook/:id/resolve', async (req, res) => {
  try {
    await getDB();
    runQuery("UPDATE error_book SET is_resolved = 1, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = 1", [req.params.id]);
    res.json({ success: true, data: { resolved: true }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
