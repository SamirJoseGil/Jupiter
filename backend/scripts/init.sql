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
  citizen_id VARCHAR(30),
  neighborhood VARCHAR(120),
  evidence_images JSONB DEFAULT '[]'::jsonb,
  evidence_documents JSONB DEFAULT '[]'::jsonb,
  classification VARCHAR(100),
  confidence INTEGER,
  summary TEXT,
  topics JSONB,
  multi_dependency BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_entries (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS response_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pqr_relations (
  source_pqr_id INTEGER NOT NULL,
  related_pqr_id INTEGER NOT NULL,
  score NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT pqr_relations_pk PRIMARY KEY (source_pqr_id, related_pqr_id)
);