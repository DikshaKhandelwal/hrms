"""
Simplified ML Model Training
Uses only easily collectible features for practical predictions
"""

import os
import sys
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'

from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'ml_models'))

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("🚀 SIMPLIFIED ML TRAINING - PRACTICAL FEATURES ONLY")
print("=" * 80)

try:
    import xgboost as xgb
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, 
        roc_auc_score, classification_report, confusion_matrix
    )
    from sklearn.model_selection import train_test_split
    import joblib
    print("✓ All libraries imported successfully")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / 'hr_data.csv'
MODELS_DIR = BASE_DIR / 'backend' / 'ml_models' / 'saved_models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("\n" + "=" * 80)
print("📊 Step 1: Load and Prepare Data")
print("=" * 80)

# Load data
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows with {len(df.columns)} columns")
print(f"Attrition rate: {(df['Attrition'] == 'Yes').sum() / len(df) * 100:.2f}%")

# Select only practical, easily collectible features
PRACTICAL_FEATURES = [
    'Age',
    'MonthlyIncome',
    'TotalWorkingYears',
    'YearsAtCompany',
    'JobSatisfaction',
    'WorkLifeBalance',
    'EnvironmentSatisfaction',
    'JobInvolvement',
    'PerformanceRating',
    'OverTime',
    'DistanceFromHome',
    'NumCompaniesWorked',
    'YearsSinceLastPromotion',
    'Department',
    'JobRole'
]

print(f"\n🎯 Using {len(PRACTICAL_FEATURES)} practical features:")
for i, feature in enumerate(PRACTICAL_FEATURES, 1):
    print(f"  {i:2d}. {feature}")

# Drop unnecessary columns
drop_cols = ['EmployeeCount', 'EmployeeNumber', 'Over18', 'StandardHours']
df = df.drop(columns=[col for col in drop_cols if col in df.columns], errors='ignore')

# Select features
X = df[PRACTICAL_FEATURES].copy()
y = df['Attrition'].apply(lambda x: 1 if x == 'Yes' else 0)

print("\n" + "=" * 80)
print("🔧 Step 2: Feature Engineering")
print("=" * 80)

# Simple feature engineering
X['TenureRatio'] = X['YearsAtCompany'] / (X['TotalWorkingYears'] + 1)
X['PromotionFrequency'] = 1 / (X['YearsSinceLastPromotion'] + 1)
X['IncomeAgeRatio'] = X['MonthlyIncome'] / X['Age']
X['SatisfactionScore'] = (X['JobSatisfaction'] + X['WorkLifeBalance'] + 
                          X['EnvironmentSatisfaction'] + X['JobInvolvement']) / 4

# Flags
X['IsLowSatisfaction'] = (X['JobSatisfaction'] <= 2).astype(int)
X['IsLongCommute'] = (X['DistanceFromHome'] > 15).astype(int)
X['IsJobHopper'] = (X['NumCompaniesWorked'] > 3).astype(int)
X['IsStagnant'] = ((X['YearsSinceLastPromotion'] > 3) & (X['YearsAtCompany'] > 3)).astype(int)

print(f"✓ Added 8 engineered features")
print(f"Total features: {len(X.columns)}")

# Encode categorical features
label_encoders = {}
categorical_cols = ['OverTime', 'Department', 'JobRole']

for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    label_encoders[col] = le

print(f"✓ Encoded {len(categorical_cols)} categorical features")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Calculate class weights
neg_count = (y_train == 0).sum()
pos_count = (y_train == 1).sum()
scale_pos_weight = neg_count / pos_count
print(f"Class imbalance ratio: {scale_pos_weight:.2f}:1")

print("\n" + "=" * 80)
print("🤖 Step 3: Train Models")
print("=" * 80)

models = {}

# Model 1: XGBoost
print("\n[1/3] Training XGBoost...")
xgb_model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    eval_metric='logloss'
)
xgb_model.fit(X_train_scaled, y_train)
models['XGBoost'] = xgb_model
print("✓ XGBoost trained")

