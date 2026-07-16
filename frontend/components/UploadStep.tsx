"use client";

import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";

const MAX_FILE_SIZE_MB = 5;

const SAMPLE_CSV = `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Client is asking to reschedule demo,,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,"Person was busy, will try again next week",,,
`;

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groweasy_sample_leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface UploadStepProps {
  onFileAccepted: (file: File) => void;
}

export function UploadStep({ onFileAccepted }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        setError(rejected[0].errors[0]?.message ?? "That file couldn't be accepted.");
        return;
      }
      if (accepted[0]) onFileAccepted(accepted[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-ink-900 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Import Leads via CSV
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Upload a CSV in any layout — Facebook Lead Ads, Google Ads, Excel exports,
        or a manual spreadsheet. AI will map it into GrowEasy CRM fields.
      </p>

      <div
        {...getRootProps()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragActive
            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
            : "border-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-ink-800"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">
            {isDragActive ? "Drop it right here" : "Drop your CSV file here"}
          </p>
          <p className="text-sm text-slate-400">or click to browse files</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Supported file: .csv (max {MAX_FILE_SIZE_MB}MB)
        </span>
      </div>

      {error && (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Any column names work — the AI figures out the mapping.
        </p>
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12M12 15l-4-4M12 15l4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download sample CSV
        </button>
      </div>
    </div>
  );
}
