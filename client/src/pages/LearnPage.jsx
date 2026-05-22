import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ContentViewer from '../components/content/ContentViewer';
import NotesSection from '../components/content/NotesSection';
import Breadcrumb from '../components/common/Breadcrumb';
import { useLearningFlow } from '../hooks/useLearningFlow';
import { api } from '../utils/api';

export default function LearnPage() {
  const { unitId: rawUnitId } = useParams();
  const unitId = decodeURIComponent(rawUnitId || '');
  const navigate = useNavigate();
  const { phase, loading: flowLoading, completePhase } = useLearningFlow(unitId);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const locationState = location.state || {};

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    api.get(`/units/${encodeURIComponent(unitId)}/content`)
      .then((data) => setContent(data.content || ''))
      .catch(() => setContent(''))
      .finally(() => setLoading(false));
  }, [unitId]);

  async function handleComplete() {
    await completePhase(1);
    navigate(`/quiz/${encodeURIComponent(unitId)}`, { state: locationState });
  }

  if (loading || flowLoading) return <div className="page-loading">加载中...</div>;

  if (!content) {
    return (
      <div className="page">
        <Breadcrumb chapterId={locationState.chapterId} partTitle={locationState.partTitle || '学习内容'} />
        <div className="empty-hint">该单元暂无学习内容</div>
      </div>
    );
  }

  return (
    <div className="page page--learn">
      <Breadcrumb chapterId={locationState.chapterId} partTitle={locationState.partTitle || '学习内容'} />

      <ContentViewer content={content} />

      <NotesSection unitId={unitId} />

      <div className="learn-page__action">
        <button className="btn btn--primary btn--lg btn--block" onClick={handleComplete}>
          完成学习 →
        </button>
      </div>
    </div>
  );
}
