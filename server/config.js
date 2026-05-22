const path = require('path');

module.exports = {
  port: process.env.PORT || 3200,
  contentDir: path.join(__dirname, '..', 'content'),
  dataDir: path.join(__dirname, '..', 'data'),
  dbPath: path.join(__dirname, '..', 'data', 'anatomy.db'),
};
