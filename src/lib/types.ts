// Database Types

export interface Profile {
  id: string;
  role: 'admin' | 'senior_manager' | 'recruiter' | 'employee';
  full_name: string;
  email: string;
  phone?: string;
  department_id?: number;
  job_title?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  profile_picture_url?: string;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  job_title: string;
  company_name?: string;
  job_description?: string;
  location?: string;
  job_type?: string; // Full-time, Part-time, Contract
  salary_range?: string;
  experience_level?: string; // Entry, Mid, Senior
  skills_required?: string; // Comma-separated
  industry?: string;
  posted_date?: string;
  employment_mode?: string; // Remote, On-site, Hybrid
  status?: string; // active, closed, on-hold
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string; // Changed from number to string (UUID)
  full_name: string;
  email: string;
  phone?: string;
  position_applied: string;
  resume_url?: string;
  resume_text?: string;
  ai_screening_score?: number;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  skills_extracted?: string;
  skills_matched?: string[];
  experience_years?: number;
  interview_date?: string;
  recruiter_id?: string;
  notes?: string;
  ai_model_used?: string;
  last_screening_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PredictionHistory {
  id: number;
  candidate_id?: string; // Changed from number to string (UUID)
  job_id?: number;
  resume_name?: string;
  model_used: string; // Gemini Pro, LSTM, Transformer, Rule-Based
  match_score?: number; // 0-100
  skill_match_score?: number; // 0-100
  experience_match_score?: number; // 0-100
  matched_skills?: string[];
  missing_skills?: string[];
  suggestions?: string;
  gemini_suitability_summary?: string;
  created_at: string;
}

// Frontend Types

export interface ResumeData {
  raw_text: string;
  skills: string[];
  years_experience: number;
}

export interface MatchResult {
  match_score: number;
  skill_match: number;
  experience_match: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string;
  gemini_suitability_summary?: string;
}

export interface AIScreeningRequest {
  resumeFile: File;
  jobId: number;
  modelChoice: 'Gemini Pro' | 'Rule-Based Fallback';
}

export interface AIScreeningResponse {
  candidateId?: number;
  predictionId: number;
  result: MatchResult;
  resumeData: ResumeData;
  jobData: Job;
}
