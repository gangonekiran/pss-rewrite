/**
 * Parsing and validation helpers shared by the input-form modules (Exit, Insurance).
 * Each module keeps its own column list and cross-field rules.
 */
export function error(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

export function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

/** Date, ISO timestamp or YYYY-MM-DD → YYYY-MM-DD (UTC), or null. */
export function toIsoDate(value: unknown): string | null {
  if (isBlank(value)) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function parseDate(value: unknown, field: string): string | null {
  if (isBlank(value)) return null;
  if (value instanceof Date) return toIsoDate(value);
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) error(`${field} must use YYYY-MM-DD format`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    error(`${field} must be a valid date`);
  }
  return s;
}

export function parseInt32(value: unknown, field: string): number | null {
  if (isBlank(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) error(`${field} must be a whole number`);
  return n;
}

export function parseBit(value: unknown, field: string): boolean {
  if (isBlank(value)) return false;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["1", "-1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  error(`${field} must be true or false`);
}

export function parseText(value: unknown, field: string, max?: number): string | null {
  if (isBlank(value)) return null;
  const s = String(value).trim();
  if (max !== undefined && s.length > max) {
    error(`${field} must be ${max} characters or fewer`);
  }
  return s;
}
