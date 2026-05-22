import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

function calcRemaining(targetISO) {
  if (!targetISO) return null;
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export default function CountdownCard() {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');

  useEffect(() => {
    api.get('/countdown').then((data) => {
      setName(data.name);
      setTarget(data.target);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!target) return;
    setRemaining(calcRemaining(target));
    const timer = setInterval(() => {
      setRemaining(calcRemaining(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  async function handleSave() {
    try {
      const data = await api.put('/countdown', { name: editName || name, target: editTarget });
      setName(data.name);
      setTarget(data.target);
      setEditing(false);
    } catch {}
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  return (
    <div className="countdown-card">
      {!editing ? (
        <>
          <button className="countdown-card__edit" onClick={() => { setEditName(name); setEditTarget(target); setEditing(true); }}>
            ⚙ 编辑
          </button>
          <p className="countdown-card__name">{name}</p>
          {remaining ? remaining.expired ? (
            <div className="countdown-card__time countdown-card__time--expired">已到达</div>
          ) : (
            <div className="countdown-card__time">
              <span className="countdown-card__days">{remaining.days}</span>
              <span className="countdown-card__unit">天</span>
              <span className="countdown-card__hms">
                {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
              </span>
            </div>
          ) : (
            <div className="countdown-card__time">加载中...</div>
          )}
        </>
      ) : (
        <div className="countdown-card__form">
          <label className="countdown-card__label">倒计时名称</label>
          <input
            className="countdown-card__input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="如：距离解剖学期末考试"
          />
          <label className="countdown-card__label">目标日期时间</label>
          <input
            className="countdown-card__input"
            type="datetime-local"
            value={editTarget ? editTarget.slice(0, 16) : ''}
            onChange={(e) => setEditTarget(e.target.value)}
          />
          <div className="countdown-card__actions">
            <button className="btn btn--outline btn--sm" onClick={() => setEditing(false)}>取消</button>
            <button className="btn btn--primary btn--sm" onClick={handleSave}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}
