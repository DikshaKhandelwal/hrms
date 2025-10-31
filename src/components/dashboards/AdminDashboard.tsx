import React, { useEffect, useState } from 'react';
import { RecruiterDashboard } from './RecruiterDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import ProfilePage from '../employee/ProfilePage';
import AttendancePage from '../employee/AttendancePage';
import LeaveRequestsPage from '../employee/LeaveRequestsPage';
import { Users, Building2, TrendingDown, Star, DollarSign, UserCheck } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { supabase } from '../../lib/supabase';
import { useRealtime } from '../../hooks/useRealtime';

interface DashboardStats {
  totalEmployees: number;
  departmentCount: number;
  attritionRate: number;
  avgPerformance: number;
  totalPayroll: number;
  activeRecruitments: number;
}

export const AdminDashboard: React.FC<{ activeView?: string; onViewChange?: (v: string) => void }> = ({ activeView = 'dashboard', onViewChange }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    departmentCount: 0,
    attritionRate: 0,
    avgPerformance: 0,
    totalPayroll: 0,
    activeRecruitments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [employeesRes, departmentsRes, candidatesRes, payrollRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('departments').select('id', { count: 'exact' }),
        supabase.from('candidates').select('id', { count: 'exact' }).in('status', ['applied', 'screening', 'interview_scheduled']),
        supabase.from('payroll').select('net_salary').eq('month', new Date().getMonth() + 1).eq('year', new Date().getFullYear()),
        supabase.from('performance_reviews').select('rating').eq('status', 'completed')
      ]);

      const totalPayroll = payrollRes.data?.reduce((sum, p) => sum + (p.net_salary || 0), 0) || 0;
      const avgRating = reviewsRes.data?.length
        ? reviewsRes.data.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsRes.data.length
        : 0;

      setStats({
        totalEmployees: employeesRes.count || 0,
        departmentCount: departmentsRes.count || 0,
        attritionRate: 4.2,
        avgPerformance: Number(avgRating.toFixed(1)),
        totalPayroll: totalPayroll,
        activeRecruitments: candidatesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime events and refresh admin overview when attendance or
  // leave requests change. This keeps the admin summary in sync across sessions.
  useRealtime(
    () => {
      // attendance changed
      loadDashboardData();
    },
    () => {
      // leave requests changed
      loadDashboardData();
    }
  );

  // If the admin selected a non-dashboard view from the sidebar, render the
  // corresponding role-specific dashboard or page so admins can inspect any
  // role's tabs and content.
  if (activeView && activeView !== 'dashboard') {
    // manager views
    const managerViews = new Set([
      'team',
      'approvals',
      'recruitment-pipeline',
      'team-performance',
      'role-management',
      'goal-kpi',
      'audit-logs',
    ]);

    // recruiter views
    const recruiterViews = new Set(['candidates', 'ai-screening', 'voice-interview', 'analytics', 'recruitment']);

    // employee views
    const employeeViews = new Set(['profile', 'attendance', 'leaves']);

    if (managerViews.has(activeView)) {
      return <ManagerDashboard activeView={activeView} />;
    }

    if (recruiterViews.has(activeView)) {
      return <RecruiterDashboard activeView={activeView} />;
    }

    if (employeeViews.has(activeView)) {
      switch (activeView) {
        case 'profile':
          return <ProfilePage />;
        case 'attendance':
          return <AttendancePage />;
        case 'leaves':
          return <LeaveRequestsPage />;
        default:
          return <EmployeeDashboard onViewChange={onViewChange} />;
      }
    }
    // For other admin sub-views (employees, departments, payroll, etc.),
    // fall back to showing the admin overview below.
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Management Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of company-wide HR operations and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          trend={{ value: '12% from last month', isPositive: true }}
          iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Departments"
          value={stats.departmentCount}
          icon={Building2}
          iconColor="bg-green-50 text-green-600"
        />
        <StatCard
          title="Attrition Rate"
          value={`${stats.attritionRate}%`}
          icon={TrendingDown}
          trend={{ value: '2.1% from last quarter', isPositive: false }}
          iconColor="bg-red-50 text-red-600"
        />
        <StatCard
          title="Avg Performance"
          value={stats.avgPerformance || 'N/A'}
          icon={Star}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Total Payroll"
          value={`$${(stats.totalPayroll / 1000).toFixed(0)}K`}
          icon={DollarSign}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Recruitments"
          value={stats.activeRecruitments}
          icon={UserCheck}
          iconColor="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Attrition Risk by Department</h3>
          <div className="space-y-4">
            {[
              { name: 'Engineering', risk: 18, count: 45 },
              { name: 'Sales', risk: 32, count: 28 },
              { name: 'Marketing', risk: 12, count: 22 },
              { name: 'Operations', risk: 8, count: 35 },
              { name: 'HR', risk: 5, count: 12 },
            ].map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                  <span className="text-sm text-slate-600">{dept.risk}% ({dept.count} employees)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${dept.risk > 25 ? 'bg-red-500' : dept.risk > 15 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${dept.risk}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">High Attrition Risk</p>
                  <p className="text-xs text-red-700 mt-1">
                    Sales department shows 32% attrition risk due to high workload and limited growth opportunities
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Performance Anomaly</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Engineering team performance decreased by 15% this quarter
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Hiring Recommendation</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Consider hiring 3-5 engineers to reduce workload and improve team morale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Hiring vs Attrition Trends</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[
            { month: 'Jan', hired: 8, left: 3 },
            { month: 'Feb', hired: 12, left: 5 },
            { month: 'Mar', hired: 6, left: 4 },
            { month: 'Apr', hired: 15, left: 7 },
            { month: 'May', hired: 10, left: 6 },
            { month: 'Jun', hired: 9, left: 8 },
          ].map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center space-x-1 mb-2" style={{ height: '200px' }}>
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${(data.hired / 15) * 100}%` }}
                  title={`Hired: ${data.hired}`}
                ></div>
                <div
                  className="w-full bg-red-500 rounded-t"
                  style={{ height: `${(data.left / 15) * 100}%` }}
                  title={`Left: ${data.left}`}
                ></div>
              </div>
              <span className="text-xs text-slate-600">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-slate-600">Hired</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-slate-600">Left</span>
          </div>
        </div>
      </div>
    </div>
  );
};
