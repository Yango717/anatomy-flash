const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/# 第八章 内分泌系统.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

// ── State machine ──
let section = null; // 'fill' | 'mcA' | 'mcX' | 'term'
const fillBlanks = [];
const mcSingle = [];  // A型题
const mcMulti = [];   // X型题
const terms = [];

// Parse questions
let i = 0;
for (i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('一、填空题')) { section = 'fill'; continue; }
  if (line.includes('二、选择题')) { section = null; continue; }
  if (line.includes('A型题') || line.includes('最佳单项选择题')) { section = 'mcA'; continue; }
  if (line.includes('X型题')) { section = 'mcX'; continue; }
  if (line.includes('三、解释名词概念')) { section = 'term'; continue; }
  if (line.includes('四、问答题') || line.includes('五、答题要点')) { section = null; continue; }

  if (section === 'fill') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) {
      fillBlanks.push({ num: parseInt(m[1]), stem: m[2].replace(/_{2,}/g, '___').replace(/\s+/g, ' ').trim() });
    }
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

        // Find all A-E option markers and their positions on this line
        const markers = [...optLine.matchAll(/([A-E])[.．、]\s*/g)];
        for (let k = 0; k < markers.length; k++) {
          const key = markers[k][1];
          if (seenKeys.has(key)) continue;
          const start = markers[k].index + markers[k][0].length;
          const end = k + 1 < markers.length ? markers[k + 1].index : optLine.length;
          const text = optLine.slice(start, end).trim();
          if (text) {
            options.push({ key, text });
            seenKeys.add(key);
          }
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
    if (m) {
      terms.push({ num: parseInt(m[1]), stem: m[2].trim() });
    }
  }
}

// ── Parse answers ──
const answers = { fill: {}, mcA: {}, mcX: {}, term: {} };
let ansSection = null;

// Convert fill blank answer line to array of answers
function parseFillAnswer(text) {
  // Split by Chinese comma or English comma
  return text.split(/[，,]/).map(s => s.trim()).filter(Boolean);
}

for (i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('五、答题要点和答案')) ansSection = 'start';
  if (!ansSection) continue;

  if (line.includes('（一）填空题') || line.includes('(一)填空题')) ansSection = 'fillAns';
  else if (line.includes('(二)选择题') || line.includes('（二）选择题')) ansSection = 'mcAns';
  else if (line.includes('A型题')) ansSection = 'mcAAns';
  else if (line.includes('X型题')) ansSection = 'mcXAns';
  else if (line.includes('(三)解释名词') || line.includes('（三）解释名词')) ansSection = 'termAns';
  else if (line.includes('(四)') || line.includes('（四）')) ansSection = null;

  if (ansSection === 'fillAns') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) {
      answers.fill[parseInt(m[1])] = parseFillAnswer(m[2]);
    }
  }

  if (ansSection === 'mcAAns' || ansSection === 'mcXAns') {
    // Parse: "1. C    2.B     3.C  ..."
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
    if (m && parseInt(m[1]) <= 20) {
      // Read until empty line or next number
      let text = m[2];
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\./) && !lines[j].includes('(四)') && !lines[j].includes('（四）')) {
        if (lines[j].trim()) text += '\n' + lines[j].trim();
        j++;
      }
      answers.term[parseInt(m[1])] = text.trim();
    }
  }
}

// ── Build pool ──
const pool = { chapterId: 'chapter-09', questions: [] };
let mc = 0, dx = 0, mj = 0;

// Fill blanks
fillBlanks.forEach((q) => {
  const ans = answers.fill[q.num] || [];
  const blanks = ans.map(a => ({ answer: a }));
  pool.questions.push({
    id: `YD-MC-${String(++mc).padStart(3, '0')}`,
    type: 'fill_blank',
    stem: q.stem,
    options: null,
    blanks,
    answer: ans.join('、'),
    explanation: '',
  });
});

// MC single
mcSingle.forEach((q) => {
  const answer = answers.mcA[q.num] || '';
  pool.questions.push({
    id: `YD-DX-${String(++dx).padStart(3, '0')}`,
    type: 'multiple_choice',
    stem: q.stem,
    options: q.options,
    answer,
    explanation: '',
  });
});

// MC multi
mcMulti.forEach((q) => {
  const answer = answers.mcX[q.num] || '';
  pool.questions.push({
    id: `YD-DX-${String(++dx).padStart(3, '0')}`,
    type: 'multi_select',
    stem: q.stem,
    options: q.options,
    answer,
    explanation: '',
  });
});

// Term explanations
terms.forEach((q) => {
  const ans = answers.term[q.num] || '';
  pool.questions.push({
    id: `YD-MJ-${String(++mj).padStart(3, '0')}`,
    type: 'term_explanation',
    stem: q.stem,
    options: null,
    answer: ans,
    explanation: ans,
  });
});

// ── Write ──
const poolPath = path.join(__dirname, '..', 'content', 'chapter-09-内分泌系统', 'practice-pool.json');
fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2));

console.log(`Fill-blank: ${fillBlanks.length}, answers: ${Object.keys(answers.fill).length}`);
console.log(`MC single: ${mcSingle.length}, answers: ${Object.keys(answers.mcA).length}`);
console.log(`MC multi: ${mcMulti.length}, answers: ${Object.keys(answers.mcX).length}`);
console.log(`Term: ${terms.length}, answers: ${Object.keys(answers.term).length}`);
console.log(`Total: ${pool.questions.length}`);
console.log(`Written to: ${poolPath}`);
