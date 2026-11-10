import {
  BILLING_CONSENT,
  BILLING_CONSENT_DECLINE,
  BILLING_CONSENT_PRIVATE,
  COLUMNS,
  DECLINE_REASONS,
  type WritableColumn,
} from "./insurance-form.config.js";
import type { InsuranceFormRecord } from "./insurance-form.types.js";

export function error(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

const columnNames = new Set<string>(Object.keys(COLUMNS));

function isBlank(value: unknown) {
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

function parseDate(value: unknown, field: string): string | null {
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

function parseInt32(value: unknown, field: string): number | null {
  if (isBlank(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) error(`${field} must be a whole number`);
  return n;
}

function parseBit(value: unknown, field: string): boolean {
  if (isBlank(value)) return false;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["1", "-1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  error(`${field} must be true or false`);
}

function parseText(value: unknown, field: string, max?: number): string | null {
  if (isBlank(value)) return null;
  const s = String(value).trim();
  if (max !== undefined && s.length > max) {
    error(`${field} must be ${max} characters or fewer`);
  }
  return s;
}

/**
 * Turns a raw request body into column → typed value.
 * - Unknown keys, the unused legacy columns and audit columns are dropped.
 * - FormType is always the legacy literal 'Insurance'.
 * Only keys present in the body are returned, so it works for partial updates.
 */
export function normalizePayload(raw: InsuranceFormRecord): InsuranceFormRecord {
  const body = raw ?? {};
  const out: InsuranceFormRecord = {};

  for (const [key, value] of Object.entries(body)) {
    if (!columnNames.has(key) || value === undefined) continue;
    const spec: { kind: string; max?: number } = COLUMNS[key as WritableColumn];

    switch (spec.kind) {
      case "date":
        out[key] = parseDate(value, key);
        break;
      case "int":
        out[key] = parseInt32(value, key);
        break;
      case "bit":
        out[key] = parseBit(value, key);
        break;
      default:
        out[key] = parseText(value, key, spec.max);
    }
  }

  if (
    out.BillingConsent !== undefined &&
    out.BillingConsent !== null &&
    !BILLING_CONSENT.some((o) => o.code === out.BillingConsent)
  ) {
    error(`BillingConsent has an unknown value: ${String(out.BillingConsent)}`);
  }

  return out;
}

/**
 * Clears what belongs to the other consent answer, when BillingConsent is
 * part of this save:
 * - allow (1 or 2): no decline reasons, no decline signature date
 * - decline (3): no consent signature date
 */
export function clearDependentFields(p: InsuranceFormRecord) {
  if (p.BillingConsent === undefined || p.BillingConsent === null) return;

  if (p.BillingConsent === BILLING_CONSENT_DECLINE) {
    p.ParentSignatureDate = null;
  } else {
    for (const { field } of DECLINE_REASONS) p[field] = false;
    p.ParentSignatureDate2 = null;
  }
}

/** Cross-field rules, run on the merged record (existing + changes). */
export function validateRecord(record: InsuranceFormRecord, dobRaw: unknown) {
  const dob = toIsoDate(dobRaw);

  if (!toIsoDate(record.FormDate)) error("Date Completed is required");

  const dates: Array<[string, unknown]> = [
    ["Date Completed", record.FormDate],
    ["Parent or Guardian Signature Date", record.ParentSignatureDate],
    ["Parent or Guardian Signature Date", record.ParentSignatureDate2],
  ];
  for (const [label, value] of dates) {
    const d = toIsoDate(value);
    if (dob && d && d < dob) error(`${label} cannot be before Date of Birth`);
  }

  const effective = toIsoDate(record.EffectiveDate);
  const end = toIsoDate(record.EndDate);
  if (effective && end && end < effective) {
    error("End Date of Policy cannot be before Effective Date of Policy");
  }

  const consent = record.BillingConsent;
  if (consent === undefined || consent === null) {
    // The FITP extract bills when BillingConsent is NULL, so an answer is required.
    error("Choose whether Children's Integrated Services may bill insurance");
  }

  if (consent === BILLING_CONSENT_DECLINE) {
    const chosen = DECLINE_REASONS.filter(({ field }) => record[field] === true);
    if (chosen.length !== 1) {
      error("Choose one reason for denying permission to bill private insurance");
    }
    if (!toIsoDate(record.ParentSignatureDate2)) {
      error("Parent or Guardian Signature Date is required when billing is declined");
    }
    return;
  }

  if (!toIsoDate(record.ParentSignatureDate)) {
    error("Parent or Guardian Signature Date is required when billing is allowed");
  }
  if (consent === BILLING_CONSENT_PRIVATE && isBlank(record.BranchAddress)) {
    error("Insurance Company Name is required when private insurance billing is allowed");
  }
}
