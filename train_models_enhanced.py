"""
Enhanced ML Model Training with Hyperparameter Tuning
Focus on improving accuracy through better feature engineering and model optimization
"""

import os
import sys
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'

from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'ml_models'))

from data_preprocessing import AttritionDataPreprocessor
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("🚀 ENHANCED ML TRAINING - ACCURACY OPTIMIZATION")
print("=" * 80)

try:
    import xgboost as xgb
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, 
        roc_auc_score, classification_report, confusion_matrix
    )
    from sklearn.model_selection import GridSearchCV, cross_val_score
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

# Step 1: Enhanced Preprocessing
print("\n" + "=" * 80)
print("📊 Step 1: Enhanced Data Preprocessing")
print("=" * 80)

class EnhancedPreprocessor(AttritionDataPreprocessor):
    """Enhanced preprocessor with better feature engineering"""
    
    def engineer_features(self, df):
        """Enhanced feature engineering"""
        df = super().engineer_features(df)
        
        # Job satisfaction metrics
        if 'JobSatisfaction' in df.columns:
            df['IsUnsatisfied'] = (df['JobSatisfaction'] <= 2).astype(int)
        
        # Environment satisfaction
        if 'EnvironmentSatisfaction' in df.columns:
            df['PoorEnvironment'] = (df['EnvironmentSatisfaction'] <= 2).astype(int)
        
        # Relationship satisfaction
        if 'RelationshipSatisfaction' in df.columns:
            df['PoorRelationships'] = (df['RelationshipSatisfaction'] <= 2).astype(int)
        
        # Work-life balance flag
        if 'WorkLifeBalance' in df.columns:
            df['PoorWorkLife'] = (df['WorkLifeBalance'] <= 2).astype(int)
        
        # Low income flag
        if 'MonthlyIncome' in df.columns:
            median_income = df['MonthlyIncome'].median()
            df['BelowMedianIncome'] = (df['MonthlyIncome'] < median_income).astype(int)
        
        # Recent hire
        if 'YearsAtCompany' in df.columns:
            df['IsNewHire'] = (df['YearsAtCompany'] <= 2).astype(int)
            df['IsLongTenure'] = (df['YearsAtCompany'] >= 10).astype(int)
        
        # Career progression
        if 'YearsSinceLastPromotion' in df.columns and 'YearsAtCompany' in df.columns:
            df['StagnantCareer'] = ((df['YearsSinceLastPromotion'] > 5) & 
                                   (df['YearsAtCompany'] > 5)).astype(int)
        
        # High distance from home
        if 'DistanceFromHome' in df.columns:
            df['LongCommute'] = (df['DistanceFromHome'] > 15).astype(int)
        
        # Low training
        if 'TrainingTimesLastYear' in df.columns:
            df['LowTraining'] = (df['TrainingTimesLastYear'] <= 1).astype(int)
        
        # Age groups
        if 'Age' in df.columns:
            df['AgeGroup'] = pd.cut(df['Age'], 
                                    bins=[0, 30, 40, 50, 100],
                                    labels=[0, 1, 2, 3])
            df['AgeGroup'] = df['AgeGroup'].fillna(1).astype(int)
        
        # Experience levels
        if 'TotalWorkingYears' in df.columns:
            df['ExperienceLevel'] = pd.cut(df['TotalWorkingYears'],
                                          bins=[0, 5, 10, 20, 100],
                                          labels=[0, 1, 2, 3])
            df['ExperienceLevel'] = df['ExperienceLevel'].fillna(1).astype(int)
        
        return df
    
    def transform_new_data(self, df):
        """Transform new data using fitted preprocessor (for predictions)"""
        # Engineer features
        df = self.engineer_features(df)
        
        # Encode categorical features using fitted encoders
        df = self.encode_features(df)
        
        # Select features in the same order as training
        if self.feature_names:
            # Drop target column if present
            if 'Attrition' in df.columns:
                df = df.drop('Attrition', axis=1)
            
            # Ensure all required features exist
            for feature in self.feature_names:
                if feature not in df.columns:
                    df[feature] = 0  # Default value for missing features
            
            # Select and reorder
            df = df[self.feature_names]
        
        # Scale features using fitted scaler
        X_scaled = self.scaler.transform(df)
        
        return X_scaled

preprocessor = EnhancedPreprocessor()
df = preprocessor.load_data(str(DATA_PATH))

