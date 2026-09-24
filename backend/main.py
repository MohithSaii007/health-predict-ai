"""
main.py
-------
FastAPI application exposing the trained diabetes prediction model.

Endpoints:
    POST /predict     run a prediction for one patient record
    GET  /health      service + model availability
    GET  /model-info  algorithm, features, hyperparameters
    GET  /metrics     evaluation metrics produced during training

Run:  uvicorn main:app --reload
Docs: http://localhost:8000/docs
"""

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from prediction import ModelUnavailable, load_metrics, model_info, predict
from preprocessing import PipelineUnavailable

load_dotenv()

app = FastAPI(
    title="AI-Based Diabetes Prediction System",
    description="Random Forest diabetes risk prediction API",
    version="1.0.0",
)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PatientInput(BaseModel):
    age: int = Field(..., ge=18, le=120, description="Age in years")
    bmi: float = Field(..., ge=10, le=70, description="Body mass index (kg/m2)")
    physical_activity: Literal["Low", "Moderate", "High"]
    blood_pressure: float = Field(..., ge=70, le=250, description="Systolic blood pressure (mmHg)")
    cholesterol: float = Field(..., ge=80, le=500, description="Total cholesterol (mg/dL)")
    glucose: float = Field(..., ge=40, le=500, description="Fasting glucose (mg/dL)")


class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    risk_percentage: float
    confidence: float
    risk_level: str
    message: str


@app.post("/predict", response_model=PredictionResponse)
def post_predict(payload: PatientInput):
    try:
        return predict(payload.model_dump())
    except (ModelUnavailable, PipelineUnavailable) as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed. Please try again.")


@app.get("/health")
def health():
    try:
        info = model_info()
        return {"status": "ok", "model_loaded": True, "algorithm": info["algorithm"]}
    except (ModelUnavailable, PipelineUnavailable):
        return {"status": "degraded", "model_loaded": False}


@app.get("/model-info")
def get_model_info():
    try:
        return model_info()
    except (ModelUnavailable, PipelineUnavailable) as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/metrics")
def get_metrics():
    return load_metrics()
