import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/model-info")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { modelInfo } = await import("@/ml/inference.server");
          return Response.json(modelInfo());
        } catch {
          return Response.json({ error: "Model information unavailable." }, { status: 503 });
        }
      },
    },
  },
});
