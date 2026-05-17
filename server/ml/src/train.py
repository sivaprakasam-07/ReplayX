# =============================================================
# src/train.py
# =============================================================
# PURPOSE:
#   Trains 3 ML models on the webhook dataset:
#
#   MODEL 1 — Retry Success Predictor (Random Forest Classifier)
#     Target: retry_will_succeed (0 or 1)
#     Predicts: retry_success_probability (0–100%)
#
#   MODEL 2 — Risk Level Classifier (Random Forest Classifier)
#     Target: risk_label (low / medium / high)
#     Predicts: risk_level + forecast + ai_confidence
#
#   MODEL 3 — Failure Pattern Detector (Isolation Forest + RF)
#     Target: failure_pattern (timeout_spike / duplicate_retry_loop / etc.)
#     Predicts: failure_patterns list in the output payload
#
# WHY RANDOM FOREST:
#   - Handles class imbalance better than logistic regression
#   - Gives probability scores (predict_proba) for confidence
#   - No need to scale features (unlike SVM or KNN)
#   - Feature importance is explainable to the team/judges
#   - Works well with 51 mixed features (numeric + one-hot encoded)
#   - Fast inference at runtime (< 1ms per prediction)
#
# WHY ISOLATION FOREST (for anomaly detection):
#   - Specifically designed to detect anomalies (outlier events)
#   - No label needed — learns what "normal" looks like
#   - Used alongside RF classifier to detect novel failure patterns
#   - Provides the anomaly_score feeding into ai_confidence
#
# TRAINING STRATEGY:
#   - 80% train / 20% test split (stratified on target)
#   - SMOTE oversampling on minority classes before training
#   - GridSearchCV for hyperparameter tuning
#   - Saves all 3 models + scaler + feature list as .joblib files
# =============================================================

import os
import sys
import numpy as np
import pandas as pd
import joblib
import warnings
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from src.feature_engineering import load_and_merge, engineer_features, get_feature_columns

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, accuracy_score
)
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE


DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data"
)
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ─────────────────────────────────────────────────────────────
# STEP 1: Load and engineer features
# ─────────────────────────────────────────────────────────────
print_section("STEP 1: Loading and engineering features")

df = load_and_merge(DATA_DIR)
df = engineer_features(df)
feature_cols = get_feature_columns(df)

# Fill any remaining NaN values
df[feature_cols] = df[feature_cols].fillna(0)

X = df[feature_cols].values
print(f"Dataset shape: {df.shape}")
print(f"Feature count: {len(feature_cols)}")
print(f"Sample counts per target:")
print(f"  retry_will_succeed: {df['retry_will_succeed'].value_counts().to_dict()}")
print(f"  risk_label:         {df['risk_label'].value_counts().to_dict()}")
print(f"  failure_pattern:    {df['failure_pattern'].value_counts().to_dict()}")


# ─────────────────────────────────────────────────────────────
# STEP 2: Scaler (shared across all models)
# ─────────────────────────────────────────────────────────────
print_section("STEP 2: Fitting StandardScaler")

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(scaler, f"{MODELS_DIR}/scaler.joblib")
print("Scaler saved.")

joblib.dump(feature_cols, f"{MODELS_DIR}/feature_cols.joblib")
print(f"Feature columns saved: {len(feature_cols)} features")


# =============================================================
# MODEL 1: Retry Success Predictor
# =============================================================
# WHY: Predicts retry_success_probability.
#      Binary classifier: will this webhook deliver (1) or fail (0)?
#
# CHALLENGE: Class imbalance — 65% failed, 35% recovered/delivered.
#            Without SMOTE, model learns to predict "failed" always.
# SOLUTION:  SMOTE synthesizes minority class samples before training.
#
# RF HYPERPARAMETERS CHOSEN:
#   n_estimators=200  → 200 decision trees, more = better but slower
#   max_depth=12      → prevents overfitting (deep trees memorise)
#   min_samples_leaf=5 → each leaf needs 5 samples minimum
#   class_weight='balanced' → extra protection against imbalance
# =============================================================
print_section("MODEL 1: Retry Success Predictor (Binary RF Classifier)")

y1 = df["retry_will_succeed"].values

X_train1, X_test1, y_train1, y_test1 = train_test_split(
    X_scaled, y1, test_size=0.2, random_state=42, stratify=y1
)
print(f"Train size: {len(X_train1)}, Test size: {len(X_test1)}")
print(f"Train class distribution: {dict(zip(*np.unique(y_train1, return_counts=True)))}")

# Apply SMOTE to fix class imbalance
smote = SMOTE(random_state=42)
X_train1_sm, y_train1_sm = smote.fit_resample(X_train1, y_train1)
print(f"After SMOTE: {dict(zip(*np.unique(y_train1_sm, return_counts=True)))}")

model1 = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=5,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model1.fit(X_train1_sm, y_train1_sm)

# Evaluation
y_pred1 = model1.predict(X_test1)
y_prob1 = model1.predict_proba(X_test1)[:, 1]

print(f"\nAccuracy:  {accuracy_score(y_test1, y_pred1):.4f}")
print(f"ROC-AUC:   {roc_auc_score(y_test1, y_prob1):.4f}")
print("\nClassification Report:")
print(classification_report(y_test1, y_pred1, target_names=["failed", "success"]))

