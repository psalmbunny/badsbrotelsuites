-- Keyline hotel ticket desk — database schema
-- Run this once against your Vercel Postgres database before first use.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  room TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Other',
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  reporter TEXT DEFAULT '',
  assignee TEXT DEFAULT '',
  guest TEXT DEFAULT '',
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_logs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single shared row used for the shift handover notes textarea.
CREATE TABLE IF NOT EXISTS handover (
  id INTEGER PRIMARY KEY DEFAULT 1,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT handover_single_row CHECK (id = 1)
);
INSERT INTO handover (id, notes) VALUES (1, '') ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_id ON ticket_logs (ticket_id);
