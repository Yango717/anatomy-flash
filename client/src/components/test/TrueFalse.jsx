export default function TrueFalse({ question, value, onChange }) {
  return (
    <div className="test-question">
      <p className="test-question__stem">{question.stem}</p>
      <div className="test-tf">
        <button
          className={`btn test-tf__btn ${value === 'true' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => onChange('true')}
        >
          ✓ 正确
        </button>
        <button
          className={`btn test-tf__btn ${value === 'false' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => onChange('false')}
        >
          ✗ 错误
        </button>
      </div>
    </div>
  );
}
