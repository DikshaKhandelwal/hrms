import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { profile } = useAuth();

  // For recruiters, show the EHR Portal style navigation
  if (profile?.role === 'recruiter') {
    return (
      <nav className="bg-slate-800 text-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold">
                HR
              </div>
              <span className="font-semibold text-lg">EHR PORTAL</span>
            </div>
            <div className="flex gap-6 text-sm">
              <button 
                onClick={() => onViewChange?.('dashboard')}
                className={currentView === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onViewChange?.('candidates')}
                className={currentView === 'candidates' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Candidates
              </button>
              <button 
                onClick={() => onViewChange?.('ai-screening')}
                className={currentView === 'ai-screening' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                AI Screening
              </button>
              <button 
                onClick={() => onViewChange?.('voice-interview')}
                className={currentView === 'voice-interview' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Voice Interview
              </button>
              <button 
                onClick={() => onViewChange?.('attendance')}
                className={currentView === 'attendance' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Attendance
              </button>
              <button 
                onClick={() => onViewChange?.('payroll')}
                className={currentView === 'payroll' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Payroll
              </button>
              <button 
                onClick={() => onViewChange?.('reports')}
                className={currentView === 'reports' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Reports
              </button>
              <button 
                onClick={() => onViewChange?.('settings')}
                className={currentView === 'settings' ? 'text-white' : 'text-slate-400 hover:text-white'}
              >
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Employee/Reports..."
                className="bg-slate-700 text-white px-4 py-2 rounded-lg w-64 text-sm placeholder-slate-400"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <Bell className="w-5 h-5 text-slate-300" />
            <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </nav>
    );
  }

  // For other roles, show the default white header
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">dk</p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
