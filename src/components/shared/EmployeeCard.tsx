import React from 'react';
import { Mail, Phone, Calendar, Award, Clock } from 'lucide-react';
import { EmployeeStats } from '../../lib/dashboardService';

interface EmployeeCardProps {
  stats: EmployeeStats;
  onClick?: () => void;
  showDetails?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ stats, onClick, showDetails = false }) => {
  const { employee, attendance, leaves, performance } = stats;

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-6 border border-slate-200 transition ${
        onClick ? 'hover:shadow-md cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {employee.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
            <p className="text-sm text-slate-600">{employee.position || employee.role}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceColor(
            attendance.attendanceRate
          )}`}
        >
          {attendance.attendanceRate}% Attendance
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{attendance.present}</div>
          <div className="text-xs text-slate-600">Present</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{leaves.pending}</div>
          <div className="text-xs text-slate-600">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {performance.lastRating || 'N/A'}
          </div>
          <div className="text-xs text-slate-600">Rating</div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Contact Info */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            {employee.email && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.hire_date && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Joined: {new Date(employee.hire_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Leaves</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {leaves.remainingBalance} days left
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Performance</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {performance.avgRating || 'N/A'} avg
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
