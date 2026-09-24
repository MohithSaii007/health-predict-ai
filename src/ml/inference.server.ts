/**
 * Runtime inference for the trained Random Forest.
 *
 * The forest and the fitted preprocessing constants (medians, means, scales)
 * are produced by backend/train_model.py and exported to src/ml/model.json.
 * Nothing here is hardcoded: every threshold, split and leaf probability comes
 * from the trained scikit-learn model.
 */
import modelJson from "./model.json";
import metricsJson from "./metrics.json";

type Tree = { l: number[]; r: number[]; f: number[]; t: number[]; p: number[] };

type ModelExport = {
  version: number;
  features: string[];
  numericFeatures: string[];
  activityCategories: string[];
  preprocessing: {
    medians: Record<string, number>;
    means: Record<string, number>;
    scales: Record<string, number>;
    activityMostFrequent: string;
  };
  trees: Tree[];
};

const model = modelJson as unknown as ModelExport;

export type PatientInput = {
  age: number;
  bmi: number;
  physical_activity: "Low" | "Moderate" | "High";
  blood_pressure: number;
  cholesterol: number;
  glucose: number;
};

export type PredictionResult = {
  prediction: "Diabetic" | "Non-Diabetic";
  probability: number;
  risk_percentage: number;
  confidence: number;
  risk_level: "Low" | "Moderate" | "High";
  message: string;
  features: PatientInput;
  model: { algorithm: string; trees: number; rocAuc: number };
};

/** Same preprocessing as the fitted pipeline: median impute -> standard scale -> one-hot. */
export function preprocess(input: PatientInput): number[] {
  const { medians, means, scales } = model.preprocessing;
  const numeric = model.numericFeatures.map((name) => {
    const raw = (input as unknown as Record<string, number>)[name];
    const value = Number.isFinite(raw) ? raw : (medians[name] as number);
    return (value - (means[name] as number)) / (scales[name] as number);
  });
  const activity = model.activityCategories.map((c) => (c === input.physical_activity ? 1 : 0));
  return [...numeric, ...activity];
}

function traverse(tree: Tree, x: number[]): number {
  let node = 0;
  while (tree.l[node] !== -1) {
    const featureIndex = tree.f[node] as number;
    node =
      (x[featureIndex] as number) <= (tree.t[node] as number)
        ? (tree.l[node] as number)
        : (tree.r[node] as number);
  }
  return tree.p[node] as number;
}

export function predict(input: PatientInput): PredictionResult {
  const x = preprocess(input);
  const probability = model.trees.reduce((sum, tree) => sum + traverse(tree, x), 0) / model.trees.length;
  const isDiabetic = probability >= 0.5;
  const risk = probability * 100;
  const risk_level = risk < 20 ? "Low" : risk < 50 ? "Moderate" : "High";

  return {
    prediction: isDiabetic ? "Diabetic" : "Non-Diabetic",
    probability: Number(probability.toFixed(4)),
    risk_percentage: Number(risk.toFixed(1)),
    confidence: Number(((isDiabetic ? probability : 1 - probability) * 100).toFixed(1)),
    risk_level,
    message: isDiabetic
      ? "The model classifies this health profile as likely diabetic. A clinical test is recommended."
      : "The model classifies this health profile as likely non-diabetic.",
    features: input,
    model: {
      algorithm: metricsJson.algorithm,
      trees: model.trees.length,
      rocAuc: metricsJson.rocAuc,
    },
  };
}

export function modelInfo() {
  return {
    algorithm: metricsJson.algorithm,
    problem_type: metricsJson.problemType,
    dataset: metricsJson.dataset,
    features: model.features,
    n_estimators: model.trees.length,
    hyperparameters: metricsJson.hyperparameters,
    trained_at: metricsJson.trainedAt,
    samples: metricsJson.samples,
  };
}

export function modelMetrics() {
  return metricsJson;
}
