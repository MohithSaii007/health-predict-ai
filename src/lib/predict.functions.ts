import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const patientSchema = z.object({
  age: z.number().int().min(18, "Age must be at least 18").max(120, "Age must be 120 or below"),
  bmi: z.number().min(10, "BMI must be at least 10").max(70, "BMI must be 70 or below"),
  physical_activity: z.enum(["Low", "Moderate", "High"]),
  blood_pressure: z
    .number()
    .min(70, "Systolic blood pressure must be at least 70")
    .max(250, "Systolic blood pressure must be 250 or below"),
  cholesterol: z
    .number()
    .min(80, "Total cholesterol must be at least 80")
    .max(500, "Total cholesterol must be 500 or below"),
  glucose: z
    .number()
    .min(40, "Glucose must be at least 40")
    .max(500, "Glucose must be 500 or below"),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

/** POST /predict — validates input, applies the fitted pipeline, runs the Random Forest. */
export const predictDiabetes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => patientSchema.parse(data))
  .handler(async ({ data }) => {
    const { predict } = await import("@/ml/inference.server");
    return predict(data);
  });

export const getModelInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { modelInfo } = await import("@/ml/inference.server");
  return modelInfo();
});
