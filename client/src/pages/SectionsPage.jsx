import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SectionTree from '../components/sections/SectionTree';
import { api } from '../utils/api';

export default function SectionsPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/chapters/${chapterId}/sections`)
      .then((data) => setMeta(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) return <div className="page-loading">加载中...</div>;
  if (!meta) return <div className="page-loading">模块不存在</div>;

  return (
    <div className="page page--sections">
      <div className="page-header">
        <button className="page-header__back" onClick={() => navigate('/modules')}>← 返回</button>
        <h2 className="page-header__title">{meta.title}</h2>
      </div>
      <SectionTree sections={meta.sections} chapterId={chapterId} />
    </div>
  );
}
