import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { modelInfo } = await import("@/ml/inference.server");
          const info = modelInfo();
          return Response.json({
            status: "ok",
            model_loaded: true,
            algorithm: info.algorithm,
            trees: info.n_estimators,
          });
        } catch {
          return Response.json({ status: "degraded", model_loaded: false }, { status: 503 });
        }
      },
    },
  },
});
