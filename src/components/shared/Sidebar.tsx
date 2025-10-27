import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  BrainCircuit,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { profile, signOut } = useAuth();

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'recruitment', label: 'Recruitment', icon: UserCheck },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit },
        ];
      case 'senior_manager':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'team', label: 'My Team', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'ai-insights', label: 'Team Insights', icon: BrainCircuit },
        ];
      case 'recruiter':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Candidates', icon: Users },
          { id: 'ai-screening', label: 'AI Screening', icon: BrainCircuit },
          { id: 'voice-interview', label: 'Voice Interview', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'profile', label: 'My Profile', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'leaves', label: 'Leave Requests', icon: FileText },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-slate-800 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">HRMS</h1>
            <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-1">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            currentView === 'settings'
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
