const path = require('path');

const isVercel = !!process.env.VERCEL;

module.exports = {
  port: process.env.PORT || 3200,
  contentDir: path.join(__dirname, '..', 'content'),
  dataDir: isVercel ? '/tmp/data' : path.join(__dirname, '..', 'data'),
  dbPath: isVercel ? '/tmp/data/anatomy.db' : path.join(__dirname, '..', 'data', 'anatomy.db'),
};
