/**
 * Prediction Service
 * Handles AI/ML predictions for attrition risk and performance
 */

import { supabase } from './supabase';

const BACKEND_URL = 'http://localhost:8000/api';

// Types
export interface EmployeeData {
  employee_id: string;
  date_of_joining?: string;
  date_of_birth?: string;
  department?: string;
  job_title?: string;
  attendance_rate?: number;
  leave_days?: number;
  avg_performance_rating?: number;
  salary?: number;
  work_hours_avg?: number;
  overtime_frequency?: number;
  sick_leave_ratio?: number;
}

export interface AttritionPrediction {
  employee_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  contributing_factors: string[];
  recommendations: string;
  prediction_date: string;
}

export interface PerformancePrediction {
  employee_id: string;
  predicted_performance: number;
  confidence: number;
  insights: string[];
  category: string;
  prediction_date: string;
}

export interface CombinedPrediction {
  employee_id: string;
  prediction_date: string;
  attrition: {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    contributing_factors: string[];
    recommendations: string;
  };
  performance: {
    predicted_performance: number;
    confidence: number;
    insights: string[];
    category: string;
  };
}

export interface EmployeeAnalytics {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  date_of_joining: string;
  date_of_birth: string;
  tenure_months: number;
  age: number;
  attendance_rate: number;
  work_hours_avg: number;
  leave_days: number;
  sick_leave_ratio: number;
  avg_performance_rating: number;
  latest_performance_rating: number;
  salary: number;
  overtime_frequency: number;
  current_risk_score?: number;
  current_risk_level?: string;
}

/**
 * Get employee analytics data from database view
 */
export async function getEmployeeAnalytics(employeeId?: string): Promise<EmployeeAnalytics[]> {
  try {
    let query = supabase
      .from('employee_analytics')
      .select('*');
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employee analytics:', error);
    throw error;
  }
}

/**
 * Predict attrition risk for an employee
 */
export async function predictAttrition(employeeData: EmployeeData): Promise<AttritionPrediction> {
  try {
    const response = await fetch(`${BACKEND_URL}/predict-attrition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to predict attrition');
    }
    
    const prediction = await response.json();
    
    // Save to database
    await saveAttritionPrediction(prediction);
    
    return prediction;
  } catch (error) {
    console.error('Error predicting attrition:', error);
    throw error;
  }
}

/**
 * Predict performance for an employee
 */
export async function predictPerformance(employeeData: EmployeeData): Promise<PerformancePrediction> {
  try {
    const response = await fetch(`${BACKEND_URL}/predict-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to predict performance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error predicting performance:', error);
    throw error;
  }
}

/**
 * Get both attrition and performance predictions
 */
export async function predictBoth(employeeData: EmployeeData): Promise<CombinedPrediction> {
  try {
    const response = await fetch(`${BACKEND_URL}/predict-both`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate predictions');
    }
    
    const prediction = await response.json();
    
    // Save attrition prediction to database
    await saveAttritionPrediction({
      employee_id: prediction.employee_id,
      risk_score: prediction.attrition.risk_score,
      risk_level: prediction.attrition.risk_level,
      contributing_factors: prediction.attrition.contributing_factors,
      recommendations: prediction.attrition.recommendations,
      prediction_date: prediction.prediction_date,
    });
    
    return prediction;
  } catch (error) {
    console.error('Error generating predictions:', error);
    throw error;
  }
}

/**
 * Save attrition prediction to database
 */
async function saveAttritionPrediction(prediction: AttritionPrediction): Promise<void> {
  try {
    const { error } = await supabase
      .from('attrition_predictions')
      .upsert({
        employee_id: prediction.employee_id,
        risk_score: prediction.risk_score,
        risk_level: prediction.risk_level,
        contributing_factors: prediction.contributing_factors,
        recommendations: prediction.recommendations,
        prediction_date: prediction.prediction_date,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'employee_id'
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving attrition prediction:', error);
    throw error;
  }
}

/**
 * Get all employees with high attrition risk
 */
export async function getHighRiskEmployees(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('attrition_predictions')
      .select(`
        *,
        employee:profiles!attrition_predictions_employee_id_fkey (
          full_name,
          email,
          job_title,
          department:departments(name)
        )
      `)
      .eq('risk_level', 'high')
      .order('risk_score', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching high risk employees:', error);
    throw error;
  }
}

/**
 * Get prediction history for an employee
 */
export async function getPredictionHistory(employeeId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('attrition_predictions')
      .select('*')
      .eq('employee_id', employeeId)
      .order('prediction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    throw error;
  }
}

/**
 * Predict for all employees (batch prediction)
 */
export async function predictAllEmployees(): Promise<CombinedPrediction[]> {
  try {
    // Get all employee analytics
    const employees = await getEmployeeAnalytics();
    
    const predictions: CombinedPrediction[] = [];
    
    // Predict in batches to avoid overwhelming the backend
    for (const employee of employees) {
      try {
        const employeeData: EmployeeData = {
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
        };
        
        const prediction = await predictBoth(employeeData);
        predictions.push(prediction);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error predicting for employee ${employee.employee_id}:`, error);
      }
    }
    
    return predictions;
  } catch (error) {
    console.error('Error in batch prediction:', error);
    throw error;
  }
}

/**
 * Get risk distribution statistics
 */
export async function getRiskDistribution(): Promise<{ low: number; medium: number; high: number }> {
  try {
    const { data, error } = await supabase
      .from('attrition_predictions')
      .select('risk_level');
    
    if (error) throw error;
    
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
    };
    
    data?.forEach(item => {
      distribution[item.risk_level as keyof typeof distribution]++;
    });
    
    return distribution;
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    throw error;
  }
}
