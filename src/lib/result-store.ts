export type StoredPrediction = {
  prediction: "Diabetic" | "Non-Diabetic";
  probability: number;
  risk_percentage: number;
  confidence: number;
  risk_level: "Low" | "Moderate" | "High";
  message: string;
  features: {
    age: number;
    bmi: number;
    physical_activity: "Low" | "Moderate" | "High";
    blood_pressure: number;
    cholesterol: number;
    glucose: number;
  };
  model: { algorithm: string; trees: number; rocAuc: number };
};

const KEY = "diabetes-prediction-result";

export function saveResult(result: StoredPrediction) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadResult(): StoredPrediction | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPrediction;
  } catch {
    return null;
  }
}
