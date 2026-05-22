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

export { nextReview, isDue, daysUntil, INTERVALS };
