import { ArrowDown } from "lucide-react";

export function Workflow({ steps, title }: { steps: string[]; title?: string }) {
  return (
    <div className="panel p-6">
      {title ? <h3 className="mb-5 text-base font-semibold">{title}</h3> : null}
      <ol className="flex flex-col items-stretch gap-2">
        {steps.map((step, i) => (
          <li key={step} className="flex flex-col items-center gap-2">
            <div className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-medium">
              <span className="mr-2 font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </div>
            {i < steps.length - 1 ? (
              <ArrowDown className="size-4 text-muted-foreground" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
