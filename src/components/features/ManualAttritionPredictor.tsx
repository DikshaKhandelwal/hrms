/**
 * Manual Attrition Prediction
 * Allows recruiters to manually enter employee data for prediction
 */

import { useState } from 'react';
import {
  AlertTriangle, CheckCircle, TrendingUp, Brain, RefreshCw, Sparkles, Zap
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000/api';

interface PredictionResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  contributing_factors: string[];
  recommendations: string;
  ai_explanation?: string;
}

export default function ManualAttritionPredictor() {
  const [formData, setFormData] = useState({
    age: '',
    monthly_income: '',
    total_working_years: '',
    years_at_company: '',
    job_satisfaction: '3',
    work_life_balance: '3',
    environment_satisfaction: '3',
    job_involvement: '3',
    performance_rating: '3',
    overtime: 'No',
    distance_from_home: '',
    num_companies_worked: '',
    years_since_last_promotion: '',
    department: 'Sales',
    job_role: 'Sales Executive'
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = [
    'Sales',
    'Research & Development',
    'Human Resources',
    'Technology',
    'Marketing',
    'Operations',
    'Finance'
  ];

  const jobRoles = [
    'Sales Executive',
    'Sales Representative',
    'Research Scientist',
    'Laboratory Technician',
    'Manufacturing Director',
    'Healthcare Representative',
    'Manager',
    'Research Director',
    'Human Resources',
    'Software Engineer',
    'Data Scientist'
  ];

  const loadSampleData = () => {
    // High risk sample
    setFormData({
      age: '32',
      monthly_income: '4500',
      total_working_years: '10',
      years_at_company: '3',
      job_satisfaction: '2',
      work_life_balance: '2',
      environment_satisfaction: '2',
      job_involvement: '2',
      performance_rating: '3',
      overtime: 'Yes',
      distance_from_home: '25',
      num_companies_worked: '5',
      years_since_last_promotion: '4',
      department: 'Sales',
      job_role: 'Sales Executive'
    });
    setPrediction(null);
    setError('Sample high-risk data loaded. Click "Predict Risk" to analyze.');
  };

  const getAIExplanation = async (predictionData: PredictionResult) => {
    setAiLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/explain-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionData),
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction({ ...predictionData, ai_explanation: data.explanation });
      }
    } catch (err) {
      console.error('AI explanation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const response = await fetch(`${BACKEND_URL}/predict-attrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: 'manual',
          ...formData,
          age: parseInt(formData.age),
          monthly_income: parseFloat(formData.monthly_income),
          total_working_years: parseInt(formData.total_working_years),
          years_at_company: parseInt(formData.years_at_company),
          job_satisfaction: parseInt(formData.job_satisfaction),
          work_life_balance: parseInt(formData.work_life_balance),
          environment_satisfaction: parseInt(formData.environment_satisfaction),
          job_involvement: parseInt(formData.job_involvement),
          performance_rating: parseInt(formData.performance_rating),
          distance_from_home: parseInt(formData.distance_from_home),
          num_companies_worked: parseInt(formData.num_companies_worked),
          years_since_last_promotion: parseInt(formData.years_since_last_promotion)
        }),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      setPrediction(result);
      
      // Get AI explanation
      getAIExplanation(result);
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to generate prediction. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      age: '',
      monthly_income: '',
      total_working_years: '',
      years_at_company: '',
      job_satisfaction: '3',
      work_life_balance: '3',
      environment_satisfaction: '3',
      job_involvement: '3',
      performance_rating: '3',
      overtime: 'No',
      distance_from_home: '',
      num_companies_worked: '',
      years_since_last_promotion: '',
      department: 'Sales',
      job_role: 'Sales Executive'
    });
    setPrediction(null);
    setError('');
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            AI Attrition Risk Prediction
          </h1>
          <p className="text-gray-600 mt-2">
            Enter employee details to predict attrition risk using our trained ML model
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Information
              </h2>
              <button
                type="button"
                onClick={loadSampleData}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 border border-purple-200"
              >
                <Sparkles className="w-4 h-4" />
                Load Sample Data
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Income ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Working Years *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="40"
                    value={formData.total_working_years}
                    onChange={(e) => setFormData({ ...formData, total_working_years: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years at Company *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="40"
                    value={formData.years_at_company}
                    onChange={(e) => setFormData({ ...formData, years_at_company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 3"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Role *
                  </label>
                  <select
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {jobRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Satisfaction Ratings (1-4 scale) */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900">Satisfaction Ratings (1-4 scale)</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Job Satisfaction
                    </label>
                    <select
                      value={formData.job_satisfaction}
                      onChange={(e) => setFormData({ ...formData, job_satisfaction: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 - Very Unsatisfied</option>
                      <option value="2">2 - Unsatisfied</option>
                      <option value="3">3 - Satisfied</option>
                      <option value="4">4 - Very Satisfied</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Work-Life Balance
                    </label>
                    <select
                      value={formData.work_life_balance}
                      onChange={(e) => setFormData({ ...formData, work_life_balance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 - Very Poor</option>
                      <option value="2">2 - Poor</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Excellent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Environment Satisfaction
                    </label>
                    <select
                      value={formData.environment_satisfaction}
                      onChange={(e) => setFormData({ ...formData, environment_satisfaction: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 - Very Unsatisfied</option>
                      <option value="2">2 - Unsatisfied</option>
                      <option value="3">3 - Satisfied</option>
                      <option value="4">4 - Very Satisfied</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Job Involvement
                    </label>
                    <select
                      value={formData.job_involvement}
                      onChange={(e) => setFormData({ ...formData, job_involvement: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 - Very Low</option>
                      <option value="2">2 - Low</option>
                      <option value="3">3 - High</option>
                      <option value="4">4 - Very High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performance Rating
                  </label>
                  <select
                    value={formData.performance_rating}
                    onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Below Average</option>
                    <option value="3">3 - Average</option>
                    <option value="4">4 - Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime
                  </label>
                  <select
                    value={formData.overtime}
                    onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance from Home (km) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.distance_from_home}
                    onChange={(e) => setFormData({ ...formData, distance_from_home: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Companies Worked *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    value={formData.num_companies_worked}
                    onChange={(e) => setFormData({ ...formData, num_companies_worked: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years Since Last Promotion *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="20"
                    value={formData.years_since_last_promotion}
                    onChange={(e) => setFormData({ ...formData, years_since_last_promotion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Predict Risk
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Prediction Results
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {prediction ? (
              <div className="space-y-6">
                {/* Risk Score */}
                <div className={`${getRiskBgColor(prediction.risk_level)} rounded-lg p-6 text-center`}>
                  <div className="flex items-center justify-center mb-2">
                    {prediction.risk_level === 'low' ? (
                      <CheckCircle className={`w-12 h-12 ${getRiskColor(prediction.risk_level)}`} />
                    ) : (
                      <AlertTriangle className={`w-12 h-12 ${getRiskColor(prediction.risk_level)}`} />
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {prediction.risk_score}%
                  </h3>
                  <p className={`text-lg font-semibold uppercase ${getRiskColor(prediction.risk_level)}`}>
                    {prediction.risk_level} RISK
                  </p>
                </div>

                {/* Contributing Factors */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contributing Factors</h3>
                  <ul className="space-y-2">
                    {prediction.contributing_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {prediction.recommendations}
                    </pre>
                  </div>
                </div>

                {/* AI Explanation */}
                {prediction.ai_explanation && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-gray-900">AI Insights</h3>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-md p-4 border border-amber-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {prediction.ai_explanation}
                      </p>
                    </div>
                  </div>
                )}

                {aiLoading && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Generating AI insights...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Fill out the form and click "Predict Risk" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