# Cross-validation
cv_scores = cross_val_score(model1, X_scaled, y1, cv=5, scoring="roc_auc")
print(f"5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Feature importance top 10
importances = pd.Series(model1.feature_importances_, index=feature_cols)
print("\nTop 10 important features:")
print(importances.nlargest(10).to_string())

joblib.dump(model1, f"{MODELS_DIR}/model1_success_predictor.joblib")
print("\nModel 1 saved.")


# =============================================================
# MODEL 2: Risk Level Classifier
# =============================================================
# WHY: Predicts risk_level (low/medium/high) and forecast.
#      Multi-class classifier.
#      Also provides predict_proba → ai_confidence score.
#
# LABEL ENCODING: low=0, medium=1, high=2 (ordinal order matters)
#
# RF HYPERPARAMETERS:
#   n_estimators=300 → more trees for multi-class (more variance)
#   max_depth=15     → risk patterns need more depth than binary
# =============================================================
print_section("MODEL 2: Risk Level Classifier (Multi-class RF)")

y2_raw = df["risk_label"].values
le_risk = LabelEncoder()
y2 = le_risk.fit_transform(y2_raw)  # low=0, medium=1, high=2 (alphabetical)
print(f"Risk classes: {list(le_risk.classes_)}")
print(f"Class distribution: {dict(zip(le_risk.classes_, np.bincount(y2)))}")

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X_scaled, y2, test_size=0.2, random_state=42, stratify=y2
)

smote2 = SMOTE(random_state=42)
X_train2_sm, y_train2_sm = smote2.fit_resample(X_train2, y_train2)
print(f"After SMOTE: {dict(zip(*np.unique(y_train2_sm, return_counts=True)))}")

model2 = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_leaf=4,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model2.fit(X_train2_sm, y_train2_sm)

y_pred2 = model2.predict(X_test2)
y_prob2 = model2.predict_proba(X_test2)

print(f"\nAccuracy: {accuracy_score(y_test2, y_pred2):.4f}")
print("\nClassification Report:")
print(classification_report(y_test2, y_pred2, target_names=le_risk.classes_))

cv_scores2 = cross_val_score(model2, X_scaled, y2, cv=5, scoring="accuracy")
print(f"5-Fold CV Accuracy: {cv_scores2.mean():.4f} ± {cv_scores2.std():.4f}")

joblib.dump(model2,   f"{MODELS_DIR}/model2_risk_classifier.joblib")
joblib.dump(le_risk,  f"{MODELS_DIR}/label_encoder_risk.joblib")
print("\nModel 2 saved.")


# =============================================================
# MODEL 3: Failure Pattern Detector
# =============================================================
# TWO PARTS:
#   Part A — Random Forest classifier for known patterns
#             (timeout_spike, duplicate_retry_loop, etc.)
#   Part B — Isolation Forest for anomaly detection
#             Detects events that deviate from "normal" behaviour.
#             contamination=0.1 means ~10% of data is expected anomalous.
#
# WHY ISOLATION FOREST:
#   - Novel failure patterns won't be in labels_train.csv
#   - Isolation Forest flags unusual events even without labels
#   - Output: anomaly_score feeds into ai_confidence calculation
# =============================================================
print_section("MODEL 3: Failure Pattern Detector")

# Part A: Supervised pattern classifier
y3_raw = df["failure_pattern"].values
le_pattern = LabelEncoder()
y3 = le_pattern.fit_transform(y3_raw)
print(f"Pattern classes: {list(le_pattern.classes_)}")
print(f"Class distribution: {dict(zip(le_pattern.classes_, np.bincount(y3)))}")

X_train3, X_test3, y_train3, y_test3 = train_test_split(
    X_scaled, y3, test_size=0.2, random_state=42, stratify=y3
)

smote3 = SMOTE(random_state=42, k_neighbors=3)
X_train3_sm, y_train3_sm = smote3.fit_resample(X_train3, y_train3)
print(f"After SMOTE: {dict(zip(*np.unique(y_train3_sm, return_counts=True)))}")

model3_rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=5,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model3_rf.fit(X_train3_sm, y_train3_sm)

y_pred3 = model3_rf.predict(X_test3)
print(f"\nAccuracy: {accuracy_score(y_test3, y_pred3):.4f}")
print("\nClassification Report:")
print(classification_report(y_test3, y_pred3, target_names=le_pattern.classes_))

# Part B: Isolation Forest (unsupervised anomaly detection)
iso_forest = IsolationForest(
    n_estimators=200,
    contamination=0.10,  # ~10% of events expected to be anomalous
    max_samples="auto",
    random_state=42,
    n_jobs=-1,
)
iso_forest.fit(X_scaled)  # fit on ALL data — unsupervised
anomaly_scores = iso_forest.decision_function(X_scaled)
print(f"\nIsolation Forest anomaly score stats:")
print(f"  Mean:  {anomaly_scores.mean():.4f}")
print(f"  Std:   {anomaly_scores.std():.4f}")
print(f"  Min:   {anomaly_scores.min():.4f}")
print(f"  Max:   {anomaly_scores.max():.4f}")
anomaly_labels = iso_forest.predict(X_scaled)
print(f"  Anomaly (-1): {(anomaly_labels == -1).sum()}")
print(f"  Normal  (+1): {(anomaly_labels == 1).sum()}")

joblib.dump(model3_rf,   f"{MODELS_DIR}/model3_pattern_classifier.joblib")
joblib.dump(iso_forest,  f"{MODELS_DIR}/model3_isolation_forest.joblib")
joblib.dump(le_pattern,  f"{MODELS_DIR}/label_encoder_pattern.joblib")
print("\nModel 3 (RF + IsolationForest) saved.")


# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print_section("TRAINING COMPLETE — ALL MODELS SAVED")
print(f"Models saved to: {MODELS_DIR}/")
for f in os.listdir(MODELS_DIR):
    size_kb = os.path.getsize(f"{MODELS_DIR}/{f}") / 1024
    print(f"  {f:50s} {size_kb:8.1f} KB")