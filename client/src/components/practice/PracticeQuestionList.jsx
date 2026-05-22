export default function PracticeQuestionList({ questions, statusMap, onQuestionClick, onBack, onReset, stats }) {
  if (!questions.length) {
    return (
      <div>
        <button className="page-header__back" onClick={onBack}>← 返回</button>
        <div className="empty-hint">该模块暂无题目</div>
      </div>
    );
  }

  const doneCount = Object.keys(statusMap).length;
  const correctCount = Object.values(statusMap).filter(s => s === 'correct').length;
  const wrongCount = Object.values(statusMap).filter(s => s === 'wrong').length;

  return (
    <div>
      <div className="page-header">
        <button className="page-header__back" onClick={onBack}>← 返回</button>
        <h2 className="page-header__title">题目列表</h2>
        {doneCount > 0 && (
          <button className="practice-reset-btn" onClick={onReset}>重新开始</button>
        )}
      </div>

      <p className="practice-list__total">共 {questions.length} 题</p>

      {doneCount > 0 && (
        <div className="practice-stats">
          <div className="practice-stats__bar">
            <div className="practice-stats__fill practice-stats__fill--correct"
              style={{ width: `${(correctCount / questions.length) * 100}%` }} />
            <div className="practice-stats__fill practice-stats__fill--wrong"
              style={{ width: `${(wrongCount / questions.length) * 100}%` }} />
          </div>
          <div className="practice-stats__labels">
            <span className="practice-stats__label practice-stats__label--correct">
              正确 {correctCount} ({questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%)
            </span>
            <span className="practice-stats__label practice-stats__label--wrong">
              错误 {wrongCount} ({questions.length > 0 ? Math.round((wrongCount / questions.length) * 100) : 0}%)
            </span>
            <span className="practice-stats__label">
              未做 {questions.length - doneCount}
            </span>
          </div>
        </div>
      )}

      <div className="practice-grid">
        {questions.map((q, i) => {
          const status = statusMap[q.id];
          let cls = 'practice-num';
          if (status === 'correct') cls += ' practice-num--correct';
          else if (status === 'wrong') cls += ' practice-num--wrong';
          return (
            <button key={q.id} className={cls} onClick={() => onQuestionClick(q, i)}>
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
