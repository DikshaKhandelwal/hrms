import { ResumeData, MatchResult, Job } from './types';
import { calculateSkillMatch, calculateExperienceMatch } from './resumeParser';
import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Parse a resume file using the backend API
 */
export async function parseResumeFile(file: File): Promise<ResumeData> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/parse-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to parse resume: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data as ResumeData;
}

/**
 * Match a resume to a job posting using OpenAI API
 */
export async function matchResumeToJob(
  resumeFile: File,
  job: Job,
  modelChoice: 'OpenAI' | 'Rule-Based Fallback' = 'OpenAI'
): Promise<MatchResult> {
  
  if (modelChoice === 'OpenAI') {
    // Call the backend API for AI-powered matching
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('job_title', job.job_title);
    formData.append('company_name', job.company_name || '');
    formData.append('job_description', job.job_description || '');
    formData.append('location', job.location || '');
    formData.append('experience_level', job.experience_level || '');
    formData.append('skills_required', job.skills_required || '');
    formData.append('industry', job.industry || '');
    formData.append('employment_mode', job.employment_mode || '');
    formData.append('model_choice', 'OpenAI');

    const response = await fetch(`${API_BASE_URL}/api/match-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to match resume: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      match_score: result.match_score,
      skill_match: result.skill_match,
      experience_match: result.experience_match,
      matched_skills: result.matched_skills,
      missing_skills: result.missing_skills,
      suggestions: result.suggestions,
      gemini_suitability_summary: result.gemini_suitability_summary,
    };
  } else {
    // Fallback to rule-based matching
    const resumeData = await parseResumeFile(resumeFile);
    
    const jobSkills = job.skills_required 
      ? job.skills_required.split(',').map(s => s.trim()).filter(s => s)
      : [];
    
    const { matchPercentage: skillMatch, matchedSkills, missingSkills } = calculateSkillMatch(
      resumeData.skills,
      jobSkills
    );
    
    const experienceMatch = calculateExperienceMatch(
      resumeData.years_experience,
      job.experience_level || ''
    );
    
    // Calculate overall match score (70% skills, 30% experience)
    const matchScore = Math.round(skillMatch * 0.7 + experienceMatch * 0.3);
    
    const suggestions = generateSuggestions(missingSkills, skillMatch, experienceMatch);
    
    return {
      match_score: matchScore,
      skill_match: skillMatch,
      experience_match: experienceMatch,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      suggestions,
    };
  }
}

/**
 * Generate suggestions based on match results
 */
function generateSuggestions(
  missingSkills: string[],
  skillMatch: number,
  experienceMatch: number
): string {
  const suggestions: string[] = [];
  
  if (skillMatch < 50) {
    suggestions.push('Consider acquiring more relevant skills for this position.');
  }
  
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    suggestions.push(`Focus on learning: ${topMissing}`);
  }
  
  if (experienceMatch < 70) {
    suggestions.push('Gain more experience in this field to strengthen your application.');
  }
  
  if (skillMatch >= 70 && experienceMatch >= 70) {
    suggestions.push('Strong match! Highlight your matching skills in your application.');
  }
  
  return suggestions.join(' ') || 'Review the job requirements and tailor your resume accordingly.';
}

/**
 * Save prediction history to database
 */
export async function savePredictionHistory(
  candidateId: string | undefined,
  jobId: number,
  resumeName: string,
  modelUsed: string,
  result: MatchResult
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('prediction_history')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        resume_name: resumeName,
        model_used: modelUsed,
        match_score: result.match_score,
        skill_match_score: result.skill_match,
        experience_match_score: result.experience_match,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills,
        suggestions: result.suggestions,
        gemini_suitability_summary: result.gemini_suitability_summary,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving prediction history:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error saving prediction history:', error);
    return null;
  }
}

/**
 * Get all active jobs
 */
export async function getActiveJobs(): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

/**
 * Create a new job posting
 */
export async function createJob(job: Partial<Job>): Promise<Job | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...job,
        created_by: user?.id,
        status: 'active',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating job:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    return null;
  }
}

/**
 * Update candidate with AI screening results
 */
export async function updateCandidateWithScreening(
  candidateId: string,
  resumeData: ResumeData,
  result: MatchResult,
  modelUsed: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({
        resume_text: resumeData.raw_text,
        skills_extracted: resumeData.skills.join(', '),
        skills_matched: result.matched_skills,
        experience_years: resumeData.years_experience,
        ai_screening_score: result.match_score,
        ai_model_used: modelUsed,
        last_screening_date: new Date().toISOString(),
      })
      .eq('id', candidateId);
    
    if (error) {
      console.error('Error updating candidate:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating candidate:', error);
    return false;
  }
}
