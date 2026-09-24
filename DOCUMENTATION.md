# AI-Based Diabetes Prediction System — Project Documentation

## 1. Dataset Description
- **Source:** CDC NHANES 2013-2014 (public US National Health and Nutrition Examination Survey). Built by `backend/build_dataset.py`, saved as `backend/data/diabetes_health.csv`.
- **Records:** 2,493 adults (age ≥ 20). **Diabetic:** 302 (12.1%), **Non-diabetic:** 2,191 — imbalanced.
- **Features:**

| Feature | Unit | NHANES source |
|---|---|---|
| age | years | RIDAGEYR |
| bmi | kg/m² | BMXBMI |
| physical_activity | Low / Moderate / High | PAQ650, PAQ665 |
| blood_pressure | systolic mmHg (mean of readings) | BPXSY1–4 |
| cholesterol | total, mg/dL | LBXTC |
| glucose | fasting, mg/dL | LBXGLU |
| **diabetes (target)** | 1 = doctor-diagnosed, 0 = no | DIQ010 |

- Missing values in raw data: BMI 24, blood pressure 82, cholesterol 24.

## 2. Preprocessing Techniques (`backend/train_model.py`)
1. **Cleaning:** duplicates removed; physiologically impossible values (e.g. BMI outside 10–70, BP outside 70–250) set to missing.
2. **Missing values:** median imputation (numeric), most-frequent imputation (activity).
3. **Encoding:** one-hot encoding of physical activity (Low/Moderate/High).
4. **Scaling:** StandardScaler (zero mean, unit variance) on numeric features.
5. **Split:** 80% train (1,994) / 20% test (499), stratified, random_state = 42.
6. The fitted pipeline is saved to `models/preprocessing_pipeline.pkl` and reused for every prediction.

## 3. Model Training
- **Algorithm:** `RandomForestClassifier` (scikit-learn), binary classification.
- **Hyperparameters:** n_estimators = 150, max_depth = 8, min_samples_leaf = 4, class_weight = "balanced" (handles imbalance), random_state = 42.
- **Output:** `models/diabetes_model.pkl`, `models/metrics.json`.

## 4. Results & Evaluation Metrics (test set, 499 records)

| Metric | Value |
|---|---|
| Accuracy | 0.8858 |
| Precision | 0.5185 |
| Recall | 0.7000 |
| F1-Score | 0.5957 |
| ROC-AUC | 0.9074 |
| 5-fold CV ROC-AUC | 0.9286 ± 0.015 |

**Confusion matrix:** TN 400, FP 39, FN 18, TP 42.

**Feature importance (from the trained model):** glucose 0.566, age 0.183, BMI 0.097, cholesterol 0.074, blood pressure 0.053, physical activity 0.027.

**Interpretation:** High ROC-AUC shows strong ranking ability. Recall (0.70) was prioritised over precision via class balancing, since missing a diabetic case is costlier than a false alarm. Glucose dominates, consistent with clinical knowledge.

Figures in `backend/reports/`: confusion matrix, ROC curve, feature importance, class distribution, feature distributions, correlation heatmap.

## 5. Prediction Workflow
Patient data → validation → preprocessing (same fitted pipeline) → Random Forest → probability → risk level (Low < 20%, Moderate 20–50%, High ≥ 50%; class Diabetic if ≥ 50%).

## 6. How to Run
```bash
cd backend
pip install -r requirements.txt
python build_dataset.py        # optional: rebuild dataset from NHANES
python train_model.py          # train + evaluate + save model
python visualize.py            # figures -> reports/
streamlit run streamlit_app.py # interactive app
uvicorn main:app --reload      # REST API at http://localhost:8000/docs
```
Web app (React): `npm install && npm run dev` in the project root.

## 7. Limitations & Future Scope
- Self-reported diagnosis label; single survey cycle; modest positive-class size.
- Future: more NHANES cycles, HbA1c feature, SHAP explanations, threshold tuning, XGBoost comparison.

*Educational project only — not a medical diagnosis.*
