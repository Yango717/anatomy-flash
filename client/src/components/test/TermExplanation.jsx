export default function TermExplanation({ question, value, onChange }) {
  return (
    <div className="test-question">
      <p className="test-question__stem">{question.stem}</p>
      <textarea
        className="test-textarea"
        rows={4}
        placeholder="请输入你的解释..."
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
