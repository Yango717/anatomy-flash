import initSqlJs from 'sql.js';
import { getSQL } from './migrations';

const DB_STORE = 'anatomy-flash-db';
const DB_VERSION = 1;
const DB_KEY = 'anatomy.db';

let dbInstance = null;
let savePending = false;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_STORE, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore('files'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB() {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction('files', 'readonly');
      const getReq = tx.objectStore('files').get(DB_KEY);
      getReq.onsuccess = () => {
        idb.close();
        resolve(getReq.result ? new Uint8Array(getReq.result) : null);
      };
      getReq.onerror = () => { idb.close(); resolve(null); };
    });
  } catch { return null; }
}

async function saveToIDB() {
  if (!dbInstance || savePending) return;
  savePending = true;
  try {
    const data = dbInstance.export();
    const idb = await openIDB();
    await new Promise((resolve, reject) => {
      const tx = idb.transaction('files', 'readwrite');
      tx.objectStore('files').put(data.buffer, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    idb.close();
  } catch {} finally { savePending = false; }
}

function debouncedSave() {
  if (savePending) return;
  savePending = true;
  setTimeout(() => {
    savePending = false;
    saveToIDB();
  }, 2000);
}

async function getDB() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: file => `/node_modules/sql.js/dist/${file}`
  });

  const saved = await loadFromIDB();
  dbInstance = saved ? new SQL.Database(saved) : new SQL.Database();

  const sql = getSQL();
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try { dbInstance.run(stmt + ';'); } catch {}
  }

  if (dbInstance.exec("SELECT id FROM users WHERE username = 'default_user'").length === 0) {
    dbInstance.run("INSERT INTO users (username, display_name) VALUES ('default_user', '医学生')");
  }

  if (dbInstance.exec("SELECT key FROM settings WHERE key = 'countdown_target'").length === 0) {
    dbInstance.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('countdown_name', '距离解剖学期末考试')");
    const d = new Date();
    d.setDate(d.getDate() + 60);
    dbInstance.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('countdown_target', '${d.toISOString()}')`);
  }

  window.addEventListener('beforeunload', () => {
    if (dbInstance) {
      const data = dbInstance.export();
      try {
        const req = indexedDB.open(DB_STORE, DB_VERSION);
        req.onsuccess = () => {
          const tx = req.result.transaction('files', 'readwrite');
          tx.objectStore('files').put(data.buffer, DB_KEY);
        };
      } catch {}
    }
  });

  return dbInstance;
}

function all(sqlStr, params = []) {
  const d = dbInstance;
  if (!d) throw new Error('Database not initialized. Call getDB() first.');
  const stmt = d.prepare(sqlStr);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function getOne(sqlStr, params = []) {
  return all(sqlStr, params)[0] || null;
}

function runQuery(sqlStr, params = []) {
  const d = dbInstance;
  if (!d) throw new Error('Database not initialized. Call getDB() first.');
  d.run(sqlStr, params);
  return { changes: d.getRowsModified() };
}

export { getDB, all, getOne, runQuery, saveToIDB, debouncedSave };
