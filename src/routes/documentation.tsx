import { createFileRoute } from "@tanstack/react-router";
import metrics from "@/ml/metrics.json";

export const Route = createFileRoute("/documentation")({
  head: () => ({
    meta: [
      { title: "Documentation — AI-Based Diabetes Prediction System" },
      {
        name: "description",
        content:
          "Project documentation: problem statement, dataset, preprocessing, Random Forest training, evaluation metrics, architecture, limitations and future scope.",
      },
      { property: "og:title", content: "Documentation — AI Diabetes Prediction" },
      {
        property: "og:description",
        content: "Complete academic documentation of the diabetes prediction minor project.",
      },
    ],
  }),
  component: Documentation,
});

const sections = [
  { id: "overview", title: "1. Project Overview" },
  { id: "problem", title: "2. Problem Statement" },
  { id: "objectives", title: "3. Objectives" },
  { id: "dataset", title: "4. Dataset" },
  { id: "preprocessing", title: "5. Data Preprocessing" },
  { id: "algorithm", title: "6. Machine Learning Algorithm" },
  { id: "training", title: "7. Model Training" },
  { id: "evaluation", title: "8. Evaluation Metrics" },
  { id: "workflow", title: "9. Prediction Workflow" },
  { id: "architecture", title: "10. System Architecture" },
  { id: "stack", title: "11. Technology Stack" },
  { id: "running", title: "12. Running the Python Backend" },
  { id: "limitations", title: "13. Limitations" },
  { id: "future", title: "14. Future Scope" },
];

