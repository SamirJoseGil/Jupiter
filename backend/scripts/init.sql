-- Create database (run this manually in psql)
-- CREATE DATABASE pqrs_db;

-- Connect to pqrs_db and run:
CREATE TABLE IF NOT EXISTS pqrs (
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