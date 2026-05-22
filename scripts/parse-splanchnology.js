const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/21109/Desktop/# 第六章 内脏学.txt', 'utf-8');
const lines = raw.split('\n').map(l => l.trim());

// ── System classification by keyword ──
const DIG = ['消化','口腔','咽','食管','胃','十二指肠','空肠','回肠','盲肠','阑尾','结肠','直肠','肛管','肛梳','肛皮','齿状','肝','胆囊','胆总','肝胰','胰','唾液','腮腺','舌下腺','下颌下腺','牙','舌','腭','扁桃体','腹膜','大网膜','小网膜','网膜囊','肠系膜','肝胃','肝十二指肠','贲门','幽门','味蕾','界沟','切牙','尖牙','前磨牙','磨牙','牙冠','牙颈','牙根','牙腔','卵圆窝'];
const RESP = ['呼吸','鼻','鼻腔','喉','气管','支气管','肺','胸膜','纵隔','声带','声门','环甲','环杓','杓状','甲状软骨','环状软骨','会厌','喉结','上鼻甲','中鼻甲','下鼻甲','鼻旁窦','额窦','蝶窦','筛窦','上颌窦','鼻泪管','Little','鼻中隔'];
const URI = ['泌尿','肾','输尿管','膀胱','尿道内口','尿道外口','尿道','肾单位','肾小体','肾小盏','肾大盏','肾盂','肾锥体','肾柱','肾皮质','肾髓质','肾筋膜','脂肪囊','纤维囊','膀胱三角','肾门'];
const REPRO = ['生殖','睾丸','附睾','精囊','前列腺','阴茎','阴囊','卵巢','输卵管','子宫','阴道','乳房','会阴','精曲','鞘膜','射精管','输精管','精索','肉膜','海绵体','子宫阔韧带','子宫圆韧带','骶子宫','子宫主韧带','卵巢悬韧带','卵巢固有韧带','前庭大腺','阴道前庭','阴道穹','女阴','小阴唇','大阴唇','阴阜','阴蒂','乳腺','乳头','乳晕','尿道球腺','尿道球','男性尿道','女性尿道'];

function classify(stem) {
  let score = { dig: 0, resp: 0, uri: 0, repro: 0 };
  for (const kw of DIG) if (stem.includes(kw)) score.dig++;
  for (const kw of RESP) if (stem.includes(kw)) score.resp++;
  for (const kw of URI) if (stem.includes(kw)) score.uri++;
  for (const kw of REPRO) if (stem.includes(kw)) score.repro++;
  const max = Math.max(score.dig, score.resp, score.uri, score.repro);
  if (max === 0) return 'dig'; // default
  if (score.dig === max) return 'dig';
  if (score.resp === max) return 'resp';
  if (score.uri === max) return 'uri';
  return 'repro';
}

const chMap = { dig: 'chapter-02', resp: 'chapter-03', uri: 'chapter-04', repro: 'chapter-05' };
const chDir = {
  dig: 'chapter-02-消化系统', resp: 'chapter-03-呼吸系统',
  uri: 'chapter-04-泌尿系统', repro: 'chapter-05-生殖系统',
};

// ── Parse questions ──
let section = null;
const allF = [], allSA = [], allSX = [], allTM = [];

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('一、填空题')) section = 'fill';
  else if (l.includes('二、选择题')) section = null;
  else if (l.includes('A型题') || l.includes('最佳单项')) section = 'mcA';
  else if (l.includes('X型题') || l.includes('多项选择')) section = 'mcX';
  else if (l.includes('三、解释概念名词') || l.includes('三、解释名词概念')) section = 'term';
  else if (l.includes('四、简答') || l.includes('五、问答') || l.includes('六、答题要点')) section = null;

  if (section === 'fill') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m) allF.push({ n: parseInt(m[1]), stem: m[2].replace(/_{2,}/g, '___').replace(/\s+/g, ' ').trim(), sys: classify(m[2]) });
  }
  if (section === 'mcA' || section === 'mcX') {
    const m = l.match(/^(\d+)\.\s*(.+?)\s*\(\s*\)/);
    if (m) {
      const stem = m[2].trim();
      const opts = []; const sk = new Set();
      let j = i + 1;
      while (j < lines.length && j < i + 15) {
        const ol = lines[j];
        if (ol.match(/^\d+\./) || ol.includes('X型题') || ol.includes('A型题') || /^\*\*/.test(ol) || ol === '') break;
        const mk = [...ol.matchAll(/([A-E])[.．、]\s*/g)];
        for (let k = 0; k < mk.length; k++) {
          const key = mk[k][1]; if (sk.has(key)) continue;
          const st = mk[k].index + mk[k][0].length;
          const en = k + 1 < mk.length ? mk[k + 1].index : ol.length;
          const txt = ol.slice(st, en).trim();
          if (txt) { opts.push({ key, text: txt }); sk.add(key); }
        }
        j++;
      }
      opts.sort((a, b) => a.key.localeCompare(b.key));
      (section === 'mcA' ? allSA : allSX).push({ n: parseInt(m[1]), stem, opts, sys: classify(stem) });
    }
  }
  if (section === 'term') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m) allTM.push({ n: parseInt(m[1]), stem: m[2].trim(), sys: classify(m[2]) });
  }
}

