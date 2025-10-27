import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'senior_manager' | 'recruiter' | 'employee';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  department_id: string | null;
  job_title: string;
  date_of_joining: string;
  date_of_birth: string | null;
  address: string;
  emergency_contact: string;
  profile_picture_url: string;
  status: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id: string | null;
  budget: number;
  employee_count: number;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  resume_url: string;
  ai_screening_score: number;
  status: string;
  skills_extracted: string[];
  experience_years: number;
  interview_date: string | null;
  recruiter_id: string | null;
  notes: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  work_hours: number;
  notes: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string | null;
  payment_status: string;
  tax_deducted: number;
  reimbursements: number;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  rating: number;
  strengths: string;
  areas_for_improvement: string;
  goals_achieved: string;
  overall_comments: string;
  review_date: string;
  status: string;
}

export interface AttritionPrediction {
  id: string;
  employee_id: string;
  risk_score: number;
  risk_level: string;
  contributing_factors: string[];
  recommendations: string;
  prediction_date: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  approved_by: string | null;
  applied_date: string;
  approval_date: string | null;
}
