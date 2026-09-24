import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import analytics from "@/ml/analytics.json";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Analytics Dashboard — Diabetes Dataset" },
      {
        name: "description",
        content:
          "Interactive analytics of the diabetes health dataset: class balance, age, BMI, glucose, blood pressure and cholesterol distributions.",
      },
      { property: "og:title", content: "Analytics Dashboard — Diabetes Dataset" },
      {
        property: "og:description",
        content: "Class distribution and health-factor distributions of the training dataset.",
      },
    ],
  }),
  component: Dashboard,
});

type DistributionKey = keyof typeof analytics.distributions;

const distributionLabels: Record<DistributionKey, string> = {
  age: "Age (years)",
  bmi: "BMI (kg/m²)",
  glucose: "Glucose (mg/dL)",
  blood_pressure: "Blood pressure (mmHg)",
  cholesterol: "Cholesterol (mg/dL)",
};

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.6rem",
  fontSize: "12px",
  color: "var(--color-foreground)",
};

function Dashboard() {
  const keys = Object.keys(analytics.distributions) as DistributionKey[];
  const [active, setActive] = useState<DistributionKey>("glucose");
  const positiveRate = ((analytics.diabetic / analytics.totalRecords) * 100).toFixed(1);

  const classData = [
    { name: "Non-Diabetic", value: analytics.nonDiabetic },
    { name: "Diabetic", value: analytics.diabetic },
  ];

  const meanRows = Object.entries(analytics.meansByClass);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Analytics Dashboard</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Exploratory analysis of the cleaned dataset that was used to train and evaluate the
          Random Forest classifier. All numbers are computed from the dataset itself.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total records" value={analytics.totalRecords} />
        <MetricCard label="Diabetic cases" value={analytics.diabetic} hint={`${positiveRate}% of records`} />
        <MetricCard label="Non-diabetic cases" value={analytics.nonDiabetic} />
        <MetricCard label="Health factors" value={6} hint="5 numerical + 1 categorical" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
        <section className="panel p-6">
          <h2 className="text-base font-semibold">Class distribution</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={classData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {classData.map((entry, i) => (
                    <Cell key={entry.name} fill={chartColors[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">
            The dataset is imbalanced, which is handled with balanced class weights during training.
          </p>
        </section>

        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Health factor distribution</h2>
            <div className="flex flex-wrap gap-2">
              {keys.map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={active === key ? "default" : "outline"}
                  onClick={() => setActive(key)}
                >
                  {distributionLabels[key].split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.distributions[active]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="bin" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">{distributionLabels[active]} — record counts per range.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-base font-semibold">Physical activity distribution</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.physicalActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Records" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="diabetic" name="Diabetic" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-semibold">Average values by class</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Health factor</th>
                  <th className="py-2 text-right">Diabetic</th>
                  <th className="py-2 text-right">Non-diabetic</th>
                </tr>
              </thead>
              <tbody>
                {meanRows.map(([key, value]) => (
                  <tr key={key} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 capitalize">{key.replace("_", " ")}</td>
                    <td className="py-2.5 text-right font-mono">{value.diabetic}</td>
                    <td className="py-2.5 text-right font-mono">{value.nonDiabetic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel mt-6 overflow-x-auto p-6">
        <h2 className="text-base font-semibold">Correlation heatmap</h2>
        <table className="mt-4 w-full min-w-[640px] text-xs">
          <thead>
            <tr>
              <th className="p-2" />
              {analytics.correlation.map((row) => (
                <th key={row.feature} className="p-2 text-left capitalize text-muted-foreground">
                  {row.feature.replace("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analytics.correlation.map((row) => (
              <tr key={row.feature}>
                <th className="p-2 text-left capitalize text-muted-foreground">
                  {row.feature.replace("_", " ")}
                </th>
                {row.values.map((cell) => (
                  <td key={cell.feature} className="p-1">
                    <div
                      className="rounded-md py-2 text-center font-mono"
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--color-chart-1) ${Math.abs(cell.value) * 85}%, var(--color-secondary))`,
                      }}
                    >
                      {cell.value.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
