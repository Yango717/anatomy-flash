import { useNavigate } from 'react-router-dom';
import { CHAPTER_NAMES } from '../../utils/constants';

export default function Breadcrumb({ chapterId, partTitle }) {
  const navigate = useNavigate();
  const chapterName = CHAPTER_NAMES[chapterId] || '';

  return (
    <div className="breadcrumb">
      <button className="breadcrumb__link" onClick={() => navigate('/modules')}>系统</button>
      {chapterName && (
        <>
          <span className="breadcrumb__sep">›</span>
          <span className="breadcrumb__text">{chapterName}</span>
        </>
      )}
      {partTitle && (
        <>
          <span className="breadcrumb__sep">›</span>
          <span className="breadcrumb__current">{partTitle}</span>
        </>
      )}
    </div>
  );
}
