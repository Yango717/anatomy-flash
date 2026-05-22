import { useEffect, useState } from 'react';
import { api } from '../../utils/api';

export default function NotesSection({ unitId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    api.get(`/learning/notes/${encodeURIComponent(unitId)}`)
      .then((d) => setNotes(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [unitId]);

  async function addNote() {
    if (!text.trim()) return;
    await api.post(`/learning/notes/${encodeURIComponent(unitId)}`, { text: text.trim() });
    setText('');
    load();
  }

  async function deleteNote(id) {
    await api.del(`/learning/notes/${id}`);
    load();
  }

  return (
    <div className="notes-section">
      <h3 className="notes-section__title">📝 我的笔记 ({notes.length})</h3>
      <div className="notes-section__form">
        <textarea
          className="notes-section__input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="添加笔记..."
        />
        <button className="btn btn--primary btn--sm" onClick={addNote} disabled={!text.trim()}>
          保存
        </button>
      </div>
      {notes.map((n) => (
        <div key={n.id} className="notes-item">
          <p className="notes-item__text">{n.note_text}</p>
          <span className="notes-item__time">{n.created_at?.slice(0, 10)}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => deleteNote(n.id)}>删除</button>
        </div>
      ))}
    </div>
  );
}
