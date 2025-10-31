-- Seed data for Senior Manager dashboard: goals and audit_logs

-- Insert a few sample goals (owner_id left NULL where no profile exists locally)
INSERT INTO goals (title, description, owner_id, status, target_date, progress)
VALUES
  ('Reduce attrition in Sales', 'Improve retention by targeted training and hiring', NULL, 'in_progress', (CURRENT_DATE + INTERVAL '90 days')::date, 20.00),
  ('Q4 Hiring Targets', 'Fill 10 engineering positions by end of quarter', NULL, 'open', (CURRENT_DATE + INTERVAL '120 days')::date, 5.00),
  ('Customer Onboarding Improvements', 'Decrease time-to-first-value for new customers', NULL, 'on_hold', (CURRENT_DATE + INTERVAL '60 days')::date, 0.00)
RETURNING id;

-- Insert a few audit log entries
INSERT INTO audit_logs (event, actor_id, metadata)
VALUES
  ('Created goal: Reduce attrition in Sales', NULL, jsonb_build_object('goal', 'Reduce attrition in Sales', 'severity', 'info')),
  ('Updated payroll schedule', NULL, jsonb_build_object('section', 'payroll', 'action', 'updated_schedule')),
  ('Approved leave request', NULL, jsonb_build_object('leave_request_id', 'sample', 'decision', 'approved'));

-- A couple of lightweight indexes/seeds are already handled by migration; nothing else required.
