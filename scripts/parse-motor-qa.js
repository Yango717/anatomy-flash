const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/运动系统题.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

let section = null;
const shortAnswers = [];  // 简答题 → short_answer
const essays = [];        // 问答题 → essay

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('四、简答题')) { section = 'short'; continue; }
  if (line.includes('五、问答题')) { section = 'essay'; continue; }
  if (line.includes('六、答题要点') || line.includes('六、答案')) { section = null; continue; }

  if (section === 'short' || section === 'essay') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) {
      (section === 'short' ? shortAnswers : essays).push({
        num: parseInt(m[1]),
        stem: m[2].trim(),
      });
    }
  }
}

// Parse answers
const answers = { short: {}, essay: {} };
let ansSection = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('六、答题要点和答案') || line.includes('六、答案')) ansSection = 'start';
  if (!ansSection) continue;

  if (line.includes('(四)简答题') || line.includes('（四）简答题')) ansSection = 'shortAns';
  else if (line.includes('(五)问答题') || line.includes('（五）问答题') || line.includes('(五) 问答题') || line.includes('（五） 问答题')) ansSection = 'essayAns';
  else if (line.includes('(六)') || line.includes('（六）')) ansSection = null;

  if (ansSection === 'shortAns' || ansSection === 'essayAns') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m && parseInt(m[1]) <= 30) {
      let text = m[2];
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\./) &&
             !lines[j].includes('(五)') && !lines[j].includes('（五）') &&
             !lines[j].includes('(六)') && !lines[j].includes('（六）')) {
        if (lines[j].trim()) text += ' ' + lines[j].trim();
        j++;
      }
      const target = ansSection === 'shortAns' ? answers.short : answers.essay;
      target[parseInt(m[1])] = text.trim();
    }
  }
}

console.log(`Short answers: ${shortAnswers.length}/${Object.keys(answers.short).length}`);
console.log(`Essays: ${essays.length}/${Object.keys(answers.essay).length}`);

// Merge with existing pool
const poolPath = path.join(__dirname, '..', 'content', 'chapter-01-运动系统', 'practice-pool.json');
const existing = JSON.parse(fs.readFileSync(poolPath, 'utf-8'));
const existingIds = new Set(existing.questions.map(q => q.id));

// Find max MJ ID (term_explanation, short_answer, essay share the MJ namespace)
const maxMJ = Math.max(0, ...existing.questions
  .filter(q => q.type === 'term_explanation')
  .map(q => parseInt(q.id.split('-')[2])));
let mjCounter = maxMJ;

const newQuestions = [];

shortAnswers.forEach(q => {
  const ans = answers.short[q.num] || '';
  if (!ans) { console.log(`  WARNING: No answer for short answer #${q.num}`); return; }
  mjCounter++;
  newQuestions.push({
    id: `YD-MJ-${String(mjCounter).padStart(3, '0')}`,
    type: 'short_answer',
    stem: q.stem,
    options: null,
    answer: ans,
    explanation: ans,
  });
});

essays.forEach(q => {
  const ans = answers.essay[q.num] || '';
  if (!ans) { console.log(`  WARNING: No answer for essay #${q.num}`); return; }
  mjCounter++;
  newQuestions.push({
    id: `YD-MJ-${String(mjCounter).padStart(3, '0')}`,
    type: 'essay',
    stem: q.stem,
    options: null,
    answer: ans,
    explanation: ans,
  });
});

const merged = {
  chapterId: 'chapter-01',
  questions: [...existing.questions, ...newQuestions],
};

fs.writeFileSync(poolPath, JSON.stringify(merged, null, 2));

console.log(`New: ${newQuestions.length}, Existing: ${existing.questions.length}, Total: ${merged.questions.length}`);
const t = {};
merged.questions.forEach(q => { t[q.type] = (t[q.type] || 0) + 1; });
console.log('Types:', JSON.stringify(t));
