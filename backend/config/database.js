const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required');
}

const poolConfig = {
  connectionString,
};

// Supabase/Postgres cloud usually requires SSL.
if (connectionString.includes('supabase.co') || connectionString.includes('sslmode=require')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;