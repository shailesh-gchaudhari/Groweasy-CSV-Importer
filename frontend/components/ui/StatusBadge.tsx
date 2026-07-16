const STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  SALE_DONE:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  DID_NOT_CONNECT:
    "bg-slate-200 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  BAD_LEAD:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "": "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
};

const LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  SALE_DONE: "Sale Done",
  DID_NOT_CONNECT: "Not Connected",
  BAD_LEAD: "Bad Lead",
  "": "—",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES[""];
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