print(f"\nDataset: {df.shape}")
print(f"Attrition rate: {(df['Attrition'] == 'Yes').sum() / len(df) * 100:.2f}%")

X_train, X_test, y_train, y_test = preprocessor.prepare_data(
    df, target_col='Attrition', test_size=0.2, balance_method=None, random_state=42
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")
print(f"Features: {len(preprocessor.feature_names)}")

# Calculate class weights for imbalanced data
neg_count = (y_train == 0).sum()
pos_count = (y_train == 1).sum()
scale_pos_weight = neg_count / pos_count
print(f"\nClass imbalance ratio: {scale_pos_weight:.2f}:1")

# Step 2: Train Multiple Models
print("\n" + "=" * 80)
print("🤖 Step 2: Training Multiple Models")
print("=" * 80)

models_to_train = {}

# Model 1: XGBoost with optimized parameters
print("\n[1/4] Training XGBoost with optimized parameters...")
xgb_model = xgb.XGBClassifier(
    n_estimators=300,  # More trees
    max_depth=5,       # Slightly shallower to prevent overfitting
    learning_rate=0.05, # Slower learning
    subsample=0.8,
    colsample_bytree=0.8,
    gamma=1,           # More regularization
    min_child_weight=3,
    reg_alpha=0.1,     # L1 regularization
    reg_lambda=1.0,    # L2 regularization
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    eval_metric='logloss',
    use_label_encoder=False,
    n_jobs=1
)
xgb_model.fit(X_train, y_train)
models_to_train['XGBoost_Optimized'] = xgb_model
print("✓ XGBoost trained")

# Model 2: XGBoost aggressive (more focus on recall)
print("\n[2/4] Training XGBoost (Recall-focused)...")
xgb_recall = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=7,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    gamma=0.5,
    min_child_weight=1,
    scale_pos_weight=scale_pos_weight * 1.5,  # More weight to positive class
    random_state=42,
    eval_metric='logloss',
    use_label_encoder=False,
    n_jobs=1
)
xgb_recall.fit(X_train, y_train)
models_to_train['XGBoost_Recall'] = xgb_recall
print("✓ XGBoost Recall trained")

# Model 3: Random Forest
print("\n[3/4] Training Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_split=8,
    min_samples_leaf=2,
    max_features='sqrt',
    class_weight='balanced',
    random_state=42,
    n_jobs=1
)
rf_model.fit(X_train, y_train)
models_to_train['RandomForest'] = rf_model
print("✓ Random Forest trained")

# Model 4: Gradient Boosting
print("\n[4/4] Training Gradient Boosting...")
gb_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
gb_model.fit(X_train, y_train)
models_to_train['GradientBoosting'] = gb_model
print("✓ Gradient Boosting trained")

# Step 3: Evaluate and Compare
print("\n" + "=" * 80)
print("📈 Step 3: Model Evaluation & Comparison")
print("=" * 80)

results = []

for name, model in models_to_train.items():
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    # Cross-validation score
    cv_scores = cross_val_score(model, X_train, y_train, cv=3, scoring='roc_auc', n_jobs=1)
    cv_mean = cv_scores.mean()
    
    results.append({
        'Model': name,
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1,
        'ROC-AUC': roc_auc,
        'CV_ROC-AUC': cv_mean
    })
    
    print(f"\n{'='*80}")
    print(f"Model: {name}")
    print(f"{'-'*80}")
    print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
    print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print(f"ROC-AUC:   {roc_auc:.4f} ({roc_auc*100:.2f}%)")
    print(f"CV ROC-AUC: {cv_mean:.4f} ({cv_mean*100:.2f}%)")
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"  TN={cm[0,0]:3d}  FP={cm[0,1]:3d}")
    print(f"  FN={cm[1,0]:3d}  TP={cm[1,1]:3d}")

# Step 4: Select Best Model
print("\n" + "=" * 80)
print("🏆 Step 4: Best Model Selection")
print("=" * 80)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('ROC-AUC', ascending=False)

print("\n📊 Model Comparison (sorted by ROC-AUC):")
print(results_df.to_string(index=False))

best_idx = results_df['ROC-AUC'].idxmax()
best_model_name = results_df.loc[best_idx, 'Model']
best_model = models_to_train[best_model_name]

print(f"\n🥇 Best Model: {best_model_name}")
print(f"   Accuracy:  {results_df.loc[best_idx, 'Accuracy']:.4f}")
print(f"   F1-Score:  {results_df.loc[best_idx, 'F1-Score']:.4f}")
print(f"   ROC-AUC:   {results_df.loc[best_idx, 'ROC-AUC']:.4f}")

