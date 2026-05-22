export default function AutoReviewViewer({ reviewData, onComplete }) {
  if (!reviewData || reviewData.skip) {
    return (
      <div className="review-page">
        <div className="empty-hint">太棒了！没有需要复习的知识点</div>
        <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 'var(--spacing-xl)' }} onClick={onComplete}>
          继续学习 →
        </button>
      </div>
    );
  }

  return (
    <div className="review-page">
      <h2 className="review-page__title">自动回顾</h2>
      <p className="review-page__subtitle">以下是你做错的知识点，请仔细阅读并理解</p>

      <div className="review-list">
        {reviewData.items.map((item) => (
          <div key={item.weakPointId} className="review-card">
            <div className="review-card__question">{item.questionStem}</div>
            <div className="review-card__answer review-card__answer--wrong">
              你的答案：{(item.userAnswer || []).join('、') || '(未填)'}
            </div>
            <div className="review-card__answer review-card__answer--correct">
              正确答案：{item.correctAnswer}
            </div>
            {item.hint && (
              <div className="review-card__hint">💡 提示：{item.hint}</div>
            )}
            <div className="review-card__related">
              相关知识点：{item.relatedContent}
            </div>
            <label className="review-card__check">
              <input type="checkbox" /> 我已理解
            </label>
          </div>
        ))}
      </div>

      <button className="btn btn--primary btn--lg btn--block" onClick={onComplete}>
        完成回顾 ({reviewData.totalCount} 项) →
      </button>
    </div>
  );
}
