import { useState } from 'react';

export default function FillBlankQuiz({ question, onAnswerChange }) {
  const { stem, blankCount, hints } = question;
  const [showHints, setShowHints] = useState({});
  const parts = parseStem(stem);

  function toggleHint(index) {
    setShowHints((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="quiz-blank">
      {parts.map((part, i) => {
        if (part.type === 'blank') {
          const idx = part.index;
          return (
            <span key={i} className="quiz-blank__wrapper">
              <input
                className="quiz-blank__input"
                type="text"
                placeholder={`填空 ${idx + 1}`}
                onChange={(e) => onAnswerChange(idx, e.target.value)}
              />
              {hints[idx] && showHints[idx] && (
                <span className="quiz-blank__hint">💡 {hints[idx].hint}</span>
              )}
              <button
                className="quiz-blank__hint-btn"
                onClick={() => toggleHint(idx)}
              >
                ?
              </button>
            </span>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </div>
  );
}

function parseStem(stem) {
  const result = [];
  const parts = stem.split(/_{2,}/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) result.push({ type: 'text', text: parts[i] });
    if (i < parts.length - 1) result.push({ type: 'blank', index: i });
  }
  return result;
}
