import { useState, useEffect } from 'react';
import ErrorBookItem from './ErrorBookItem';
import { api } from '../../utils/api';

export default function ErrorBookList() {
  const [errors, setErrors] = useState([]);
  const [dueErrors, setDueErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/errorbook'),
      api.get('/errorbook/due'),
    ]).then(([all, due]) => {
      setErrors(all);
      setDueErrors(due);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleMastery(id, level) {
    await api.put(`/errorbook/${id}/mastery`, { masteryLevel: level });
    load();
  }

  async function handleResolve(id) {
    await api.put(`/errorbook/${id}/resolve`);
    load();
  }

  if (loading) return <div className="page-loading">加载中...</div>;
  if (!errors.length) {
    return (
      <div className="empty-hint">
        <p>🎉 暂无错题</p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-hint)' }}>继续完成更多测试吧</p>
      </div>
    );
  }

  const dueIds = new Set(dueErrors.map((e) => e.id));

  return (
    <div className="error-list">
      {dueErrors.length > 0 && (
        <div className="due-section">
          <h3 className="due-section__title">📅 今日待复习 · {dueErrors.length} 题</h3>
          {dueErrors.map((e) => (
            <ErrorBookItem key={e.id} error={e} onMastery={handleMastery} onResolve={handleResolve} />
          ))}
        </div>
      )}

      <h3 className="due-section__title" style={{ color: 'var(--color-text-secondary)' }}>
        全部错题 · {errors.length} 题
      </h3>
      {errors.map((e) => (
        <ErrorBookItem key={e.id} error={e} onMastery={handleMastery} onResolve={handleResolve} isDue={dueIds.has(e.id)} />
      ))}
    </div>
  );
}
