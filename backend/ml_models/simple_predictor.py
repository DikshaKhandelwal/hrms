"""
Simplified Attrition Predictor
For manual data entry - uses only practical features
"""

import numpy as np
import pandas as pd
import joblib
import os
from typing import Dict

class SimpleAttritionPredictor:
    """Simplified predictor for manual data entry"""
    
    def __init__(self, model_dir='ml_models/saved_models'):
        self.model_dir = model_dir
        self.model = None
        self.preprocessor = None
        self.load_models()
        
    def load_models(self):
        """Load simplified model and preprocessor"""
        try:
            model_path = os.path.join(self.model_dir, 'attrition_model_simple.pkl')
            preprocessor_path = os.path.join(self.model_dir, 'preprocessor_simple.pkl')
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print(f"✓ Loaded simple model from {model_path}")
            
            if os.path.exists(preprocessor_path):
                self.preprocessor = joblib.load(preprocessor_path)
                print(f"✓ Loaded preprocessor with {len(self.preprocessor['feature_names'])} features")
                
        except Exception as e:
            print(f"Warning: Could not load models: {e}")
    
    def predict_attrition(self, employee_data: Dict) -> Dict:
        """
        Predict attrition risk from manual input
        
        Required fields in employee_data:
        - age: int (years)
        - monthly_income: float (salary per month)
        - total_working_years: int (total years of experience)
        - years_at_company: int (tenure at current company)
        - job_satisfaction: int (1-4 scale)
        - work_life_balance: int (1-4 scale)
        - environment_satisfaction: int (1-4 scale)
        - job_involvement: int (1-4 scale)
        - performance_rating: int (1-4 scale)
        - overtime: str ('Yes' or 'No')
        - distance_from_home: int (km)
        - num_companies_worked: int (previous companies)
        - years_since_last_promotion: int (years)
        - department: str (e.g., 'Sales', 'Research & Development', 'Human Resources')
        - job_role: str (e.g., 'Sales Executive', 'Research Scientist')
        """
        
        if not self.model or not self.preprocessor:
            return self._fallback_prediction(employee_data)
        
        try:
            # Create DataFrame with required features
            df = pd.DataFrame([{
                'Age': int(employee_data.get('age', 30)),
                'MonthlyIncome': float(employee_data.get('monthly_income', 5000)),
                'TotalWorkingYears': int(employee_data.get('total_working_years', 5)),
                'YearsAtCompany': int(employee_data.get('years_at_company', 2)),
                'JobSatisfaction': int(employee_data.get('job_satisfaction', 3)),
                'WorkLifeBalance': int(employee_data.get('work_life_balance', 3)),
                'EnvironmentSatisfaction': int(employee_data.get('environment_satisfaction', 3)),
                'JobInvolvement': int(employee_data.get('job_involvement', 3)),
                'PerformanceRating': int(employee_data.get('performance_rating', 3)),
                'OverTime': str(employee_data.get('overtime', 'No')),
                'DistanceFromHome': int(employee_data.get('distance_from_home', 10)),
                'NumCompaniesWorked': int(employee_data.get('num_companies_worked', 2)),
                'YearsSinceLastPromotion': int(employee_data.get('years_since_last_promotion', 1)),
                'Department': str(employee_data.get('department', 'Research & Development')),
                'JobRole': str(employee_data.get('job_role', 'Sales Executive'))
            }])
            
            # Engineer features
            df['TenureRatio'] = df['YearsAtCompany'] / (df['TotalWorkingYears'] + 1)
            df['PromotionFrequency'] = 1 / (df['YearsSinceLastPromotion'] + 1)
            df['IncomeAgeRatio'] = df['MonthlyIncome'] / df['Age']
            df['SatisfactionScore'] = (df['JobSatisfaction'] + df['WorkLifeBalance'] + 
                                      df['EnvironmentSatisfaction'] + df['JobInvolvement']) / 4
            df['IsLowSatisfaction'] = (df['JobSatisfaction'] <= 2).astype(int)
            df['IsLongCommute'] = (df['DistanceFromHome'] > 15).astype(int)
            df['IsJobHopper'] = (df['NumCompaniesWorked'] > 3).astype(int)
            df['IsStagnant'] = ((df['YearsSinceLastPromotion'] > 3) & (df['YearsAtCompany'] > 3)).astype(int)
            
            # Encode categorical features
            for col, encoder in self.preprocessor['label_encoders'].items():
                if col in df.columns:
                    try:
                        df[col] = encoder.transform(df[col])
                    except:
                        # Handle unseen categories - use most common
                        df[col] = encoder.transform([encoder.classes_[0]])[0]
            
            # Ensure columns are in correct order
            df = df[self.preprocessor['feature_names']]
            
            # Scale features
            X = self.preprocessor['scaler'].transform(df)
            
            # Predict
            attrition_prob = self.model.predict_proba(X)[0][1] * 100
            
            # Determine risk level
            if attrition_prob < 30:
                risk_level = 'low'
            elif attrition_prob < 60:
                risk_level = 'medium'
            else:
                risk_level = 'high'
            
            # Identify factors
            factors = self._identify_factors(employee_data, df)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_level, factors)
            
            return {
                'risk_score': round(attrition_prob, 2),
                'risk_level': risk_level,
                'contributing_factors': factors,
                'recommendations': recommendations
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_prediction(employee_data)
    
    def _identify_factors(self, employee_data: Dict, df: pd.DataFrame) -> list:
        """Identify risk factors"""
        factors = []
        
        # Satisfaction
        if employee_data.get('job_satisfaction', 3) <= 2:
            factors.append(f"Low job satisfaction ({employee_data.get('job_satisfaction')}/4)")
        
        if employee_data.get('work_life_balance', 3) <= 2:
            factors.append(f"Poor work-life balance ({employee_data.get('work_life_balance')}/4)")
        
        if employee_data.get('environment_satisfaction', 3) <= 2:
            factors.append(f"Low environment satisfaction ({employee_data.get('environment_satisfaction')}/4)")
        
        # Overtime
        if employee_data.get('overtime') == 'Yes':
            factors.append("Frequent overtime work")
        
        # Commute
        distance = employee_data.get('distance_from_home', 10)
        if distance > 20:
            factors.append(f"Long commute distance ({distance} km)")
        
        # Career stagnation
        years_no_promotion = employee_data.get('years_since_last_promotion', 1)
        if years_no_promotion > 3:
            factors.append(f"No promotion in {years_no_promotion} years")
        
        # Job hopping
        num_companies = employee_data.get('num_companies_worked', 2)
        if num_companies > 3:
            factors.append(f"History of frequent job changes ({num_companies} companies)")
        
        # Income vs age
        income = employee_data.get('monthly_income', 5000)
        age = employee_data.get('age', 30)
        income_age_ratio = income / age
        if income_age_ratio < 150:  # Low income for age
            factors.append(f"Compensation below average for age group")
        
        # Performance
        if employee_data.get('performance_rating', 3) <= 2:
            factors.append(f"Below average performance rating")
        
        if not factors:
            factors.append("Multiple factors contributing to moderate risk")
        
        return factors[:5]  # Return top 5 factors
    
    def _generate_recommendations(self, risk_level: str, factors: list) -> str:
        """Generate actionable recommendations"""
        recs = []
        
        if risk_level == 'high':
            recs.append('🚨 HIGH RISK - IMMEDIATE ACTION REQUIRED')
            recs.append('• Schedule urgent one-on-one meeting within 48 hours')
            recs.append('• Conduct stay interview to understand concerns')
            recs.append('• Review compensation and career progression opportunities')
            recs.append('• Consider retention bonus or counter-offer preparation')
        elif risk_level == 'medium':
            recs.append('⚠️ MEDIUM RISK - PROACTIVE INTERVENTION NEEDED')
            recs.append('• Schedule bi-weekly check-ins to monitor engagement')
            recs.append('• Discuss career development and growth plans')
            recs.append('• Address any workplace concerns promptly')
            recs.append('• Review workload and work-life balance')
        else:
            recs.append('✅ LOW RISK - MAINTAIN ENGAGEMENT')
            recs.append('• Continue regular performance reviews and feedback')
            recs.append('• Recognize contributions and good work')
            recs.append('• Provide growth and development opportunities')
            recs.append('• Keep communication channels open')
        
        # Factor-specific recommendations
        factor_text = ' '.join(factors).lower()
        if 'satisfaction' in factor_text:
            recs.append('• Conduct satisfaction survey to identify specific issues')
        if 'overtime' in factor_text:
            recs.append('• Review workload distribution and staffing needs')
        if 'commute' in factor_text:
            recs.append('• Explore remote work or flexible hours options')
        if 'promotion' in factor_text:
            recs.append('• Discuss promotion timeline and career path')
        if 'compensation' in factor_text:
            recs.append('• Review salary against market benchmarks')
        
        return '\n'.join(recs[:8])  # Limit to 8 recommendations
    
    def _fallback_prediction(self, employee_data: Dict) -> Dict:
        """Simple rule-based fallback"""
        risk_score = 50  # Default medium
        
        # Adjust based on satisfaction
        satisfaction_avg = (
            employee_data.get('job_satisfaction', 3) +
            employee_data.get('work_life_balance', 3) +
            employee_data.get('environment_satisfaction', 3)
        ) / 3
        
        if satisfaction_avg <= 2:
            risk_score += 20
        elif satisfaction_avg >= 3.5:
            risk_score -= 20
        
        # Adjust for overtime
        if employee_data.get('overtime') == 'Yes':
            risk_score += 15
        
        # Adjust for commute
        if employee_data.get('distance_from_home', 10) > 20:
            risk_score += 10
        
        risk_score = max(0, min(100, risk_score))
        
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'contributing_factors': ['Manual assessment based on key indicators'],
            'recommendations': self._generate_recommendations(risk_level, [])
        }
    
    def predict_performance(self, employee_data: Dict) -> Dict:
        """Simple performance prediction"""
        current_rating = employee_data.get('performance_rating', 3)
        involvement = employee_data.get('job_involvement', 3)
        satisfaction = employee_data.get('job_satisfaction', 3)
        
        predicted_score = (current_rating + involvement + satisfaction) / 3
        predicted_score = max(1.0, min(4.0, predicted_score))
        
        return {
            'predicted_score': round(predicted_score, 2),
            'current_score': current_rating,
            'trend': 'improving' if predicted_score > current_rating else 'stable' if predicted_score == current_rating else 'declining'
        }

# Global instance
predictor = SimpleAttritionPredictor()