function Documentation() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contents
        </p>
        <nav className="mt-3 space-y-1 text-sm">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <article className="space-y-8">
        <header>
          <h1 className="font-display text-3xl font-semibold">Project Documentation</h1>
          <p className="mt-2 text-muted-foreground">
            Academic documentation for the AI-Based Diabetes Prediction System minor project.
          </p>
        </header>

        <Section id="overview" title="1. Project Overview">
          <p>
            This project implements a supervised machine-learning system that estimates the
            likelihood of diabetes from six routinely collected health factors. The system consists
            of a training pipeline written in Python, a trained Random Forest classifier, a
            prediction service, and a responsive web interface that presents predictions, dataset
            analytics and model evaluation results.
          </p>
        </Section>

        <Section id="problem" title="2. Problem Statement">
          <p>
            Diabetes frequently remains undetected until complications appear. Screening every
            individual with laboratory tests is expensive, so a data-driven tool that highlights
            high-risk profiles from commonly available measurements is valuable. The task is framed
            as binary classification: given age, BMI, physical activity level, blood pressure,
            cholesterol and glucose, predict whether the person is diabetic (1) or not (0), and
            report the probability of that prediction.
          </p>
        </Section>

        <Section id="objectives" title="3. Objectives">
          <ul>
            <li>Build and evaluate a Random Forest classifier on real health data.</li>
            <li>Implement a reusable preprocessing pipeline shared by training and inference.</li>
            <li>Expose the model through an API and an interactive web interface.</li>
            <li>Visualise dataset patterns, feature importance and evaluation results.</li>
          </ul>
        </Section>

        <Section id="dataset" title="4. Dataset">
          <p>
            The dataset is assembled from the public CDC NHANES 2013-2014 survey files by{" "}
            <code>backend/build_dataset.py</code>. Demographics, body measures, blood pressure
            examinations, total cholesterol, fasting plasma glucose, physical activity
            questionnaires and the diabetes questionnaire are merged on the respondent identifier
            and restricted to adults (age 20 and above).
          </p>
          <ul>
            <li>
              <strong>Records:</strong> {metrics.samples.total} after cleaning (
              {metrics.samples.train} training / {metrics.samples.test} testing).
            </li>
            <li>
              <strong>Features:</strong> age, bmi, physical_activity (Low / Moderate / High),
              blood_pressure (systolic), cholesterol (total), glucose (fasting).
            </li>
            <li>
              <strong>Target:</strong> diabetes = 1 when the respondent reports a doctor-diagnosed
              diabetes (NHANES DIQ010), else 0.
            </li>
          </ul>
        </Section>

        <Section id="preprocessing" title="5. Data Preprocessing">
          <ul>
            <li>Duplicate records removed and physiologically impossible readings set to missing.</li>
            <li>
              Missing numerical values (for example BMI, cholesterol or blood pressure) imputed with
              the training-set median; the categorical activity level uses the most frequent value.
            </li>
            <li>Physical activity one-hot encoded into three indicator columns.</li>
            <li>
              Numerical features standardised with <code>StandardScaler</code> (zero mean, unit
              variance).
            </li>
            <li>
              The fitted imputer, encoder and scaler are stored in{" "}
              <code>preprocessing_pipeline.pkl</code> and their constants are exported so that the
              web application applies exactly the same transformation at prediction time.
            </li>
          </ul>
        </Section>

        <Section id="algorithm" title="6. Machine Learning Algorithm">
          <p>
            A Random Forest is an ensemble of decision trees, each grown on a bootstrap sample of
            the training data with a random subset of features considered at every split. The
            prediction is the average of the individual tree probabilities, which reduces the
            variance of a single deep tree and improves generalisation. The ensemble also provides
            Gini-based feature importance, which makes it well suited to an interpretable
            healthcare demonstration.
          </p>
        </Section>

        <Section id="training" title="7. Model Training">
          <p>
            Training is performed by <code>backend/train_model.py</code>. The data is split 80/20
            with stratification on the target, so the class balance is preserved. Hyperparameters:
          </p>
          <ul>
            <li>n_estimators = {metrics.hyperparameters.n_estimators}</li>
            <li>max_depth = {metrics.hyperparameters.max_depth}</li>
            <li>min_samples_leaf = {metrics.hyperparameters.min_samples_leaf}</li>
            <li>class_weight = {metrics.hyperparameters.class_weight} (compensates class imbalance)</li>
            <li>random_state = {metrics.hyperparameters.random_state} (reproducibility)</li>
          </ul>
          <p>
            Artefacts saved: <code>models/diabetes_model.pkl</code>,{" "}
            <code>models/preprocessing_pipeline.pkl</code> and <code>models/metrics.json</code>.
          </p>
        </Section>

        <Section id="evaluation" title="8. Evaluation Metrics">
          <ul>
            <li>
              <strong>Accuracy</strong> — overall proportion of correct predictions.
            </li>
            <li>
              <strong>Precision</strong> — of the profiles predicted diabetic, how many truly are.
            </li>
            <li>
              <strong>Recall</strong> — of the truly diabetic profiles, how many are detected.
            </li>
            <li>
              <strong>F1-Score</strong> — harmonic mean of precision and recall, important on an
              imbalanced dataset.
            </li>
            <li>
              <strong>ROC-AUC</strong> — ranking quality across all decision thresholds; also
              validated with 5-fold cross-validation.
            </li>
          </ul>
          <p>
            Current test results: accuracy {(metrics.accuracy * 100).toFixed(2)}%, precision{" "}
            {(metrics.precision * 100).toFixed(2)}%, recall {(metrics.recall * 100).toFixed(2)}%,
            F1 {(metrics.f1 * 100).toFixed(2)}%, ROC-AUC {metrics.rocAuc}.
          </p>
        </Section>

        <Section id="workflow" title="9. Prediction Workflow">
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs">
{`Patient Data
   -> Client-side validation (Zod)
   -> Prediction service (server-side re-validation)
   -> Preprocessing pipeline (impute -> encode -> scale)
   -> Random Forest Classifier (150 trees vote)
   -> Probability + class + risk band
   -> Result page and analytics`}
          </pre>
        </Section>

        <Section id="architecture" title="10. System Architecture">
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs">
{`frontend (React + TypeScript + Tailwind)
   |  POST /api/public/predict  (or server function)
   v
prediction service
   |-- validation layer (Zod / Pydantic)
   |-- preprocessing.py  (fitted pipeline)
   |-- prediction.py     (model loading + inference)
   v
models/diabetes_model.pkl  +  models/metrics.json`}
          </pre>
          <p>
            The FastAPI backend exposes <code>POST /predict</code>, <code>GET /health</code>,{" "}
            <code>GET /model-info</code> and <code>GET /metrics</code>. The deployed web application
            mirrors these as <code>/api/public/predict</code>, <code>/api/public/health</code>,{" "}
            <code>/api/public/model-info</code> and <code>/api/public/metrics</code>.
          </p>
        </Section>

        <Section id="stack" title="11. Technology Stack">
          <ul>
            <li>Frontend: React 19, TypeScript, Tailwind CSS, TanStack Router, Recharts.</li>
            <li>Backend / API: Python, FastAPI, Pydantic, Uvicorn.</li>
            <li>Machine learning: Pandas, NumPy, scikit-learn, joblib, Matplotlib/Seaborn plots.</li>
          </ul>
        </Section>

        <Section id="running" title="12. Running the Python Backend">
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs">
{`cd backend
pip install -r requirements.txt
python build_dataset.py     # downloads NHANES files, writes data/diabetes_health.csv
python train_model.py       # trains the Random Forest, writes models/*.pkl + metrics.json
uvicorn main:app --reload   # serves the API on http://localhost:8000/docs`}
          </pre>
          <p>
            Copy <code>.env.example</code> to <code>.env</code> to configure the API host, port and
            allowed origins. No secret keys are hardcoded anywhere in the project.
          </p>
        </Section>

        <Section id="limitations" title="13. Limitations">
          <ul>
            <li>The target is self-reported doctor-diagnosed diabetes, so undiagnosed cases are labelled negative.</li>
            <li>Only six health factors are used; genetics, diet and medication history are not modelled.</li>
            <li>The dataset is imbalanced, which limits precision for the positive class.</li>
            <li>The dataset represents a United States survey population and may not generalise elsewhere.</li>
            <li>The system is an academic demonstration and is not a medical device.</li>
          </ul>
        </Section>

        <Section id="future" title="14. Future Scope">
          <ul>
            <li>Compare additional algorithms (Logistic Regression, XGBoost, SVM) and tune hyperparameters.</li>
            <li>Add SHAP-based per-patient explanations alongside global feature importance.</li>
            <li>Persist prediction history per user with authentication and a database.</li>
            <li>Include HbA1c and family history as additional predictors.</li>
            <li>Deploy the FastAPI service in a container with automated retraining.</li>
          </ul>
        </Section>
      </article>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="panel scroll-mt-24 p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_li]:ml-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
