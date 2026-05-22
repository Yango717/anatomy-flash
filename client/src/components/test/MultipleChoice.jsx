export default function MultipleChoice({ question, value, onChange }) {
  return (
    <div className="test-question">
      <p className="test-question__stem">{question.stem}</p>
      <div className="test-options">
        {(question.options || []).map((opt) => (
          <label key={opt.key} className={`test-option ${value === opt.key ? 'test-option--selected' : ''}`}>
            <input
              type="radio"
              name={`q-${question.id}`}
              value={opt.key}
              checked={value === opt.key}
              onChange={() => onChange(opt.key)}
            />
            <span className="test-option__key">{opt.key}</span>
            <span className="test-option__text">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
