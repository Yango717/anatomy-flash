import { useNavigate } from 'react-router-dom';

export default function ExamHubPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2 className="page__title">考试</h2>

      <div className="exam-hub">
        <button className="exam-entry" onClick={() => navigate('/practice')}>
          <span className="exam-entry__icon">📝</span>
          <div className="exam-entry__body">
            <h3 className="exam-entry__title">分章刷题</h3>
            <p className="exam-entry__desc">按系统选择题目，支持背题/刷题/测试三种模式</p>
          </div>
          <span className="exam-entry__arrow">→</span>
        </button>

        <div className="exam-entry exam-entry--disabled">
          <span className="exam-entry__icon">📋</span>
          <div className="exam-entry__body">
            <h3 className="exam-entry__title">综合模拟</h3>
            <p className="exam-entry__desc">跨系统随机组卷，模拟真实考试环境</p>
          </div>
          <span className="exam-entry__tag">即将推出</span>
        </div>
      </div>
    </div>
  );
}
