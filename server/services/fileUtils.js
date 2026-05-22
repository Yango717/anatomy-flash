const fs = require('fs');
const path = require('path');

function findFileIn(dir, filename, prefix) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name.startsWith(prefix)) {
        const fp = path.join(fullPath, filename);
        if (fs.existsSync(fp)) return fs.readFileSync(fp, 'utf-8');
      }
      const deeper = findFileIn(fullPath, filename, prefix);
      if (deeper) return deeper;
    }
  } catch {}
  return null;
}

// Walk chapter directories looking for a file matching a subPrefix
function findInChapters(contentDir, filename, subPrefix) {
  const chapterDirs = fs.readdirSync(contentDir).filter((d) =>
    d.startsWith('chapter-') && fs.statSync(path.join(contentDir, d)).isDirectory()
  );
  for (const chDir of chapterDirs) {
    const result = findFileIn(path.join(contentDir, chDir), filename, subPrefix);
    if (result) return result;
  }
  return null;
}

module.exports = { findFileIn, findInChapters };