# Model 2: Random Forest
print("\n[2/3] Training Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=10,
    min_samples_leaf=4,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)
models['RandomForest'] = rf_model
print("✓ Random Forest trained")

# Model 3: Gradient Boosting
print("\n[3/3] Training Gradient Boosting...")
gb_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
gb_model.fit(X_train_scaled, y_train)
models['GradientBoosting'] = gb_model
print("✓ Gradient Boosting trained")

print("\n" + "=" * 80)
print("📈 Step 4: Evaluate Models")
print("=" * 80)

results = []

for name, model in models.items():
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    results.append({
        'Model': name,
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1': f1,
        'ROC_AUC': roc_auc
    })
    
    print(f"\n{'=' * 80}")
    print(f"Model: {name}")
    print(f"{'-' * 80}")
    print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
    print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print(f"ROC-AUC:   {roc_auc:.4f} ({roc_auc*100:.2f}%)")
    
    cm = confusion_matrix(y_test, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"  TN={cm[0,0]:3d}  FP={cm[0,1]:3d}")
    print(f"  FN={cm[1,0]:3d}  TP={cm[1,1]:3d}")

# Select best model
results_df = pd.DataFrame(results)
best_idx = results_df['ROC_AUC'].idxmax()
best_model_name = results_df.loc[best_idx, 'Model']
best_model = models[best_model_name]

print("\n" + "=" * 80)
print("🏆 Best Model Selection")
print("=" * 80)
print(f"\n🥇 Best Model: {best_model_name}")
print(f"   Accuracy:  {results_df.loc[best_idx, 'Accuracy']:.4f}")
print(f"   ROC-AUC:   {results_df.loc[best_idx, 'ROC_AUC']:.4f}")

print("\n" + "=" * 80)
print("🔍 Feature Importance")
print("=" * 80)

if hasattr(best_model, 'feature_importances_'):
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n📊 Top 15 Most Important Features:")
    for idx, row in feature_importance.head(15).iterrows():
        bar = '█' * int(row['importance'] * 100)
        print(f"  {row['feature']:30s} {bar} {row['importance']:.4f}")

print("\n" + "=" * 80)
print("💾 Step 5: Save Model and Preprocessor")
print("=" * 80)

# Save best model
model_path = MODELS_DIR / 'attrition_model_simple.pkl'
joblib.dump(best_model, model_path)
print(f"✓ Model saved: {model_path}")

# Save preprocessor components
preprocessor = {
    'feature_names': list(X.columns),
    'scaler': scaler,
    'label_encoders': label_encoders,
    'practical_features': PRACTICAL_FEATURES
}
preprocessor_path = MODELS_DIR / 'preprocessor_simple.pkl'
joblib.dump(preprocessor, preprocessor_path)
print(f"✓ Preprocessor saved: {preprocessor_path}")

# Save results
results_df.to_csv(MODELS_DIR / 'model_comparison_simple.csv', index=False)
print(f"✓ Comparison saved: {MODELS_DIR / 'model_comparison_simple.csv'}")

if hasattr(best_model, 'feature_importances_'):
    feature_importance.to_csv(MODELS_DIR / 'feature_importance_simple.csv', index=False)
    print(f"✓ Feature importance saved: {MODELS_DIR / 'feature_importance_simple.csv'}")

print("\n" + "=" * 80)
print("✅ SIMPLIFIED TRAINING COMPLETE!")
print("=" * 80)
print(f"\n🎯 Best Model: {best_model_name}")
print(f"📈 Accuracy: {results_df.loc[best_idx, 'Accuracy']:.4f} ({results_df.loc[best_idx, 'Accuracy']*100:.2f}%)")
print(f"📊 ROC-AUC: {results_df.loc[best_idx, 'ROC_AUC']:.4f} ({results_df.loc[best_idx, 'ROC_AUC']*100:.2f}%)")
print(f"📝 Features: {len(X.columns)} (15 input + 8 engineered)")
print("\n🚀 Model ready for manual data entry predictions!")
print("=" * 80)
