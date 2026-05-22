const express = require('express');
const { getDB, get, run } = require('../db/database');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    await getDB();
    const nameRow = get("SELECT value FROM settings WHERE key = 'countdown_name'");
    const targetRow = get("SELECT value FROM settings WHERE key = 'countdown_target'");

    res.json({
      success: true,
      data: {
        name: nameRow?.value || '距离考试',
        target: targetRow?.value || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

router.put('/', async (req, res) => {
  try {
    const { name, target } = req.body;
    if (!target) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'target is required' }, timestamp: new Date().toISOString() });
    }

    await getDB();

    const upsert = (key, value) => {
      run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        [key, value]
      );
    };

    if (name) upsert('countdown_name', name);
    upsert('countdown_target', target);

    res.json({ success: true, data: { name, target }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
