-- Seed data for recruiter dashboard: jobs, candidates, prediction_history, ai_screening_results, voice_interview_results
-- Timestamp: 2025-10-31 12:00:00

BEGIN;

DO $$
DECLARE
    j1 BIGINT;
    j2 BIGINT;
    c1 UUID := gen_random_uuid();
    c2 UUID := gen_random_uuid();
    c3 UUID := gen_random_uuid();
BEGIN
    -- Insert two job postings
    INSERT INTO public.jobs (job_title, company_name, job_description, location, job_type, salary_range, experience_level, skills_required, industry, employment_mode, status, created_by)
    VALUES
      ('Frontend Engineer', 'Acme Corp', 'Build delightful web experiences using React/TypeScript', 'Remote', 'Full-time', '₹8,00,000 - ₹12,00,000', 'Mid', 'React,TypeScript,HTML,CSS', 'Software', 'Hybrid', 'active', NULL)
    RETURNING id INTO j1;

    INSERT INTO public.jobs (job_title, company_name, job_description, location, job_type, salary_range, experience_level, skills_required, industry, employment_mode, status, created_by)
    VALUES
      ('Data Scientist', 'Acme Corp', 'Work on ML models and production pipelines', 'Bangalore', 'Full-time', '₹10,00,000 - ₹18,00,000', 'Senior', 'Python,ML,SQL,PyTorch', 'Data', 'On-site', 'active', NULL)
    RETURNING id INTO j2;

    -- Insert sample candidates
    INSERT INTO public.candidates (id, full_name, email, phone, position_applied, resume_url, ai_screening_score, status, skills_extracted, experience_years, notes)
    VALUES
      (c1, 'Priya Sharma', 'priya.sharma@example.com', '+919900112233', 'Frontend Engineer', '', 82, 'applied', ARRAY['React','TypeScript','CSS'], 3.5, 'Referred candidate'),
      (c2, 'Rohit Kumar', 'rohit.kumar@example.com', '+919988776655', 'Data Scientist', '', 74, 'screening', ARRAY['Python','ML','SQL'], 4.0, ''),
      (c3, 'Anita Desai', 'anita.desai@example.com', '+919977665544', 'Frontend Engineer', '', 66, 'shortlisted', ARRAY['HTML','CSS','JavaScript'], 2.0, 'Strong portfolio');

    -- Insert prediction history entries linking candidates to jobs
    INSERT INTO public.prediction_history (candidate_id, job_id, resume_name, model_used, match_score, skill_match_score, experience_match_score, matched_skills, missing_skills, suggestions, gemini_suitability_summary)
    VALUES
      (c1, j1, 'priya_sharma_resume.pdf', 'OpenAI', 82, 85, 70, ARRAY['React','TypeScript'], ARRAY['CSS Grid'], 'Good match; strengthen CSS layout skills', 'Strong fit for frontend role'),
      (c2, j2, 'rohit_kumar_cv.pdf', 'Rule-Based Fallback', 74, 70, 78, ARRAY['Python','ML'], ARRAY['PyTorch'], 'Good technical fit; consider additional deep-learning experience', 'Good fit for data role'),
      (c3, j1, 'anita_desai_resume.pdf', 'OpenAI', 66, 60, 72, ARRAY['JavaScript'], ARRAY['React','TypeScript'], 'Needs React/TypeScript experience', 'Potential junior frontend');

    -- Insert AI screening results (extra validation table)
    INSERT INTO public.ai_screening_results (candidate_id, resume_text, extracted_skills, match_score, fit_explanation, sentiment_score, confidence_level, screening_date, screened_by)
    VALUES
      (c1, '...resume text...', ARRAY['React','TypeScript','CSS'], 82, 'Candidate has strong React skills and good TypeScript usage', 0.8, 0.92, now(), NULL),
      (c2, '...resume text...', ARRAY['Python','ML','SQL'], 74, 'Good ML fundamentals, needs more deep-learning exposure', 0.6, 0.85, now(), NULL);

    -- Insert a sample voice interview result for one candidate
    INSERT INTO public.voice_interview_results (candidate_id, interview_transcript, sentiment_score, confidence_score, communication_rating, technical_rating, recommendation, interview_date)
    VALUES
      (c3, 'Hello, I have built several projects using vanilla JS and CSS...', 0.7, 0.8, 4.0, 3.5, 'Consider for frontend interview', now());

END $$;

COMMIT;

-- Indexes for seed data access
CREATE INDEX IF NOT EXISTS idx_seed_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_seed_candidates_status ON public.candidates(status);
