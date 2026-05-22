export default function QuizResult({ result, onReview, onNext }) {
  const { score, totalQuestions, correctCount, wrongAnswers, hasWeakPoints } = result;

  return (
    <div className="quiz-result">
      <div className="quiz-result__score-circle">
        <span className="quiz-result__score-num">{score}</span>
        <span className="quiz-result__score-label">分</span>
      </div>

      <p className="quiz-result__summary">
        答对 {correctCount}/{totalQuestions} 题
        {hasWeakPoints ? `，有 ${wrongAnswers.length} 个知识点需要巩固` : '，全部正确！'}
      </p>

      {wrongAnswers.length > 0 && (
        <div className="quiz-result__errors">
          <h3 className="quiz-result__errors-title">答错的题目</h3>
          {wrongAnswers.map((w, i) => (
            <div key={i} className="quiz-result__error-item">
              <p className="quiz-result__error-stem">{w.stem.replace(/___/g, '___')}</p>
              <p className="quiz-result__error-answer">
                <span className="quiz-result__error-label">你的答案：</span>
                <span className="quiz-result__error-wrong">{(w.userAnswer || []).join('、') || '(未填)'}</span>
              </p>
              <p className="quiz-result__error-correct">
                <span className="quiz-result__error-label">正确答案：</span>
                <span className="quiz-result__error-right">{w.correctAnswer.join('、')}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="quiz-result__actions">
        {hasWeakPoints ? (
          <button className="btn btn--secondary btn--lg btn--block" onClick={onReview}>
            查看回顾 →
          </button>
        ) : null}
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>
          进入测试 →
        </button>
      </div>
    </div>
  );
}
