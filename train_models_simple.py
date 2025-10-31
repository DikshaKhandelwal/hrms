"""
Simple ML Model Training Script
Run directly with: python train_models_simple.py
"""

import os
import sys

# Set environment variable to avoid threadpoolctl issues on Windows
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'

from pathlib import Path

# Add ml_models to path
sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'ml_models'))

from data_preprocessing import AttritionDataPreprocessor
import pandas as pd
import numpy as np

# Simple imports to avoid threadpoolctl issues
import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("🚀 HR ATTRITION PREDICTION - SIMPLE TRAINING")
print("=" * 70)

try:
    import xgboost as xgb
    print("✓ XGBoost imported successfully")
except Exception as e:
    print(f"❌ Error importing XGBoost: {e}")
    sys.exit(1)

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    import joblib
    print("✓ Scikit-learn imported successfully")
except Exception as e:
    print(f"❌ Error importing scikit-learn: {e}")
    sys.exit(1)

# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / 'hr_data.csv'
MODELS_DIR = BASE_DIR / 'backend' / 'ml_models' / 'saved_models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print(f"\n📁 Data path: {DATA_PATH}")
print(f"📁 Models will be saved to: {MODELS_DIR}")

if not DATA_PATH.exists():
    print(f"\n❌ ERROR: hr_data.csv not found at {DATA_PATH}")
    print("Please make sure hr_data.csv is in the /d/hrms directory")
    sys.exit(1)

# Step 1: Load and preprocess data
print("\n" + "=" * 70)
print("📊 Step 1: Loading Data")
print("=" * 70)

preprocessor = AttritionDataPreprocessor()
df = preprocessor.load_data(str(DATA_PATH))

print(f"\nDataset shape: {df.shape}")
print(f"\nAttrition distribution:")
print(df['Attrition'].value_counts())

# Step 2: Prepare data
print("\n" + "=" * 70)
print("🔧 Step 2: Preprocessing Data")
print("=" * 70)

try:
    X_train, X_test, y_train, y_test = preprocessor.prepare_data(
        df,
        target_col='Attrition',
        test_size=0.2,
        balance_method=None,  # Skip SMOTE to avoid threadpoolctl issues
        random_state=42
    )
    print(f"\n✓ Data prepared successfully")
    print(f"Training set: {X_train.shape}")
    print(f"Test set: {X_test.shape}")
except Exception as e:
    print(f"\n❌ Error during preprocessing: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 3: Train XGBoost (Best model)
print("\n" + "=" * 70)
print("🤖 Step 3: Training XGBoost Model")
print("=" * 70)

try:
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.1,
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False,
        n_jobs=1,  # Single thread to avoid issues
        scale_pos_weight=5  # Handle imbalanced data (ratio of negative to positive)
    )
    
    print("Training model (this may take 1-2 minutes)...")
    model.fit(X_train, y_train)
    print("✓ Model trained successfully")
except Exception as e:
    print(f"\n❌ Error during training: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Evaluate
print("\n" + "=" * 70)
print("📈 Step 4: Evaluating Model")
print("=" * 70)

try:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    print(f"\n📊 Model Performance:")
    print(f"   Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"   Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"   Recall:    {recall:.4f} ({recall*100:.2f}%)")
    print(f"   F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print(f"   ROC-AUC:   {roc_auc:.4f} ({roc_auc*100:.2f}%)")
    
    print(f"\n🎯 Interpretation:")
    print(f"   - The model correctly predicts attrition {accuracy*100:.1f}% of the time")
    print(f"   - When it predicts someone will leave, it's right {precision*100:.1f}% of the time")
    print(f"   - It catches {recall*100:.1f}% of people who actually leave")
    
except Exception as e:
    print(f"\n❌ Error during evaluation: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Save models
print("\n" + "=" * 70)
print("💾 Step 5: Saving Models")
print("=" * 70)

try:
    # Save main model
    model_path = MODELS_DIR / 'attrition_model.pkl'
    joblib.dump(model, str(model_path))
    print(f"✓ Saved model to: {model_path}")
    
    # Save preprocessor
    preprocessor_path = MODELS_DIR / 'preprocessor.pkl'
    preprocessor.save_preprocessor(str(preprocessor_path))
    print(f"✓ Saved preprocessor to: {preprocessor_path}")
    
    # Save feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'Feature': preprocessor.feature_names,
            'Importance': model.feature_importances_
        }).sort_values('Importance', ascending=False)
        
        importance_path = MODELS_DIR / 'feature_importance.csv'
        feature_importance.to_csv(importance_path, index=False)
        print(f"✓ Saved feature importance to: {importance_path}")
        
        print(f"\n🔍 Top 10 Most Important Features:")
        for idx, row in feature_importance.head(10).iterrows():
            print(f"   {row['Feature']:30s} {row['Importance']:.4f}")
    
    # Save performance metrics
    metrics = {
        'Model': 'XGBoost',
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1,
        'ROC-AUC': roc_auc
    }
    metrics_df = pd.DataFrame([metrics])
    metrics_path = MODELS_DIR / 'model_performance.csv'
    metrics_df.to_csv(metrics_path, index=False)
    print(f"✓ Saved performance metrics to: {metrics_path}")
    
except Exception as e:
    print(f"\n❌ Error saving models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Success!
print("\n" + "=" * 70)
print("✅ TRAINING COMPLETE!")
print("=" * 70)
print(f"\n📁 Models saved in: {MODELS_DIR}")
print(f"🎯 Model: XGBoost")
print(f"📈 F1-Score: {f1:.4f} ({f1*100:.2f}%)")
print(f"📊 ROC-AUC: {roc_auc:.4f} ({roc_auc*100:.2f}%)")
print("\n🚀 Next Steps:")
print("1. Restart your Python backend:")
print("   cd backend && python main.py")
print("2. The prediction API will now use the trained ML model!")
print("3. Login as recruiter and test predictions in the UI")
print("\n✨ Your ML model is ready to predict attrition!")
print("=" * 70)
