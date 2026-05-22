export default function TestResult({ result, onViewErrors, onBack, onExam }) {
  return (
    <div className="quiz-result">
      <div className="quiz-result__score-circle">
        <span className="quiz-result__score-num">{result.score}</span>
        <span className="quiz-result__score-label">分</span>
      </div>
      <p className="quiz-result__summary">
        得分 {result.totalPoints}/{result.maxPoints} 分
        {result.wrongCount > 0 ? `，${result.wrongCount} 道错题已加入错题本` : '，全部正确！'}
      </p>
      <div className="quiz-result__actions">
        {result.wrongCount > 0 && (
          <button className="btn btn--secondary btn--lg btn--block" onClick={onViewErrors}>
            查看错题本 →
          </button>
        )}
        <button className="btn btn--primary btn--lg btn--block" onClick={onBack}>
          回到目录 →
        </button>
        {onExam && (
          <button className="btn btn--outline btn--sm" onClick={onExam}>
            做真题 (可选)
          </button>
        )}
      </div>
    </div>
  );
}
