import { DataTable } from "./ui/DataTable";
import { ParsedCsvPreview } from "@/lib/csv";

interface PreviewStepProps {
  fileName: string;
  preview: ParsedCsvPreview;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreviewStep({ fileName, preview, onConfirm, onCancel }: PreviewStepProps) {
  const columns = preview.headers.map((header) => ({
    key: header,
    header,
    render: (row: Record<string, string>) => row[header] || (
      <span className="text-slate-300 dark:text-slate-600">—</span>
    ),
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-ink-900 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Preview: {fileName}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {preview.totalRowCount} row{preview.totalRowCount === 1 ? "" : "s"} detected
            {preview.totalRowCount > preview.rows.length &&
              ` — showing first ${preview.rows.length}`}
            . No AI processing has happened yet.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {preview.headers.length} columns detected
        </span>
      </div>

      <div className="mt-5">
        <DataTable columns={columns} rows={preview.rows} />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-ink-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          Confirm &amp; Import with AI
        </button>
      </div>
    </div>
  );
}
