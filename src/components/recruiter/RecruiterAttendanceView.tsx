import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  employee_id: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  attendanceRate: number;
}

export const RecruiterAttendanceView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching attendance for date:', selectedDate);

      // Fetch attendance records with employee details
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          check_in,
          check_out,
          employee_id,
          profiles (
            full_name,
            email,
            role
          )
        `)
        .eq('date', selectedDate)
        .order('check_in', { ascending: false });

      if (attendanceError) {
        console.error('❌ Attendance fetch error:', attendanceError);
        throw attendanceError;
      }

      console.log('✅ Attendance data fetched:', attendanceData?.length || 0, 'records');
      console.log('📊 Raw attendance data:', JSON.stringify(attendanceData, null, 2));
      
      // Transform the data to match our interface - handle both array and object forms
      const transformedData = (attendanceData || []).map(record => {
        let profileData = null;
        if (record.profiles) {
          profileData = Array.isArray(record.profiles) && record.profiles.length > 0 
            ? record.profiles[0] 
            : (Array.isArray(record.profiles) ? null : record.profiles);
        }
        return {
          ...record,
          profiles: profileData
        };
      });
      
      setRecords(transformedData as AttendanceRecord[]);

      // Fetch total employees count (only actual employees who mark attendance)
      const { count: totalCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'employee'); // Only count employees who mark attendance

      if (countError) {
        console.error('❌ Employee count error:', countError);
        console.error('❌ Count error details:', JSON.stringify(countError, null, 2));
        throw countError;
      }

      console.log('✅ Total employees:', totalCount);
      
      // Also fetch actual employee list for debugging
      const { data: employeeList, error: listError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'employee');
      
      if (!listError) {
        console.log('✅ Employee list:', employeeList);
      }

      // Calculate stats
      const presentCount = attendanceData?.filter(r => r.status === 'present').length || 0;
      const absentCount = attendanceData?.filter(r => r.status === 'absent').length || 0;
      const leaveCount = attendanceData?.filter(r => r.status === 'leave').length || 0;
      const attendanceRate = totalCount ? ((presentCount / totalCount) * 100) : 0;

      setStats({
        totalEmployees: totalCount || 0,
        presentToday: presentCount,
        absentToday: absentCount,
        onLeave: leaveCount,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      });

    } catch (err: unknown) {
      console.error('❌ Failed to load attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAttendance();

    // Listen for real-time updates
    const channel = supabase
      .channel('recruiter-attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('🔄 Real-time attendance update:', payload);
          loadAttendance();
        }
      )
      .subscribe();

    // Listen for custom events from other components
    const handleUpdate = () => {
      console.log('🔄 Attendance updated event received');
      loadAttendance();
    };
    window.addEventListener('attendance-updated', handleUpdate);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('attendance-updated', handleUpdate);
    };
  }, [loadAttendance]);

  const getStatusBadge = (status: string) => {
    const styles = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      leave: 'bg-amber-100 text-amber-800',
      half_day: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '—';
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

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
          <h2 className="text-3xl font-bold text-slate-900">Attendance Overview</h2>
          <p className="text-slate-500 mt-1">Monitor employee attendance across the organization</p>
        </div>
        
        {/* Date Picker */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Today
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Attendance</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadAttendance}
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
            <h3 className="text-slate-600 text-sm font-medium">Total Employees</h3>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalEmployees}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Present Today</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.attendanceRate}% attendance rate
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">On Leave</h3>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.onLeave}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600 text-sm font-medium">Absent</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Attendance Records ({records.length})
          </h3>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No attendance records for this date</p>
            <p className="text-sm text-slate-400 mt-1">
              Employees haven't marked attendance yet
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Check-out
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {record.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">
                            {record.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500">{record.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 capitalize">
                        {record.profiles?.role?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          record.status
                        )}`}
                      >
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatTime(record.check_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatTime(record.check_out)}
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

export default RecruiterAttendanceView;
