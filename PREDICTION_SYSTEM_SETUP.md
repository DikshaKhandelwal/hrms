# Attrition & Performance Prediction System - Setup Guide

## 🎯 Overview
AI/ML-powered system to predict employee attrition risk and performance scores using machine learning models integrated into your HRMS recruiter dashboard.

## 📦 What's Been Built

### 1. Backend ML Service (`backend/ml_models/attrition_predictor.py`)
- **Rule-based prediction engine** (works without training data)
- Analyzes 11 employee features:
  - Tenure, attendance rate, leave days
  - Performance ratings, salary, work hours
  - Department, job title, age
  - Overtime frequency, sick leave ratio

**Predictions:**
- **Attrition Risk**: 0-100% score with Low/Medium/High classification
- **Performance Score**: 1-5 rating with confidence level
- Contributing factors identification
- Actionable recommendations

### 2. FastAPI Endpoints (`backend/main.py`)
Three new API endpoints added:
- `POST /api/predict-attrition` - Predict attrition risk
- `POST /api/predict-performance` - Predict performance score
- `POST /api/predict-both` - Get both predictions

### 3. Database View (`supabase/ADD_PREDICTION_VIEWS.sql`)
- `employee_analytics` view aggregates all employee data
- Calculates metrics automatically:
  - Attendance rate (last 90 days)
  - Leave days (last 365 days)
  - Average performance rating
  - Work hours average
  - Overtime frequency
  - Sick leave ratio

### 4. Frontend Service (`src/lib/predictionService.ts`)
- Calls ML backend APIs
- Saves predictions to database
- Retrieves high-risk employees
- Batch prediction support
- Risk distribution statistics

### 5. UI Component (`src/components/features/AttritionPredictor.tsx`)
Beautiful dashboard with:
- Employee selector dropdown
- Predict button (individual) + Predict All button (batch)
- Risk score gauges with color-coded levels
- Performance prediction cards
- Contributing factors list
- Actionable recommendations
- High-risk employees table with real-time updates
- Stats cards (Total, Low Risk, Medium Risk, High Risk)

### 6. Navigation Integration
- Added "Predictions" button in Header (between Leaves and Payroll)
- Route added to RecruiterDashboard

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies
```bash
cd /d/hrms/backend
pip install numpy pandas scikit-learn joblib
```

Or use the updated `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Step 2: Run Database Migration
Execute the SQL file to create the analytics view:

```bash
cd /d/hrms
psql -h your-supabase-host -U postgres -d postgres -f supabase/ADD_PREDICTION_VIEWS.sql
```

Or run directly in Supabase SQL Editor:
1. Go to your Supabase project → SQL Editor
2. Copy contents of `supabase/ADD_PREDICTION_VIEWS.sql`
3. Click "Run"

### Step 3: Start Python Backend
```bash
cd /d/hrms/backend
python main.py
```

Backend will run on `http://localhost:8000`

### Step 4: Start Frontend (if not already running)
```bash
cd /d/hrms
npm run dev
```

### Step 5: Test the Feature
1. Log in as **recruiter**
2. Click **"Predictions"** in the navigation bar
3. Select an employee from dropdown
4. Click **"Predict"** button
5. View attrition risk and performance predictions!

## 📊 How It Works

### Prediction Logic (Rule-Based)

**Attrition Risk Calculation:**
- New employees (< 6 months): +20% risk
- Long tenure (> 5 years): +10% risk
- Low attendance (< 70%): +30% risk
- High leaves (> 20 days): +20% risk
- Low performance (< 2.5/5): +25% risk

**Performance Prediction:**
- Starts at 3.0 (neutral)
- Excellent attendance (≥ 95%): +0.5
- High work hours (≥ 9 hrs): +0.3
- Low leaves (< 5 days): +0.2
- Averaged with historical performance

### Features Used
```javascript
{
  tenure_months: number,        // Months since joining
  attendance_rate: number,      // % present (last 90 days)
  leave_days: number,           // Total leaves (last year)
  avg_performance_rating: number, // Average rating (1-5)
  salary: number,               // Latest net salary
  work_hours_avg: number,       // Average daily hours
  dept_encoded: number,         // Department ID
  job_title_encoded: number,    // Job title ID
  age: number,                  // Current age
  overtime_frequency: number,   // Days with >9 hours
  sick_leave_ratio: number      // Sick leaves / Total leaves
}
```

## 🎨 UI Features

### Stats Dashboard
- **Total Employees**: Count from employee_analytics view
- **Low Risk**: Green card with count
- **Medium Risk**: Yellow card with count
- **High Risk**: Red card with count

### Individual Prediction
- Select employee from dropdown
- Shows employee details (tenure, attendance, leaves, performance)
- Click "Predict" to generate
- Results show:
  - Risk score with color-coded gauge
  - Risk level badge (Low/Medium/High)
  - Contributing factors list
  - Detailed recommendations
  - Predicted performance (1-5) with confidence
  - Performance category (Exceptional/Excellent/Good/etc.)
  - Actionable insights

