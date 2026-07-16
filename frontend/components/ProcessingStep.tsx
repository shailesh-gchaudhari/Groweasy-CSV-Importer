"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Uploading CSV to the server…",
  "Parsing rows…",
  "Batching records for AI mapping…",
  "Extracting CRM fields with Gemini…",
  "Validating and cleaning results…",
];

export function ProcessingStep({ rowCount }: { rowCount: number }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.min(
    95,
    Math.round(((stageIndex + 1) / STAGES.length) * 100)
  );

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-ink-900">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-100 border-t-brand-500 dark:border-slate-800" />
      </div>

      <h2 className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Mapping {rowCount} row{rowCount === 1 ? "" : "s"} into GrowEasy CRM format
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {STAGES[stageIndex]}
      </p>

      <div className="mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        This can take a little longer for larger files — batches are processed
        with automatic retries.
      </p>
    </div>
  );
}
