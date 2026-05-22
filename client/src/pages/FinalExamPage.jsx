import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TestSession from '../components/test/TestSession';
import TestResult from '../components/test/TestResult';
import Breadcrumb from '../components/common/Breadcrumb';
import { api } from '../utils/api';

export default function FinalExamPage() {
  const { unitId: raw } = useParams();
  const unitId = decodeURIComponent(raw || '');
  const navigate = useNavigate();
  const location = useLocation();
  const loc = location.state || {};
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    api.get(`/units/${encodeURIComponent(unitId)}/finalexam`)
      .then((d) => setQuestions(d.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  async function handleSubmit(answers) {
    const res = await api.post(`/units/${encodeURIComponent(unitId)}/finalexam/submit`, { answers });
    setResult(res);
  }

  function handleSkip() {
    api.post(`/learning/progress/unit/${encodeURIComponent(unitId)}/phase/5/complete`).catch(() => {});
    navigate('/modules');
  }

  if (loading) return <div className="page-loading">加载中...</div>;

  if (result) {
    const chapterId = loc.chapterId || loc.sectionId || '';
    return (
      <div className="page">
        <Breadcrumb chapterId={loc.chapterId || loc.sectionId} partTitle="真题结果" />
        <TestResult
          result={result}
          onBack={() => chapterId ? navigate(`/sections/${chapterId}`) : navigate('/modules')}
        />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="page">
        <Breadcrumb chapterId={loc.chapterId || loc.sectionId} partTitle="真题测试" />
        <div className="empty-hint">
          <p>该单元暂无真题</p>
          <button className="btn btn--primary btn--lg" style={{ marginTop: 'var(--spacing-xl)' }} onClick={handleSkip}>
            回到目录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb chapterId={loc.chapterId || loc.sectionId} partTitle={loc.partTitle || '真题测试'} />
      <TestSession questions={questions} onSubmit={handleSubmit} />
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--spacing-md)', width: '100%' }} onClick={handleSkip}>
        跳过真题，回到目录
      </button>
    </div>
  );
}
