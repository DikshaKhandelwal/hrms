#!/bin/bash

echo "🚀 Starting ML Model Training for HR Attrition Prediction"
echo "=" 

# Check if we're in the correct directory
if [ ! -f "hr_data.csv" ]; then
    echo "❌ Error: hr_data.csv not found!"
    echo "Please make sure you're running this from /d/hrms directory"
    exit 1
fi

echo "📦 Step 1: Installing ML dependencies..."
cd backend
pip install xgboost imbalanced-learn numpy pandas scikit-learn joblib

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🤖 Step 2: Training models (this may take a few minutes)..."
python ml_models/train_models.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Models trained and saved"
    echo ""
    echo "📁 Models saved in: backend/ml_models/saved_models/"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your Python backend: python backend/main.py"
    echo "2. The prediction API will now use the trained ML models!"
    echo ""
else
    echo ""
    echo "❌ Training failed. Check the error messages above."
    exit 1
fi
