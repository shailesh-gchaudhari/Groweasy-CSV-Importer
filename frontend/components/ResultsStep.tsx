import { CrmRecord, ImportResult } from "@/lib/types";
import { DataTable, DataTableColumn } from "./ui/DataTable";
import { StatusBadge } from "./ui/StatusBadge";

interface ResultsStepProps {
  result: ImportResult;
  onReset: () => void;
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "positive" | "negative";
}) {
  const toneClasses = {
    neutral: "text-slate-900 dark:text-slate-100",
    positive: "text-brand-600 dark:text-brand-400",
    negative: "text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-ink-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-semibold ${toneClasses}`}>{value}</p>
    </div>
  );
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsStep({ result, onReset }: ResultsStepProps) {
  const importedColumns: DataTableColumn<CrmRecord>[] = [
    { key: "name", header: "Name", render: (r) => r.name || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    {
      key: "mobile",
      header: "Contact",
      render: (r) =>
        r.mobile_without_country_code
          ? `${r.country_code} ${r.mobile_without_country_code}`
          : "—",
    },
    { key: "company", header: "Company", render: (r) => r.company || "—" },
    {
      key: "location",
      header: "Location",
      render: (r) => [r.city, r.state].filter(Boolean).join(", ") || "—",
    },
    {
      key: "created_at",
      header: "Date Created",
      render: (r) => r.created_at || "—",
    },
    {
      key: "crm_status",
      header: "Status",
      render: (r) => <StatusBadge status={r.crm_status} />,
    },
    {
      key: "data_source",
      header: "Source",
      render: (r) => r.data_source || "—",
    },
  ];

  const skippedColumns: DataTableColumn<ImportResult["skipped"][number]>[] = [
    { key: "rowIndex", header: "Row #", render: (r) => r.rowIndex + 1 },
    {
      key: "raw",
      header: "Raw Row (first 3 fields)",
      render: (r) =>
        Object.entries(r.row)
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ") || "—",
      minWidth: 260,
    },
    { key: "reason", header: "Reason Skipped", render: (r) => r.reason, minWidth: 260 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Rows" value={result.totalRows} tone="neutral" />
        <SummaryCard
          label="Successfully Imported"
          value={result.totalImported}
          tone="positive"
        />
        <SummaryCard label="Skipped" value={result.totalSkipped} tone="negative" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-ink-900 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Imported CRM Records
          </h2>
          <button
            onClick={() => downloadJson(result.imported, "groweasy_imported_leads.json")}
            disabled={result.imported.length === 0}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40 dark:text-brand-400"
          >
            Download JSON
          </button>
        </div>
        <div className="mt-4">
          <DataTable
            columns={importedColumns}
            rows={result.imported}
            emptyMessage="No records were successfully imported."
          />
        </div>
      </div>

      {result.skipped.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-ink-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Skipped Records
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Rows without an email or mobile number, or that failed AI extraction.
          </p>
          <div className="mt-4">
            <DataTable columns={skippedColumns} rows={result.skipped} />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Import Another CSV
        </button>
      </div>
    </div>
  );
}