// ── Parse answers ──
const AF = {}, AA = {}, AX = {}, AT = {};
let as = null;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('六、答题要点和答案')) as = 'start';
  if (!as) continue;
  if (l.includes('（一）填空题') || l.includes('(一)填空题')) as = 'fA';
  else if (l.includes('(二)选择题') || l.includes('（二）选择题')) as = 'mA';
  else if (l.includes('A型题')) as = 'aA';
  else if (l.includes('X型题')) as = 'xA';
  else if (l.includes('(三)解释') || l.includes('（三）解释')) as = 'tA';
  else if (l.includes('(四)') || l.includes('（四）')) as = null;

  if (as === 'fA') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m) AF[parseInt(m[1])] = m[2].split(/[，,]/).map(s => s.trim()).filter(Boolean);
  }
  if (as === 'aA' || as === 'xA') {
    const nums = l.match(/(\d+)\.\s*([A-E]+)/g);
    if (nums) nums.forEach(m => { const [n, ans] = m.split(/\.\s*/); (as === 'aA' ? AA : AX)[parseInt(n)] = ans.trim(); });
  }
  if (as === 'tA') {
    const m = l.match(/^(\d+)\.\s*(.+)/);
    if (m && parseInt(m[1]) <= 80) {
      let t = m[2]; let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\./) && !lines[j].includes('(四)') && !lines[j].includes('（四）') && !lines[j].includes('（五）') && !lines[j].includes('(五)')) {
        if (lines[j].trim()) t += ' ' + lines[j].trim();
        j++;
      }
      AT[parseInt(m[1])] = t.trim();
    }
  }
}

// ── Build per-system pools ──
const pools = { dig: [], resp: [], uri: [], repro: [] };
const counters = { dig: { mc: 0, dx: 0, mj: 0 }, resp: { mc: 0, dx: 0, mj: 0 }, uri: { mc: 0, dx: 0, mj: 0 }, repro: { mc: 0, dx: 0, mj: 0 } };

function addQ(sys, q) { pools[sys].push(q); }

allF.forEach(q => {
  const ans = AF[q.n] || [];
  const c = counters[q.sys];
  addQ(q.sys, { id: `YD-MC-${String(++c.mc).padStart(3, '0')}`, type: 'fill_blank', stem: q.stem, blanks: ans.map(a => ({ answer: a })), answer: ans.join('、'), explanation: '' });
});
allSA.forEach(q => {
  const c = counters[q.sys];
  addQ(q.sys, { id: `YD-DX-${String(++c.dx).padStart(3, '0')}`, type: 'multiple_choice', stem: q.stem, options: q.opts, answer: AA[q.n] || '', explanation: '' });
});
allSX.forEach(q => {
  const c = counters[q.sys];
  addQ(q.sys, { id: `YD-DX-${String(++c.dx).padStart(3, '0')}`, type: 'multi_select', stem: q.stem, options: q.opts, answer: AX[q.n] || '', explanation: '' });
});
allTM.forEach(q => {
  const ans = AT[q.n] || '';
  const c = counters[q.sys];
  addQ(q.sys, { id: `YD-MJ-${String(++c.mj).padStart(3, '0')}`, type: 'term_explanation', stem: q.stem, answer: ans, explanation: ans });
});

// ── Write ──
const contentDir = path.join(__dirname, '..', 'content');
for (const [sys, qs] of Object.entries(pools)) {
  const dir = path.join(contentDir, chDir[sys]);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pp = path.join(dir, 'practice-pool.json');
  const pool = { chapterId: chMap[sys], questions: qs };
  fs.writeFileSync(pp, JSON.stringify(pool, null, 2));
  const t = {}; qs.forEach(q => { t[q.type] = (t[q.type] || 0) + 1; });
  console.log(`${chDir[sys]}: ${qs.length} questions`, JSON.stringify(t));
}
