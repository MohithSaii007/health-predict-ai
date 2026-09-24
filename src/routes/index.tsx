import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, Brain, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Workflow } from "@/components/workflow";
import metrics from "@/ml/metrics.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI-Based Diabetes Prediction System" },
      {
        name: "description",
        content:
          "Machine learning powered diabetes risk prediction using a trained Random Forest classifier on real health survey data.",
      },
      { property: "og:title", content: "AI-Based Diabetes Prediction System" },
      {
        property: "og:description",
        content: "Machine Learning Powered Diabetes Risk Prediction — Random Forest classifier.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: Brain,
    title: "AI Prediction",
    text: "A trained Random Forest classifier returns a diabetic / non-diabetic class with a calibrated probability.",
  },
  {
    icon: BarChart3,
    title: "Health Analytics",
    text: "Interactive charts of class balance and the distribution of every health factor in the dataset.",
  },
  {
    icon: Activity,
    title: "Machine Learning",
    text: "A reusable preprocessing pipeline — cleaning, imputation, encoding and scaling — applied at training and prediction time.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Assessment",
    text: "Risk banding with low, moderate and high indicators plus model confidence for every prediction.",
  },
];

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="grid-backdrop absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Stethoscope className="size-3.5 text-primary" />
              Supervised Learning · Random Forest · Binary Classification
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              AI-Based Diabetes Prediction System
            </h1>
            <p className="mt-3 text-lg text-primary">
              Machine Learning Powered Diabetes Risk Prediction
            </p>
            <p className="mt-4 max-w-xl text-muted-foreground">
              The system analyses six health-related factors — age, BMI, physical activity, blood
              pressure, cholesterol and glucose — preprocesses them with the same fitted pipeline
              used during training, and returns a diabetes prediction together with a probability
              score.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/prediction">Start Prediction</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">View Analytics</Link>
              </Button>
            </div>
            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Dataset records</dt>
                <dd className="font-display text-xl font-semibold">{metrics.samples.total}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Test ROC-AUC</dt>
                <dd className="font-display text-xl font-semibold">{metrics.rocAuc}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Trees</dt>
                <dd className="font-display text-xl font-semibold">
                  {metrics.hyperparameters.n_estimators}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="panel w-full max-w-md p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Model pipeline</p>
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                  Model loaded
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {metrics.featureImportance.map((f) => (
                  <div key={f.feature}>
                    <div className="flex justify-between text-xs">
                      <span className="capitalize">{f.feature.replace("_", " ")}</span>
                      <span className="font-mono text-muted-foreground">
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, f.importance * 160)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <HeartPulse className="size-4 text-primary" />
                Feature importance read directly from the trained forest.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-semibold">What the system provides</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="panel p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_400px]">
          <div>
            <h2 className="font-display text-2xl font-semibold">How a prediction is produced</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Patient measurements travel through the same sequence that was used to build the
              model. Missing values are imputed with the training medians, the categorical activity
              level is one-hot encoded and numerical features are standardised before the forest
              votes on the outcome.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="panel p-5">
                <p className="text-sm font-semibold">Trained, not simulated</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every split threshold and leaf probability comes from a scikit-learn
                  RandomForestClassifier fitted in <code className="font-mono">train_model.py</code>.
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-sm font-semibold">Evaluated honestly</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Accuracy, precision, recall, F1 and ROC-AUC are computed on a held-out test split
                  and published unchanged on the model performance page.
                </p>
              </div>
            </div>
          </div>
          <Workflow
            title="Prediction workflow"
            steps={[
              "Patient Data",
              "Data Preprocessing",
              "Machine Learning Model",
              "Risk Prediction",
              "Result & Analytics",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
