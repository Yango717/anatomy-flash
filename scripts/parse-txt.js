const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/运动系统题.txt', 'utf-8');
const lines = raw.split('\n');

// ── Parse sections ──
let section = null;
const questions = { mc: [], multi: [], term: [] }; // mc=单选, multi=多选, term=名解
let currentMC = null;
let mcType = null; // 'A' or 'X'
let ansSection = false;

function finalizeMC() {
  if (currentMC && currentMC.stem) {
    (mcType === 'A' ? questions.mc : questions.multi).push(currentMC);
    currentMC = null;
  }
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect sections
  if (line.includes('二、选择题')) section = 'mc';
  else if (line.includes('三、解释名词概念')) { finalizeMC(); section = 'term'; }
  else if (line.includes('四、简答题')) { finalizeMC(); section = 'short'; }
  else if (line.includes('五、问答题')) section = 'essay';
  else if (line.includes('六、答题要点和答案')) section = 'answers';

  if (section === 'mc') {
    // Detect A/X type
    if (line.includes('A型选择题') || line.includes('A型题') || line.includes('最佳选择题')) mcType = 'A';
    if (line.includes('X型题') || line.includes('X型选择题')) mcType = 'X';

    // Detect numbered question: "1. " or "1．" or "1 )"
    const mcMatch = line.match(/^\s*(\d+)\.\s*([^(]+)\(?\s*\)?\s*$/);
    const mcMatch2 = line.match(/^\s*(\d+)\.\s*(.+)$/);
    if (mcMatch || mcMatch2) {
      finalizeMC();
      const match = mcMatch || mcMatch2;
      currentMC = { num: parseInt(match[1]), stem: match[2].trim(), options: [], qLines: [line] };
      continue;
    }

    // Detect option lines: "    > A．" or "    A." or "A.xxx B.xxx" etc
    if (currentMC) {
      currentMC.qLines.push(line);
      // Collect option text - each option starts with A. B. C. D. E. or A． etc
      const optMatch = line.match(/[>]?\s*([A-E])[.．、]\s*(.+)/);
      if (optMatch) {
        currentMC.options.push({ key: optMatch[1], text: optMatch[2].trim() });
      } else {
        // Check for inline options: "A.xxxB.xxxC.xxx"
        const rawLine = line.replace(/^[>\s]+/, '');
        // Try to match multiple option patterns
      }
    }
  }

  // Only parse questions before section 六 (answers)
  if (section === 'term' || section === 'short' || section === 'essay') {
    // Parse numbered questions: "1. xxx"
    const termMatch = line.match(/^\s*(\d+)[.、)\s]\s*(.+)/);
    if (termMatch && line.length > 5 &&
        !line.includes('解释名词概念') && !line.includes('简答题') && !line.includes('问答题') &&
        !line.includes('答题要点和答案')) {
      finalizeMC();
      questions.term.push({
        num: parseInt(termMatch[1]),
        stem: termMatch[2].replace(/^\s*名词解释[：:]\s*/, '').trim(),
      });
    }
  }
}
finalizeMC();

// ── Parse answers from section 六 ──
ansSection = null;
const answers = { mc: {}, multi: {}, term: {} };
let currentAns = null;
let ansType = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('六、答题要点和答案')) ansSection = 'start';
  if (!ansSection) continue;

  if (line.includes('（二）选择题') || line.includes('(二)选择题')) ansType = 'mc';
  else if (line.includes('A型题')) ansType = 'mcA';
  else if (line.includes('X型题')) ansType = 'mcX';
  else if (line.includes('(三)解释名词') || line.includes('（三）解释名词')) ansType = 'term';
  else if (line.includes('(四)简答题') || line.includes('（四）简答题')) ansType = 'short';
  else if (line.includes('(五)') || line.includes('（五）')) ansType = 'essay';

  if (ansType === 'mcA' || ansType === 'mcX') {
    // Parse: "1. B 2. E 3. B 4. C ..."
    const nums = line.match(/(\d+)\.\s*([A-E]+)/g);
    if (nums) {
      nums.forEach(m => {
        const [num, ans] = m.split(/\.\s*/);
        const target = ansType === 'mcA' ? answers.mc : answers.multi;
        target[parseInt(num)] = ans.trim();
      });
    }
  }

  if (ansType === 'term') {
    // Read term answers (multi-line explanations)
    const termMatch = line.match(/^(\d+)[.、]\s*(.+)/);
    if (termMatch && parseInt(termMatch[1]) <= 100) {
      answers.term[parseInt(termMatch[1])] = termMatch[2];
    }
  }
}

// ── Build question pool ──
const pool = { chapterId: 'chapter-01', questions: [] };

