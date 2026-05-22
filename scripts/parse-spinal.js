const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/# 中枢神经系统脊髓.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

let section = null;
const fillBlanks = [], mcSingle = [], mcMulti = [], terms = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('一、填空题')) { section = 'fill'; continue; }
  if (line.includes('二、多选题') || line.includes('二、选择题')) { section = null; continue; }
  if (line.includes('A型题') || line.includes('最佳单项选择题')) { section = 'mcA'; continue; }
  if (line.includes('X型题')) { section = 'mcX'; continue; }
  if (line.includes('三、解释名词概念')) { section = 'term'; continue; }
  if (line.includes('四、简答题') || line.includes('五、问答题') || line.includes('六、答题要点')) { section = null; continue; }

  if (section === 'fill') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) fillBlanks.push({ num: parseInt(m[1]), stem: m[2].replace(/_{2,}/g, '___').replace(/\s+/g, ' ').trim() });
    continue;
  }

  if (section === 'mcA' || section === 'mcX') {
    const qMatch = line.match(/^(\d+)\.\s*(.+?)\s*\(\s*\)/);
    if (qMatch) {
      const stem = qMatch[2].trim();
      const options = [];
      const seenKeys = new Set();
      let j = i + 1;
      while (j < lines.length && j < i + 15) {
        const optLine = lines[j];
        if (optLine.match(/^\d+\./) || optLine.includes('X型题') || optLine.includes('A型题') || optLine.includes('选择题') || optLine === '') break;
        const markers = [...optLine.matchAll(/([A-E])[.．、]\s*/g)];
        for (let k = 0; k < markers.length; k++) {
          const key = markers[k][1];
          if (seenKeys.has(key)) continue;
          const start = markers[k].index + markers[k][0].length;
          const end = k + 1 < markers.length ? markers[k + 1].index : optLine.length;
          const text = optLine.slice(start, end).trim();
          if (text) { options.push({ key, text }); seenKeys.add(key); }
        }
        j++;
      }
      options.sort((a, b) => a.key.localeCompare(b.key));
      const target = section === 'mcA' ? mcSingle : mcMulti;
      target.push({ num: parseInt(qMatch[1]), stem, options });
    }
    continue;
  }

  if (section === 'term') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) terms.push({ num: parseInt(m[1]), stem: m[2].trim() });
  }
}

// Answers
const answers = { fill: {}, mcA: {}, mcX: {}, term: {} };
let ansSection = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('六、答题要点和答案')) ansSection = 'start';
  if (!ansSection) continue;

  if (line.includes('（一）填空题') || line.includes('(一)填空题')) ansSection = 'fillAns';
  else if (line.includes('(二)多选题') || line.includes('（二）多选题') || line.includes('(二)选择题')) ansSection = 'mcAns';
  else if (line.includes('A型题')) ansSection = 'mcAAns';
  else if (line.includes('X型题')) ansSection = 'mcXAns';
  else if (line.includes('(三)解释名词') || line.includes('（三）解释名词')) ansSection = 'termAns';
  else if (line.includes('(四)') || line.includes('（四）')) ansSection = null;

  if (ansSection === 'fillAns') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) answers.fill[parseInt(m[1])] = m[2].split(/[，,]/).map(s => s.trim()).filter(Boolean);
  }

  if (ansSection === 'mcAAns' || ansSection === 'mcXAns') {
    const nums = line.match(/(\d+)\.\s*([A-E]+)/g);
    if (nums) {
      nums.forEach(match => {
        const [num, ans] = match.split(/\.\s*/);
        const target = ansSection === 'mcAAns' ? answers.mcA : answers.mcX;
        target[parseInt(num)] = ans.trim();
      });
    }
  }

  if (ansSection === 'termAns') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m && parseInt(m[1]) <= 30) {
      let text = m[2];
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\./) && !lines[j].includes('(四)') &&
             !lines[j].includes('（四）') && !lines[j].includes('（五）') && !lines[j].includes('(五)')) {
        if (lines[j].trim()) text += ' ' + lines[j].trim();
        j++;
      }
      answers.term[parseInt(m[1])] = text.trim();
    }
  }
}

// Build pool
const pool = { chapterId: 'chapter-08', questions: [] };
let mc = 0, dx = 0, mj = 0;

fillBlanks.forEach((q) => {
  const ans = answers.fill[q.num] || [];
  pool.questions.push({
    id: `YD-MC-${String(++mc).padStart(3, '0')}`,
    type: 'fill_blank', stem: q.stem, options: null,
    blanks: ans.map(a => ({ answer: a })),
    answer: ans.join('、'), explanation: '',
  });
});

mcSingle.forEach((q) => {
  pool.questions.push({
    id: `YD-DX-${String(++dx).padStart(3, '0')}`,
    type: 'multiple_choice', stem: q.stem, options: q.options,
    answer: answers.mcA[q.num] || '', explanation: '',
  });
});

mcMulti.forEach((q) => {
  pool.questions.push({
    id: `YD-DX-${String(++dx).padStart(3, '0')}`,
    type: 'multi_select', stem: q.stem, options: q.options,
    answer: answers.mcX[q.num] || '', explanation: '',
  });
});

terms.forEach((q) => {
  const ans = answers.term[q.num] || '';
  pool.questions.push({
    id: `YD-MJ-${String(++mj).padStart(3, '0')}`,
    type: 'term_explanation', stem: q.stem, options: null,
    answer: ans, explanation: ans,
  });
});

const poolPath = path.join(__dirname, '..', 'content', 'chapter-08-神经系统', 'practice-pool.json');

// If existing pool, merge (for batch uploads)
let finalPool = pool;
if (fs.existsSync(poolPath)) {
  const existing = JSON.parse(fs.readFileSync(poolPath, 'utf-8'));
  const existingIds = new Set(existing.questions.map(q => q.id));
  const newQs = pool.questions.filter(q => !existingIds.has(q.id));
  finalPool = { chapterId: 'chapter-08', questions: [...existing.questions, ...newQs] };
  console.log(`Merged: ${existing.questions.length} existing + ${newQs.length} new`);
}

fs.writeFileSync(poolPath, JSON.stringify(finalPool, null, 2));

console.log(`Fill: ${fillBlanks.length}/${Object.keys(answers.fill).length}`);
console.log(`MC single: ${mcSingle.length}/${Object.keys(answers.mcA).length}`);
console.log(`MC multi: ${mcMulti.length}/${Object.keys(answers.mcX).length}`);
console.log(`Term: ${terms.length}/${Object.keys(answers.term).length}`);
console.log(`Batch total: ${pool.questions.length}, Pool total: ${finalPool.questions.length} → ${poolPath}`);
