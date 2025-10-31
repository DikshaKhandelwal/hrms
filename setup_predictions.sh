#!/bin/bash

echo "🚀 Setting up Attrition & Performance Prediction System..."
echo ""

# Check if we're in the correct directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the /d/hrms directory"
    exit 1
fi

echo "📦 Installing Python ML dependencies..."
cd backend
pip install numpy pandas scikit-learn joblib
if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "🗄️  Next steps:"
echo "1. Run the database migration:"
echo "   - Go to Supabase SQL Editor"
echo "   - Copy contents of supabase/ADD_PREDICTION_VIEWS.sql"
echo "   - Execute the SQL"
echo ""
echo "2. Start the Python backend:"
echo "   cd backend && python main.py"
echo ""
echo "3. Start the frontend (if not running):"
echo "   npm run dev"
echo ""
echo "4. Login as recruiter and click 'Predictions' in the nav bar"
echo ""
echo "✨ Setup complete! Check PREDICTION_SYSTEM_SETUP.md for full documentation."
