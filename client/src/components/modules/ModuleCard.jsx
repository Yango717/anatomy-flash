import { useNavigate } from 'react-router-dom';
import SystemIcon from '../systems/SystemIcon';

export default function ModuleCard({ chapter }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/sections/${chapter.chapterId}`);
  }

  const subCount = (chapter.sections || []).reduce(
    (sum, s) => sum + (s.subsections || []).length, 0
  );

  return (
    <button className="module-card" onClick={handleClick}>
      <SystemIcon chapterId={chapter.chapterId} size={28} />
      <h3 className="module-card__title">{chapter.title}</h3>
      {chapter.description && (
        <p className="module-card__desc">{chapter.description}</p>
      )}
      <p className="module-card__count">{subCount} 个小节</p>
    </button>
  );
}
