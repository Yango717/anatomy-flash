import { useState, useEffect } from 'react';
import ErrorBookList from '../components/errorbook/ErrorBookList';
import { api } from '../utils/api';

export default function ReviewHubPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/progress/overview').then((d) => setStats(d)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h2 className="page__title">复习</h2>

      {stats && (
        <div className="review-stats">
          <div className="review-stat">
            <span className="review-stat__num">{stats.errorTotal || 0}</span>
            <span className="review-stat__label">全部错题</span>
          </div>
          <div className="review-stat review-stat--due">
            <span className="review-stat__num">{stats.dueErrors || 0}</span>
            <span className="review-stat__label">今日待复习</span>
          </div>
        </div>
      )}

      <ErrorBookList />
    </div>
  );
}
