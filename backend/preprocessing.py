"""
preprocessing.py
----------------
Reusable preprocessing layer. The SAME fitted pipeline object that was saved by
train_model.py is loaded here, which guarantees that prediction-time transforms
(median imputation, one-hot encoding, standard scaling) are identical to the
transforms applied during training.
"""

import os
from typing import Any, Dict

import joblib
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
PIPELINE_PATH = os.path.join(HERE, "models", "preprocessing_pipeline.pkl")

NUMERIC = ["age", "bmi", "blood_pressure", "cholesterol", "glucose"]
CATEGORICAL = ["physical_activity"]

_pipeline = None


class PipelineUnavailable(RuntimeError):
    """Raised when the fitted preprocessing pipeline has not been created yet."""


def load_pipeline():
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(PIPELINE_PATH):
            raise PipelineUnavailable(
                "preprocessing_pipeline.pkl not found — run `python train_model.py` first."
            )
        _pipeline = joblib.load(PIPELINE_PATH)
    return _pipeline


def to_frame(payload: Dict[str, Any]) -> pd.DataFrame:
    return pd.DataFrame([{col: payload.get(col) for col in NUMERIC + CATEGORICAL}])


def transform(payload: Dict[str, Any]):
    """Apply the fitted pipeline to a single patient record."""
    return load_pipeline().transform(to_frame(payload))
