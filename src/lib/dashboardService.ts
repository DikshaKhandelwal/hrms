/**
 * Centralized Dashboard Data Service
 * Provides role-based data access for Admin, Manager, and Employee dashboards
 */

import { supabase } from './supabase';

export interface EmployeeData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string | null;
  position: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  hire_date: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day';
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_date: string;
  rating: number;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals: string | null;
  status: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  status: string;
  created_at: string;
}

export interface EmployeeStats {
  employee: EmployeeData;
  attendance: {
    present: number;
    absent: number;
    onLeave: number;
    totalDays: number;
    attendanceRate: number;
  };
  leaves: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    remainingBalance: number;
  };
  performance: {
    lastRating: number | null;
    avgRating: number | null;
    totalReviews: number;
  };
  payroll: {
    lastPayment: number | null;
    nextPaymentDate: string | null;
    ytdEarnings: number;
  };
}

/**
 * Get all employees (Admin only)
 */
export async function getAllEmployees(): Promise<EmployeeData[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get employees by department (Manager/Admin)
 */
export async function getEmployeesByDepartment(departmentId: string): Promise<EmployeeData[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('department_id', departmentId)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching department employees:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get employee by ID with full details
 */
export async function getEmployeeById(employeeId: string): Promise<EmployeeData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data;
}

/**
 * Get attendance records for an employee
 */
export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get attendance for all employees (Admin/Manager)
 */
export async function getAllAttendance(
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all attendance:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get leave requests for an employee
 */
export async function getEmployeeLeaves(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leaves:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all pending leave requests (Manager/Admin)
 */
export async function getPendingLeaves(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending leaves:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all leave requests (Admin)
 */
export async function getAllLeaves(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all leaves:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get performance reviews for an employee
 */
export async function getEmployeePerformance(employeeId: string): Promise<PerformanceReview[]> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*')
    .eq('employee_id', employeeId)
    .order('review_date', { ascending: false });

  if (error) {
    console.error('Error fetching performance reviews:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get payroll records for an employee
 */
export async function getEmployeePayroll(employeeId: string): Promise<PayrollRecord[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching payroll:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get comprehensive stats for an employee
 */
export async function getEmployeeStats(employeeId: string): Promise<EmployeeStats | null> {
  try {
    // Fetch employee data
    const employee = await getEmployeeById(employeeId);
    if (!employee) return null;

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;

    // Fetch all data in parallel
    const [attendanceData, leaveData, performanceData, payrollData] = await Promise.all([
      getEmployeeAttendance(employeeId, firstDayOfMonth),
      getEmployeeLeaves(employeeId),
      getEmployeePerformance(employeeId),
      getEmployeePayroll(employeeId),
    ]);

    // Calculate attendance stats
    const presentCount = attendanceData.filter(a => a.status === 'present').length;
    const absentCount = attendanceData.filter(a => a.status === 'absent').length;
    const onLeaveCount = attendanceData.filter(a => a.status === 'leave').length;
    const totalDays = attendanceData.length || 1;
    const attendanceRate = (presentCount / totalDays) * 100;

    // Calculate leave stats
    const approvedLeaves = leaveData.filter(l => l.status === 'approved');
    const usedLeaveDays = approvedLeaves.reduce((sum, l) => sum + l.total_days, 0);
    const totalLeaveBalance = 20; // Standard annual leave
    const pendingLeaves = leaveData.filter(l => l.status === 'pending').length;
    const rejectedLeaves = leaveData.filter(l => l.status === 'rejected').length;

    // Calculate performance stats
    const completedReviews = performanceData.filter(r => r.status === 'completed');
    const avgRating = completedReviews.length
      ? completedReviews.reduce((sum, r) => sum + r.rating, 0) / completedReviews.length
      : null;
    const lastRating = completedReviews.length > 0 ? completedReviews[0].rating : null;

    // Calculate payroll stats
    const ytdPayroll = payrollData
      .filter(p => p.year === currentYear)
      .reduce((sum, p) => sum + p.net_salary, 0);
    const lastPayment = payrollData.length > 0 ? payrollData[0].net_salary : null;
    const nextPaymentDate = payrollData.length > 0 ? payrollData[0].payment_date : null;

    return {
      employee,
      attendance: {
        present: presentCount,
        absent: absentCount,
        onLeave: onLeaveCount,
        totalDays,
        attendanceRate: Math.round(attendanceRate),
      },
      leaves: {
        total: leaveData.length,
        approved: approvedLeaves.length,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
        remainingBalance: totalLeaveBalance - usedLeaveDays,
      },
      performance: {
        lastRating,
        avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
        totalReviews: completedReviews.length,
      },
      payroll: {
        lastPayment,
        nextPaymentDate,
        ytdEarnings: ytdPayroll,
      },
    };
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    return null;
  }
}

/**
 * Get stats for all employees (Admin dashboard)
 */
export async function getAllEmployeeStats(): Promise<EmployeeStats[]> {
  const employees = await getAllEmployees();
  const stats = await Promise.all(
    employees.map(emp => getEmployeeStats(emp.id))
  );
  return stats.filter((s): s is EmployeeStats => s !== null);
}

/**
 * Get stats for team members (Manager dashboard)
 */
export async function getTeamStats(departmentId: string): Promise<EmployeeStats[]> {
  const employees = await getEmployeesByDepartment(departmentId);
  const stats = await Promise.all(
    employees.map(emp => getEmployeeStats(emp.id))
  );
  return stats.filter((s): s is EmployeeStats => s !== null);
}

/**
 * Approve leave request
 */
export async function approveLeaveRequest(
  leaveId: string,
  approverId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      approved_by: approverId,
      approval_date: new Date().toISOString(),
    })
    .eq('id', leaveId);

  if (error) {
    console.error('Error approving leave:', error);
    return false;
  }

  return true;
}

/**
 * Reject leave request
 */
export async function rejectLeaveRequest(
  leaveId: string,
  approverId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      approved_by: approverId,
      approval_date: new Date().toISOString(),
    })
    .eq('id', leaveId);

  if (error) {
    console.error('Error rejecting leave:', error);
    return false;
  }

  return true;
}
