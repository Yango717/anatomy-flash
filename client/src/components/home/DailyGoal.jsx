import { useEffect, useState } from 'react';
import { api } from '../../utils/api';

export default function DailyGoal() {
  const [todayCount, setTodayCount] = useState(0);
  const goal = parseInt(localStorage.getItem('dailyGoal') || '0', 10);

  useEffect(() => {
    // Count today's quiz and test attempts
    api.get('/progress/overview').then((d) => {
      setTodayCount(d.recentAttempts || 0);
    }).catch(() => {});
  }, []);

  if (!goal) return null;

  const pct = Math.min(100, Math.round((todayCount / goal) * 100));

  return (
    <div className="daily-goal">
      <div className="daily-goal__header">
        <span>📋 今日进度</span>
        <span>{todayCount} / {goal}</span>
      </div>
      <div className="daily-goal__bar">
        <div className="daily-goal__fill" style={{ width: pct + '%' }} />
      </div>
      {pct >= 100 && <p className="daily-goal__done">🎉 今日目标达成！</p>}
    </div>
  );
}
