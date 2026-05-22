import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    setSearching(true);
    api.get('/search', { q: val })
      .then((d) => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }

  function handleResultClick(result) {
    // Try to parse which unitId the file belongs to by extracting dir name
    const parts = result.filePath.split('/').filter(Boolean);
    // parts e.g.: ['chapter-01-运动系统', 'section-01-骨学', 'subsection-01-概述', 'content.md']
    if (parts.length >= 3) {
      const subDir = parts[2]; // subsection-01-概述
      // Build unitId: sub-01-01-01-part-XXX
      const subMatch = subDir.match(/^subsection-(\d+)-(\d+)-(\d+)-(.+)$/);
      if (subMatch) {
        const subId = `sub-${subMatch[1]}-${subMatch[2]}-${subMatch[3]}`;
        const partName = subMatch[4];
        navigate(`/learn/${encodeURIComponent(subId + '-part-' + partName)}`, { state: { partTitle: partName } });
      }
    }
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  return (
    <>
      <button className="topbar__search-btn" onClick={() => setOpen(true)}>
        🔍
      </button>

      {open && (
        <div className="search-overlay">
          <div className="search-overlay__header">
            <input
              className="search-overlay__input"
              type="text"
              placeholder="搜索解剖知识点..."
              value={query}
              onChange={handleInput}
              autoFocus
            />
            <button className="btn btn--ghost btn--sm" onClick={() => { setOpen(false); setQuery(''); setResults([]); }}>
              取消
            </button>
          </div>
          <div className="search-overlay__body">
            {searching && query.length >= 2 && <div className="page-loading">搜索中...</div>}
            {results.map((r, i) => (
              <button key={i} className="search-result" onClick={() => handleResultClick(r)}>
                <div className="search-result__path">{r.headings.join(' › ')}</div>
                {r.matches.slice(0, 2).map((m, j) => (
                  <p key={j} className="search-result__snippet">...{m.text}...</p>
                ))}
              </button>
            ))}
            {!searching && query.length >= 2 && results.length === 0 && (
              <div className="empty-hint">未找到相关内容</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
