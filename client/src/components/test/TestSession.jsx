import { useState } from 'react';
import MultipleChoice from './MultipleChoice';
import TrueFalse from './TrueFalse';
import TermExplanation from './TermExplanation';

export default function TestSession({ questions, onSubmit }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const q = questions[currentIdx];
  const isLast = currentIdx >= questions.length - 1;

  function setAnswer(val) {
    setAnswers((prev) => {
      const a = [...prev];
      a[currentIdx] = val;
      return a;
    });
  }

  function goNext() { if (!isLast) setCurrentIdx((i) => i + 1); }
  function goPrev() { if (currentIdx > 0) setCurrentIdx((i) => i - 1); }

  function handleSubmit() {
    onSubmit(answers);
  }

  if (!q) return null;

  return (
    <div className="quiz-session">
      <div className="quiz-session__progress">
        {questions.map((_, i) => (
          <span key={i} className={`quiz-session__dot ${i === currentIdx ? 'quiz-session__dot--active' : ''} ${i < currentIdx ? 'quiz-session__dot--done' : ''}`} />
        ))}
        <span className="quiz-session__count">{currentIdx + 1}/{questions.length}</span>
      </div>

      <div className="test-type-badge">
        {q.type === 'multiple_choice' ? '选择题' : q.type === 'true_false' ? '判断题' : '名词解释'}
      </div>

      {q.type === 'multiple_choice' && (
        <MultipleChoice question={q} value={answers[currentIdx]} onChange={setAnswer} />
      )}
      {q.type === 'true_false' && (
        <TrueFalse question={q} value={answers[currentIdx]} onChange={setAnswer} />
      )}
      {(q.type === 'term_explanation' || q.type === 'short_answer' || q.type === 'essay') && (
        <TermExplanation question={q} value={answers[currentIdx]} onChange={setAnswer} />
      )}

      <div className="quiz-session__nav">
        <button className="btn btn--outline btn--sm" onClick={goPrev} disabled={currentIdx === 0}>上一题</button>
        {isLast ? (
          <button className="btn btn--primary btn--sm" onClick={handleSubmit}>提交测试</button>
        ) : (
          <button className="btn btn--primary btn--sm" onClick={goNext}>下一题</button>
        )}
      </div>
    </div>
  );
}
