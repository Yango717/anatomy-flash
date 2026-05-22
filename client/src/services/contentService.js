// Browser-side content service — replaces fs.readFileSync with fetch
let chaptersCache = null;
let chaptersPromise = null;
let pathIndex = null;  // subId -> { chapterDir, sectionDir, subDir, parts }

async function loadChapters() {
  if (chaptersCache) return chaptersCache;
  if (chaptersPromise) return chaptersPromise;

  chaptersPromise = (async () => {
    const resp = await fetch('/content/chapters.json');
    if (!resp.ok) throw new Error('Failed to load chapters.json');
    const data = await resp.json();
    chaptersCache = data;
    pathIndex = new Map();
    for (const ch of data.chapters) {
      const chapterDir = `${ch.chapterId}-${ch.title}`;
      for (const sec of ch.sections) {
        const sectionDir = `${sec.id}-${sec.title}`;
        for (const sub of sec.subsections) {
          const subDir = `${sub.id}-${sub.title}`;
          pathIndex.set(sub.id, { chapterDir, sectionDir, subDir, parts: sub.parts, chapterId: ch.chapterId, sectionId: sec.id });
        }
      }
    }
    return data;
  })();

  return chaptersPromise;
}

function unitPrefix(unitId) {
  return unitId.replace(/-part-.*$/, '');
}

function getContentPath(subId, filename) {
  const entry = pathIndex?.get(subId);
  if (!entry) return null;
  return `/content/${entry.chapterDir}/${entry.sectionDir}/${entry.subDir}/${filename}`;
}

function resolveChapterDir(chapterId) {
  if (!chaptersCache) return null;
  const ch = chaptersCache.chapters.find(c => c.chapterId === chapterId);
  return ch ? `${chapterId}-${ch.title}` : null;
}

// --- Public API (matches original contentService + content route) ---

async function getChapters() {
  const data = await loadChapters();
  return { chapters: data.chapters };
}

async function getChapter(chapterId) {
  const data = await loadChapters();
  return data.chapters.find(c => c.chapterId === chapterId) || null;
}

async function getChapterMeta(chapterId) {
  const dir = resolveChapterDir(chapterId);
  if (!dir) return null;
  const resp = await fetch(`/content/${dir}/meta.json`);
  return resp.ok ? resp.json() : null;
}

async function getUnitContent(unitId) {
  await loadChapters();
  const subId = unitPrefix(unitId);
  const path = getContentPath(subId, 'content.md');
  if (!path) return null;
  const resp = await fetch(path);
  if (!resp.ok) return null;
  return { content: await resp.text() };
}

async function fetchJSON(subId, filename) {
  await loadChapters();
  const path = getContentPath(subId, filename);
  if (!path) return null;
  const resp = await fetch(path);
  return resp.ok ? resp.json() : null;
}

// Build unit path string like "运动系统 > 骨学 > 骨的分类"
function buildUnitPath(unitId) {
  if (!chaptersCache || !pathIndex) return '';
  const subId = unitPrefix(unitId);
  const entry = pathIndex.get(subId);
  if (!entry) return '';
  const ch = chaptersCache.chapters.find(c => c.chapterId === entry.chapterId);
  const sec = ch?.sections.find(s => s.id === entry.sectionId);
  const sub = sec?.subsections.find(s => s.id === subId);
  return [ch?.title, sec?.title, sub?.title].filter(Boolean).join(' > ');
}

// Search — walks content via chapters.json index + fetches content.md
async function search(query) {
  const data = await loadChapters();
  const q = query.toLowerCase();
  const results = [];
  for (const ch of data.chapters) {
    for (const sec of ch.sections) {
      for (const sub of sec.subsections) {
        const path = getContentPath(sub.id, 'content.md');
        if (!path) continue;
        try {
          const resp = await fetch(path);
          if (!resp.ok) continue;
          const text = await resp.text();
          const lines = text.split('\n');
          const matches = [];
          for (const line of lines) {
            if (line.toLowerCase().includes(q)) matches.push(line.trim());
          }
          if (matches.length > 0) {
            const heading = lines.find(l => l.startsWith('#'))?.replace(/^#+ /, '') || sub.title;
            results.push({ unitId: sub.id, title: sub.title, heading, snippets: matches.slice(0, 3) });
          }
        } catch {}
      }
    }
    if (results.length >= 20) break;
  }
  return results.slice(0, 20);
}

async function getPracticePool(chapterId) {
  const dir = resolveChapterDir(chapterId);
  if (!dir) return { questions: [] };
  const resp = await fetch(`/content/${dir}/practice-pool.json`);
  return resp.ok ? resp.json() : { questions: [] };
}

// Iterate ALL chapters to collect practice questions for pool-based practice
async function getAllPracticePools() {
  const data = await loadChapters();
  const allPools = [];
  for (const ch of data.chapters) {
    const pool = await getPracticePool(ch.chapterId);
    if (pool.questions?.length > 0) allPools.push(pool);
  }
  return allPools;
}

export { loadChapters, getChapters, getChapter, getChapterMeta, getUnitContent, fetchJSON, buildUnitPath, search, getPracticePool, getAllPracticePools, pathIndex, chaptersCache };
