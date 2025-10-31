"""
Attrition & Performance Prediction Model
Uses employee data to predict attrition risk and performance scores
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json

class AttritionPerformancePredictor:
    """
    Machine Learning model for predicting employee attrition risk and performance
    """
    
    def __init__(self, model_dir='ml_models/saved_models'):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Models
        self.attrition_model = None
        self.performance_model = None
        
        # Scalers and encoders
        self.scaler = StandardScaler()
        self.dept_encoder = LabelEncoder()
        self.job_encoder = LabelEncoder()
        
        # Feature names for consistency
        self.feature_names = [
            'tenure_months', 'attendance_rate', 'leave_days', 
            'avg_performance_rating', 'salary', 'work_hours_avg',
            'dept_encoded', 'job_title_encoded', 'age',
            'overtime_frequency', 'sick_leave_ratio'
        ]
        
        # Load pre-trained models if they exist
        self.load_models()
    
    def prepare_features(self, employee_data: Dict) -> np.ndarray:
        """
        Prepare features from employee data for prediction
        
        Args:
            employee_data: Dictionary containing employee information
            
        Returns:
            Numpy array of prepared features
        """
        # Calculate tenure in months
        if employee_data.get('date_of_joining'):
            date_of_joining = datetime.fromisoformat(str(employee_data['date_of_joining']).replace('Z', '+00:00'))
            tenure_months = (datetime.now() - date_of_joining).days / 30
        else:
            tenure_months = 12  # Default to 1 year
        
        # Calculate age
        if employee_data.get('date_of_birth'):
            date_of_birth = datetime.fromisoformat(str(employee_data['date_of_birth']).replace('Z', '+00:00'))
            age = (datetime.now() - date_of_birth).days / 365
        else:
            age = 30  # Default age
        
        # Attendance rate
        attendance_rate = employee_data.get('attendance_rate', 85.0)
        
        # Leave days
        leave_days = employee_data.get('leave_days', 10)
        
        # Average performance rating
        avg_performance_rating = employee_data.get('avg_performance_rating', 3.0)
        
        # Salary
        salary = employee_data.get('salary', 50000)
        
        # Work hours average
        work_hours_avg = employee_data.get('work_hours_avg', 8.0)
        
        # Department encoding
        dept_name = employee_data.get('department', 'IT')
        try:
            dept_encoded = self.dept_encoder.transform([dept_name])[0]
        except:
            dept_encoded = 0  # Unknown department
        
        # Job title encoding
        job_title = employee_data.get('job_title', 'Employee')
        try:
            job_title_encoded = self.job_encoder.transform([job_title])[0]
        except:
            job_title_encoded = 0  # Unknown job title
        
        # Overtime frequency (times per month)
        overtime_frequency = employee_data.get('overtime_frequency', 2)
        
        # Sick leave ratio
        sick_leave_ratio = employee_data.get('sick_leave_ratio', 0.2)
        
        # Combine all features
        features = np.array([[
            tenure_months,
            attendance_rate,
            leave_days,
            avg_performance_rating,
            salary,
            work_hours_avg,
            dept_encoded,
            job_title_encoded,
            age,
            overtime_frequency,
            sick_leave_ratio
        ]])
        
        return features
    
    def predict_attrition(self, employee_data: Dict) -> Dict:
        """
        Predict attrition risk for an employee
        
        Args:
            employee_data: Employee information dictionary
            
        Returns:
            Dictionary with risk_score, risk_level, and contributing_factors
        """
        # Prepare features
        features = self.prepare_features(employee_data)
        
        # If model is not trained, use rule-based approach
        if self.attrition_model is None:
            return self._rule_based_attrition(employee_data, features)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict attrition probability
        attrition_prob = self.attrition_model.predict_proba(features_scaled)[0][1] * 100
        
        # Determine risk level
        if attrition_prob < 30:
            risk_level = 'low'
        elif attrition_prob < 60:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        # Get feature importances
        feature_importance = dict(zip(self.feature_names, self.attrition_model.feature_importances_))
        contributing_factors = self._identify_contributing_factors(employee_data, feature_importance)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, contributing_factors)
        
        return {
            'risk_score': round(attrition_prob, 2),
            'risk_level': risk_level,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _rule_based_attrition(self, employee_data: Dict, features: np.ndarray) -> Dict:
        """
        Rule-based attrition prediction when ML model is not available
        """
        risk_score = 0
        contributing_factors = []
        
        # Analyze each factor
        tenure_months = features[0][0]
        attendance_rate = features[0][1]
        leave_days = features[0][2]
        avg_performance = features[0][3]
        
        # Low tenure increases risk (honeymoon period)
        if tenure_months < 6:
            risk_score += 20
            contributing_factors.append('New employee (< 6 months tenure)')
        elif tenure_months > 60:  # Long tenure
            risk_score += 10
            contributing_factors.append('Long tenure (> 5 years) - may seek new challenges')
        
        # Poor attendance
        if attendance_rate < 70:
            risk_score += 30
            contributing_factors.append(f'Low attendance rate ({attendance_rate}%)')
        elif attendance_rate < 85:
            risk_score += 15
            contributing_factors.append(f'Below average attendance ({attendance_rate}%)')
        
        # High leave usage
        if leave_days > 20:
            risk_score += 20
            contributing_factors.append(f'High leave usage ({leave_days} days)')
        
        # Low performance
        if avg_performance < 2.5:
            risk_score += 25
            contributing_factors.append(f'Low performance rating ({avg_performance}/5)')
        
        # Cap at 100
        risk_score = min(100, risk_score)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        recommendations = self._generate_recommendations(risk_level, contributing_factors)
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def predict_performance(self, employee_data: Dict) -> Dict:
        """
        Predict performance score for an employee
        
        Args:
            employee_data: Employee information dictionary
            
        Returns:
            Dictionary with predicted_performance, confidence, and insights
        """
        # Prepare features
        features = self.prepare_features(employee_data)
        
        # If model is not trained, use rule-based approach
        if self.performance_model is None:
            return self._rule_based_performance(employee_data, features)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict performance
        predicted_score = self.performance_model.predict(features_scaled)[0]
        predicted_score = max(1, min(5, predicted_score))  # Clamp between 1-5
        
        # Calculate confidence based on feature consistency
        confidence = self._calculate_confidence(employee_data)
        
        # Generate insights
        insights = self._generate_performance_insights(predicted_score, employee_data)
        
        return {
            'predicted_performance': round(predicted_score, 2),
            'confidence': round(confidence, 2),
            'insights': insights,
            'category': self._performance_category(predicted_score)
        }
    
    def _rule_based_performance(self, employee_data: Dict, features: np.ndarray) -> Dict:
        """
        Rule-based performance prediction when ML model is not available
        """
        attendance_rate = features[0][1]
        leave_days = features[0][2]
        work_hours_avg = features[0][5]
        
        # Start with neutral score
        score = 3.0
        insights = []
        
        # Attendance impact
        if attendance_rate >= 95:
            score += 0.5
            insights.append('Excellent attendance record')
        elif attendance_rate >= 85:
            score += 0.2
            insights.append('Good attendance')
        elif attendance_rate < 70:
            score -= 0.8
            insights.append('Poor attendance affecting performance')
        
        # Work hours impact
        if work_hours_avg >= 9:
            score += 0.3
            insights.append('Consistently works beyond required hours')
        elif work_hours_avg < 7:
            score -= 0.4
            insights.append('Below standard work hours')
        
        # Leave balance
        if leave_days < 5:
            score += 0.2
            insights.append('Minimal leave usage indicates dedication')
        elif leave_days > 20:
            score -= 0.3
            insights.append('High leave usage may impact productivity')
        
        # Historical performance
        if employee_data.get('avg_performance_rating'):
            hist_perf = employee_data['avg_performance_rating']
            score = (score + hist_perf) / 2  # Average with historical
            insights.append(f'Historical performance: {hist_perf}/5')
        
        # Clamp score
        score = max(1, min(5, score))
        
        confidence = 75.0  # Moderate confidence for rule-based
        
        return {
            'predicted_performance': round(score, 2),
            'confidence': confidence,
            'insights': insights,
            'category': self._performance_category(score)
        }
    
    def _identify_contributing_factors(self, employee_data: Dict, feature_importance: Dict) -> List[str]:
        """
        Identify top contributing factors to attrition risk
        """
        factors = []
        
        # Sort features by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        # Analyze top 3 features
        for feature_name, importance in sorted_features[:3]:
            if 'attendance' in feature_name and employee_data.get('attendance_rate', 100) < 85:
                factors.append(f'Low attendance rate ({employee_data.get("attendance_rate")}%)')
            elif 'performance' in feature_name and employee_data.get('avg_performance_rating', 5) < 3:
                factors.append(f'Below average performance ({employee_data.get("avg_performance_rating")}/5)')
            elif 'leave' in feature_name and employee_data.get('leave_days', 0) > 15:
                factors.append(f'High leave usage ({employee_data.get("leave_days")} days)')
            elif 'tenure' in feature_name:
                tenure = employee_data.get('tenure_months', 12)
                if tenure < 6:
                    factors.append('New employee - settling in period')
                elif tenure > 60:
                    factors.append('Long tenure - may seek new opportunities')
        
        return factors if factors else ['No significant risk factors identified']
    
    def _generate_recommendations(self, risk_level: str, contributing_factors: List[str]) -> str:
        """
        Generate actionable recommendations based on risk level
        """
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append('URGENT: Schedule one-on-one meeting immediately')
            recommendations.append('Conduct stay interview to understand concerns')
            recommendations.append('Review compensation and growth opportunities')
        elif risk_level == 'medium':
            recommendations.append('Schedule regular check-ins (bi-weekly)')
            recommendations.append('Discuss career development plans')
            recommendations.append('Monitor engagement levels closely')
        else:
            recommendations.append('Continue regular performance reviews')
            recommendations.append('Recognize good work and contributions')
            recommendations.append('Maintain open communication channels')
        
        # Add factor-specific recommendations
        for factor in contributing_factors:
            if 'attendance' in factor.lower():
                recommendations.append('Address attendance concerns - check for personal issues')
            if 'performance' in factor.lower():
                recommendations.append('Provide additional training and support')
            if 'leave' in factor.lower():
                recommendations.append('Investigate reasons for high leave usage')
        
        return '\n'.join(recommendations)
    
    def _calculate_confidence(self, employee_data: Dict) -> float:
        """
        Calculate prediction confidence based on data quality
        """
        confidence = 100.0
        
        # Reduce confidence for missing data
        if not employee_data.get('avg_performance_rating'):
            confidence -= 15
        if not employee_data.get('attendance_rate'):
            confidence -= 10
        if not employee_data.get('date_of_joining'):
            confidence -= 10
        
        return max(50, confidence)  # Minimum 50% confidence
    
    def _generate_performance_insights(self, score: float, employee_data: Dict) -> List[str]:
        """
        Generate insights for performance prediction
        """
        insights = []
        
        if score >= 4.5:
            insights.append('Top performer - Consider for leadership roles')
            insights.append('Eligible for performance bonus')
        elif score >= 4.0:
            insights.append('Strong performer - On track for promotion')
        elif score >= 3.0:
            insights.append('Meets expectations - Room for growth')
        else:
            insights.append('Below expectations - Requires improvement plan')
            insights.append('Consider additional training and mentorship')
        
        return insights
    
    def _performance_category(self, score: float) -> str:
        """
        Categorize performance score
        """
        if score >= 4.5:
            return 'Exceptional'
        elif score >= 4.0:
            return 'Excellent'
        elif score >= 3.5:
            return 'Good'
        elif score >= 3.0:
            return 'Satisfactory'
        elif score >= 2.0:
            return 'Needs Improvement'
        else:
            return 'Unsatisfactory'
    
    def train_models(self, training_data: pd.DataFrame):
        """
        Train attrition and performance models with historical data
        
        Args:
            training_data: DataFrame with employee features and labels
        """
        # This is a placeholder for when you have historical data
        # For now, we'll use the rule-based approach
        pass
    
    def save_models(self):
        """
        Save trained models to disk
        """
        if self.attrition_model:
            joblib.dump(self.attrition_model, f'{self.model_dir}/attrition_model.pkl')
        if self.performance_model:
            joblib.dump(self.performance_model, f'{self.model_dir}/performance_model.pkl')
        joblib.dump(self.scaler, f'{self.model_dir}/scaler.pkl')
        joblib.dump(self.dept_encoder, f'{self.model_dir}/dept_encoder.pkl')
        joblib.dump(self.job_encoder, f'{self.model_dir}/job_encoder.pkl')
    
    def load_models(self):
        """
        Load pre-trained models from disk
        """
        try:
            # Try to load the best trained model
            attrition_path = f'{self.model_dir}/attrition_model.pkl'
            preprocessor_path = f'{self.model_dir}/preprocessor.pkl'
            
            if os.path.exists(attrition_path):
                self.attrition_model = joblib.load(attrition_path)
                print(f"✓ Loaded trained attrition model from {attrition_path}")
            
            if os.path.exists(preprocessor_path):
                preprocessor_state = joblib.load(preprocessor_path)
                self.scaler = preprocessor_state.get('scaler', self.scaler)
                self.dept_encoder = preprocessor_state.get('dept_encoder', self.dept_encoder)
                self.job_encoder = preprocessor_state.get('job_encoder', self.job_encoder)
                print(f"✓ Loaded preprocessor from {preprocessor_path}")
            else:
                # Try old paths for backward compatibility
                if os.path.exists(f'{self.model_dir}/scaler.pkl'):
                    self.scaler = joblib.load(f'{self.model_dir}/scaler.pkl')
                if os.path.exists(f'{self.model_dir}/dept_encoder.pkl'):
                    self.dept_encoder = joblib.load(f'{self.model_dir}/dept_encoder.pkl')
                if os.path.exists(f'{self.model_dir}/job_encoder.pkl'):
                    self.job_encoder = joblib.load(f'{self.model_dir}/job_encoder.pkl')
                    
        except Exception as e:
            print(f"Note: Could not load pre-trained models: {e}")
            print("Using rule-based predictions")

# Global predictor instance
predictor = AttritionPerformancePredictor()
