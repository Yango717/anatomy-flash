import { CHAPTER_NAMES } from '../../utils/constants';

export default function DashboardCards({ stats, onViewErrors }) {
  const chapters = (stats.chapterProgress || [])
    .sort((a, b) => a.chapterId.localeCompare(b.chapterId));

  return (
    <div className="dashboard-cards">
      {/* Overall progress */}
      <div className="dash-card dash-card--main">
        <span className="dash-card__value">{stats.percentage}%</span>
        <span className="dash-card__label">
          总进度 · {stats.completedUnits || 0}/{stats.totalUnits} 单元
        </span>
      </div>

      {/* Completed units */}
      <div className="dash-card">
        <span className="dash-card__value">{stats.completedUnits || 0}</span>
        <span className="dash-card__label">已完成单元</span>
      </div>

      <div className="dash-card">
        <span className="dash-card__value">{stats.recentAttempts}</span>
        <span className="dash-card__label">本周测验</span>
      </div>

      {/* Errors & due */}
      <button className="dash-card dash-card--clickable" onClick={onViewErrors}>
        <span className={`dash-card__value ${stats.dueErrors > 0 ? 'dash-card__value--warn' : ''}`}>
          {stats.dueErrors}
        </span>
        <span className="dash-card__label">待复习错题</span>
        {stats.dueErrors > 0 && <span className="dash-card__dot" />}
      </button>

      <div className="dash-card">
        <span className="dash-card__value">{stats.errorTotal}</span>
        <span className="dash-card__label">未纠错题</span>
      </div>

      {/* Chapter breakdown */}
      {chapters.length > 0 && (
        <div className="dash-section">
          <h3 className="dash-section__title">各章进度</h3>
          {chapters.map((ch) => (
            <div key={ch.chapterId} className="dash-chapter">
              <span className="dash-chapter__name">{CHAPTER_NAMES[ch.chapterId] || ch.chapterId}</span>
              <span className="dash-chapter__pct">{ch.percentage}%</span>
              <span className="dash-chapter__count">{ch.completedUnits || 0}/{ch.totalUnits}</span>
              <div className="dash-chapter__bar">
                <div className="dash-chapter__fill" style={{ width: ch.percentage + '%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
