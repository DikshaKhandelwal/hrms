import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, DollarSign, TrendingUp, FileText, Clock, Award } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRealtime } from '../../hooks/useRealtime';

export const EmployeeDashboard: React.FC<{ onViewChange?: (view: string) => void }> = ({ onViewChange }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    attendanceRate: 0,
    nextPayrollDate: '',
    leaveBalance: 0,
    lastPerformanceRating: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadEmployeeData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [attendanceRes, payrollRes, leaveRes, reviewRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('status')
          .eq('employee_id', profile.id)
          .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`),
        supabase
          .from('payroll')
          .select('payment_date')
          .eq('employee_id', profile.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle(),
        supabase
          .from('leave_requests')
          .select('total_days')
          .eq('employee_id', profile.id)
          .eq('status', 'approved'),
        supabase
          .from('performance_reviews')
          .select('rating')
          .eq('employee_id', profile.id)
          .order('review_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const presentDays = attendanceRes.data?.filter((a: any) => a.status === 'present').length || 0;
      const totalDays = attendanceRes.data?.length || 1;
      const attendanceRate = (presentDays / totalDays) * 100;

      const usedLeave = leaveRes.data?.reduce((sum: number, l: any) => sum + l.total_days, 0) || 0;
      const totalLeave = 20;

      setStats({
        attendanceRate: Math.round(attendanceRate),
        nextPayrollDate: payrollRes.data?.payment_date || 'Not scheduled',
        leaveBalance: totalLeave - usedLeave,
        lastPerformanceRating: reviewRes.data?.rating || 0,
      });
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  // listen for updates triggered by other pages (attendance/leave requests)
  useEffect(() => {
    const handler = () => loadEmployeeData();
    window.addEventListener('attendance-updated', handler as EventListener);
    window.addEventListener('leave-request-updated', handler as EventListener);
    return () => {
      window.removeEventListener('attendance-updated', handler as EventListener);
      window.removeEventListener('leave-request-updated', handler as EventListener);
    };
  }, [loadEmployeeData]);

  // Also subscribe to database-level realtime events so changes from other
  // browser sessions trigger a reload (keeps the dashboard in sync).
  useRealtime(
    () => loadEmployeeData(),
    () => loadEmployeeData()
  );

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
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.full_name}!</h1>
        <p className="text-slate-600 mt-1">Here's your personal dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Attendance This Month"
          value={`${stats.attendanceRate}%`}
          icon={Calendar}
          trend={{ value: '5% from last month', isPositive: true }}
          iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Leave Balance"
          value={`${stats.leaveBalance} days`}
          icon={Clock}
          iconColor="bg-green-50 text-green-600"
        />
        <StatCard
          title="Last Performance Rating"
          value={stats.lastPerformanceRating || 'N/A'}
          icon={Award}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Next Payroll"
          value={stats.nextPayrollDate === 'Not scheduled' ? 'N/A' : new Date(stats.nextPayrollDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          icon={DollarSign}
          iconColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => {
              // If an external attendance portal is configured, open it in a new tab;
              // otherwise navigate to the app's attendance view.
              const portal = import.meta.env.VITE_ATTENDANCE_PORTAL_URL;
              if (portal) {
                window.open(portal, '_blank');
              } else {
                onViewChange?.('attendance');
              }
            }} className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-left">
              <Calendar className="w-8 h-8 text-slate-900 mb-3" />
              <p className="font-semibold text-slate-900 mb-1">Mark Attendance</p>
              <p className="text-xs text-slate-600">Check in for today</p>
            </button>

            <button onClick={() => onViewChange?.('leaves')} className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-left">
              <FileText className="w-8 h-8 text-slate-900 mb-3" />
              <p className="font-semibold text-slate-900 mb-1">Request Leave</p>
              <p className="text-xs text-slate-600">Submit leave application</p>
            </button>

            <button className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-left">
              <DollarSign className="w-8 h-8 text-slate-900 mb-3" />
              <p className="font-semibold text-slate-900 mb-1">View Payslips</p>
              <p className="text-xs text-slate-600">Download salary slips</p>
            </button>

            <button className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-left">
              <TrendingUp className="w-8 h-8 text-slate-900 mb-3" />
              <p className="font-semibold text-slate-900 mb-1">Performance</p>
              <p className="text-xs text-slate-600">View reviews & goals</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Tasks</h3>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900">Complete Q2 Goals</p>
              <p className="text-xs text-amber-700 mt-1">Due: Jun 30, 2025</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Submit Timesheet</p>
              <p className="text-xs text-blue-700 mt-1">Due: Weekly</p>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Training: React Advanced</p>
              <p className="text-xs text-green-700 mt-1">Scheduled: Tomorrow</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700">Present</span>
              <span className="text-sm font-semibold text-green-600">18 days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700">On Leave</span>
              <span className="text-sm font-semibold text-blue-600">2 days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700">Absent</span>
              <span className="text-sm font-semibold text-red-600">0 days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700">Total Work Hours</span>
              <span className="text-sm font-semibold text-slate-900">144 hrs</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Career Growth Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Skill Development</p>
                  <p className="text-xs text-blue-700 mt-1">
                    You're 75% complete with TypeScript certification. Keep going!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Performance Trend</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your ratings have improved by 20% this year. Excellent progress!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
