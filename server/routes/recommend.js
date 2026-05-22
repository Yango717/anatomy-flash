const express = require('express');
const router = express.Router();
const { getDB, all } = require('../db/database');
const contentService = require('../services/contentService');

// Ebbinghaus intervals in days: 1, 2, 4, 7, 15, 30
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

router.get('/recommend', async (_req, res) => {
  try {
    await getDB();

    // 1. Find units due for review based on Ebbinghaus
    const learnedRows = all(
      "SELECT unit_id, current_phase, phase_1_completed_at FROM unit_progress WHERE user_id = 1 AND current_phase >= 1 AND current_phase < 5"
    );

    const now = new Date();
    const dueForReview = learnedRows.filter((r) => {
      if (!r.phase_1_completed_at) return false;
      const learnedAt = new Date(r.phase_1_completed_at);
      const daysPassed = Math.floor((now - learnedAt) / (1000 * 60 * 60 * 24));
      // Check if daysPassed matches any review interval
      return REVIEW_INTERVALS.some((interval) => daysPassed >= interval && daysPassed < interval + 1);
    });

    // 2. Find units with due errors (highest priority)
    const dueErrors = all(
      "SELECT DISTINCT unit_id FROM error_book WHERE user_id = 1 AND is_resolved = 0 AND next_review_due <= datetime('now') LIMIT 3"
    );

    // 3. Find first unstarted unit (for new learning)
    const chaptersData = contentService.getChapters();
    const allUnits = [];
    for (const ch of (chaptersData.chapters || [])) {
      for (const s of (ch.sections || [])) {
        for (const sub of (s.subsections || [])) {
          for (const part of (sub.parts || [])) {
            allUnits.push({
              unitId: sub.id + '-part-' + part.id,
              chapterTitle: ch.title,
              sectionTitle: s.title,
              subTitle: sub.title,
              partTitle: part.title,
            });
          }
        }
      }
    }

    const progressRows = all('SELECT unit_id, current_phase FROM unit_progress WHERE user_id = 1');
    const progressMap = {};
    progressRows.forEach((r) => { progressMap[r.unit_id] = r.current_phase || 0; });

    // First unstarted or in-progress unit
    const nextNew = allUnits.find((u) => {
      const p = progressMap[u.unitId] || 0;
      return p === 0 || (p > 0 && p < 5);
    });

    // Build recommendation
    let priority = 'review'; // review | error | learn
    let recommended = null;

    if (dueErrors.length > 0) {
      priority = 'error';
      const errUnitId = dueErrors[0].unit_id;
      const info = allUnits.find((u) => u.unitId === errUnitId) || {};
      recommended = {
        type: 'error',
        title: '错题待复习',
        message: `你有 ${dueErrors.length} 道错题需要复习`,
        unitId: errUnitId,
        path: (info.chapterTitle || '') + ' > ' + (info.subTitle || errUnitId),
      };
    } else if (dueForReview.length > 0) {
      priority = 'review';
      const revUnitId = dueForReview[0].unit_id;
      const info = allUnits.find((u) => u.unitId === revUnitId) || {};
      recommended = {
        type: 'review',
        title: '艾宾浩斯复习提醒',
        message: '根据遗忘曲线，建议回顾以下内容',
        unitId: revUnitId,
        path: (info.chapterTitle || '') + ' > ' + (info.subTitle || revUnitId),
        daysPassed: Math.floor((now - new Date(dueForReview[0].phase_1_completed_at)) / (1000 * 60 * 60 * 24)),
      };
    } else if (nextNew) {
      priority = 'learn';
      recommended = {
        type: 'learn',
        title: '推荐学习',
        message: '继续你的学习之旅',
        unitId: nextNew.unitId,
        path: nextNew.chapterTitle + ' > ' + nextNew.subTitle,
      };
    }

    res.json({
      success: true,
      data: {
        priority,
        recommended,
        dueErrors: dueErrors.length,
        dueReview: dueForReview.length,
        totalStarted: progressRows.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'RECOMMEND_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
