import React, { useEffect, useState } from 'react';
import { Clock, Check, X, Calendar, User } from 'lucide-react';
import {
  getPendingLeaves,
  getAllLeaves,
  approveLeaveRequest,
  rejectLeaveRequest,
  LeaveRequest,
  getEmployeeById,
  EmployeeData,
} from '../../lib/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveWithEmployee extends LeaveRequest {
  employeeData?: EmployeeData | null;
}

export const LeaveApprovalDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadLeaves();
  }, [filter]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = filter === 'pending' ? await getPendingLeaves() : await getAllLeaves();
      
      // Fetch employee data for each leave request
      const leavesWithEmployees = await Promise.all(
        data.map(async (leave) => {
          const employeeData = await getEmployeeById(leave.employee_id);
          return { ...leave, employeeData };
        })
      );

      setLeaves(leavesWithEmployees);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    if (!profile?.id) return;
    
    setProcessing(leaveId);
    try {
      const success = await approveLeaveRequest(leaveId, profile.id);
      if (success) {
        // Refresh the list
        await loadLeaves();
      }
    } catch (error) {
      console.error('Error approving leave:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!profile?.id) return;
    
    setProcessing(leaveId);
    try {
      const success = await rejectLeaveRequest(leaveId, profile.id);
      if (success) {
        // Refresh the list
        await loadLeaves();
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getDuration = (startDate: string, endDate: string, totalDays: number) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end} (${totalDays} day${totalDays > 1 ? 's' : ''})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-slate-600 mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Approved This Month</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {leaves.filter(l => l.status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected This Month</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {leaves.filter(l => l.status === 'rejected').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Requests ({leaves.length})
          </button>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {leaves.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No leave requests found</p>
          </div>
        ) : (
          leaves.map((leave) => (
            <div
              key={leave.id}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Employee Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {leave.employeeData?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {leave.employeeData?.full_name || 'Unknown Employee'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {leave.employeeData?.position || leave.employeeData?.role || 'Employee'}
                      </p>
                    </div>
                  </div>

                  {/* Leave Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{getDuration(leave.start_date, leave.end_date, leave.total_days)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{leave.leave_type}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="p-4 bg-slate-50 rounded-lg mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Reason:</p>
                    <p className="text-sm text-slate-600">{leave.reason}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        leave.status
                      )}`}
                    >
                      {leave.status.toUpperCase()}
                    </span>
                    {leave.approval_date && (
                      <span className="text-xs text-slate-500">
                        {leave.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                        {new Date(leave.approval_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {leave.status === 'pending' && (
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      disabled={processing === leave.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-slate-300 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      disabled={processing === leave.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-slate-300 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
