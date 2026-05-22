// Minimal Vercel serverless function
module.exports = async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // API routes
  if (pathname === '/api/v1/health') {
    return res.json({ success: true, data: { status: 'ok' } });
  }

  if (pathname === '/api/v1/test') {
    // Test that we can load modules
    let modules = {};
    try {
      modules.express = !!require('express');
    } catch (e) { modules.express = e.message; }
    try {
      const fs = require('fs');
      modules.fs = !!fs.readFileSync;
    } catch (e) { modules.fs = e.message; }
    return res.json({ modules, node: process.version, cwd: process.cwd() });
  }

  // Fallback: serve static from client/dist
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, 'client', 'dist');

  let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[ext] || 'text/plain');
    return res.end(fs.readFileSync(filePath));
  }
  // SPA fallback
  res.setHeader('Content-Type', 'text/html');
  return res.end(fs.readFileSync(path.join(distPath, 'index.html')));
};
