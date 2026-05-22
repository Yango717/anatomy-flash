export default function PracticeResult({ result, questions, statusMap, onBack }) {
  return (
    <div>
      <div className="page-header">
        <button className="page-header__back" onClick={onBack}>← 返回列表</button>
        <h2 className="page-header__title">测试结果</h2>
      </div>

      <div className="quiz-result">
        <div className="quiz-result__score-circle">
          <span className="quiz-result__score-num">{result.score}</span>
          <span className="quiz-result__score-label">分</span>
        </div>
        <p className="quiz-result__summary">
          {result.correct}/{result.total} 正确
        </p>

        <div className="practice-result-grid">
          {questions.map((q, i) => {
            const s = statusMap[q.id];
            let cls = 'practice-num';
            if (s === 'correct') cls += ' practice-num--correct';
            else if (s === 'wrong') cls += ' practice-num--wrong';
            else cls += ' practice-num--skipped';
            return (
              <div key={q.id} className={cls}>
                <span>{i + 1}</span>
              </div>
            );
          })}
        </div>

        <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 'var(--spacing-xl)' }}
          onClick={onBack}>返回列表</button>
      </div>
    </div>
  );
}
