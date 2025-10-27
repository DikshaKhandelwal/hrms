import React, { useState, useEffect } from 'react';
import { Upload, FileText, Briefcase, TrendingUp, AlertCircle, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { getActiveJobs, matchResumeToJob, savePredictionHistory, createJob, parseResumeFile } from '../../lib/aiMatcher';
import { Job, MatchResult, ResumeData } from '../../lib/types';

interface ScreeningResult {
  resumeName: string;
  resumeData: ResumeData;
  matchResult: MatchResult;
  job: Job;
}

export const AIScreening: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelChoice, setModelChoice] = useState<'OpenAI' | 'Rule-Based Fallback'>('OpenAI');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    job_title: '',
    company_name: '',
    job_description: '',
    location: '',
    experience_level: '',
    skills_required: '',
    industry: '',
    employment_mode: 'Hybrid'
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const activeJobs = await getActiveJobs();
    setJobs(activeJobs);
    if (activeJobs.length > 0) {
      setSelectedJob(activeJobs[0]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleScreenResume = async () => {
    if (!selectedFile || !selectedJob) {
      setError('Please select both a resume file and a job posting');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const matchResult = await matchResumeToJob(selectedFile, selectedJob, modelChoice);
      const resumeData = await parseResumeFile(selectedFile);

      await savePredictionHistory(
        undefined,
        selectedJob.id,
        selectedFile.name,
        modelChoice,
        matchResult
      );

      setResult({
        resumeName: selectedFile.name,
        resumeData,
        matchResult,
        job: selectedJob
      });
    } catch (err) {
      console.error('Screening error:', err);
      setError(err instanceof Error ? err.message : 'Failed to screen resume');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.job_title || !newJob.job_description || !newJob.skills_required) {
      setError('Please fill in required fields');
      return;
    }

    const job = await createJob(newJob);
    if (job) {
      setJobs([job, ...jobs]);
      setSelectedJob(job);
      setShowJobForm(false);
      setNewJob({
        job_title: '',
        company_name: '',
        job_description: '',
        location: '',
        experience_level: '',
        skills_required: '',
        industry: '',
        employment_mode: 'Hybrid'
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good Match', color: 'bg-amber-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AI Resume Screening</h1>
        </div>
        <p className="text-indigo-100">
          Powered by OpenAI GPT-4 - Intelligent resume analysis
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Select Job Position</span>
          </h2>
          <button
            onClick={() => setShowJobForm(!showJobForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            {showJobForm ? 'Cancel' : '+ Create New Job'}
          </button>
        </div>

        {showJobForm ? (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Job Title *" value={newJob.job_title} onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="text" placeholder="Company Name" value={newJob.company_name} onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <textarea placeholder="Job Description *" value={newJob.job_description} onChange={(e) => setNewJob({ ...newJob, job_description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
            <div className="grid grid-cols-3 gap-4">
              <input type="text" placeholder="Location" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="text" placeholder="Experience (e.g., 3-5 years)" value={newJob.experience_level} onChange={(e) => setNewJob({ ...newJob, experience_level: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <select value={newJob.employment_mode} onChange={(e) => setNewJob({ ...newJob, employment_mode: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>Remote</option>
                <option>On-site</option>
                <option>Hybrid</option>
              </select>
            </div>
            <input type="text" placeholder="Required Skills (comma-separated) *" value={newJob.skills_required} onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <button onClick={handleCreateJob} className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
              Create Job Posting
            </button>
          </div>
        ) : (
          <select value={selectedJob?.id || ''} onChange={(e) => { const job = jobs.find(j => j.id === Number(e.target.value)); setSelectedJob(job || null); }} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900">
            {jobs.length === 0 ? (<option>No jobs available - Create one first</option>) : (jobs.map(job => (<option key={job.id} value={job.id}>{job.job_title} {job.company_name ? `- ${job.company_name}` : ''} ({job.employment_mode})</option>)))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload Resume</span>
        </h2>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-slate-700 font-medium">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <p className="text-slate-600 mb-2">Upload PDF or DOCX resume</p>
          )}
          <label className="inline-block mt-3">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            <span className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium cursor-pointer hover:bg-slate-800 transition inline-block">
              {selectedFile ? 'Change File' : 'Choose File'}
            </span>
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Model</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="OpenAI" checked={modelChoice === 'OpenAI'} onChange={(e) => setModelChoice(e.target.value as 'OpenAI')} className="text-indigo-600" />
                <span className="text-slate-700">OpenAI GPT-4 (Recommended)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="Rule-Based Fallback" checked={modelChoice === 'Rule-Based Fallback'} onChange={(e) => setModelChoice(e.target.value as 'Rule-Based Fallback')} className="text-indigo-600" />
                <span className="text-slate-700">Rule-Based Matching</span>
              </label>
            </div>
          </div>

          <button onClick={handleScreenResume} disabled={!selectedFile || !selectedJob || loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing with AI...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span>Screen Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Screening Results</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getScoreBadge(result.matchResult.match_score).color} text-white`}>
              {getScoreBadge(result.matchResult.match_score).label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-xl p-6 ${getScoreColor(result.matchResult.match_score)}`}>
              <p className="text-sm font-medium mb-1">Overall Match</p>
              <p className="text-3xl font-bold">{result.matchResult.match_score}%</p>
            </div>
            <div className={`rounded-xl p-6 ${getScoreColor(result.matchResult.skill_match)}`}>
              <p className="text-sm font-medium mb-1">Skill Match</p>
              <p className="text-3xl font-bold">{result.matchResult.skill_match}%</p>
            </div>
            <div className={`rounded-xl p-6 ${getScoreColor(result.matchResult.experience_match)}`}>
              <p className="text-sm font-medium mb-1">Experience Match</p>
              <p className="text-3xl font-bold">{result.matchResult.experience_match}%</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Matched Skills ({result.matchResult.matched_skills.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.matchResult.matched_skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">{skill}</span>
              ))}
            </div>
          </div>

          {result.matchResult.missing_skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Missing Skills ({result.matchResult.missing_skills.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matchResult.missing_skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Recommendations</h3>
            <p className="text-slate-700 leading-relaxed">{result.matchResult.suggestions}</p>
          </div>

          {result.matchResult.gemini_suitability_summary && (
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-sm font-semibold text-indigo-900 mb-3">Suitability Summary</h3>
              <p className="text-indigo-800 leading-relaxed">{result.matchResult.gemini_suitability_summary}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Resume Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-600">File Name:</span><span className="ml-2 text-slate-900 font-medium">{result.resumeName}</span></div>
              <div><span className="text-slate-600">Years of Experience:</span><span className="ml-2 text-slate-900 font-medium">{result.resumeData.years_experience} years</span></div>
              <div><span className="text-slate-600">Total Skills Found:</span><span className="ml-2 text-slate-900 font-medium">{result.resumeData.skills.length}</span></div>
              <div><span className="text-slate-600">AI Model Used:</span><span className="ml-2 text-slate-900 font-medium">{modelChoice}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
