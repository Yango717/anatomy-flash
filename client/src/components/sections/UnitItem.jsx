import { useNavigate } from 'react-router-dom';
import { PHASE_LABELS } from '../../utils/constants';

const PHASE_COLORS = {
  0: '#CCCCCC', 1: '#3498DB', 2: '#F1C40F',
  3: '#1ABC9C', 4: '#9B59B6', 5: '#1e6b9b',
};

export default function UnitItem({ part, sectionId, subsectionId, phase = 0 }) {
  const navigate = useNavigate();
  const unitId = `${subsectionId}-part-${part.id}`;

  function handleClick() {
    navigate(`/learn/${encodeURIComponent(unitId)}`, { state: { sectionId, subsectionId, partId: part.id, partTitle: part.title } });
  }

  return (
    <button className="unit-item" onClick={handleClick}>
      <span className="unit-item__name">{part.title}</span>
      <span
        className="unit-item__badge"
        style={{ backgroundColor: PHASE_COLORS[phase] || PHASE_COLORS[0] }}
      >
        {PHASE_LABELS[phase] || PHASE_LABELS[0]}
      </span>
    </button>
  );
}
