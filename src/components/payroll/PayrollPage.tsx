/**
 * Payroll Management Page
 * View and manage employee payroll records
 */

import { useState, useEffect } from 'react';
import {
  DollarSign, Calendar, Users, TrendingUp, Download, 
  Filter, Search, CheckCircle, Clock, XCircle, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  payment_status: 'pending' | 'processed' | 'failed';
  tax_deducted: number;
  reimbursements: number;
  employee_name?: string;
  department?: string;
  job_title?: string;
}

interface PayrollStats {
  totalPayroll: number;
  avgSalary: number;
  totalEmployees: number;
  pendingPayments: number;
}

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({
    totalPayroll: 0,
    avgSalary: 0,
    totalEmployees: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadPayrollData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    filterRecords();
  }, [payrollRecords, searchTerm, selectedStatus]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      
      // Fetch payroll records
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('payment_date', { ascending: false });

      if (payrollError) {
        console.error('Error fetching payroll:', payrollError);
        throw payrollError;
      }

      console.log('Fetched payroll records:', payroll?.length || 0);

      if (!payroll || payroll.length === 0) {
        setPayrollRecords([]);
        setStats({
          totalPayroll: 0,
          avgSalary: 0,
          totalEmployees: 0,
          pendingPayments: 0
        });
        setLoading(false);
        return;
      }

      // Get unique employee IDs
      const employeeIds = [...new Set(payroll.map(p => p.employee_id))];
      
      // Fetch employee details
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department_id')
        .in('id', employeeIds);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
      }

      // Fetch departments
      const departmentIds = [...new Set((employees || []).map(e => e.department_id).filter(Boolean))];
      const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      // Create lookup maps
      const employeeMap = new Map(
        (employees || []).map(e => [e.id, e])
      );
      const departmentMap = new Map(
        (departments || []).map(d => [d.id, d.name])
      );

      // Format data with employee details
      const formattedRecords = payroll.map(record => {
        const employee = employeeMap.get(record.employee_id);
        return {
          ...record,
          employee_name: employee?.full_name || 'Unknown Employee',
          department: employee?.department_id ? departmentMap.get(employee.department_id) || 'N/A' : 'N/A',
          job_title: employee?.job_title || 'N/A'
        };
      });

      setPayrollRecords(formattedRecords);

      // Calculate stats
      const total = formattedRecords.reduce((sum, r) => sum + (Number(r.net_salary) || 0), 0);
      const pending = formattedRecords.filter(r => r.payment_status === 'pending').length;
      
      setStats({
        totalPayroll: total,
        avgSalary: formattedRecords.length > 0 ? total / formattedRecords.length : 0,
        totalEmployees: formattedRecords.length,
        pendingPayments: pending
      });
    } catch (error) {
      console.error('Error loading payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...payrollRecords];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.employee_name?.toLowerCase().includes(term) ||
        record.job_title?.toLowerCase().includes(term) ||
        record.department?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.payment_status === selectedStatus);
    }

    setFilteredRecords(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Job Title', 'Department', 'Basic Salary', 'Allowances', 'Deductions', 'Tax', 'Net Salary', 'Status'];
    const rows = filteredRecords.map(record => [
      record.employee_name,
      record.job_title,
      record.department,
      record.basic_salary,
      record.allowances,
      record.deductions,
      record.tax_deducted,
      record.net_salary,
      record.payment_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${months[selectedMonth - 1]}_${selectedYear}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-indigo-600" />
            Payroll Management
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage employee salary records
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalPayroll)}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.avgSalary)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalEmployees}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.pendingPayments}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search employee, job title, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Month */}
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {payrollRecords.length} records
            </p>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.job_title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {record.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.basic_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{formatCurrency(record.allowances)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(record.deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(record.tax_deducted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(record.net_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.payment_status)}`}>
                        {getStatusIcon(record.payment_status)}
                        {record.payment_status.charAt(0).toUpperCase() + record.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll records</h3>
              <p className="mt-1 text-sm text-gray-500">
                No payroll records found for the selected filters.
              </p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Payroll Details
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {months[selectedRecord.month - 1]} {selectedRecord.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Employee Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.employee_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Job Title</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.job_title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedRecord.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Salary Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Basic Salary</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedRecord.basic_salary)}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Allowances</span>
                        <span className="text-sm font-medium">
                          +{formatCurrency(selectedRecord.allowances)}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Reimbursements</span>
                        <span className="text-sm font-medium">
                          +{formatCurrency(selectedRecord.reimbursements)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="text-sm">Deductions</span>
                        <span className="text-sm font-medium">
                          -{formatCurrency(selectedRecord.deductions)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="text-sm">Tax Deducted</span>
                        <span className="text-sm font-medium">
                          -{formatCurrency(selectedRecord.tax_deducted)}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-base font-semibold text-gray-900">Net Salary</span>
                          <span className="text-base font-bold text-indigo-600">
                            {formatCurrency(selectedRecord.net_salary)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.payment_status)}`}>
                      {getStatusIcon(selectedRecord.payment_status)}
                      {selectedRecord.payment_status.charAt(0).toUpperCase() + selectedRecord.payment_status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
