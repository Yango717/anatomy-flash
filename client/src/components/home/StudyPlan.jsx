import { useState } from 'react';

export default function StudyPlan() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyPlan') || '[]'); } catch { return []; }
  });
  const [text, setText] = useState('');

  function save(newItems) {
    setItems(newItems);
    localStorage.setItem('studyPlan', JSON.stringify(newItems));
  }

  function add() {
    if (!text.trim()) return;
    save([...items, { id: Date.now(), text: text.trim(), done: false }]);
    setText('');
  }

  function toggle(id) {
    save(items.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  }

  function remove(id) {
    save(items.filter((i) => i.id !== id));
  }

  const undone = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <div className="study-plan">
      <h3 className="study-plan__title">📋 今日学习计划</h3>

      <div className="study-plan__form">
        <input
          className="study-plan__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="添加计划，如：完成运动系统骨学概述"
        />
        <button className="btn btn--primary btn--sm" onClick={add}>添加</button>
      </div>

      {undone.length === 0 && (
        <p className="study-plan__hint">暂无计划，开始添加吧</p>
      )}

      {undone.map((item) => (
        <div key={item.id} className="study-plan__item">
          <button
            className={`study-plan__check ${item.done ? 'study-plan__check--done' : ''}`}
            onClick={() => toggle(item.id)}
          >
            {item.done ? '✓' : '○'}
          </button>
          <span className="study-plan__text">{item.text}</span>
          <button className="study-plan__del" onClick={() => remove(item.id)}>✕</button>
        </div>
      ))}

      {done.length > 0 && (
        <details className="study-plan__done">
          <summary>已完成 ({done.length})</summary>
          {done.map((item) => (
            <div key={item.id} className="study-plan__item study-plan__item--done">
              <button className="study-plan__check study-plan__check--done" onClick={() => toggle(item.id)}>✓</button>
              <span className="study-plan__text">{item.text}</span>
              <button className="study-plan__del" onClick={() => remove(item.id)}>✕</button>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
