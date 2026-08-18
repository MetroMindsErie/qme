type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: unknown): string {
  const raw = csvCell(value);
  if (!/[",\r\n]/.test(raw)) return raw;
  return `"${raw.replaceAll('"', '""')}"`;
}

export function formatCsvTimestamp(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

export function safeCsvFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'qme-report';
}

export function downloadCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[]
) {
  const header = columns.map((column) => escapeCsv(column.header)).join(',');
  const body = rows.map((row) => (
    columns.map((column) => escapeCsv(column.value(row))).join(',')
  ));
  const csv = [header, ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
