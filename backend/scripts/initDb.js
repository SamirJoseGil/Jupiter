const pool = require('../config/database');

const initDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Create users table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        avatar_base64 TEXT,
        avatar_mime_type VARCHAR(100),
        avatar_updated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Users table ready');

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_base64 TEXT;
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(100);
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP;
    `);

    // Create PQRSDf table
    console.log('Creating PQRSDf table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PQRSDf (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        channel VARCHAR(50) NOT NULL,
        classification VARCHAR(100),
        confidence INTEGER,
        summary TEXT,
        topics JSONB,
        multi_dependency BOOLEAN DEFAULT FALSE,
        assigned_department VARCHAR(100),
        assigned_to_user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('PQRSDf table ready');

    // Add missing columns to existing PQRSDf table
    await pool.query(`
      ALTER TABLE PQRSDf
      ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(100);
    `);
    
    await pool.query(`
      ALTER TABLE PQRSDf
      ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE PQRSDf
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    
    console.log('PQRSDf table columns updated');

    // Create responses table
    console.log('Creating responses table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        pqr_id INTEGER NOT NULL REFERENCES PQRSDf(id) ON DELETE CASCADE,
        created_by_user_id INTEGER REFERENCES users(id),
        response_text TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'responses_pqr_id_unique'
        ) THEN
          ALTER TABLE responses ADD CONSTRAINT responses_pqr_id_unique UNIQUE (pqr_id);
        END IF;
      END $$;
    `);
    console.log('Responses table ready');

    // Create corrections table
    console.log('Creating corrections table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS corrections (
        id SERIAL PRIMARY KEY,
        pqr_id INTEGER NOT NULL REFERENCES PQRSDf(id) ON DELETE CASCADE,
        original_classification VARCHAR(100),
        corrected_classification VARCHAR(100),
        confidence_before INTEGER,
        confidence_after INTEGER,
        admin_notes TEXT,
        admin_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Corrections table ready');

    // Create email ingestions table
    console.log('Creating email_ingestions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_ingestions (
        id SERIAL PRIMARY KEY,
        external_message_id VARCHAR(255) UNIQUE,
        sender_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        raw_payload JSONB,
        status VARCHAR(50) DEFAULT 'received',
        pqr_id INTEGER REFERENCES PQRSDf(id) ON DELETE SET NULL,
        last_error TEXT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('email_ingestions table ready');

    // Create indices for performance
    console.log('Creating indices...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_PQRSDf_status ON PQRSDf(status);
        CREATE INDEX IF NOT EXISTS idx_PQRSDf_department ON PQRSDf(assigned_department);
        CREATE INDEX IF NOT EXISTS idx_PQRSDf_user ON PQRSDf(assigned_to_user_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_responses_pqr ON responses(pqr_id);
        CREATE INDEX IF NOT EXISTS idx_corrections_pqr ON corrections(pqr_id);
        CREATE INDEX IF NOT EXISTS idx_email_ingestions_status ON email_ingestions(status);
        CREATE INDEX IF NOT EXISTS idx_email_ingestions_created_at ON email_ingestions(created_at DESC);
      `);
    } catch (indexError) {
      console.log('Note: Some indices may already exist');
    }
    console.log('Indices ready');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
};

module.exports = initDatabase;