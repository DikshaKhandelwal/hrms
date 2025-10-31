"""
ML-based Attrition and Performance Predictor
Uses trained ML model with proper feature mapping
"""

import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
from pathlib import Path
from typing import Dict
import sys

# Add parent directory to path to import ml_adapter
sys.path.insert(0, str(Path(__file__).parent.parent))

class AttritionPerformancePredictor:
    """Predicts employee attrition risk and performance using trained ML model"""
    
    def __init__(self, model_dir='ml_models/saved_models'):
        self.model_dir = model_dir
        self.model = None
        self.preprocessor = None
        
        # Load trained model and preprocessor
        self.load_models()
        
    def load_models(self):
        """Load trained ML model and preprocessor"""
        try:
            model_path = os.path.join(self.model_dir, 'attrition_model.pkl')
            preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print(f"✓ Loaded attrition model from {model_path}")
            
            if os.path.exists(preprocessor_path):
                self.preprocessor = joblib.load(preprocessor_path)
                print(f"✓ Loaded preprocessor with {len(self.preprocessor['feature_names'])} features")
                
        except Exception as e:
            print(f"Warning: Could not load ML models: {e}")
    
    def map_hrms_to_ml_features(self, employee_data: Dict) -> pd.DataFrame:
        """
        Map HRMS employee data to ML model features
        Creates a dataframe with all 47 features expected by the model
        """
        # Calculate derived values
        tenure_months = employee_data.get('tenure_months', 12)
        tenure_years = tenure_months / 12
        age = int(employee_data.get('age', 35))
        salary = float(employee_data.get('salary', 6500))
        
        # Create DataFrame with all required features
        df = pd.DataFrame([{
            # Basic demographics
            'Age': age,
            'Gender': 'Male',  # Default (will be encoded)
            'MaritalStatus': 'Married',
            
            # Travel and location
            'BusinessTravel': 'Travel_Rarely',
            'DistanceFromHome': 10,
            
            # Education
            'Education': 3,  # Bachelor's degree
            'EducationField': 'Life Sciences',
            
            # Job details
            'Department': employee_data.get('department', 'Research & Development'),
            'JobRole': employee_data.get('job_title', 'Sales Executive'),
            'JobLevel': 2,
            
            # Compensation
            'MonthlyIncome': salary,
            'DailyRate': int(salary / 22),
            'HourlyRate': int(salary / (employee_data.get('work_hours_avg', 8) * 22)),
            'MonthlyRate': int(salary * 3.5),
            'PercentSalaryHike': 15,
            'StockOptionLevel': 1,
            
            # Satisfaction scores (1-4 scale)
            'EnvironmentSatisfaction': 3,
            'JobSatisfaction': 3,
            'RelationshipSatisfaction': 3,
            'WorkLifeBalance': 3,
            
            # Performance and involvement
            'JobInvolvement': 3,
            'PerformanceRating': int(employee_data.get('avg_performance_rating', 3)),
            
            # Work characteristics
            'OverTime': 'Yes' if employee_data.get('overtime_frequency', 0) > 5 else 'No',
            'TrainingTimesLastYear': 2,
            
            # Tenure and experience
            'YearsAtCompany': int(tenure_years),
            'YearsInCurrentRole': int(tenure_years * 0.6),
            'YearsSinceLastPromotion': int(tenure_years * 0.4),
            'YearsWithCurrManager': int(tenure_years * 0.5),
            'TotalWorkingYears': int(tenure_years * 1.5),
            'NumCompaniesWorked': max(1, int(tenure_years / 3)),
        }])
        
        # Adjust satisfaction based on attendance and performance
        attendance = employee_data.get('attendance_rate', 85)
        if attendance < 85:
            df['JobSatisfaction'] = 2
            df['EnvironmentSatisfaction'] = 2
            df['WorkLifeBalance'] = 2
        elif attendance > 95:
            df['JobSatisfaction'] = 4
            df['EnvironmentSatisfaction'] = 4
        
        # Adjust based on leave days
        leave_days = employee_data.get('leave_days', 10)
        if leave_days > 20:
            df['WorkLifeBalance'] = 2
        
        # Adjust based on performance
        performance = employee_data.get('avg_performance_rating', 3)
        df['PerformanceRating'] = min(4, max(1, int(performance + 1)))
        df['JobInvolvement'] = min(4, max(1, int(performance)))
        
        return df
    
    def predict_attrition(self, employee_data: Dict) -> Dict:
        """
        Predict attrition risk using trained ML model
        
        Args:
            employee_data: HRMS employee data from employee_analytics view
            
        Returns:
            Dictionary with risk_score, risk_level, contributing_factors, recommendations
        """
        if not self.model or not self.preprocessor:
            return self._fallback_prediction(employee_data)
        
        try:
            # Map HRMS data to ML features
            ml_df = self.map_hrms_to_ml_features(employee_data)
            
            # Import and use the enhanced preprocessor
            import sys
            from pathlib import Path
            sys.path.insert(0, str(Path(__file__).parent.parent.parent))
            from train_models_enhanced import EnhancedPreprocessor
            
            # Create preprocessor instance and load fitted components
            prep = EnhancedPreprocessor()
            prep.label_encoders = self.preprocessor['label_encoders']
            prep.scaler = self.preprocessor['scaler']
            prep.feature_names = self.preprocessor['feature_names']
            
            # Add temporary target column for preprocessing
            ml_df['Attrition'] = 'No'
            
            # Transform using the same pipeline as training
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
            
            # Get contributing factors and recommendations
            factors = self._identify_factors(employee_data, attrition_prob)
            recommendations = self._generate_recommendations(risk_level, factors)
            
            return {
                'risk_score': round(attrition_prob, 2),
                'risk_level': risk_level,
                'contributing_factors': factors,
                'recommendations': recommendations
            }
            
        except Exception as e:
            print(f"ML prediction error: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_prediction(employee_data)
    
    def _fallback_prediction(self, employee_data: Dict) -> Dict:
        """Simple rule-based prediction if ML model fails"""
        risk_score = 0
        factors = []
        
        # Attendance
        attendance = employee_data.get('attendance_rate', 85)
        if attendance < 70:
            risk_score += 30
            factors.append(f'Low attendance ({attendance:.1f}%)')
        elif attendance < 85:
            risk_score += 15
            factors.append(f'Below average attendance ({attendance:.1f}%)')
        
        # Leave days
        leave_days = employee_data.get('leave_days', 10)
        if leave_days > 20:
            risk_score += 20
            factors.append(f'High leave usage ({leave_days} days)')
        
        # Performance
        performance = employee_data.get('avg_performance_rating', 3.0)
        if performance < 2.5:
            risk_score += 25
            factors.append(f'Low performance ({performance:.1f}/5)')
        
        # Tenure
        tenure = employee_data.get('tenure_months', 12)
        if tenure < 6:
            risk_score += 20
            factors.append('New employee settling in')
        
        risk_score = min(100, risk_score)
        
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        if not factors:
            factors = ['No major risk factors identified']
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'contributing_factors': factors,
            'recommendations': self._generate_recommendations(risk_level, factors)
        }
    
    def _identify_factors(self, employee_data: Dict, risk_score: float) -> list:
        """Identify contributing risk factors"""
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
        
        tenure = employee_data.get('tenure_months', 12)
        if tenure < 6:
            factors.append('New employee - settling in period')
        elif tenure > 60:
            factors.append('Long tenure - may seek new challenges')
        
        overtime = employee_data.get('overtime_frequency', 0)
        if overtime > 10:
            factors.append(f'Frequent overtime ({overtime} times/3 months)')
        
        salary = employee_data.get('salary', 0)
        if salary < 5000:
            factors.append('Below average compensation')
        
        if not factors:
            factors.append('Model-based prediction - multiple factors considered')
        
        return factors
    
    def _generate_recommendations(self, risk_level: str, factors: list) -> str:
        """Generate actionable recommendations"""
        recs = []
        
        if risk_level == 'high':
            recs.append('🚨 URGENT: Schedule one-on-one meeting within 48 hours')
            recs.append('• Conduct stay interview to understand concerns')
            recs.append('• Review compensation and career growth opportunities')
            recs.append('• Consider retention bonus or promotion discussion')
        elif risk_level == 'medium':
            recs.append('⚠️ ATTENTION: Schedule bi-weekly check-ins')
            recs.append('• Discuss career development plans')
            recs.append('• Monitor engagement levels closely')
            recs.append('• Address any workplace concerns proactively')
        else:
            recs.append('✅ MAINTAIN: Continue regular performance reviews')
            recs.append('• Recognize good work and contributions')
            recs.append('• Keep communication channels open')
            recs.append('• Provide growth opportunities')
        
        # Factor-specific recommendations
        factor_text = ' '.join(factors).lower()
        if 'attendance' in factor_text:
            recs.append('• Address attendance concerns - check for personal/health issues')
        if 'performance' in factor_text:
            recs.append('• Provide additional training and mentorship')
        if 'leave' in factor_text:
            recs.append('• Investigate reasons for high leave usage')
        if 'overtime' in factor_text:
            recs.append('• Review workload distribution and work-life balance')
        if 'compensation' in factor_text:
            recs.append('• Review salary benchmarking and consider adjustment')
        
        return '\n'.join(recs)
    
    def predict_performance(self, employee_data: Dict) -> Dict:
        """Predict future performance score"""
        current_rating = employee_data.get('avg_performance_rating', 3.0)
        attendance = employee_data.get('attendance_rate', 85)
        tenure = employee_data.get('tenure_months', 12)
        
        # Simple performance prediction
        predicted_score = current_rating
        
        # Adjust based on attendance
        if attendance < 85:
            predicted_score -= 0.3
        elif attendance > 95:
            predicted_score += 0.2
        
        # Adjust based on tenure (learning curve)
        if tenure < 6:
            predicted_score += 0.1  # Improvement expected
        
        predicted_score = max(1.0, min(5.0, predicted_score))
        
        return {
            'predicted_score': round(predicted_score, 2),
            'current_score': current_rating,
            'trend': 'improving' if predicted_score > current_rating else 'stable' if predicted_score == current_rating else 'declining'
        }
