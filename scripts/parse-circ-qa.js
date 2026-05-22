const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/# 循环系统.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

let section = null;
const shortA = [], essays = [];

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('四、简答题')) { section = 'short'; continue; }
  if (l.includes('五、问答题')) { section = 'essay'; continue; }
  if (l.includes('六、答题要点')) { section = null; continue; }
  if (section === 'short' || section === 'essay') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m) (section === 'short' ? shortA : essays).push({ n: parseInt(m[1]), stem: m[2].trim() });
  }
}

const ansShort = {}, ansEssay = {};
let as = null;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('六、答题要点和答案')) as = 'start';
  if (!as) continue;
  if (l.includes('(四)简答题') || l.includes('（四）简答题')) as = 'sA';
  else if (l.includes('(五)问答') || l.includes('（五）问答') || l.includes('(五) 问答')) as = 'eA';
  else if (l.includes('(六)') || l.includes('（六）')) as = null;
  if (as === 'sA' || as === 'eA') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m && parseInt(m[1]) <= 50) {
      let text = m[2]; let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\./) &&
             !lines[j].includes('(五)') && !lines[j].includes('（五）') &&
             !lines[j].includes('(六)') && !lines[j].includes('（六）')) {
        if (lines[j].trim()) text += ' ' + lines[j].trim();
        j++;
      }
      (as === 'sA' ? ansShort : ansEssay)[parseInt(m[1])] = text.trim();
    }
  }
}

// Build and merge
const poolPath = path.join(__dirname, '..', 'content', 'chapter-06-循环系统', 'practice-pool.json');
const existing = JSON.parse(fs.readFileSync(poolPath, 'utf-8'));
let mjMax = 0;
existing.questions.forEach(q => {
  const p = q.id.split('-');
  if (p[1] === 'MJ') mjMax = Math.max(mjMax, parseInt(p[2]));
});

let added = 0;
const addQ = (type, q, ans) => {
  if (!ans) { console.log(`  WARN: no answer for ${type} #${q.n}`); return; }
  mjMax++;
  existing.questions.push({
    id: `YD-MJ-${String(mjMax).padStart(3, '0')}`,
    type, stem: q.stem, options: null, answer: ans, explanation: ans,
  });
  added++;
};

shortA.forEach(q => addQ('short_answer', q, ansShort[q.n]));
essays.forEach(q => addQ('essay', q, ansEssay[q.n]));

fs.writeFileSync(poolPath, JSON.stringify(existing, null, 2));
const t = {}; existing.questions.forEach(q => { t[q.type] = (t[q.type] || 0) + 1; });
console.log(`Short: ${shortA.length}/${Object.keys(ansShort).length}, Essay: ${essays.length}/${Object.keys(ansEssay).length}`);
console.log(`Added: ${added}, Total: ${existing.questions.length}`, JSON.stringify(t));
