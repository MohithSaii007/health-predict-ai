"""
prediction.py
-------------
Prediction service: loads the trained Random Forest and returns the predicted
class together with the probability of the positive class. No value returned by
this module is hardcoded — everything comes from the trained model.
"""

import json
import os
from typing import Any, Dict

import joblib

from preprocessing import PipelineUnavailable, transform

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "models", "diabetes_model.pkl")
METRICS_PATH = os.path.join(HERE, "models", "metrics.json")

_model = None


class ModelUnavailable(RuntimeError):
    """Raised when the trained model file is missing."""


def load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise ModelUnavailable(
                "diabetes_model.pkl not found — run `python train_model.py` first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def load_metrics() -> Dict[str, Any]:
    if not os.path.exists(METRICS_PATH):
        return {"trained": False, "message": "Model metrics will appear after model training."}
    with open(METRICS_PATH) as fh:
        return json.load(fh)


def risk_level(risk_percentage: float) -> str:
    if risk_percentage < 20:
        return "Low"
    if risk_percentage < 50:
        return "Moderate"
    return "High"


def predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    model = load_model()
    features = transform(payload)
    probability = float(model.predict_proba(features)[0][1])
    is_diabetic = probability >= 0.5
    risk = round(probability * 100, 1)

    return {
        "prediction": "Diabetic" if is_diabetic else "Non-Diabetic",
        "probability": round(probability, 4),
        "risk_percentage": risk,
        "confidence": round((probability if is_diabetic else 1 - probability) * 100, 1),
        "risk_level": risk_level(risk),
        "message": (
            "The model classifies this health profile as likely diabetic. "
            "A clinical test is recommended."
            if is_diabetic
            else "The model classifies this health profile as likely non-diabetic."
        ),
        "features": payload,
    }


def model_info() -> Dict[str, Any]:
    model = load_model()
    metrics = load_metrics()
    return {
        "algorithm": "Random Forest Classifier",
        "problem_type": "Binary Classification",
        "dataset": metrics.get("dataset", "Diabetes Health Dataset"),
        "n_estimators": int(getattr(model, "n_estimators", 0)),
        "features": metrics.get("rawFeatureNames", []),
        "hyperparameters": metrics.get("hyperparameters", {}),
        "trained_at": metrics.get("trainedAt"),
        "samples": metrics.get("samples", {}),
    }


__all__ = ["predict", "model_info", "load_metrics", "ModelUnavailable", "PipelineUnavailable"]
