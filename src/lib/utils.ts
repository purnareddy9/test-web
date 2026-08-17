// Date utilities
export function formatDate(d: string | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getDateRange(start: string, end?: string, current?: boolean): string {
  const s = formatDate(start);
  if (current) return `${s} — Present`;
  if (!end) return s;
  return `${s} — ${formatDate(end)}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
