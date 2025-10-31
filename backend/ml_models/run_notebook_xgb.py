"""
Train XGBoost following the notebook training pipeline (02_model_training_pipeline.ipynb)
- Use AttritionDataPreprocessor.prepare_data(..., balance_method='smote', test_size=0.2)
- Train XGBClassifier with hyperparams from model_training.py
- Save model and preprocessor
"""

from pathlib import Path
from src.data_preprocessing import AttritionDataPreprocessor
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib

BASE_DIR = Path(__file__).resolve().parents[0]
models_dir = BASE_DIR / 'models'
models_dir.mkdir(parents=True, exist_ok=True)

print('\nStarting notebook-style XGBoost training...')

# Preprocess
preprocessor = AttritionDataPreprocessor()
df = preprocessor.load_data(str(BASE_DIR / 'hr_data.csv'))
X_train, X_test, y_train, y_test = preprocessor.prepare_data(df, target_col='Attrition', test_size=0.2, balance_method='smote', random_state=42)

print(f"Training set: {X_train.shape}, Test set: {X_test.shape}")

# Train XGBoost with parameters used in model_training
xgb_model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss',
    use_label_encoder=False
)

xgb_model.fit(X_train, y_train)

# Evaluate
y_pred = xgb_model.predict(X_test)
y_proba = xgb_model.predict_proba(X_test)[:,1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print('\nXGBoost Evaluation:')
print(f'Accuracy: {acc:.4f}')
print(f'Precision: {prec:.4f}')
print(f'Recall: {rec:.4f}')
print(f'F1: {f1:.4f}')
print('\nClassification Report:')
print(classification_report(y_test, y_pred))

# Save model and preprocessor
joblib.dump(xgb_model, str(models_dir / 'notebook_xgboost_model.pkl'))
preprocessor.save_preprocessor(str(models_dir / 'notebook_preprocessor_for_xgb.pkl'))

print(f"\nSaved XGBoost model to {models_dir / 'notebook_xgboost_model.pkl'}")
print(f"Saved preprocessor to {models_dir / 'notebook_preprocessor_for_xgb.pkl'}")
