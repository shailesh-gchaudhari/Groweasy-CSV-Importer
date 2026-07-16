import { Step } from "@/lib/types";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload CSV" },
  { id: "preview", label: "Preview" },
  { id: "processing", label: "AI Mapping" },
  { id: "results", label: "Results" },
];

export function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex w-full items-center">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-brand-500 text-white"
                    : isActive
                    ? "bg-brand-500/15 text-brand-600 ring-2 ring-brand-500 dark:text-brand-400"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-3 h-px flex-1 ${
                  isDone ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
