import React, { useEffect, useState } from 'react';
import { Search, Filter, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { supabase, Candidate } from '../../lib/supabase';

export const CandidateManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      applied: 'bg-blue-100 text-blue-700',
      screening: 'bg-amber-100 text-amber-700',
      shortlisted: 'bg-green-100 text-green-700',
      interview_scheduled: 'bg-violet-100 text-violet-700',
      interviewed: 'bg-teal-100 text-teal-700',
      offered: 'bg-emerald-100 text-emerald-700',
      hired: 'bg-slate-900 text-white',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position_applied.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interviewed">Interviewed</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No candidates found</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{candidate.full_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        {candidate.status.replace('_', ' ')}
                      </span>
                      {candidate.ai_screening_score > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-slate-600">AI Score:</span>
                          <span className={`text-sm font-bold ${
                            candidate.ai_screening_score >= 75 ? 'text-green-600' :
                            candidate.ai_screening_score >= 65 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {candidate.ai_screening_score}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-700 font-medium mb-3">{candidate.position_applied}</p>

                    <div className="flex items-center space-x-6 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.experience_years > 0 && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>{candidate.experience_years} years experience</span>
                        </div>
                      )}
                    </div>

                    {candidate.skills_extracted && candidate.skills_extracted.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {candidate.skills_extracted.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium">
                      View Details
                    </button>
                    {candidate.status === 'shortlisted' && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Schedule</span>
                      </button>
                    )}
                  </div>
                </div>

                {candidate.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">{candidate.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
