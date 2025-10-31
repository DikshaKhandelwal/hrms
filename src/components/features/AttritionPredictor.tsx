/**
 * Attrition & Performance Prediction Dashboard
 * AI/ML-powered predictions for employee retention and performance
 */

import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  RefreshCw, BarChart3, Target, Brain, Zap, Award, AlertCircle
} from 'lucide-react';
import {
  getEmployeeAnalytics,
  predictBoth,
  getHighRiskEmployees,
  getRiskDistribution,
  predictAllEmployees,
  type EmployeeAnalytics,
  type CombinedPrediction
} from '../../lib/predictionService';

export default function AttritionPredictor() {
  const [employees, setEmployees] = useState<EmployeeAnalytics[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [prediction, setPrediction] = useState<CombinedPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [highRiskEmployees, setHighRiskEmployees] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState({ low: 0, medium: 0, high: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, highRisk, distribution] = await Promise.all([
        getEmployeeAnalytics(),
        getHighRiskEmployees(),
        getRiskDistribution()
      ]);
      
      setEmployees(employeesData);
      setHighRiskEmployees(highRisk);
      setRiskDistribution(distribution);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load employee data');
    }
  };

  const handlePredict = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const employee = employees.find(e => e.employee_id === selectedEmployee);
      if (!employee) throw new Error('Employee not found');

      const result = await predictBoth({
        employee_id: employee.employee_id,
        date_of_joining: employee.date_of_joining,
        date_of_birth: employee.date_of_birth,
        department: employee.department,
        job_title: employee.job_title,
        attendance_rate: employee.attendance_rate,
        leave_days: employee.leave_days,
        avg_performance_rating: employee.avg_performance_rating,
        salary: employee.salary,
        work_hours_avg: employee.work_hours_avg,
        overtime_frequency: employee.overtime_frequency,
        sick_leave_ratio: employee.sick_leave_ratio,
      });

      setPrediction(result);
      await loadData(); // Refresh high risk list
    } catch (err) {
      console.error('Error predicting:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPredict = async () => {
    if (!confirm('This will generate predictions for all employees. Continue?')) {
      return;
    }

    setBatchLoading(true);
    setError('');

    try {
      await predictAllEmployees();
      await loadData(); // Refresh all data
      alert('Batch prediction completed successfully!');
    } catch (err) {
      console.error('Error in batch prediction:', err);
      setError('Failed to complete batch prediction');
    } finally {
      setBatchLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'high': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const selectedEmployeeData = employees.find(e => e.employee_id === selectedEmployee);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          <span>AI Predictions</span>
        </h1>
        <p className="text-slate-600 mt-2">Attrition risk and performance predictions powered by machine learning</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Employees</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{employees.length}</p>
            </div>
            <Users className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Low Risk</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{riskDistribution.low}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{riskDistribution.medium}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">High Risk</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{riskDistribution.high}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Prediction Controls */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Generate Prediction</h2>
        
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose an employee --</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} - {emp.job_title} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading || !selectedEmployee}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Predicting...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Predict</span>
              </>
            )}
          </button>

          <button
            onClick={handleBatchPredict}
            disabled={batchLoading}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {batchLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Predict All</span>
              </>
            )}
          </button>
        </div>

        {/* Employee Details */}
        {selectedEmployeeData && (
          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Tenure:</span>
              <span className="ml-2 font-medium text-slate-900">{Math.round(selectedEmployeeData.tenure_months)} months</span>
            </div>
            <div>
              <span className="text-slate-600">Attendance:</span>
              <span className="ml-2 font-medium text-slate-900">{selectedEmployeeData.attendance_rate.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-600">Leave Days:</span>
              <span className="ml-2 font-medium text-slate-900">{selectedEmployeeData.leave_days} days</span>
            </div>
            <div>
              <span className="text-slate-600">Avg Performance:</span>
              <span className="ml-2 font-medium text-slate-900">{selectedEmployeeData.avg_performance_rating.toFixed(1)}/5</span>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attrition Risk */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span>Attrition Risk</span>
              </h3>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getRiskColor(prediction.attrition.risk_level)}`}>
                {prediction.attrition.risk_level.toUpperCase()}
              </span>
            </div>

            {/* Risk Score Gauge */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Risk Score</span>
                <span className="text-2xl font-bold text-slate-900">{prediction.attrition.risk_score}%</span>
              </div>
              <div className="overflow-hidden h-4 text-xs flex rounded-full bg-slate-200">
                <div
                  style={{ width: `${prediction.attrition.risk_score}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    prediction.attrition.risk_score < 30 ? 'bg-green-500' :
                    prediction.attrition.risk_score < 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* Contributing Factors */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Contributing Factors</h4>
              <ul className="space-y-2">
                {prediction.attrition.contributing_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Recommendations</span>
              </h4>
              <p className="text-sm text-indigo-800 whitespace-pre-line">{prediction.attrition.recommendations}</p>
            </div>
          </div>

          {/* Performance Prediction */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Performance Prediction</span>
              </h3>
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {prediction.performance.category}
              </span>
            </div>

            {/* Performance Score */}
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-4 border-purple-200">
                <div>
                  <p className="text-4xl font-bold text-slate-900">{prediction.performance.predicted_performance}</p>
                  <p className="text-sm text-slate-600 font-medium">/5.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Confidence: {prediction.performance.confidence}%
              </p>
            </div>

            {/* Insights */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Insights</span>
              </h4>
              <ul className="space-y-2">
                {prediction.performance.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* High Risk Employees Table */}
      {highRiskEmployees.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>High Risk Employees ({highRiskEmployees.length})</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1">Employees requiring immediate attention</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {highRiskEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-slate-900">{emp.employee?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{emp.employee?.job_title || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {emp.employee?.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden" style={{ minWidth: '100px' }}>
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${emp.risk_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{emp.risk_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(emp.risk_level)}`}>
                        {getRiskIcon(emp.risk_level)}
                        <span>{emp.risk_level.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(emp.last_updated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
