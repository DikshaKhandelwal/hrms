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
    // base recruiter tabs (shared by recruiter and senior_manager per request)
    const recruiterTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'candidates', label: 'Candidates', icon: Users },
      { id: 'ai-screening', label: 'AI Screening', icon: BrainCircuit },
      { id: 'voice-interview', label: 'Voice Interview', icon: FileText },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    ];

    switch (profile?.role) {
      case 'admin': {
        // Admin should be able to access all role tabs — expose a union of admin, recruiter, manager and employee items
        const adminBase = [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'recruitment', label: 'Recruitment', icon: UserCheck },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit },
        ];

        const managerExtras = [
          { id: 'candidates', label: 'Candidates', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'team', label: 'My Team', icon: Users },
          { id: 'approvals', label: 'Approvals', icon: UserCheck },
          { id: 'recruitment-pipeline', label: 'Recruitment Pipeline', icon: UserCheck },
          { id: 'team-performance', label: 'Team Performance', icon: TrendingUp },
          { id: 'role-management', label: 'Role Management', icon: Settings },
          { id: 'goal-kpi', label: 'Goal Management', icon: TrendingUp },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        ];

        const recruiterTabsForAdmin = recruiterTabs;

        const employeeTabs = [
          { id: 'profile', label: 'My Profile', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'leaves', label: 'Leave Requests', icon: FileText },
        ];

        // build a unique list by id while preserving a reasonable order
        const combined = [...adminBase, ...managerExtras, ...recruiterTabsForAdmin, ...employeeTabs];
        const seen = new Set<string>();
        return combined.filter((it) => {
          if (seen.has(it.id)) return false;
          seen.add(it.id);
          return true;
        });
      }

      case 'senior_manager': {
        // Manager: intentionally exclude AI Screening, Voice Interview, Performance, and Attendance
        const managerBase = [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Candidates', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ];
        const managerExtras = [
          { id: 'team', label: 'My Team', icon: Users },
          { id: 'approvals', label: 'Approvals', icon: UserCheck },
          { id: 'recruitment-pipeline', label: 'Recruitment Pipeline', icon: UserCheck },
          { id: 'team-performance', label: 'Team Performance', icon: TrendingUp },
          { id: 'role-management', label: 'Role Management', icon: Settings },
          { id: 'goal-kpi', label: 'Goal Management', icon: TrendingUp },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        ];
        return [...managerBase, ...managerExtras];
      }

      case 'recruiter':
        return recruiterTabs;

      default:
        // Employee (default role): only show personal, non-managerial items
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'profile', label: 'My Profile', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'leaves', label: 'Leave Requests', icon: FileText },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-slate-800 min-h-screen flex flex-col overflow-y-auto">
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

      <nav className="flex-1 p-4">
        {profile?.role === 'admin' ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs text-slate-400 uppercase px-3 mb-2">Dashboard</h4>
              <div className="space-y-1">
                <button onClick={() => onViewChange('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <button onClick={() => onViewChange('employees')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'employees' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Employees</span>
                </button>
                <button onClick={() => onViewChange('departments')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'departments' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">Departments</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-slate-400 uppercase px-3 mb-2">Recruitment</h4>
              <div className="space-y-1">
                <button onClick={() => onViewChange('candidates')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'candidates' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Candidates</span>
                </button>
                <button onClick={() => onViewChange('recruitment-pipeline')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'recruitment-pipeline' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <UserCheck className="w-5 h-5" />
                  <span className="font-medium">Pipeline</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-slate-400 uppercase px-3 mb-2">Analytics</h4>
              <div className="space-y-1">
                <button onClick={() => onViewChange('ai-insights')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'ai-insights' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-medium">AI Insights</span>
                </button>
                <button onClick={() => onViewChange('performance')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'performance' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Performance Overview</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-slate-400 uppercase px-3 mb-2">Management</h4>
              <div className="space-y-1">
                <button onClick={() => onViewChange('role-management')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'role-management' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Role Management</span>
                </button>
                <button onClick={() => onViewChange('goal-kpi')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'goal-kpi' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Goal Management</span>
                </button>
                <button onClick={() => onViewChange('approvals')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'approvals' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <UserCheck className="w-5 h-5" />
                  <span className="font-medium">Approvals</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-slate-400 uppercase px-3 mb-2">Other</h4>
              <div className="space-y-1">
                <button onClick={() => onViewChange('payroll')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'payroll' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Payroll</span>
                </button>
                <button onClick={() => onViewChange('team')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'team' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <Users className="w-5 h-5" />
                  <span className="font-medium">My Team</span>
                </button>
                <button onClick={() => onViewChange('leaves')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'leaves' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Leave Requests</span>
                </button>
                <button onClick={() => onViewChange('audit-logs')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'audit-logs' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Audit Logs</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-1">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentView === 'settings'
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
