require('dotenv').config();

const app = require('../app');
const initDatabase = require('../scripts/initDb');

let dbInitPromise;

const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const getCorsOrigin = (origin) => {
  if (!origin) return configuredOrigins[0] || 'http://localhost:5173';
  if (configuredOrigins.includes(origin)) return origin;
  if (/^https:\/\/([a-z0-9-]+\.)?sglabs\.site$/i.test(origin)) return origin;
  return configuredOrigins[0] || 'http://localhost:5173';
};

async function ensureDatabaseReady() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase();
  }
  return dbInitPromise;
}

module.exports = async (req, res) => {
  const requestOrigin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(requestOrigin));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

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
