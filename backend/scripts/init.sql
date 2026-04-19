-- Create database (run this manually in psql)
-- CREATE DATABASE PQRSDf_db;

-- Connect to PQRSDf_db and run:
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

CREATE TABLE IF NOT EXISTS PQRSDf (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  channel VARCHAR(50) NOT NULL,
  classification VARCHAR(100),
  confidence INTEGER,
  summary TEXT,
  topics JSONB,
  multi_dependency BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);