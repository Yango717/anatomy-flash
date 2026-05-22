const initSqlJs = require('sql.js');
const fs = require('fs');
const config = require('../config');
const { getSQL } = require('./migrations');

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  const dataDir = config.dataDir;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();
  const dbPath = config.dbPath;
  let dbBuffer = null;
  if (fs.existsSync(dbPath)) {
    dbBuffer = fs.readFileSync(dbPath);
  }

  dbInstance = new SQL.Database(dbBuffer);

  const sql = getSQL();
  // Execute each statement separately, ignoring errors on re-runs
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try { dbInstance.run(stmt + ';'); } catch {}
  }

  // Seed default user
  if (dbInstance.exec("SELECT id FROM users WHERE username = 'default_user'").length === 0) {
    dbInstance.run("INSERT INTO users (username, display_name) VALUES ('default_user', '医学生')");
  }

  // Seed default countdown
  if (dbInstance.exec("SELECT key FROM settings WHERE key = 'countdown_target'").length === 0) {
    dbInstance.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('countdown_name', '距离解剖学期末考试')");
    const d = new Date();
    d.setDate(d.getDate() + 60);
    dbInstance.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('countdown_target', '${d.toISOString()}')`);
  }

  // Auto-save on exit
  function save() {
    if (dbInstance) {
      fs.writeFileSync(dbPath, Buffer.from(dbInstance.export()));
      dbInstance.close();
      dbInstance = null;
    }
  }
  process.on('SIGINT', save);
  process.on('SIGTERM', save);
  process.on('beforeExit', save);

  // Periodic auto-save every 5 minutes
  const saveInterval = setInterval(() => {
    if (dbInstance) {
      fs.writeFileSync(dbPath, Buffer.from(dbInstance.export()));
    }
  }, 300000);
  // Don't let the interval keep the process alive
  if (saveInterval.unref) saveInterval.unref();

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

module.exports = { getDB, all, get: getOne, run: runQuery };
