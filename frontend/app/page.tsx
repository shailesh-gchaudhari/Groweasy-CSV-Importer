"use client";

import { useState } from "react";
import { Stepper } from "@/components/Stepper";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadStep } from "@/components/UploadStep";
import { PreviewStep } from "@/components/PreviewStep";
import { ProcessingStep } from "@/components/ProcessingStep";
import { ResultsStep } from "@/components/ResultsStep";
import { parseCsvForPreview, ParsedCsvPreview } from "@/lib/csv";
import { importCsvFile, ApiError } from "@/lib/api";
import { ImportResult, Step } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedCsvPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = async (accepted: File) => {
    setError(null);
    try {
      const parsed = await parseCsvForPreview(accepted);
      setFile(accepted);
      setPreview(parsed);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse this CSV file.");
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setStep("processing");
    setError(null);
    try {
      const res = await importCsvFile(file);
      setResult(res);
      setStep("results");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong while importing this file."
      );
      setStep("preview");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep("upload");
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M3 17l5-5 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              GrowEasy
            </p>
            <p className="text-xs leading-tight text-slate-400">AI CSV Lead Importer</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card dark:border-slate-800 dark:bg-ink-900">
        <Stepper current={step} />
      </div>

      {error && step !== "results" && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {step === "upload" && <UploadStep onFileAccepted={handleFileAccepted} />}

      {step === "preview" && file && preview && (
        <PreviewStep
          fileName={file.name}
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}

      {step === "processing" && <ProcessingStep rowCount={preview?.totalRowCount ?? 0} />}

      {step === "results" && result && (
        <ResultsStep result={result} onReset={reset} />
      )}
    </main>
  );
}
