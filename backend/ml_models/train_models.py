"""
Train ML Models for Attrition Prediction
Trains XGBoost, Random Forest, and Logistic Regression models
Compares performance and saves the best model
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from data_preprocessing import AttritionDataPreprocessor
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix
)
import joblib
import pandas as pd
import numpy as np

# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR.parent.parent / 'hr_data.csv'
MODELS_DIR = BASE_DIR / 'saved_models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 70)
print("🚀 HR ATTRITION PREDICTION - MODEL TRAINING PIPELINE")
print("=" * 70)

# Step 1: Load and preprocess data
print("\n📊 Step 1: Loading and Preprocessing Data")
print("-" * 70)

preprocessor = AttritionDataPreprocessor()
df = preprocessor.load_data(str(DATA_PATH))

print(f"\nDataset shape: {df.shape}")
print(f"\nAttrition distribution:")
print(df['Attrition'].value_counts())
print(f"\nAttrition rate: {(df['Attrition'] == 'Yes').sum() / len(df) * 100:.2f}%")

# Prepare data with SMOTE balancing
X_train, X_test, y_train, y_test = preprocessor.prepare_data(
    df,
    target_col='Attrition',
    test_size=0.2,
    balance_method='smote',
    random_state=42
)

print(f"\nFinal training shape: {X_train.shape}")
print(f"Final test shape: {X_test.shape}")
print(f"\nFeatures used: {len(preprocessor.feature_names)}")

# Step 2: Train Multiple Models
print("\n" + "=" * 70)
print("🤖 Step 2: Training Multiple Models")
print("=" * 70)

models = {}
results = []

# Model 1: XGBoost (Best for imbalanced data)
print("\n[1/4] Training XGBoost Classifier...")
xgb_model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    gamma=0.1,
    min_child_weight=1,
    random_state=42,
    eval_metric='logloss',
    use_label_encoder=False
)
xgb_model.fit(X_train, y_train)
models['XGBoost'] = xgb_model
print("✓ XGBoost training complete")

# Model 2: Random Forest
print("\n[2/4] Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=10,
    min_samples_leaf=4,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)
models['RandomForest'] = rf_model
print("✓ Random Forest training complete")

# Model 3: Gradient Boosting
print("\n[3/4] Training Gradient Boosting Classifier...")
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42
)
gb_model.fit(X_train, y_train)
models['GradientBoosting'] = gb_model
print("✓ Gradient Boosting training complete")

# Model 4: Logistic Regression (Baseline)
print("\n[4/4] Training Logistic Regression (Baseline)...")
lr_model = LogisticRegression(
    max_iter=1000,
    random_state=42,
    class_weight='balanced'
)
lr_model.fit(X_train, y_train)
models['LogisticRegression'] = lr_model
print("✓ Logistic Regression training complete")

# Step 3: Evaluate All Models
print("\n" + "=" * 70)
print("📈 Step 3: Model Evaluation")
print("=" * 70)

for model_name, model in models.items():
    print(f"\n{'=' * 70}")
    print(f"Model: {model_name}")
    print("-" * 70)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    results.append({
        'Model': model_name,
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1,
        'ROC-AUC': roc_auc
    })
    
    print(f"\n📊 Performance Metrics:")
    print(f"   Accuracy:  {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall:    {recall:.4f}")
    print(f"   F1-Score:  {f1:.4f}")
    print(f"   ROC-AUC:   {roc_auc:.4f}")
    
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Attrition', 'Attrition']))
    
    print(f"\n🎯 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"   [[TN={cm[0,0]}, FP={cm[0,1]}]")
    print(f"    [FN={cm[1,0]}, TP={cm[1,1]}]]")

# Step 4: Compare Models
print("\n" + "=" * 70)
print("🏆 Step 4: Model Comparison")
print("=" * 70)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('F1-Score', ascending=False)

print("\n📊 All Models Performance:")
print(results_df.to_string(index=False))

best_model_name = results_df.iloc[0]['Model']
best_model = models[best_model_name]

print(f"\n🥇 Best Model: {best_model_name}")
print(f"   F1-Score: {results_df.iloc[0]['F1-Score']:.4f}")
print(f"   ROC-AUC: {results_df.iloc[0]['ROC-AUC']:.4f}")

# Step 5: Feature Importance
print("\n" + "=" * 70)
print("🔍 Step 5: Feature Importance Analysis")
print("=" * 70)

if hasattr(best_model, 'feature_importances_'):
    feature_importance = pd.DataFrame({
        'Feature': preprocessor.feature_names,
        'Importance': best_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print("\n📊 Top 15 Most Important Features:")
    print(feature_importance.head(15).to_string(index=False))

# Step 6: Save Models
print("\n" + "=" * 70)
print("💾 Step 6: Saving Models")
print("=" * 70)

# Save all models
for model_name, model in models.items():
    model_path = MODELS_DIR / f'{model_name.lower()}_model.pkl'
    joblib.dump(model, str(model_path))
    print(f"✓ Saved {model_name} to {model_path}")

# Save preprocessor
preprocessor_path = MODELS_DIR / 'preprocessor.pkl'
preprocessor.save_preprocessor(str(preprocessor_path))

# Save best model with special name
best_model_path = MODELS_DIR / 'attrition_model.pkl'
joblib.dump(best_model, str(best_model_path))
print(f"\n🌟 Best model saved as: {best_model_path}")

# Save results summary
results_path = MODELS_DIR / 'model_comparison.csv'
results_df.to_csv(results_path, index=False)
print(f"📊 Results summary saved to: {results_path}")

# Save feature importance
if hasattr(best_model, 'feature_importances_'):
    feature_importance_path = MODELS_DIR / 'feature_importance.csv'
    feature_importance.to_csv(feature_importance_path, index=False)
    print(f"🔍 Feature importance saved to: {feature_importance_path}")

print("\n" + "=" * 70)
print("✅ TRAINING COMPLETE!")
print("=" * 70)
print(f"\n📁 Models saved in: {MODELS_DIR}")
print(f"🎯 Best model: {best_model_name}")
print(f"📈 F1-Score: {results_df.iloc[0]['F1-Score']:.4f}")
print(f"📊 ROC-AUC: {results_df.iloc[0]['ROC-AUC']:.4f}")
print("\n✨ Models are ready to use for predictions!")
print("=" * 70)
