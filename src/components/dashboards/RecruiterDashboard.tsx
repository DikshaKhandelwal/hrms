import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { AIScreening } from '../features/AIScreening';
import { CandidateManagement } from '../features/CandidateManagement';
import { VoiceInterview } from '../features/VoiceInterview';
import { supabase } from '../../lib/supabase';

interface RecruiterDashboardProps {
  activeView?: string;
}

export const RecruiterDashboard = ({ activeView = 'dashboard' }: RecruiterDashboardProps) => {
  const { profile } = useAuth();
  const [timeFilter, setTimeFilter] = useState('Today');
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);

  const loadAttendanceStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const presentRes = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('date', today)
        .eq('status', 'present');

      const totalRes = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      setPresentCount(presentRes.count ?? 0);
      setTotalEmployees(totalRes.count ?? 0);
    } catch (err) {
      console.error('Failed to load attendance stats for recruiter dashboard', err);
      setPresentCount(null);
      setTotalEmployees(null);
    }
  }, []);

  useEffect(() => {
    loadAttendanceStats();
    const handler = () => loadAttendanceStats();
    window.addEventListener('attendance-updated', handler as EventListener);
    return () => window.removeEventListener('attendance-updated', handler as EventListener);
  }, [loadAttendanceStats]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Breadcrumb */}
      <div className="bg-white px-6 py-3 text-sm text-slate-500">
        Home / <span className="text-slate-800">Dashboard</span>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Render based on active view */}
        {activeView === 'candidates' && <CandidateManagement />}
        {activeView === 'ai-screening' && <AIScreening />}
        {activeView === 'voice-interview' && <VoiceInterview />}
        
        {/* Dashboard Overview */}
        {activeView === 'dashboard' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                  <h1 className="text-3xl font-bold text-slate-800">{profile?.role === 'senior_manager' ? 'Good Morning Senior Manager !' : 'Good Morning HR !'}</h1>
                  <p className="text-slate-500 text-sm mt-1">Keep your face always toward the sunshine, and shadows will fall behind you !</p>
                </div>
              <div className="flex gap-2">
                {['Today', 'Weekly', 'Monthly', 'Custom'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      timeFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Left Column - What's Happening */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-slate-600 text-sm mb-6">What's Happening in office</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">Today Attendance</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">{presentCount !== null && totalEmployees !== null ? `${presentCount}/${totalEmployees}` : '—'}</div>
                <div className="text-xs text-slate-400 mt-1">Employees in Building</div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">Total Paid Salary</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">₹4,625,000</div>
                <div className="text-xs text-slate-400 mt-1">22 Aug 2025</div>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="bg-white rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">On-Permission</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">12</div>
                <div className="text-xs text-slate-400 mt-1">View Employees</div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">Next Payroll On</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">25 Sept</div>
                <div className="text-xs text-slate-400 mt-1">View Payroll</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">Happiness Rate</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-800">80%</span>
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    20%
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Previous Month</div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-500 text-sm">Pending Approvals</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-slate-700">2 Reimbursements</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-slate-700">4 Leave Approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Employee Type */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Employee Type</h3>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Total Employee</span>
                <span className="font-semibold">60</span>
              </div>
            </div>
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-full bg-slate-200 rounded-full h-8">
                  <div className="bg-indigo-600 h-8 rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-600 rounded"></div>
                  <span className="text-sm text-slate-600">Full Time</span>
                </div>
                <span className="font-semibold text-slate-800">40</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-400 rounded"></div>
                  <span className="text-sm text-slate-600">Freelancer</span>
                </div>
                <span className="font-semibold text-slate-800">10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-300 rounded"></div>
                  <span className="text-sm text-slate-600">Probation</span>
                </div>
                <span className="font-semibold text-slate-800">10</span>
              </div>
            </div>
          </div>

          {/* Gender Diversity */}
          <div className="bg-white rounded-lg p-6 col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Gender Diversity</h3>
            </div>
            <div className="h-64">
              {/* Bar Chart */}
              <div className="flex items-end justify-between h-full gap-4">
                {['Marketing', 'Business', 'Human Re...', 'Engineering', 'Product M...', 'Data', 'Others'].map((dept, idx) => {
                  const heights = [
                    { male: 60, female: 50, trans: 0 },
                    { male: 75, female: 60, trans: 0 },
                    { male: 65, female: 70, trans: 0 },
                    { male: 80, female: 75, trans: 0 },
                    { male: 95, female: 85, trans: 50 },
                    { male: 70, female: 85, trans: 60 },
                    { male: 75, female: 70, trans: 0 }
                  ];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="flex items-end gap-1 mb-2 w-full justify-center">
                        <div className="w-6 bg-indigo-600 rounded-t" style={{ height: `${heights[idx].male}%` }}></div>
                        <div className="w-6 bg-indigo-400 rounded-t" style={{ height: `${heights[idx].female}%` }}></div>
                        {heights[idx].trans > 0 && (
                          <div className="w-6 bg-teal-400 rounded-t" style={{ height: `${heights[idx].trans}%` }}></div>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 text-center">{dept}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-6 mt-4 justify-end text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                <span className="text-slate-600">Male</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-400 rounded"></div>
                <span className="text-slate-600">Female</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-400 rounded"></div>
                <span className="text-slate-600">Trans</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Working Format */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Working Format</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e2e8f0" strokeWidth="32" />
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#4f46e5" strokeWidth="32" 
                    strokeDasharray="502" strokeDashoffset="167" />
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#34d399" strokeWidth="32" 
                    strokeDasharray="502" strokeDashoffset="335" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-slate-800">60</div>
                  <div className="text-sm text-slate-500">Employees</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm text-slate-600">On-Site</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Remote</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average KPI */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800">Average KPI</h3>
              <span className="text-green-600 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                125% Previous Month
              </span>
            </div>
            <div className="h-48">
              {/* Area Chart */}
              <svg className="w-full h-full" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,100 L 50,90 L 100,85 L 150,95 L 200,75 L 250,60 L 300,40 L 350,55 L 400,35 L 400,150 L 0,150 Z"
                  fill="url(#areaGradient)"
                />
                <path
                  d="M 0,100 L 50,90 L 100,85 L 150,95 L 200,75 L 250,60 L 300,40 L 350,55 L 400,35"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Notice Board</h3>
            </div>
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <h4 className="font-medium text-slate-800 mb-2">Event Notice</h4>
                <p className="text-xs text-slate-500 mb-3">Public notice, Implied notice, Actual notice, and Constructive notice are 4 different types of Legal Notice drafts in India. Notice writing represents a formal written message.</p>
                <div className="flex gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                </div>
                <div className="text-xs text-slate-400 text-right">Sri Harish | PMI<br />29-05-2025 | 9:00 AM</div>
              </div>
              <div className="pb-4">
                <h4 className="font-medium text-slate-800 mb-2">Pick The Spot for Team Lunch</h4>
                <p className="text-xs text-slate-500 mb-3">Public notice, Implied notice, Actual notice, and Constructive notice are 4 different types of Legal Notice drafts in India. Notice writing represents a formal written message.</p>
                <div className="flex gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  <div className="w-8 h-8 bg-slate-300 rounded"></div>
                </div>
                <div className="text-xs text-slate-400 text-right">Sri Harish | PMI<br />29-05-2025 | 9:00 AM</div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

