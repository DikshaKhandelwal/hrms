import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  applied_date: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

interface LeaveStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const RecruiterLeaveView: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadLeaveRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching leave requests');

      // Fetch leave requests with employee details
      // Note: Specify the foreign key explicitly because leave_requests has multiple FKs to profiles
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          leave_type,
          start_date,
          end_date,
          total_days,
          status,
          reason,
          applied_date,
          employee:profiles!leave_requests_employee_id_fkey (
            full_name,
            email,
            role
          )
        `)
        .order('applied_date', { ascending: false });

      if (leaveError) {
        console.error('❌ Leave requests fetch error:', leaveError);
        console.error('❌ Error code:', leaveError.code);
        console.error('❌ Error message:', leaveError.message);
        console.error('❌ Error details:', JSON.stringify(leaveError, null, 2));
        throw new Error(`Failed to fetch leave requests: ${leaveError.message}`);
      }

      console.log('✅ Leave requests fetched:', leaveData?.length || 0, 'records');
      console.log('📊 Raw leave data:', JSON.stringify(leaveData, null, 2));
      
      // If there's no data, it's not an error - just empty
      if (!leaveData || leaveData.length === 0) {
        console.log('ℹ️ No leave requests found in database');
        setRequests([]);
        setStats({
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        });
        setLoading(false);
        return;
      }
      
      // Transform the data to match our interface
      const transformedData = (leaveData || []).map(record => {
        let profileData = null;
        if (record.employee) {
          profileData = Array.isArray(record.employee) && record.employee.length > 0 
            ? record.employee[0] 
            : (Array.isArray(record.employee) ? null : record.employee);
        }
        return {
          ...record,
          profiles: profileData
        };
      });
      
      setRequests(transformedData as LeaveRequest[]);

      // Calculate stats
      const totalCount = transformedData.length;
      const pendingCount = transformedData.filter(r => r.status === 'pending').length;
      const approvedCount = transformedData.filter(r => r.status === 'approved').length;
      const rejectedCount = transformedData.filter(r => r.status === 'rejected').length;

      setStats({
        totalRequests: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });

    } catch (err: unknown) {
      console.error('❌ Failed to load leave requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaveRequests();

    // Listen for real-time updates
    const channel = supabase
      .channel('recruiter-leaves')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          console.log('🔄 Real-time leave request update:', payload);
          loadLeaveRequests();
        }
      )
      .subscribe();

    // Listen for custom events
    const handleUpdate = () => {
      console.log('🔄 Leave request updated event received');
      loadLeaveRequests();
    };
    window.addEventListener('leave-request-updated', handleUpdate);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('leave-request-updated', handleUpdate);
    };
  }, [loadLeaveRequests]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Leave Requests</h2>
          <p className="text-slate-500 mt-1">Monitor and track employee leave requests</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All ({stats.totalRequests})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Leave Requests</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadLeaveRequests}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Total Requests</h3>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalRequests}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Pending</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Approved</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Rejected</h3>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Leave Requests ({filteredRequests.length})
          </h3>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No leave requests found</p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'all' 
                ? 'No leave requests have been submitted yet' 
                : `No ${filter} leave requests`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {request.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">
                            {request.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500">{request.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 capitalize">
                        {request.leave_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(request.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(request.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {request.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterLeaveView;
