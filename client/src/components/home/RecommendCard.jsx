import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const TYPE_CONFIG = {
  error: { icon: '🔴', label: '优先复习错题', className: 'rec-card--error' },
  review: { icon: '🟡', label: '艾宾浩斯复习', className: 'rec-card--review' },
  learn: { icon: '🟢', label: '推荐学习', className: 'rec-card--learn' },
};

export default function RecommendCard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/recommend').then(setData).catch(() => {});
  }, []);

  if (!data?.recommended) return null;

  const { recommended, priority } = data;
  const cfg = TYPE_CONFIG[priority] || TYPE_CONFIG.learn;

  function handleClick() {
    navigate(`/learn/${encodeURIComponent(recommended.unitId)}`, {
      state: { partTitle: recommended.path },
    });
  }

  return (
    <button className={`rec-card ${cfg.className}`} onClick={handleClick}>
      <div className="rec-card__header">
        <span className="rec-card__icon">{cfg.icon}</span>
        <span className="rec-card__label">{cfg.label}</span>
      </div>
      <p className="rec-card__msg">{recommended.message}</p>
      <p className="rec-card__path">{recommended.path}</p>
      {recommended.daysPassed != null && (
        <p className="rec-card__interval">上次学习已过 {recommended.daysPassed} 天</p>
      )}
    </button>
  );
}
