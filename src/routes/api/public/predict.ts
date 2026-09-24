import { createFileRoute } from "@tanstack/react-router";
import { patientSchema } from "@/lib/predict.functions";

export const Route = createFileRoute("/api/public/predict")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
        }

        const parsed = patientSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            {
              error: "Invalid patient data.",
              details: parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              })),
            },
            { status: 422 },
          );
        }

        try {
          const { predict } = await import("@/ml/inference.server");
          return Response.json(predict(parsed.data));
        } catch {
          return Response.json(
            { error: "The prediction model is currently unavailable." },
            { status: 503 },
          );
        }
      },
    },
  },
});
