import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "@/components/workflow";
import metrics from "@/ml/metrics.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — AI-Based Diabetes Prediction System" },
      {
        name: "description",
        content:
          "Academic minor project on supervised machine learning: objectives, scope, technology stack and system architecture of the diabetes prediction system.",
      },
      { property: "og:title", content: "About the Project — AI Diabetes Prediction" },
      {
        property: "og:description",
        content: "Objectives, scope, architecture and technology stack of the minor project.",
      },
    ],
  }),
  component: About,
});

const stack = [
  { group: "Frontend", items: ["React 19", "TypeScript", "Tailwind CSS", "TanStack Router / Start", "Recharts"] },
  { group: "Backend", items: ["Python", "FastAPI", "Pydantic validation", "Server functions + REST endpoints"] },
  { group: "Machine Learning", items: ["Pandas", "NumPy", "scikit-learn", "RandomForestClassifier", "joblib"] },
  { group: "Data", items: ["CDC NHANES 2013-2014 public health survey", "CSV dataset, 2,493 adult records"] },
];

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">About the Project</h1>
      <p className="mt-3 text-muted-foreground">
        The AI-Based Diabetes Prediction System is an academic minor project that applies supervised
        machine learning to health data. It classifies a patient profile as diabetic or
        non-diabetic and reports the probability of the positive class so that the strength of the
        prediction is visible, not hidden behind a binary label.
      </p>

      <section className="panel mt-8 p-6">
        <h2 className="text-lg font-semibold">Objectives</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Develop a predictive model that classifies a person as diabetic (1) or not (0).</li>
          <li>Apply preprocessing, encoding, scaling and evaluation on a medical dataset.</li>
          <li>Build an interactive interface for entering patient details and obtaining predictions.</li>
          <li>Visualise patterns and correlations between health factors such as BMI, age and glucose.</li>
        </ul>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold">Technology stack</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {stack.map((s) => (
            <div key={s.group}>
              <p className="text-sm font-semibold">{s.group}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {s.items.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-6">
          <h2 className="text-lg font-semibold">System architecture</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The patient form validates input in the browser, the prediction service revalidates it
            on the server, applies the fitted preprocessing constants and evaluates every tree of
            the trained forest. The identical model artefacts are also served by the FastAPI
            backend in <code className="font-mono">backend/</code>, so the project can be
            demonstrated either through the web application or through the Python API.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-border bg-surface p-4">
              <dt className="text-xs uppercase text-muted-foreground">Algorithm</dt>
              <dd className="mt-1 font-medium">{metrics.algorithm}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <dt className="text-xs uppercase text-muted-foreground">Problem type</dt>
              <dd className="mt-1 font-medium">{metrics.problemType}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <dt className="text-xs uppercase text-muted-foreground">Dataset</dt>
              <dd className="mt-1 font-medium">{metrics.dataset}</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <dt className="text-xs uppercase text-muted-foreground">Test ROC-AUC</dt>
              <dd className="mt-1 font-medium">{metrics.rocAuc}</dd>
            </div>
          </dl>
        </div>
        <Workflow
          title="Architecture flow"
          steps={[
            "Patient Input",
            "Frontend",
            "API / Prediction Service",
            "Data Validation",
            "Preprocessing Pipeline",
            "Random Forest Model",
            "Prediction + Probability",
            "Results Dashboard",
          ]}
        />
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold">Disclaimer</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Predictions are produced by a statistical model trained on survey data. They are intended
          for educational and demonstration purposes within this academic project and must never be
          used as a medical diagnosis or as a substitute for professional clinical assessment.
        </p>
      </section>
    </div>
  );
}
