"""
ML Model Adapter
Bridges HRMS database schema with trained ML model features
"""

import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
from pathlib import Path
from typing import Dict

class MLModelAdapter:
    """
    Adapts HRMS employee data to trained ML model format
    """
    
    def __init__(self, model_dir='ml_models/saved_models'):
        self.model_dir = model_dir
        self.model = None
        self.preprocessor = None
        
        # Load trained model and preprocessor
        self.load_model()
    
    def load_model(self):
        """Load trained ML model and preprocessor"""
        try:
            model_path = os.path.join(self.model_dir, 'attrition_model.pkl')
            preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print(f"✓ Loaded ML model from {model_path}")
            
            if os.path.exists(preprocessor_path):
                self.preprocessor = joblib.load(preprocessor_path)
                print(f"✓ Loaded preprocessor (features: {len(self.preprocessor['feature_names'])})")
            
            return self.model is not None
        except Exception as e:
            print(f"Warning: Could not load ML model: {e}")
            return False
    
    def map_hrms_to_ml_features(self, employee_data: Dict) -> pd.DataFrame:
        """
        Map HRMS employee data to ML model features
        
        Args:
            employee_data: Data from HRMS database (employee_analytics view)
            
        Returns:
            DataFrame with features expected by ML model
        """
        # Create base dataframe with default values from HR dataset averages
        df = pd.DataFrame([{
            'Age': int(employee_data.get('age', 35)),
            'BusinessTravel': 'Travel_Rarely',  # Default
            'DailyRate': 800,  # Average
            'Department': employee_data.get('department', 'Research & Development'),
            'DistanceFromHome': 10,  # Average
            'Education': 3,  # Bachelor's
            'EducationField': 'Life Sciences',  # Most common
            'EnvironmentSatisfaction': 3,  # Average
            'Gender': 'Male',  # Will be encoded
            'HourlyRate': 65,  # Average
            'JobInvolvement': 3,  # Average
            'JobLevel': 2,  # Mid-level
            'JobRole': employee_data.get('job_title', 'Sales Executive'),
            'JobSatisfaction': 3,  # Average
            'MaritalStatus': 'Married',  # Most common
            'MonthlyIncome': float(employee_data.get('salary', 6500)),
            'MonthlyRate': float(employee_data.get('salary', 6500) * 3.5),
            'NumCompaniesWorked': 2,  # Average
            'OverTime': 'Yes' if employee_data.get('overtime_frequency', 0) > 5 else 'No',
            'PercentSalaryHike': 15,  # Average
            'PerformanceRating': int(employee_data.get('avg_performance_rating', 3)),
            'RelationshipSatisfaction': 3,  # Average
            'StockOptionLevel': 1,  # Average
            'TotalWorkingYears': int(employee_data.get('tenure_months', 12) / 12),
            'TrainingTimesLastYear': 2,  # Average
            'WorkLifeBalance': 3,  # Average
            'YearsAtCompany': int(employee_data.get('tenure_months', 12) / 12),
            'YearsInCurrentRole': int(employee_data.get('tenure_months', 12) / 12 * 0.7),
            'YearsSinceLastPromotion': int(employee_data.get('tenure_months', 12) / 12 * 0.4),
            'YearsWithCurrManager': int(employee_data.get('tenure_months', 12) / 12 * 0.5),
        }])
        
        # Map HRMS data more accurately where available
        if 'work_hours_avg' in employee_data:
            df['HourlyRate'] = int(employee_data['salary'] / (employee_data['work_hours_avg'] * 22))
        
        if 'leave_days' in employee_data:
            # More leave days = lower satisfaction
            if employee_data['leave_days'] > 20:
                df['JobSatisfaction'] = 2
                df['WorkLifeBalance'] = 2
            elif employee_data['leave_days'] < 5:
                df['JobSatisfaction'] = 4
                df['WorkLifeBalance'] = 4
        
        if 'attendance_rate' in employee_data:
            # Poor attendance = lower satisfaction
            if employee_data['attendance_rate'] < 85:
                df['EnvironmentSatisfaction'] = 2
                df['JobSatisfaction'] = 2
            elif employee_data['attendance_rate'] > 95:
                df['EnvironmentSatisfaction'] = 4
                df['JobSatisfaction'] = 4
        
        # Adjust based on performance
        if 'avg_performance_rating' in employee_data:
            perf = employee_data['avg_performance_rating']
            df['PerformanceRating'] = int(min(4, max(1, perf + 1)))  # Scale 1-5 to 1-4
            df['JobInvolvement'] = int(min(4, max(1, perf)))
        
        # Adjust tenure-related fields
        tenure_years = employee_data.get('tenure_months', 12) / 12
        df['YearsAtCompany'] = int(tenure_years)
        df['TotalWorkingYears'] = int(tenure_years * 1.5)  # Assume 50% more total experience
        df['YearsInCurrentRole'] = max(0, int(tenure_years * 0.6))
        df['YearsSinceLastPromotion'] = max(0, int(tenure_years * 0.4))
        df['YearsWithCurrManager'] = max(0, int(tenure_years * 0.5))
        
        # Adjust NumCompaniesWorked based on tenure
        if tenure_years < 2:
            df['NumCompaniesWorked'] = 1
        elif tenure_years < 5:
            df['NumCompaniesWorked'] = 2
        else:
            df['NumCompaniesWorked'] = int(tenure_years / 3)
        
        return df
    
    def predict_attrition(self, employee_data: Dict) -> Dict:
        """
        Predict attrition risk using trained ML model
        
        Args:
            employee_data: HRMS employee data
            
        Returns:
            Prediction results with risk score, level, factors, recommendations
        """
        if not self.model or not self.preprocessor:
            return self._fallback_prediction(employee_data)
        
        try:
            # Map HRMS data to ML features
            ml_df = self.map_hrms_to_ml_features(employee_data)
            
            # Transform using preprocessor
            # The preprocessor expects the same preprocessing pipeline
            from train_models_enhanced import EnhancedPreprocessor
            prep = EnhancedPreprocessor()
            prep.label_encoders = self.preprocessor['label_encoders']
            prep.scaler = self.preprocessor['scaler']
            prep.feature_names = self.preprocessor['feature_names']
            
            # Add target column temporarily (will be dropped)
            ml_df['Attrition'] = 'No'
            
            # Transform
            X = prep.transform_new_data(ml_df)
            
            # Predict
            attrition_prob = self.model.predict_proba(X)[0][1] * 100
            
            # Determine risk level
            if attrition_prob < 30:
                risk_level = 'low'
            elif attrition_prob < 60:
                risk_level = 'medium'
            else:
                risk_level = 'high'
            
            # Identify contributing factors
            contributing_factors = self._identify_factors(employee_data, attrition_prob)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_level, contributing_factors)
            
            return {
                'risk_score': round(attrition_prob, 2),
                'risk_level': risk_level,
                'contributing_factors': contributing_factors,
                'recommendations': recommendations
            }
            
        except Exception as e:
            print(f"ML prediction failed: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_prediction(employee_data)
    
    def _fallback_prediction(self, employee_data: Dict) -> Dict:
        """Fallback to rule-based prediction if ML fails"""
        risk_score = 0
        contributing_factors = []
        
        # Simple rule-based scoring
        attendance = employee_data.get('attendance_rate', 85)
        leave_days = employee_data.get('leave_days', 10)
        performance = employee_data.get('avg_performance_rating', 3.0)
        tenure_months = employee_data.get('tenure_months', 12)
        
        if attendance < 70:
            risk_score += 30
            contributing_factors.append(f'Low attendance ({attendance:.1f}%)')
        elif attendance < 85:
            risk_score += 15
            contributing_factors.append(f'Below average attendance ({attendance:.1f}%)')
        
        if leave_days > 20:
            risk_score += 20
            contributing_factors.append(f'High leave usage ({leave_days} days)')
        
        if performance < 2.5:
            risk_score += 25
            contributing_factors.append(f'Low performance ({performance}/5)')
        
        if tenure_months < 6:
            risk_score += 20
            contributing_factors.append('New employee settling in')
        
        risk_score = min(100, risk_score)
        
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'contributing_factors': contributing_factors if contributing_factors else ['No major risk factors'],
            'recommendations': self._generate_recommendations(risk_level, contributing_factors)
        }
    
    def _identify_factors(self, employee_data: Dict, risk_score: float) -> list:
        """Identify contributing factors based on employee data"""
        factors = []
        
        attendance = employee_data.get('attendance_rate', 85)
        if attendance < 85:
            factors.append(f'Below average attendance ({attendance:.1f}%)')
        
        leave_days = employee_data.get('leave_days', 10)
        if leave_days > 15:
            factors.append(f'High leave usage ({leave_days} days/year)')
        
        performance = employee_data.get('avg_performance_rating', 3.0)
        if performance < 3.0:
            factors.append(f'Below average performance ({performance:.1f}/5)')
        
        tenure_months = employee_data.get('tenure_months', 12)
        if tenure_months < 6:
            factors.append('New employee - settling in period')
        elif tenure_months > 60:
            factors.append('Long tenure - may seek new challenges')
        
        overtime = employee_data.get('overtime_frequency', 0)
        if overtime > 10:
            factors.append(f'Frequent overtime ({overtime} times/3 months)')
        
        if not factors:
            factors.append('No significant risk factors identified')
        
        return factors
    
    def _generate_recommendations(self, risk_level: str, factors: list) -> str:
        """Generate actionable recommendations"""
        recs = []
        
        if risk_level == 'high':
            recs.append('🚨 URGENT: Schedule one-on-one meeting within 48 hours')
            recs.append('• Conduct stay interview to understand concerns')
            recs.append('• Review compensation and career growth opportunities')
        elif risk_level == 'medium':
            recs.append('⚠️ ATTENTION: Schedule bi-weekly check-ins')
            recs.append('• Discuss career development plans')
            recs.append('• Monitor engagement levels closely')
        else:
            recs.append('✅ MAINTAIN: Continue regular performance reviews')
            recs.append('• Recognize good work and contributions')
            recs.append('• Keep communication channels open')
        
        # Factor-specific recommendations
        for factor in factors:
            if 'attendance' in factor.lower():
                recs.append('• Address attendance concerns - check for personal/health issues')
            if 'performance' in factor.lower():
                recs.append('• Provide additional training and mentorship')
            if 'leave' in factor.lower():
                recs.append('• Investigate reasons for high leave usage')
            if 'overtime' in factor.lower():
                recs.append('• Review workload distribution and work-life balance')
        
        return '\n'.join(recs)

# Global adapter instance
adapter = MLModelAdapter()
