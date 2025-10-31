-- Seed migration for Admin Dashboard: departments, candidates, screening and a small summary table

-- Insert departments if not present
INSERT INTO departments (id, name, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Engineering', 'Product and platform engineering', now(), now()),
  (gen_random_uuid(), 'Sales', 'Sales and business development', now(), now()),
  (gen_random_uuid(), 'HR', 'Human resources and recruitment', now(), now())
ON CONFLICT (name) DO NOTHING;

-- Insert a few sample candidates and capture their ids
WITH ins AS (
  INSERT INTO candidates (full_name, email, phone, position_applied, resume_url, ai_screening_score, status, skills_extracted, experience_years, created_at, updated_at)
  VALUES
    ('Alex Johnson', 'alex.johnson+demo@example.com', '+1-555-0101', 'Software Engineer', 'https://example.com/resume/alex', 78.5, 'applied', ARRAY['typescript','react'], 4.0, now(), now()),
    ('Priya Singh', 'priya.singh+demo@example.com', '+1-555-0102', 'Product Manager', 'https://example.com/resume/priya', 85.3, 'screening', ARRAY['product','roadmap'], 6.0, now(), now()),
    ('Carlos Mendez', 'carlos.mendez+demo@example.com', '+1-555-0103', 'Sales Executive', 'https://example.com/resume/carlos', 66.0, 'shortlisted', ARRAY['sales','crm'], 5.0, now(), now())
  RETURNING id, email
)
-- Insert AI screening results for the inserted candidates
INSERT INTO ai_screening_results (candidate_id, resume_text, extracted_skills, match_score, fit_explanation, sentiment_score, confidence_level, screening_date)
SELECT ins.id, 'Extracted resume text for ' || ins.email, ARRAY['demo_skill1','demo_skill2'], 0.75, 'Good fit based on skills', 0.1, 0.85, now()
FROM ins;

-- Insert a small voice interview result for one candidate
INSERT INTO voice_interview_results (candidate_id, interview_transcript, sentiment_score, confidence_score, communication_rating, technical_rating, recommendation, interview_date)
SELECT id, 'Short demo transcript for ' || email, 0.2, 0.9, 4.0, 3.5, 'consider', now()
FROM candidates
WHERE email = 'alex.johnson+demo@example.com'
ON CONFLICT DO NOTHING;

-- Create a lightweight admin summary table to present aggregated numbers without touching payroll/profiles
CREATE TABLE IF NOT EXISTS admin_dashboard_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_employees integer DEFAULT 0,
  todays_present integer DEFAULT 0,
  total_open_positions integer DEFAULT 0,
  avg_attrition numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert one demo summary row if table is empty
INSERT INTO admin_dashboard_summary (total_employees, todays_present, total_open_positions, avg_attrition)
SELECT 120, 98, 12, 4.2
WHERE NOT EXISTS (SELECT 1 FROM admin_dashboard_summary);