# Also select best for recall (catching attrition)
best_recall_idx = results_df['Recall'].idxmax()
best_recall_name = results_df.loc[best_recall_idx, 'Model']
print(f"\n🎯 Best for Catching Attrition: {best_recall_name}")
print(f"   Recall:    {results_df.loc[best_recall_idx, 'Recall']:.4f}")
print(f"   ROC-AUC:   {results_df.loc[best_recall_idx, 'ROC-AUC']:.4f}")

# Step 5: Feature Importance
print("\n" + "=" * 80)
print("🔍 Step 5: Feature Importance Analysis")
print("=" * 80)

if hasattr(best_model, 'feature_importances_'):
    feature_importance = pd.DataFrame({
        'Feature': preprocessor.feature_names,
        'Importance': best_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print(f"\n📊 Top 20 Most Important Features ({best_model_name}):")
    for idx, row in feature_importance.head(20).iterrows():
        bar_length = int(row['Importance'] * 100)
        bar = '█' * bar_length
        print(f"  {row['Feature']:30s} {bar} {row['Importance']:.4f}")

# Step 6: Save Models
print("\n" + "=" * 80)
print("💾 Step 6: Saving Best Models")
print("=" * 80)

# Save best overall model
best_path = MODELS_DIR / 'attrition_model.pkl'
joblib.dump(best_model, str(best_path))
print(f"✓ Best model saved: {best_path}")

# Save best recall model (if different)
if best_recall_name != best_model_name:
    recall_path = MODELS_DIR / 'attrition_model_recall.pkl'
    joblib.dump(models_to_train[best_recall_name], str(recall_path))
    print(f"✓ Recall-focused model saved: {recall_path}")

# Save preprocessor
preprocessor_path = MODELS_DIR / 'preprocessor.pkl'
preprocessor.save_preprocessor(str(preprocessor_path))
print(f"✓ Preprocessor saved: {preprocessor_path}")

# Save all results
results_path = MODELS_DIR / 'model_comparison.csv'
results_df.to_csv(results_path, index=False)
print(f"✓ Comparison saved: {results_path}")

if hasattr(best_model, 'feature_importances_'):
    importance_path = MODELS_DIR / 'feature_importance.csv'
    feature_importance.to_csv(importance_path, index=False)
    print(f"✓ Feature importance saved: {importance_path}")

# Step 7: Improvement Summary
print("\n" + "=" * 80)
print("📊 IMPROVEMENT SUMMARY")
print("=" * 80)

# Load old performance
old_performance_path = MODELS_DIR / 'model_performance.csv'
if old_performance_path.exists():
    old_perf = pd.read_csv(old_performance_path)
    old_acc = old_perf['Accuracy'].values[0]
    old_auc = old_perf['ROC-AUC'].values[0]
    
    new_acc = results_df.loc[best_idx, 'Accuracy']
    new_auc = results_df.loc[best_idx, 'ROC-AUC']
    
    acc_improvement = (new_acc - old_acc) * 100
    auc_improvement = (new_auc - old_auc) * 100
    
    print(f"\n🔄 Before → After:")
    print(f"   Accuracy:  {old_acc:.4f} → {new_acc:.4f} ({acc_improvement:+.2f}%)")
    print(f"   ROC-AUC:   {old_auc:.4f} → {new_auc:.4f} ({auc_improvement:+.2f}%)")

# Save new performance
new_performance = results_df.loc[best_idx].to_dict()
new_perf_df = pd.DataFrame([new_performance])
new_perf_df.to_csv(MODELS_DIR / 'model_performance.csv', index=False)

print("\n" + "=" * 80)
print("✅ ENHANCED TRAINING COMPLETE!")
print("=" * 80)
print(f"\n🎯 Best Model: {best_model_name}")
print(f"📈 Accuracy: {results_df.loc[best_idx, 'Accuracy']:.4f} ({results_df.loc[best_idx, 'Accuracy']*100:.2f}%)")
print(f"📊 ROC-AUC: {results_df.loc[best_idx, 'ROC-AUC']:.4f} ({results_df.loc[best_idx, 'ROC-AUC']*100:.2f}%)")
print(f"\n🚀 Restart backend to use the improved model:")
print(f"   cd backend && python main.py")
print("=" * 80)
