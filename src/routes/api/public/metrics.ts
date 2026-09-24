import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/metrics")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { modelMetrics } = await import("@/ml/inference.server");
          return Response.json(modelMetrics());
        } catch {
          return Response.json(
            { trained: false, message: "Model metrics will appear after model training." },
            { status: 503 },
          );
        }
      },
    },
  },
});
