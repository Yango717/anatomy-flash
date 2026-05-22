const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/# 第六章 内脏学.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

// ── Classification ──
const DIG = ['消化','口腔','咽','食管','胃','十二指肠','空肠','回肠','盲肠','阑尾','结肠','直肠','肛管','肛梳','肛皮','齿状','肝','胆囊','胆总','肝胰','胰','唾','腮腺','舌下腺','下颌下腺','牙','舌','腭','扁桃体','腹膜','大网膜','小网膜','网膜囊','肠系膜','贲门','幽门','味蕾'];
const RESP = ['呼吸','鼻','鼻腔','喉','气管','支气管','肺','胸膜','纵隔','声带','声门','环甲','环杓','杓状','甲状软骨','环状软骨','会厌','鼻甲','鼻旁窦','额窦','蝶窦','筛窦','上颌窦','鼻泪管'];
const URI = ['泌尿','肾','输尿管','膀胱','尿道','肾单位','肾小体','肾小盏','肾大盏','肾盂','肾锥体','肾柱','肾皮质','肾髓质','肾筋膜','脂肪囊','纤维囊','膀胱三角','肾门','排尿'];
const REPRO = ['生殖','睾丸','附睾','精囊','前列腺','阴茎','阴囊','卵巢','输卵管','子宫','阴道','乳房','会阴','精曲','鞘膜','射精管','输精管','精索','肉膜','海绵体','子宫阔韧带','子宫圆韧带','骶子宫','子宫主韧带','卵巢悬韧带','卵巢固有韧带','前庭大腺','阴道前庭','阴道穹','女阴','小阴唇','大阴唇','阴阜','阴蒂','乳腺','乳头','乳晕','尿道球腺'];

function classify(stem) {
  let score = { dig: 0, resp: 0, uri: 0, repro: 0 };
  for (const kw of DIG) if (stem.includes(kw)) score.dig++;
  for (const kw of RESP) if (stem.includes(kw)) score.resp++;
  for (const kw of URI) if (stem.includes(kw)) score.uri++;
  for (const kw of REPRO) if (stem.includes(kw)) score.repro++;
  const max = Math.max(score.dig, score.resp, score.uri, score.repro);
  if (max === 0) return 'dig';
  if (score.dig === max) return 'dig';
  if (score.resp === max) return 'resp';
  if (score.uri === max) return 'uri';
  return 'repro';
}

const chDir = { dig: 'chapter-02-消化系统', resp: 'chapter-03-呼吸系统', uri: 'chapter-04-泌尿系统', repro: 'chapter-05-生殖系统' };

// ── Parse questions ──
let section = null;
const shortA = [], essays = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('四、简答题')) { section = 'short'; continue; }
  if (line.includes('五、问答题')) { section = 'essay'; continue; }
  if (line.includes('六、答题要点')) { section = null; continue; }

  if (section === 'short' || section === 'essay') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) {
      const stem = m[2].trim();
      (section === 'short' ? shortA : essays).push({ n: parseInt(m[1]), stem, sys: classify(stem) });
    }
  }
}

// ── Parse answers ──
const ansShort = {}, ansEssay = {};
let as = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('六、答题要点和答案')) as = 'start';
  if (!as) continue;

  if (line.includes('(四)简答题') || line.includes('（四）简答题')) as = 'sA';
  else if (line.includes('(五)问答') || line.includes('（五）问答') || line.includes('(五) 问答')) as = 'eA';
  else if (line.includes('(六)') || line.includes('（六）')) as = null;

  if (as === 'sA' || as === 'eA') {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m && parseInt(m[1]) <= 40) {
      let text = m[2];
      let j = i + 1;
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

// ── Build per-system questions ──
const pools = { dig: [], resp: [], uri: [], repro: [] };

shortA.forEach(q => {
  const ans = ansShort[q.n] || '';
  if (!ans) { console.log(`  WARN: no answer for short #${q.n} (${q.sys})`); return; }
  pools[q.sys].push({ type: 'short_answer', stem: q.stem, answer: ans, explanation: ans });
});
essays.forEach(q => {
  const ans = ansEssay[q.n] || '';
  if (!ans) { console.log(`  WARN: no answer for essay #${q.n} (${q.sys})`); return; }
  pools[q.sys].push({ type: 'essay', stem: q.stem, answer: ans, explanation: ans });
});

// ── Merge with existing pools ──
const contentDir = path.join(__dirname, '..', 'content');

for (const [sys, newQs] of Object.entries(pools)) {
  if (newQs.length === 0) continue;
  const pp = path.join(contentDir, chDir[sys], 'practice-pool.json');
  if (!fs.existsSync(pp)) { console.log(`${chDir[sys]}: pool not found, skipping`); continue; }
  const existing = JSON.parse(fs.readFileSync(pp, 'utf-8'));
  let mjMax = 0;
  existing.questions.forEach(q => {
    const idParts = q.id.split('-');
    if (idParts[1] === 'MJ') mjMax = Math.max(mjMax, parseInt(idParts[2]));
  });
  newQs.forEach(q => {
    mjMax++;
    existing.questions.push({
      id: `YD-MJ-${String(mjMax).padStart(3, '0')}`,
      type: q.type,
      stem: q.stem,
      options: null,
      answer: q.answer,
      explanation: q.explanation,
    });
  });
  fs.writeFileSync(pp, JSON.stringify(existing, null, 2));
  const t = {}; existing.questions.forEach(q => { t[q.type] = (t[q.type] || 0) + 1; });
  console.log(`${chDir[sys]}: +${newQs.length} QA, total ${existing.questions.length}`, JSON.stringify(t));
}
