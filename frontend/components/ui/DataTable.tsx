export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  minWidth?: number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  maxHeight?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  maxHeight = "26rem",
  emptyMessage = "No rows to display.",
}: DataTableProps<T>) {
  return (
    <div
      className="scrollbar-thin overflow-auto rounded-xl border border-slate-200 dark:border-slate-800"
      style={{ maxHeight }}
    >
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur dark:bg-ink-900/95">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ minWidth: col.minWidth ?? 140 }}
                className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-ink-900/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200"
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
