import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { PHASE_LABELS } from '../utils/constants';
import SystemProgressRing from '../components/systems/SystemProgressRing';
import SystemIcon from '../components/systems/SystemIcon';

const PHASE_COLORS = {
  0: '#CCCCCC', 1: '#3498DB', 2: '#F1C40F',
  3: '#1ABC9C', 4: '#9B59B6', 5: '#1e6b9b',
};

function countUnits(chapter) {
  let n = 0;
  for (const s of (chapter.sections || []))
    for (const sub of (s.subsections || []))
      n += (sub.parts || []).length;
  return n;
}

export default function ModulesPage() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [progress, setProgress] = useState({}); // { [chapterId]: { [unitId]: phase } }

  useEffect(() => {
    api.get('/chapters')
      .then((d) => setChapters(d.chapters || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadProgress = useCallback(async (chapterId) => {
    if (progress[chapterId]) return;
    try {
      const data = await api.get(`/progress/chapter/${chapterId}`);
      const map = {};
      (data || []).forEach((item) => { map[item.unitId] = item.currentPhase; });
      setProgress((prev) => ({ ...prev, [chapterId]: map }));
    } catch {}
  }, [progress]);

  async function toggle(chapterId) {
    if (!expanded[chapterId]) {
      await loadProgress(chapterId);
    }
    setExpanded((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  }

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page page--systems">
      <h2 className="page__title">系统</h2>

      <div className="system-list">
        {chapters.map((ch) => {
          const isOpen = !!expanded[ch.chapterId];
          const chProgress = progress[ch.chapterId] || {};
          const total = countUnits(ch);
          const completed = Object.values(chProgress).filter((p) => p >= 5).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div key={ch.chapterId} className={`system-accordion ${isOpen ? 'system-accordion--open' : ''}`}>
              <button className="system-accordion__bar" onClick={() => toggle(ch.chapterId)}>
                <SystemIcon chapterId={ch.chapterId} size={28} />
                <div className="system-accordion__info">
                  <span className="system-accordion__title">{ch.title}</span>
                  <span className="system-accordion__meta">{total} 个知识点</span>
                </div>
                <SystemProgressRing pct={pct} size={32} />
                <span className={`system-accordion__arrow ${isOpen ? 'system-accordion__arrow--open' : ''}`}>▸</span>
              </button>

              {isOpen && (
                <div className="system-accordion__body">
                  {(ch.sections || []).map((sec) => (
                    <div key={sec.id} className="system-section">
                      <div className="system-section__header">{sec.title}</div>
                      {(sec.subsections || []).map((sub) => (
                        <div key={sub.id} className="system-subsection">
                          {(sub.parts || []).map((part) => {
                            const uid = `${sub.id}-part-${part.id}`;
                            const phase = chProgress[uid] || 0;
                            return (
                              <button key={part.id} className="system-part"
                                onClick={() => navigate(`/learn/${encodeURIComponent(uid)}`, {
                                  state: { sectionId: sec.id, subsectionId: sub.id, partId: part.id, partTitle: part.title, chapterId: ch.chapterId }
                                })}>
                                <span className="system-part__title">{part.title}</span>
                                <span className="system-part__phase"
                                  style={{ backgroundColor: PHASE_COLORS[phase] || PHASE_COLORS[0] }}>
                                  {PHASE_LABELS[phase] || PHASE_LABELS[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
