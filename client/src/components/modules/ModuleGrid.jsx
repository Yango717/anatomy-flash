import { useEffect, useState } from 'react';
import ModuleCard from './ModuleCard';
import { api } from '../../utils/api';

export default function ModuleGrid() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/chapters')
      .then((data) => setChapters(data.chapters || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">加载中...</div>;
  if (error) return <div className="page-loading">加载失败，请检查网络连接</div>;
  if (!chapters.length) return <div className="empty-hint">暂无学习模块</div>;

  return (
    <div className="module-grid">
      {chapters.map((ch) => (
        <ModuleCard key={ch.chapterId} chapter={ch} />
      ))}
    </div>
  );
}
