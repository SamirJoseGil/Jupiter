require('dotenv').config();

const app = require('../app');
const initDatabase = require('../scripts/initDb');

let dbInitPromise;

async function ensureDatabaseReady() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase();
  }
  return dbInitPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDatabaseReady();
    return app(req, res);
  } catch (error) {
    console.error('Serverless bootstrap error:', error);
    return res.status(500).json({
      error: {
        status: 500,
        message: 'Server initialization failed',
        detail: error.message,
      },
    });
  }
};
