"""
train_model.py
--------------
Complete supervised-learning pipeline for the AI-Based Diabetes Prediction System.

    Dataset -> Loading -> Cleaning -> Missing-value handling -> Encoding ->
    Scaling -> Train/Test split -> Random Forest -> Evaluation -> Persist

Artifacts written to backend/models/:
    diabetes_model.pkl          trained RandomForestClassifier
    preprocessing_pipeline.pkl  fitted imputer + scaler + one-hot encoder
    metrics.json                accuracy / precision / recall / f1 / roc-auc + curves

Artifacts written to src/ml/ (consumed by the web application):
    model.json      portable export of the SAME trained forest + preprocessing constants
    metrics.json    evaluation results
    analytics.json  dataset distributions for the analytics dashboard

Run:  python backend/train_model.py
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(HERE, "data", "diabetes_health.csv")
MODEL_DIR = os.path.join(HERE, "models")
APP_DIR = os.path.join(os.path.dirname(HERE), "src", "ml")

NUMERIC = ["age", "bmi", "blood_pressure", "cholesterol", "glucose"]
CATEGORICAL = ["physical_activity"]
ACTIVITY_ORDER = ["Low", "Moderate", "High"]
RANDOM_STATE = 42


def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_CSV)
    # cleaning: drop duplicates and physiologically impossible readings
    df = df.drop_duplicates()
    df = df[(df["age"].between(18, 120))]
    df.loc[~df["bmi"].between(10, 70), "bmi"] = np.nan
    df.loc[~df["blood_pressure"].between(70, 250), "blood_pressure"] = np.nan
    df.loc[~df["cholesterol"].between(80, 500), "cholesterol"] = np.nan
    df.loc[~df["glucose"].between(40, 500), "glucose"] = np.nan
    df = df.dropna(subset=["glucose", "diabetes"])
    return df.reset_index(drop=True)


def build_preprocessor() -> ColumnTransformer:
    numeric_pipe = Pipeline(
        [("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]
    )
    categorical_pipe = Pipeline(
        [
            ("impute", SimpleImputer(strategy="most_frequent")),
            (
                "encode",
                OneHotEncoder(categories=[ACTIVITY_ORDER], handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )
    return ColumnTransformer(
        [("num", numeric_pipe, NUMERIC), ("cat", categorical_pipe, CATEGORICAL)]
    )


def export_forest(model: RandomForestClassifier) -> list:
    """Portable JSON export of the trained forest (structure + leaf probabilities)."""
    trees = []
    for est in model.estimators_:
        t = est.tree_
        value = t.value.reshape(t.value.shape[0], -1)
        proba = (value / value.sum(axis=1, keepdims=True))[:, 1]
        trees.append(
            {
                "l": t.children_left.tolist(),
                "r": t.children_right.tolist(),
                "f": t.feature.tolist(),
                "t": [round(float(x), 6) for x in t.threshold],
                "p": [round(float(x), 6) for x in proba],
            }
        )
    return trees


def analytics(df: pd.DataFrame) -> dict:
    def histogram(col, bins):
        counts, edges = np.histogram(df[col].dropna(), bins=bins)
        return [
            {"bin": f"{int(edges[i])}-{int(edges[i + 1])}", "count": int(counts[i])}
            for i in range(len(counts))
        ]

    by_activity = (
        df.groupby("physical_activity")["diabetes"].agg(["count", "sum"]).reindex(ACTIVITY_ORDER)
    )
    return {
        "totalRecords": int(len(df)),
        "diabetic": int(df["diabetes"].sum()),
        "nonDiabetic": int((df["diabetes"] == 0).sum()),
        "distributions": {
            "age": histogram("age", [20, 30, 40, 50, 60, 70, 81]),
            "bmi": histogram("bmi", [10, 20, 25, 30, 35, 40, 70]),
            "glucose": histogram("glucose", [40, 80, 100, 126, 160, 200, 500]),
            "blood_pressure": histogram("blood_pressure", [70, 100, 120, 130, 140, 160, 250]),
            "cholesterol": histogram("cholesterol", [80, 150, 180, 200, 240, 280, 500]),
        },
        "physicalActivity": [
            {
                "level": level,
                "count": int(by_activity.loc[level, "count"]),
                "diabetic": int(by_activity.loc[level, "sum"]),
            }
            for level in ACTIVITY_ORDER
        ],
        "meansByClass": {
            col: {
                "diabetic": round(float(df[df["diabetes"] == 1][col].mean()), 2),
                "nonDiabetic": round(float(df[df["diabetes"] == 0][col].mean()), 2),
            }
            for col in NUMERIC
        },
        "correlation": [
            {
                "feature": a,
                "values": [
                    {"feature": b, "value": round(float(df[a].corr(df[b])), 3)}
                    for b in NUMERIC + ["diabetes"]
                ],
            }
            for a in NUMERIC + ["diabetes"]
        ],
    }


def main() -> None:
    df = load_data()
    X = df[NUMERIC + CATEGORICAL]
    y = df["diabetes"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    pre = build_preprocessor()
    X_train_t = pre.fit_transform(X_train)
    X_test_t = pre.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_train_t, y_train)

    y_pred = model.predict(X_test_t)
    y_proba = model.predict_proba(X_test_t)[:, 1]
    cm = confusion_matrix(y_test, y_pred)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    cv = cross_val_score(model, pre.fit_transform(X), y, cv=5, scoring="roc_auc")

    feature_names = NUMERIC + [f"activity_{a}" for a in ACTIVITY_ORDER]
    importances = model.feature_importances_
    grouped = {name: float(importances[i]) for i, name in enumerate(NUMERIC)}
    grouped["physical_activity"] = float(importances[len(NUMERIC) :].sum())

    metrics = {
        "trained": True,
        "trainedAt": pd.Timestamp.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "algorithm": "Random Forest Classifier",
        "problemType": "Binary Classification",
        "dataset": "CDC NHANES 2013-2014 adult health examination data",
        "samples": {"total": int(len(df)), "train": int(len(X_train)), "test": int(len(X_test))},
        "hyperparameters": {
            "n_estimators": 150,
            "max_depth": 8,
            "min_samples_leaf": 4,
            "class_weight": "balanced",
            "random_state": RANDOM_STATE,
        },
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "rocAuc": round(float(roc_auc_score(y_test, y_proba)), 4),
        "crossValRocAuc": {
            "mean": round(float(cv.mean()), 4),
            "std": round(float(cv.std()), 4),
            "folds": [round(float(s), 4) for s in cv],
        },
        "confusionMatrix": {
            "trueNegative": int(cm[0][0]),
            "falsePositive": int(cm[0][1]),
            "falseNegative": int(cm[1][0]),
            "truePositive": int(cm[1][1]),
        },
        "rocCurve": [
            {"fpr": round(float(a), 4), "tpr": round(float(b), 4)}
            for a, b in zip(fpr[:: max(1, len(fpr) // 60)], tpr[:: max(1, len(tpr) // 60)])
        ],
        "featureImportance": sorted(
            [{"feature": k, "importance": round(v, 4)} for k, v in grouped.items()],
            key=lambda d: -d["importance"],
        ),
        "rawFeatureNames": feature_names,
    }

    # ---- persist python artifacts -------------------------------------------------
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(MODEL_DIR, "diabetes_model.pkl"))
    joblib.dump(pre, os.path.join(MODEL_DIR, "preprocessing_pipeline.pkl"))
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as fh:
        json.dump(metrics, fh, indent=2)

    # ---- portable export used by the web application ------------------------------
    num_imputer = pre.named_transformers_["num"].named_steps["impute"]
    scaler = pre.named_transformers_["num"].named_steps["scale"]
    cat_imputer = pre.named_transformers_["cat"].named_steps["impute"]
    export = {
        "version": 1,
        "features": feature_names,
        "numericFeatures": NUMERIC,
        "activityCategories": ACTIVITY_ORDER,
        "preprocessing": {
            "medians": {n: float(v) for n, v in zip(NUMERIC, num_imputer.statistics_)},
            "means": {n: float(v) for n, v in zip(NUMERIC, scaler.mean_)},
            "scales": {n: float(v) for n, v in zip(NUMERIC, scaler.scale_)},
            "activityMostFrequent": str(cat_imputer.statistics_[0]),
        },
        "trees": export_forest(model),
    }

    os.makedirs(APP_DIR, exist_ok=True)
    with open(os.path.join(APP_DIR, "model.json"), "w") as fh:
        json.dump(export, fh)
    with open(os.path.join(APP_DIR, "metrics.json"), "w") as fh:
        json.dump(metrics, fh, indent=2)
    with open(os.path.join(APP_DIR, "analytics.json"), "w") as fh:
        json.dump(analytics(df), fh, indent=2)

    print(json.dumps({k: metrics[k] for k in ["accuracy", "precision", "recall", "f1", "rocAuc"]}, indent=2))
    print(metrics["featureImportance"])
    print(metrics["confusionMatrix"])


if __name__ == "__main__":
    main()
