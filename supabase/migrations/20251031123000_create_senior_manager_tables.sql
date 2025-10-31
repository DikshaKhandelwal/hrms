-- Migration: create tables needed by Senior Manager dashboard
-- Creates: goals, audit_logs

-- 1) goal_status type
CREATE TYPE IF NOT EXISTS goal_status AS ENUM ('open', 'in_progress', 'completed', 'on_hold');

-- 2) Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  owner_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  status goal_status DEFAULT 'open',
  target_date date,
  progress numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  actor_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4) Enable RLS for these tables (keeps behavior consistent with other migrations)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5) Simple RLS policies: admins can manage; others can read where appropriate
-- Goals: admins can manage all
CREATE POLICY IF NOT EXISTS "Admins can manage all goals"
  ON goals FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Goals: users can view goals they own
CREATE POLICY IF NOT EXISTS "Users can view their own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid());

-- Audit logs: admins only (sensitive)
CREATE POLICY IF NOT EXISTS "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Indexes to improve common queries
CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_auditlogs_created_at ON audit_logs(created_at);
