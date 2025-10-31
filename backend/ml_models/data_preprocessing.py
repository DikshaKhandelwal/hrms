"""
Data Preprocessing for HR Attrition Prediction
Handles data cleaning, feature engineering, encoding, and balancing
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import joblib
from typing import Tuple, Optional

class AttritionDataPreprocessor:
    """Preprocessor for HR attrition dataset"""
    
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = []
        
    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load HR data from CSV"""
        print(f"Loading data from {filepath}...")
        df = pd.read_csv(filepath)
        print(f"Loaded {len(df)} rows with {len(df.columns)} columns")
        return df
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare data"""
        df = df.copy()
        
        # Drop unnecessary columns
        cols_to_drop = ['EmployeeCount', 'EmployeeNumber', 'Over18', 'StandardHours']
        df = df.drop([col for col in cols_to_drop if col in df.columns], axis=1)
        
        # Handle missing values
        df = df.dropna()
        
        print(f"After cleaning: {len(df)} rows, {len(df.columns)} columns")
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features"""
        df = df.copy()
        
        # Tenure-related features
        if 'YearsAtCompany' in df.columns and 'Age' in df.columns:
            df['TenureRatio'] = df['YearsAtCompany'] / (df['Age'] - 18 + 1)
        
        # Promotion frequency
        if 'YearsAtCompany' in df.columns and 'YearsSinceLastPromotion' in df.columns:
            df['PromotionFrequency'] = df['YearsAtCompany'] / (df['YearsSinceLastPromotion'] + 1)
        
        # Income to age ratio
        if 'MonthlyIncome' in df.columns and 'Age' in df.columns:
            df['IncomeAgeRatio'] = df['MonthlyIncome'] / df['Age']
        
        # Work-life balance score
        if 'WorkLifeBalance' in df.columns and 'OverTime' in df.columns:
            df['WorkLifeScore'] = df['WorkLifeBalance']
            df.loc[df['OverTime'] == 'Yes', 'WorkLifeScore'] -= 1
        
        # Job satisfaction composite
        satisfaction_cols = ['JobSatisfaction', 'EnvironmentSatisfaction', 'RelationshipSatisfaction']
        if all(col in df.columns for col in satisfaction_cols):
            df['OverallSatisfaction'] = df[satisfaction_cols].mean(axis=1)
        
        return df
    
    def encode_features(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """Encode categorical variables"""
        df = df.copy()
        
        # Identify categorical columns
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        # Remove target if present
        if 'Attrition' in categorical_cols:
            categorical_cols.remove('Attrition')
        
        # Encode each categorical column
        for col in categorical_cols:
            if is_training:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    # Handle unseen labels
                    df[col] = df[col].apply(lambda x: x if x in le.classes_ else le.classes_[0])
                    df[col] = le.transform(df[col].astype(str))
        
        return df
    
    def prepare_data(
        self,
        df: pd.DataFrame,
        target_col: str = 'Attrition',
        test_size: float = 0.2,
        balance_method: Optional[str] = 'smote',
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Complete preprocessing pipeline
        
        Args:
            df: Input dataframe
            target_col: Name of target column
            test_size: Proportion of test set
            balance_method: 'smote', 'oversample', or None
            random_state: Random seed
            
        Returns:
            X_train, X_test, y_train, y_test
        """
        print("\n=== Starting Data Preprocessing ===")
        
        # Clean data
        df = self.clean_data(df)
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Separate target
        if target_col in df.columns:
            y = df[target_col].map({'Yes': 1, 'No': 0})
            X = df.drop(target_col, axis=1)
        else:
            raise ValueError(f"Target column '{target_col}' not found")
        
        # Encode features
        X = self.encode_features(X, is_training=True)
        
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"\nOriginal split - Train: {len(X_train)}, Test: {len(X_test)}")
        print(f"Class distribution in train: {y_train.value_counts().to_dict()}")
        
        # Balance training data
        if balance_method == 'smote':
            print("\nApplying SMOTE for balancing...")
            smote = SMOTE(random_state=random_state)
            X_train, y_train = smote.fit_resample(X_train, y_train)
            print(f"After SMOTE - Train: {len(X_train)}")
            print(f"Class distribution: {pd.Series(y_train).value_counts().to_dict()}")
        
        # Scale features
        print("\nScaling features...")
        X_train = pd.DataFrame(
            self.scaler.fit_transform(X_train),
            columns=self.feature_names
        )
        X_test = pd.DataFrame(
            self.scaler.transform(X_test),
            columns=self.feature_names
        )
        
        print("\n=== Preprocessing Complete ===\n")
        
        return X_train, X_test, y_train, y_test
    
    def transform_new_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform new data using fitted preprocessors"""
        df = df.copy()
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Encode features
        df = self.encode_features(df, is_training=False)
        
        # Ensure all features are present
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0
        
        # Select and order features
        df = df[self.feature_names]
        
        # Scale
        df_scaled = pd.DataFrame(
            self.scaler.transform(df),
            columns=self.feature_names,
            index=df.index
        )
        
        return df_scaled
    
    def save_preprocessor(self, filepath: str):
        """Save preprocessor state"""
        state = {
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }
        joblib.dump(state, filepath)
        print(f"Saved preprocessor to {filepath}")
    
    def load_preprocessor(self, filepath: str):
        """Load preprocessor state"""
        state = joblib.load(filepath)
        self.label_encoders = state['label_encoders']
        self.scaler = state['scaler']
        self.feature_names = state['feature_names']
        print(f"Loaded preprocessor from {filepath}")
