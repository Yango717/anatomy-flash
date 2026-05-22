const express = require('express');
const router = express.Router();
const { getDB, all, get: getOne } = require('../db/database');
const contentService = require('../services/contentService');

router.get('/overview', async (_req, res) => {
  try {
    await getDB();

    // Count ALL units from chapters.json
    const chaptersData = contentService.getChapters();
    let allUnitIds = [];
    for (const ch of (chaptersData.chapters || [])) {
      for (const s of (ch.sections || [])) {
        for (const sub of (s.subsections || [])) {
          for (const part of (sub.parts || [])) {
            allUnitIds.push(sub.id + '-part-' + part.id);
          }
        }
      }
    }
    const totalUnits = allUnitIds.length;

    // Get progress map (phase 5+ = final exam done)
    const rows = all('SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1');
    const progressMap = {};
    rows.forEach((r) => { progressMap[r.unit_id] = r.current_phase || 0; });

    // Get unit_ids with unresolved errors
    const unresolvedErrors = all(
      "SELECT DISTINCT unit_id FROM error_book WHERE user_id = 1 AND is_resolved = 0"
    );
    const unresolvedSet = new Set(unresolvedErrors.map((r) => r.unit_id));

    // A unit is "completed" only if phase >= 5 AND no unresolved errors
    let completedCount = 0;
    allUnitIds.forEach((uid) => {
      const phase = progressMap[uid] || 0;
      if (phase >= 5 && !unresolvedSet.has(uid)) {
        completedCount++;
      }
    });

    // Compute phase distribution (for display)
    const phaseCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allUnitIds.forEach((uid) => {
      const p = progressMap[uid] || 0;
      phaseCounts[Math.min(p, 5)] = (phaseCounts[Math.min(p, 5)] || 0) + 1;
    });

    // Error book stats — count total unresolved entries, not distinct unit_ids
    const errorTotal = all("SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0")[0]?.c || 0;
    const dueErrors = all("SELECT COUNT(*) as c FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now')")[0]?.c || 0;

    // Recent activity (last 7 days)
    const recentAttempts = all(
      "SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = 1 AND created_at >= datetime('now', '-7 days')"
    )[0]?.c || 0;

    // Chapter progress: binary completion per unit
    const chapterProgress = chaptersData.chapters.map((ch) => {
      let chTotal = 0;
      let chCompleted = 0;
      for (const s of (ch.sections || [])) {
        for (const sub of (s.subsections || [])) {
          for (const part of (sub.parts || [])) {
            const uid = sub.id + '-part-' + part.id;
            chTotal++;
            const phase = progressMap[uid] || 0;
            if (phase >= 5 && !unresolvedSet.has(uid)) {
              chCompleted++;
            }
          }
        }
      }
      return {
        chapterId: ch.chapterId,
        totalUnits: chTotal,
        completedUnits: chCompleted,
        percentage: chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        totalUnits,
        completedUnits: completedCount,
        completedByPhase: phaseCounts,
        percentage: totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0,
        errorTotal,
        dueErrors,
        recentAttempts,
        chapterProgress,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

router.get('/chapter/:chapterId', async (req, res) => {
  try {
    await getDB();
    const prefix = req.params.chapterId;
    const rows = all("SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1 AND unit_id LIKE ?", [prefix + '%']);
    res.json({
      success: true,
      data: rows.map((r) => ({ unitId: r.unit_id, currentPhase: r.current_phase })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
