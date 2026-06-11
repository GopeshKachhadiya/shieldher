import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from data.dataset_generator import generate_dummy_dataset
from models.random_forest import PhishingRandomForest
from features.extractor import FEATURE_NAMES

def main():
    print("Generating dummy dataset with 10,000 samples...")
    df = generate_dummy_dataset(10000)
    
    X = df[FEATURE_NAMES]
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    model = PhishingRandomForest()
    model.train(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    os.makedirs('saved_models', exist_ok=True)
    model_path = 'saved_models/rf_model.pkl'
    model.save(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    main()
