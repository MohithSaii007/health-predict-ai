import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/metric-card";
import metrics from "@/ml/metrics.json";

export const Route = createFileRoute("/model-performance")({
  head: () => ({
    meta: [
      { title: "Model Performance — Random Forest Evaluation" },
      {
        name: "description",
        content:
          "Accuracy, precision, recall, F1-score and ROC-AUC of the trained Random Forest diabetes classifier, with confusion matrix and feature importance.",
      },
      { property: "og:title", content: "Model Performance — Random Forest Evaluation" },
      {
        property: "og:description",
        content: "Held-out test evaluation of the diabetes prediction model.",
      },
    ],
  }),
  component: ModelPerformance,
});

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.6rem",
  fontSize: "12px",
  color: "var(--color-foreground)",
};

function pct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function ModelPerformance() {
  if (!metrics.trained) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Model Performance</h1>
        <p className="mt-3 text-muted-foreground">Model metrics will appear after model training.</p>
      </div>
    );
  }

  const cm = metrics.confusionMatrix;
  const cmCells = [
    { label: "True Negative", value: cm.trueNegative, tone: "bg-success/15 text-success" },
    { label: "False Positive", value: cm.falsePositive, tone: "bg-warning/20 text-warning-foreground" },
    { label: "False Negative", value: cm.falseNegative, tone: "bg-destructive/15 text-destructive" },
    { label: "True Positive", value: cm.truePositive, tone: "bg-success/15 text-success" },
  ];

  const importance = metrics.featureImportance.map((f) => ({
    feature: f.feature.replace("_", " "),
    importance: Number((f.importance * 100).toFixed(2)),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Model Performance</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          All values below are produced by <code className="font-mono">backend/train_model.py</code>{" "}
          on a held-out 20% test split ({metrics.samples.test} records) and are read from{" "}
          <code className="font-mono">metrics.json</code>. Last training run: {metrics.trainedAt}.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Accuracy" value={pct(metrics.accuracy)} />
        <MetricCard label="Precision" value={pct(metrics.precision)} hint="Positive class" />
        <MetricCard label="Recall" value={pct(metrics.recall)} hint="Sensitivity" />
        <MetricCard label="F1 Score" value={pct(metrics.f1)} />
        <MetricCard
          label="ROC-AUC"
          value={metrics.rocAuc.toFixed(4)}
          hint={`5-fold CV ${metrics.crossValRocAuc.mean.toFixed(3)} ± ${metrics.crossValRocAuc.std.toFixed(3)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-base font-semibold">Confusion matrix</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {cmCells.map((cell) => (
              <div key={cell.label} className={`rounded-lg p-5 text-center ${cell.tone}`}>
                <p className="font-display text-3xl font-semibold">{cell.value}</p>
                <p className="mt-1 text-xs font-medium">{cell.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Rows: actual class · Columns: predicted class, on the test split.
          </p>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-semibold">ROC curve</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.rocCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="fpr"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                  label={{ value: "False positive rate", position: "insideBottom", offset: -4, fontSize: 11 }}
                />
                <YAxis
                  dataKey="tpr"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">Area under the curve: {metrics.rocAuc}</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="panel p-6">
          <h2 className="text-base font-semibold">Feature importance</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importance} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" unit="%" />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 12, textTransform: "capitalize" }}
                  stroke="var(--color-muted-foreground)"
                  width={110}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
                <Bar dataKey="importance" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">
            Gini importance read from the trained forest (one-hot activity columns aggregated).
          </p>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-semibold">Model information</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Algorithm" value={metrics.algorithm} />
            <Row label="Problem type" value={metrics.problemType} />
            <Row label="Dataset" value={metrics.dataset} />
            <Row label="Records" value={`${metrics.samples.total} (train ${metrics.samples.train} / test ${metrics.samples.test})`} />
            <Row label="Trees" value={String(metrics.hyperparameters.n_estimators)} />
            <Row label="Max depth" value={String(metrics.hyperparameters.max_depth)} />
            <Row label="Min samples / leaf" value={String(metrics.hyperparameters.min_samples_leaf)} />
            <Row label="Class weight" value={metrics.hyperparameters.class_weight} />
            <Row label="Random state" value={String(metrics.hyperparameters.random_state)} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
