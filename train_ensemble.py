"""
Ultimate ML Training - Ensemble Voting for Maximum Accuracy
Combines multiple models for better predictions
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
print("🚀 ULTIMATE ML TRAINING - ENSEMBLE APPROACH")
print("=" * 80)

# Load the enhanced preprocessor from previous run
try:
    import joblib
    from data_preprocessing import AttritionDataPreprocessor
    import xgboost as xgb
    from sklearn.ensemble import (
        RandomForestClassifier, GradientBoostingClassifier,
        VotingClassifier, StackingClassifier
    )
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, classification_report, confusion_matrix
    )
    print("✓ All libraries imported")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Paths
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / 'backend' / 'ml_models' / 'saved_models'

# Load preprocessor and data
print("\n📊 Loading preprocessed data...")
preprocessor_path = MODELS_DIR / 'preprocessor.pkl'

if not preprocessor_path.exists():
    print("❌ Run train_models_enhanced.py first to create preprocessor")
    sys.exit(1)

preprocessor_state = joblib.load(str(preprocessor_path))

# Reload and preprocess data
from train_models_enhanced import EnhancedPreprocessor
DATA_PATH = BASE_DIR / 'hr_data.csv'

preprocessor = EnhancedPreprocessor()
preprocessor.label_encoders = preprocessor_state['label_encoders']
preprocessor.scaler = preprocessor_state['scaler']
preprocessor.feature_names = preprocessor_state['feature_names']

df = preprocessor.load_data(str(DATA_PATH))
X_train, X_test, y_train, y_test = preprocessor.prepare_data(
    df, target_col='Attrition', test_size=0.2, balance_method=None, random_state=42
)

print(f"Training: {X_train.shape}, Test: {X_test.shape}")

# Calculate class weight
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

# Create base models with different strengths
print("\n🤖 Creating Base Models...")

base_models = {
    'xgb1': xgb.XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        scale_pos_weight=scale_pos_weight, random_state=42,
        eval_metric='logloss', use_label_encoder=False, n_jobs=1
    ),
    'xgb2': xgb.XGBClassifier(
        n_estimators=250, max_depth=6, learning_rate=0.08,
        scale_pos_weight=scale_pos_weight, random_state=123,
        eval_metric='logloss', use_label_encoder=False, n_jobs=1
    ),
    'rf': RandomForestClassifier(
        n_estimators=300, max_depth=12, min_samples_split=8,
        class_weight='balanced', random_state=42, n_jobs=1
    ),
    'gb': GradientBoostingClassifier(
        n_estimators=200, max_depth=5, learning_rate=0.05,
        random_state=42
    )
}

# Train base models
print("\n🔄 Training Base Models...")
for name, model in base_models.items():
    print(f"  Training {name}...", end=' ')
    model.fit(X_train, y_train)
    print("✓")

# Method 1: Soft Voting Ensemble
print("\n🎯 Creating Soft Voting Ensemble...")
voting_clf = VotingClassifier(
    estimators=list(base_models.items()),
    voting='soft',
    n_jobs=1
)
voting_clf.fit(X_train, y_train)
print("✓ Voting Ensemble trained")

# Method 2: Stacking Ensemble
print("\n📚 Creating Stacking Ensemble...")
stacking_clf = StackingClassifier(
    estimators=list(base_models.items()),
    final_estimator=LogisticRegression(max_iter=1000, class_weight='balanced'),
    cv=3,
    n_jobs=1
)
stacking_clf.fit(X_train, y_train)
print("✓ Stacking Ensemble trained")

# Evaluate all models
print("\n" + "=" * 80)
print("📈 EVALUATION RESULTS")
print("=" * 80)

all_models = {
    **base_models,
    'Voting_Ensemble': voting_clf,
    'Stacking_Ensemble': stacking_clf
}

results = []

for name, model in all_models.items():
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    results.append({
        'Model': name,
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1,
        'ROC-AUC': roc_auc
    })
    
    print(f"\n{name}:")
    print(f"  Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    print(f"  Confusion: TN={tn}, FP={fp}, FN={fn}, TP={tp}")

# Select best
print("\n" + "=" * 80)
print("🏆 BEST MODEL SELECTION")
print("=" * 80)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('ROC-AUC', ascending=False)

print("\n📊 Final Comparison (by ROC-AUC):")
print(results_df.to_string(index=False))

best_idx = 0
best_model_name = results_df.iloc[best_idx]['Model']
best_model = all_models[best_model_name]

print(f"\n🥇 WINNER: {best_model_name}")
print(f"   Accuracy:  {results_df.iloc[best_idx]['Accuracy']:.4f} ({results_df.iloc[best_idx]['Accuracy']*100:.2f}%)")
print(f"   F1-Score:  {results_df.iloc[best_idx]['F1-Score']:.4f}")
print(f"   ROC-AUC:   {results_df.iloc[best_idx]['ROC-AUC']:.4f} ({results_df.iloc[best_idx]['ROC-AUC']*100:.2f}%)")

# Save
print("\n💾 Saving best model...")
best_path = MODELS_DIR / 'attrition_model.pkl'
joblib.dump(best_model, str(best_path))
print(f"✓ Saved: {best_path}")

# Save comparison
results_df.to_csv(MODELS_DIR / 'ensemble_comparison.csv', index=False)

# Save performance
new_performance = results_df.iloc[best_idx].to_dict()
pd.DataFrame([new_performance]).to_csv(MODELS_DIR / 'model_performance.csv', index=False)

print("\n" + "=" * 80)
print("✅ ULTIMATE TRAINING COMPLETE!")
print("=" * 80)
print(f"\n🎯 Final Model: {best_model_name}")
print(f"📈 Accuracy: {results_df.iloc[best_idx]['Accuracy']*100:.2f}%")
print(f"📊 ROC-AUC: {results_df.iloc[best_idx]['ROC-AUC']*100:.2f}%")
print(f"\n✨ This model combines multiple algorithms for maximum accuracy!")
print(f"🚀 Restart backend: cd backend && python main.py")
print("=" * 80)
