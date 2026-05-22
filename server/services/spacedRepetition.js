// Simplified SM-2 spaced repetition algorithm
// mastery 0→1天, 1→3天, 2→7天, 3→30天, 4+→已掌握(90天)

const INTERVALS = [1, 3, 7, 30, 90];

function nextReview(masteryLevel) {
  const days = INTERVALS[Math.min(masteryLevel, INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isDue(nextReviewDue) {
  if (!nextReviewDue) return true;
  return new Date(nextReviewDue) <= new Date();
}

function daysUntil(dueDate) {
  if (!dueDate) return 0;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

module.exports = { nextReview, isDue, daysUntil, INTERVALS };