### Batch Prediction
- Click "Predict All" to analyze all employees
- Processes in batches with 100ms delay
- Saves all predictions to database
- Refreshes stats automatically

### High-Risk Table
- Automatically shows employees with HIGH risk
- Sortable by risk score
- Shows department, job title
- Visual risk score bar
- Last updated timestamp

## 🔧 Customization

### Adjust Risk Thresholds
Edit `backend/ml_models/attrition_predictor.py`:

```python
# Line ~210 in _rule_based_attrition
if risk_score < 30:  # Change to 20 for more sensitive
    risk_level = 'low'
elif risk_score < 60:  # Change to 50
    risk_level = 'medium'
else:
    risk_level = 'high'
```

### Add More Features
To include additional factors:

1. Update `employee_analytics` view in SQL
2. Add feature to `feature_names` list
3. Update `prepare_features()` method
4. Adjust `_rule_based_attrition()` logic

### Train ML Model (Future Enhancement)
When you have historical data:

```python
# Collect historical data
training_data = pd.DataFrame({
    'tenure_months': [...],
    'attendance_rate': [...],
    'left_company': [0, 1, 0, 1, ...]  # Target variable
})

# Train model
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model
predictor.attrition_model = model
predictor.save_models()
```

## 🐛 Troubleshooting

### Backend Error: "Import numpy could not be resolved"
```bash
pip install numpy pandas scikit-learn joblib
```

### Frontend Error: "employee_analytics does not exist"
Run the `ADD_PREDICTION_VIEWS.sql` migration file

### CORS Error from Frontend
Check backend `main.py` has correct CORS origins:
```python
allow_origins=["http://localhost:5173", "http://localhost:3000"]
```

### No Employees Showing
Ensure you have employees with `role='employee'` in profiles table:
```sql
SELECT * FROM profiles WHERE role = 'employee';
```

### Predictions Not Saving
Check RLS policies on `attrition_predictions` table:
```sql
SELECT * FROM attrition_predictions;
```

## 📈 Next Steps

### Phase 1: Current (Rule-Based) ✅
- [x] Rule-based prediction engine
- [x] Individual predictions
- [x] Batch predictions
- [x] High-risk employee tracking
- [x] Dashboard UI

### Phase 2: Enhanced ML (Optional)
- [ ] Collect 6-12 months of attrition data
- [ ] Train Random Forest/XGBoost models
- [ ] A/B test rule-based vs ML predictions
- [ ] Add prediction accuracy metrics
- [ ] Historical trend analysis

### Phase 3: Advanced Features
- [ ] Predictive alerts (email when risk increases)
- [ ] Department-wise risk heatmaps
- [ ] Retention campaign tracking
- [ ] Exit interview integration
- [ ] Sentiment analysis from 1-on-1 notes

## 📚 API Reference

### Predict Attrition
```bash
POST http://localhost:8000/api/predict-attrition
Content-Type: application/json

{
  "employee_id": "uuid-here",
  "tenure_months": 24,
  "attendance_rate": 85.5,
  "leave_days": 12,
  "avg_performance_rating": 3.8,
  "salary": 65000,
  "work_hours_avg": 8.5,
  "dept_encoded": 1,
  "job_title_encoded": 3,
  "age": 28,
  "overtime_frequency": 4,
  "sick_leave_ratio": 0.2
}
```

**Response:**
```json
{
  "employee_id": "uuid",
  "risk_score": 35.5,
  "risk_level": "medium",
  "contributing_factors": [
    "Below average attendance (85.5%)",
    "High leave usage (12 days)"
  ],
  "recommendations": "Schedule regular check-ins (bi-weekly)\nDiscuss career development plans\nMonitor engagement levels closely\nAddress attendance concerns - check for personal issues",
  "prediction_date": "2025-10-31T12:00:00Z"
}
```

## 🎉 Success Metrics

Track these KPIs:
- **Accuracy**: % of predictions matching actual outcomes
- **Early Detection**: Days between prediction and actual attrition
- **Retention Rate**: % of high-risk employees retained after intervention
- **ROI**: Cost savings from preventing attrition

## 💡 Best Practices

1. **Run Predictions Monthly**: Keep data fresh
2. **Act on High Risk**: Schedule 1-on-1s within 48 hours
3. **Document Interventions**: Track what works
4. **Review Accuracy**: Compare predictions to actual outcomes
5. **Iterate on Thresholds**: Adjust based on your company culture

---

## 🆘 Support

If you encounter issues:
1. Check backend logs: `python main.py` output
2. Check browser console: F12 → Console tab
3. Verify database view exists: `SELECT * FROM employee_analytics LIMIT 1;`
4. Test API directly: Use Postman/curl to test endpoints

**The system is now ready to use! 🚀**
