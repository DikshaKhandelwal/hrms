/*
  # HRMS Platform Database Schema

  ## Overview
  Complete database schema for an enterprise HRMS platform with AI capabilities,
  supporting employee management, recruitment, payroll, performance tracking, and analytics.

  ## Tables Created

  ### 1. profiles
  Extended user profiles linked to auth.users
  - id (uuid, references auth.users)
  - role (enum: admin, senior_manager, recruiter, employee)
  - full_name, email, phone, department_id
  - job_title, date_of_joining, date_of_birth
  - address, emergency_contact
  - profile_picture_url, status

  ### 2. departments
  Company departments/divisions
  - id, name, description, manager_id
  - budget, employee_count
  - created_at, updated_at

  ### 3. attendance
  Daily attendance records
  - id, employee_id, date, check_in, check_out
  - status (enum: present, absent, leave, half_day)
  - work_hours, notes

  ### 4. payroll
  Monthly salary and payment records
  - id, employee_id, month, year
  - basic_salary, allowances, deductions, net_salary
  - payment_date, payment_status
  - tax_deducted, reimbursements

  ### 5. performance_reviews
  Employee performance evaluations
  - id, employee_id, reviewer_id, review_period
  - rating (1-5), strengths, areas_for_improvement
  - goals_achieved, overall_comments
  - review_date, status

  ### 6. candidates
  Job applicants and recruitment pipeline
  - id, full_name, email, phone, position_applied
  - resume_url, ai_screening_score, status
  - skills_extracted, experience_years
  - interview_date, recruiter_id, notes

  ### 7. ai_screening_results
  AI-powered candidate screening analysis
  - id, candidate_id, resume_text
  - extracted_skills, match_score, fit_explanation
  - sentiment_score, confidence_level
  - screening_date, screened_by

  ### 8. voice_interview_results
  Voice/chat bot interview records
  - id, candidate_id, interview_transcript
  - sentiment_score, confidence_score
  - communication_rating, technical_rating
  - recommendation, interview_date

  ### 9. attrition_predictions
  AI-generated employee attrition risk analysis
  - id, employee_id, risk_score, risk_level
  - contributing_factors, recommendations
  - prediction_date, last_updated

  ### 10. leave_requests
  Employee leave applications
  - id, employee_id, leave_type, start_date, end_date
  - total_days, reason, status, approved_by
  - applied_date, approval_date

  ## Security
  - RLS enabled on all tables
  - Role-based access policies for each user type
  - Employees can only view/edit their own data
  - Managers can view their department's data
  - Recruiters access candidate pipeline
  - Admins have full system access
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'senior_manager', 'recruiter', 'employee');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'leave', 'half_day');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE candidate_status AS ENUM ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE review_status AS ENUM ('draft', 'submitted', 'completed');
CREATE TYPE leave_type AS ENUM ('sick', 'casual', 'vacation', 'unpaid', 'maternity', 'paternity');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  manager_id uuid,
  budget numeric(12, 2) DEFAULT 0,
  employee_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text DEFAULT '',
  department_id uuid REFERENCES departments(id),
  job_title text DEFAULT '',
  date_of_joining date DEFAULT CURRENT_DATE,
  date_of_birth date,
  address text DEFAULT '',
  emergency_contact text DEFAULT '',
  profile_picture_url text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status attendance_status DEFAULT 'present',
  work_hours numeric(4, 2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- 4. Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  basic_salary numeric(12, 2) DEFAULT 0,
  allowances numeric(12, 2) DEFAULT 0,
  deductions numeric(12, 2) DEFAULT 0,
  net_salary numeric(12, 2) DEFAULT 0,
  payment_date date,
  payment_status payment_status DEFAULT 'pending',
  tax_deducted numeric(12, 2) DEFAULT 0,
  reimbursements numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- 5. Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) NOT NULL,
  review_period text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  strengths text DEFAULT '',
  areas_for_improvement text DEFAULT '',
  goals_achieved text DEFAULT '',
  overall_comments text DEFAULT '',
  review_date date DEFAULT CURRENT_DATE,
  status review_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  position_applied text NOT NULL,
  resume_url text DEFAULT '',
  ai_screening_score numeric(5, 2) DEFAULT 0,
  status candidate_status DEFAULT 'applied',
  skills_extracted text[] DEFAULT '{}',
  experience_years numeric(4, 1) DEFAULT 0,
  interview_date timestamptz,
  recruiter_id uuid REFERENCES profiles(id),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. AI Screening Results Table
CREATE TABLE IF NOT EXISTS ai_screening_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  resume_text text DEFAULT '',
  extracted_skills text[] DEFAULT '{}',
  match_score numeric(5, 2) DEFAULT 0,
  fit_explanation text DEFAULT '',
  sentiment_score numeric(5, 2) DEFAULT 0,
  confidence_level numeric(5, 2) DEFAULT 0,
  screening_date timestamptz DEFAULT now(),
  screened_by uuid REFERENCES profiles(id)
);

-- 8. Voice Interview Results Table
CREATE TABLE IF NOT EXISTS voice_interview_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  interview_transcript text DEFAULT '',
  sentiment_score numeric(5, 2) DEFAULT 0,
  confidence_score numeric(5, 2) DEFAULT 0,
  communication_rating numeric(5, 2) DEFAULT 0,
  technical_rating numeric(5, 2) DEFAULT 0,
  recommendation text DEFAULT '',
  interview_date timestamptz DEFAULT now()
);

-- 9. Attrition Predictions Table
CREATE TABLE IF NOT EXISTS attrition_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  risk_score numeric(5, 2) DEFAULT 0,
  risk_level risk_level DEFAULT 'low',
  contributing_factors text[] DEFAULT '{}',
  recommendations text DEFAULT '',
  prediction_date timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- 10. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer DEFAULT 1,
  reason text DEFAULT '',
  status leave_status DEFAULT 'pending',
  approved_by uuid REFERENCES profiles(id),
  applied_date timestamptz DEFAULT now(),
  approval_date timestamptz
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attrition_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Departments
CREATE POLICY "Admins can manage all departments"
  ON departments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "All authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for Profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can view their department profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'senior_manager'
      AND p.department_id = profiles.department_id
    )
  );

-- RLS Policies for Attendance
CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can view their own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create their own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can view their department attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = attendance.employee_id
    )
  );

-- RLS Policies for Payroll
CREATE POLICY "Admins can manage all payroll"
  ON payroll FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can view their own payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- RLS Policies for Performance Reviews
CREATE POLICY "Admins can manage all reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can view their own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "Managers can manage their department reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = performance_reviews.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = performance_reviews.employee_id
    )
  );

-- RLS Policies for Candidates
CREATE POLICY "Admins and recruiters can manage candidates"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  );

-- RLS Policies for AI Screening Results
CREATE POLICY "Admins and recruiters can manage AI screening results"
  ON ai_screening_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  );

-- RLS Policies for Voice Interview Results
CREATE POLICY "Admins and recruiters can manage voice interview results"
  ON voice_interview_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'recruiter')
    )
  );

-- RLS Policies for Attrition Predictions
CREATE POLICY "Admins and managers can view attrition predictions"
  ON attrition_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'senior_manager')
    )
  );

CREATE POLICY "Admins can manage attrition predictions"
  ON attrition_predictions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- RLS Policies for Leave Requests
CREATE POLICY "Employees can manage their own leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can view and approve department leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('admin', 'senior_manager')
      AND p2.id = leave_requests.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('admin', 'senior_manager')
      AND p2.id = leave_requests.employee_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);