import { useState } from 'react';
import SystemIcon from '../systems/SystemIcon';

export default function PracticeModuleSelect({ chapters, onGenerate, onSelectChapter }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function handleGenerate() {
    if (selected.size === 0) return;
    onGenerate(Array.from(selected));
  }

  return (
    <div>
      <div className="practice-generate">
        <p className="practice-generate__hint">
          已选 {selected.size} 个模块，点击「一键组题」生成综合练习
        </p>
        <button
          className="btn btn--primary btn--lg btn--block"
          onClick={handleGenerate}
          disabled={selected.size === 0}
        >
          一键组题 ({selected.size})
        </button>
      </div>

      <h3 className="practice-section__title">或点击单个模块进入刷题</h3>
      <div className="module-grid">
        {chapters.map((ch) => (
          <div key={ch.chapterId} className="module-card practice-module" onClick={() => onSelectChapter(ch.chapterId)}>
            <SystemIcon chapterId={ch.chapterId} size={28} />
            <h3 className="module-card__title">{ch.title}</h3>
            <p className="module-card__desc">点击进入刷题</p>
          </div>
        ))}
      </div>

      {chapters.length > 0 && (
        <div className="practice-checkboxes">
          {chapters.map((ch) => (
            <label key={ch.chapterId} className="practice-checkbox">
              <input type="checkbox" checked={selected.has(ch.chapterId)} onChange={() => toggle(ch.chapterId)} />
              <span><SystemIcon chapterId={ch.chapterId} size={18} /> {ch.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
