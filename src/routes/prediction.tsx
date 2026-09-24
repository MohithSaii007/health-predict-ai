import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientSchema, predictDiabetes, type PatientFormValues } from "@/lib/predict.functions";
import { saveResult, type StoredPrediction } from "@/lib/result-store";

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "Diabetes Risk Prediction — Patient Input" },
      {
        name: "description",
        content:
          "Enter age, BMI, physical activity, blood pressure, cholesterol and glucose to get a machine-learning diabetes risk prediction.",
      },
      { property: "og:title", content: "Diabetes Risk Prediction — Patient Input" },
      {
        property: "og:description",
        content: "Validated patient input form powering a trained Random Forest classifier.",
      },
    ],
  }),
  component: PredictionPage,
});

const numericFields = [
  {
    name: "age" as const,
    label: "Age (years)",
    hint: "Patient age in completed years (18–120).",
    step: "1",
    placeholder: "45",
  },
  {
    name: "bmi" as const,
    label: "BMI (kg/m²)",
    hint: "Body mass index. Normal 18.5–24.9, overweight 25–29.9, obese 30+.",
    step: "0.1",
    placeholder: "27.4",
  },
  {
    name: "blood_pressure" as const,
    label: "Blood Pressure (systolic, mmHg)",
    hint: "Average systolic reading. Normal is below 120 mmHg.",
    step: "1",
    placeholder: "126",
  },
  {
    name: "cholesterol" as const,
    label: "Total Cholesterol (mg/dL)",
    hint: "Desirable is below 200 mg/dL; 240+ is considered high.",
    step: "1",
    placeholder: "192",
  },
  {
    name: "glucose" as const,
    label: "Glucose (fasting, mg/dL)",
    hint: "Fasting plasma glucose. Normal below 100, prediabetic 100–125 mg/dL.",
    step: "1",
    placeholder: "98",
  },
];

function PredictionPage() {
  const navigate = useNavigate();
  const predict = useServerFn(predictDiabetes);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { physical_activity: "Moderate" },
  });

  const mutation = useMutation({
    mutationFn: (values: PatientFormValues) => predict({ data: values }),
    onSuccess: (result) => {
      saveResult(result as StoredPrediction);
      navigate({ to: "/results" });
    },
  });

  const activity = watch("physical_activity");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Diabetes Risk Prediction</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Provide the six health factors used by the trained model. All values are validated before
          they are sent to the prediction service.
        </p>
      </header>

      {mutation.isError ? (
        <Alert variant="destructive" className="mt-6">
          <TriangleAlert className="size-4" />
          <AlertTitle>Prediction could not be completed</AlertTitle>
          <AlertDescription>
            The prediction service did not respond correctly. Please check your values and try
            again in a moment.
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        className="panel mt-6 p-6 sm:p-8"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {numericFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type="number"
                step={field.step}
                placeholder={field.placeholder}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={`${field.name}-hint`}
                {...register(field.name, { valueAsNumber: true })}
              />
              <p id={`${field.name}-hint`} className="text-xs text-muted-foreground">
                {field.hint}
              </p>
              {errors[field.name] ? (
                <p className="text-xs font-medium text-destructive">
                  {errors[field.name]?.message ?? "Please enter a valid number."}
                </p>
              ) : null}
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="physical_activity">Physical Activity Level</Label>
            <Select
              value={activity}
              onValueChange={(v) =>
                setValue("physical_activity", v as PatientFormValues["physical_activity"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="physical_activity">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low — little or no regular exercise</SelectItem>
                <SelectItem value="Moderate">Moderate — regular moderate activity</SelectItem>
                <SelectItem value="High">High — regular vigorous activity</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Weekly recreational physical activity, encoded as a categorical feature.
            </p>
            {errors.physical_activity ? (
              <p className="text-xs font-medium text-destructive">
                {errors.physical_activity.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Predicting…
              </>
            ) : (
              "Predict Diabetes Risk"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Educational project output — not a medical diagnosis.
          </p>
        </div>
      </form>
    </div>
  );
}
