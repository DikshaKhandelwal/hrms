import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { getAllEmployeeStats, EmployeeStats } from '../../lib/dashboardService';
import { EmployeeCard } from '../shared/EmployeeCard';

export const EmployeeOverview: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'on-leave' | 'low-attendance'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getAllEmployeeStats();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = emp.employee.full_name?.toLowerCase().includes(query);
      const matchesEmail = emp.employee.email?.toLowerCase().includes(query);
      const matchesRole = emp.employee.role?.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail && !matchesRole) return false;
    }

    // Status filter
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
  const totalEmployees = employees.length;
  const avgAttendance = employees.length
    ? Math.round(
        employees.reduce((sum, e) => sum + e.attendance.attendanceRate, 0) / employees.length
      )
    : 0;
  const activeEmployees = employees.filter(e => e.attendance.attendanceRate >= 90).length;
  const pendingLeaves = employees.reduce((sum, e) => sum + e.leaves.pending, 0);

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
        <h1 className="text-2xl font-bold text-slate-900">Employee Overview</h1>
        <p className="text-slate-600 mt-1">Monitor all employee attendance, leaves, and performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Employees</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalEmployees}</p>
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
              <p className="text-sm font-medium text-slate-600">Active Workers</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{activeEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Leaves</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Employees ({totalEmployees})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'active'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Active ({activeEmployees})
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
              Low Attendance
            </button>
          </div>

          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No employees found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((empStats) => (
            <EmployeeCard key={empStats.employee.id} stats={empStats} showDetails />
          ))}
        </div>
      )}
    </div>
  );
};
