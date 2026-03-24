function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.includes(",") || s.includes("\n") || s.includes('"')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCSV(row[h])).join(",")),
  ].join("\n");
  trigger(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function downloadJSON(data: unknown, filename: string) {
  trigger(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `${filename}.json`
  );
}

function trigger(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
