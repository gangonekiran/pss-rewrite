/**
 * Date helpers shared by the input forms. Dates are YYYY-MM-DD strings
 * (what <input type="date"> uses) and are compared in UTC, so the day
 * counts are not affected by the browser's time zone or daylight saving.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD or an ISO timestamp from the API → YYYY-MM-DD, '' when empty or unreadable. */
export function toDateInput(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

function utc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

/** Whole days from `from` to `to` (negative when `to` is earlier), null when either is blank. */
export function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  return Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS);
}

/** Adds years, months and days to a YYYY-MM-DD date. */
export function addToDate(date: string, { years = 0, months = 0, days = 0 }): string {
  const d = utc(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD (or ISO) → MM/DD/YYYY for display, '—' when empty or unreadable. */
export function formatDate(value: unknown): string {
  const d = toDateInput(value);
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}
