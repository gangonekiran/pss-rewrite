/**
 * Pure Exit Form rules: payload normalisation and validation.
 * No database access here.
 */
import {
  COLUMNS,
  EXIT_AT_AGE_3,
  EXIT_AT_AGE_3_NOT_ELIGIBLE,
  EXIT_PRIOR_MOVED_OTHER_REGION,
  EXIT_PRIOR_TO_AGE_3,
  NOT_THIS_EXIT_PATH,
  REFERRED_TO,
  type WritableColumn,
} from "./exit-form.config";
import type { ExitFormRecord } from "./exit-form.types";

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

/**
 * Access-style Yes/No stored in an int column: -1 = Yes, 0 = No.
 * Accepts booleans, -1/0/1 and "yes"/"no" so the UI can send radios as-is.
 */
function parseYesNo(value: unknown, field: string): number | null {
  if (isBlank(value)) return null;
  if (value === true) return -1;
  if (value === false) return 0;
  const s = String(value).trim().toLowerCase();
  if (["-1", "1", "yes", "y", "true"].includes(s)) return -1;
  if (["0", "no", "n", "false"].includes(s)) return 0;
  error(`${field} must be Yes or No`);
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

function checkCode(
  value: unknown,
  field: string,
  options: readonly { code: number }[],
  allowNotThisPath = false,
) {
  if (value === null || value === undefined) return;
  if (allowNotThisPath && value === NOT_THIS_EXIT_PATH) return;
  if (!options.some((o) => o.code === value)) {
    error(`${field} has an unknown value: ${String(value)}`);
  }
}

/**
 * Turns a raw request body into column → typed value.
 * - Unknown keys and audit columns are dropped.
 * - FormType is always the legacy literal 'Exit'.
 * Only keys present in the body are returned, so it works for partial updates.
 */
export function normalizePayload(raw: ExitFormRecord): ExitFormRecord {
  const body = raw ?? {};
  const out: ExitFormRecord = {};

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
      case "yesNo":
        out[key] = parseYesNo(value, key);
        break;
      case "bit":
        out[key] = parseBit(value, key);
        break;
      default:
        out[key] = parseText(value, key, spec.max);
    }
  }

  delete out.FormType;

  checkCode(out.ExitPriorToAge3, "ExitPriorToAge3", EXIT_PRIOR_TO_AGE_3, true);
  checkCode(out.ExitAtAge3, "ExitAtAge3", EXIT_AT_AGE_3, true);
  checkCode(out.ReferredTo, "ReferredTo", REFERRED_TO);

  return out;
}

/** A real exit-path code (not NULL and not the legacy 0). */
function isExitCode(value: unknown) {
  return typeof value === "number" && value !== NOT_THIS_EXIT_PATH;
}

/**
 * When this save picks one exit path, stores 0 in the other path's column
 * (unless the caller also sent a code for it, which validateRecord rejects).
 * Also works for a partial update that switches path.
 */
export function applyExitPath(p: ExitFormRecord) {
  if (isExitCode(p.ExitPriorToAge3) && !isExitCode(p.ExitAtAge3)) {
    p.ExitAtAge3 = NOT_THIS_EXIT_PATH;
  }
  if (isExitCode(p.ExitAtAge3) && !isExitCode(p.ExitPriorToAge3)) {
    p.ExitPriorToAge3 = NOT_THIS_EXIT_PATH;
  }
}

/**
 * Clears fields that only apply to a specific answer, when that answer
 * is part of this save and points elsewhere:
 * - MovedOtherRegion only for ExitPriorToAge3 = 2 (Moved to other region)
 * - EXFNoPartB1-3 only for ExitAtAge3 = 4 (NOT eligible for Part B)
 */
export function clearDependentFields(p: ExitFormRecord) {
  if (p.ExitPriorToAge3 !== undefined && p.ExitPriorToAge3 !== EXIT_PRIOR_MOVED_OTHER_REGION) {
    p.MovedOtherRegion = null;
  }
  if (p.ExitAtAge3 !== undefined && p.ExitAtAge3 !== EXIT_AT_AGE_3_NOT_ELIGIBLE) {
    p.EXFNoPartB1 = false;
    p.EXFNoPartB2 = false;
    p.EXFNoPartB3 = false;
  }
}

/** Cross-field rules, run on the merged record (existing + changes). */
export function validateRecord(record: ExitFormRecord, dobRaw: unknown) {
  const dob = toIsoDate(dobRaw);
  const exitDate = toIsoDate(record.ExitDate);
  const referralDate = toIsoDate(record.ReferralDate);

  const dates: Array<[string, string, unknown]> = [
    ["ReferralDate", "Date of Referral", record.ReferralDate],
    ["ReReferralDate", "Re-referral Date", record.ReReferralDate],
    ["ExitDate", "Date of Exit", record.ExitDate],
    ["TransitionPlanCompleted", "Date Written Transition Plan", record.TransitionPlanCompleted],
    ["CLLEANotificationDate", "LEA Notification Date", record.CLLEANotificationDate],
    ["TransitionMeeting", "Date of Transition Conference", record.TransitionMeeting],
  ];

  for (const [, label, value] of dates) {
    const d = toIsoDate(value);
    if (dob && d && d < dob) error(`${label} cannot be before Date of Birth`);
  }

  if (exitDate && referralDate && exitDate < referralDate) {
    error("Date of Exit cannot be before Date of Referral");
  }

  for (const [field, label, value] of dates) {
    if (field !== "TransitionPlanCompleted" && field !== "CLLEANotificationDate") continue;
    const d = toIsoDate(value);
    if (referralDate && d && d < referralDate) error(`${label} cannot be before Date of Referral`);
  }

  for (const [field, label, value] of dates) {
    if (field === "ExitDate" || field === "ReferralDate" || field === "ReReferralDate") continue;
    const d = toIsoDate(value);
    if (exitDate && d && d > exitDate) error(`${label} cannot be after Date of Exit`);
  }

  // Legacy reports treat these as two separate exit paths (the unused one is 0).
  if (isExitCode(record.ExitPriorToAge3) && isExitCode(record.ExitAtAge3)) {
    error("Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both");
  }

  // Legacy data-cleaning check DCNotPEReferred flags these rows.
  if (record.ExitAtAge3 === EXIT_AT_AGE_3_NOT_ELIGIBLE && isBlank(record.ReferredTo)) {
    error(
      'Referred To is required when the child is NOT eligible for Part B ' +
        '(choose "Exited with no referral" if there was no referral)',
    );
  }
}
