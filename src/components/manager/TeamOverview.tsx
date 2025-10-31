import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { getTeamStats, EmployeeStats } from '../../lib/dashboardService';
import { EmployeeCard } from '../shared/EmployeeCard';
import { useAuth } from '../../contexts/AuthContext';

export const TeamOverview: React.FC = () => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'on-leave' | 'low-attendance'>('all');

  useEffect(() => {
    if (profile?.department_id) {
      loadTeam();
    }
  }, [profile]);

  const loadTeam = async () => {
    if (!profile?.department_id) return;
    
    try {
      const data = await getTeamStats(profile.department_id);
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(emp => {
    switch (filter) {
      case 'active':
        return emp.attendance.attendanceRate >= 90;
      case 'on-leave':
        return emp.leaves.pending > 0 || emp.attendance.onLeave > 0;
      case 'low-attendance':
        return emp.attendance.attendanceRate < 75;
      default:
        return true;
    }
  });

  // Calculate summary stats
  const totalMembers = teamMembers.length;
  const avgAttendance = teamMembers.length
    ? Math.round(
        teamMembers.reduce((sum, e) => sum + e.attendance.attendanceRate, 0) / teamMembers.length
      )
    : 0;
  const activeMembers = teamMembers.filter(e => e.attendance.attendanceRate >= 90).length;
  const pendingLeaves = teamMembers.reduce((sum, e) => sum + e.leaves.pending, 0);

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
        <h1 className="text-2xl font-bold text-slate-900">My Team Overview</h1>
        <p className="text-slate-600 mt-1">Monitor your team's attendance, leaves, and performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Team Members</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Attendance</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{avgAttendance}%</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Members</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{activeMembers}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{pendingLeaves}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Members ({totalMembers})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'active'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active ({activeMembers})
          </button>
          <button
            onClick={() => setFilter('on-leave')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'on-leave'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            On Leave
          </button>
          <button
            onClick={() => setFilter('low-attendance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'low-attendance'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Needs Attention
          </button>
        </div>
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No team members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((empStats) => (
            <EmployeeCard key={empStats.employee.id} stats={empStats} showDetails />
          ))}
        </div>
      )}
    </div>
  );
};