// Fill-in-blank already done (79 questions, YD-MC-001 to YD-MC-079)
// Now add MC questions
questions.mc.forEach((q, i) => {
  const answer = answers.mc[q.num];
  // Fix options: some may have A-E embedded in the stem due to parsing issues
  // If no options found, try re-parsing from qLines
  let options = q.options;
  if (options.length < 3) {
    // Re-parse: check if options are in the combined qLines
    const fullText = q.qLines.join(' ');
    const reconstructed = [];
    const optRegex = /([A-E])[.、．]\s*([^A-E]+?)(?=\s*[A-E][.、．]|$)/g;
    let m;
    while ((m = optRegex.exec(fullText)) !== null) {
      reconstructed.push({ key: m[1], text: m[2].trim() });
    }
    if (reconstructed.length >= 3) options = reconstructed;
  }

  // Clean options: remove markdown artifacts
  const cleanOpts = (options || []).map(o => ({
    key: o.key,
    text: o.text.replace(/\r/g, '').replace(/\s*>\s*$/, '').trim(),
  }));

  pool.questions.push({
    id: `YD-DX-${String(q.num).padStart(3, '0')}`,
    type: 'multiple_choice',
    stem: q.stem.replace(/\s*\(?\s*\)?\s*$/ ,'').replace(/_{2,}/g, '___'),
    options: cleanOpts,
    answer: answer || '',
    explanation: '',
  });
});

// Multi-select
questions.multi.forEach((q) => {
  const answer = answers.multi[q.num];
  let options = q.options;
  // For multi, options are often inline: "A. xxx B. xxx C. xxx"
  // Re-parse all multi options from full text
  const fullText = q.qLines.join(' ').replace(/\r/g, '').replace(/\s*>/g, '');
  // Split by A-E markers
  const splitOpts = fullText.split(/(?=[A-E][.、．]\s*)/);
  const reconstructed = [];
  splitOpts.forEach(seg => {
    const m = seg.match(/^([A-E])[.、．]\s*(.+)/);
    if (m) {
      let text = m[2].trim();
      // Remove trailing markdown artifacts and section headers
      text = text.replace(/\s*\*+X型题.*$/, '').replace(/\s*\*+[A-Z].*$/, '').replace(/\s*\([^)]*选择[^)]*\)\s*$/, '');
      reconstructed.push({ key: m[1], text: text });
    }
  });
  if (reconstructed.length >= 3) options = reconstructed;

  const cleanOpts = (options || []).map(o => ({
    key: o.key,
    text: o.text.replace(/\r/g, '').replace(/\s*>\s*$/, '').trim(),
  }));

  pool.questions.push({
    id: `YD-DX-${String(q.num + 100).padStart(3, '0')}`,
    type: 'multi_select',
    stem: q.stem.replace(/\s*\(?\s*\)?\s*$/,'').replace(/_{2,}/g, '___'),
    options: cleanOpts,
    answer: answer || '',
    explanation: '',
  });
});

// Term explanation (dedup by ID)
const seenTermIds = new Set(pool.questions.map(q => q.id));
questions.term.forEach((q) => {
  const id = `YD-MJ-${String(q.num).padStart(3, '0')}`;
  if (seenTermIds.has(id)) return;
  seenTermIds.add(id);
  pool.questions.push({
    id,
    type: 'term_explanation',
    stem: q.stem,
    options: null,
    answer: answers.term[q.num] || '',
    explanation: answers.term[q.num] || '',
  });
});

// ── Update practice-pool.json with all non-fill-blank questions ──
// Read existing pool (which has 79 fill_blank questions)
const poolPath = path.join(__dirname, '..', 'content', 'chapter-01-运动系统', 'practice-pool.json');
const existingPool = JSON.parse(fs.readFileSync(poolPath, 'utf-8'));

// Merge: keep existing 79 fill_blank questions, add new ones
const fillBlanks = existingPool.questions.filter(q => q.type === 'fill_blank');
const newQuestions = pool.questions;
const merged = [...fillBlanks, ...newQuestions];

fs.writeFileSync(poolPath, JSON.stringify({ chapterId: 'chapter-01', questions: merged }, null, 2));

console.log(`Fill-in-blank: ${fillBlanks.length} (kept)`);
console.log(`Multiple choice (单选): ${questions.mc.length}, with answers: ${Object.keys(answers.mc).length}`);
console.log(`Multi-select (多选): ${questions.multi.length}, with answers: ${Object.keys(answers.multi).length}`);
console.log(`Term explanation (名解): ${questions.term.length}`);
console.log(`Pool total: ${merged.length}`);
