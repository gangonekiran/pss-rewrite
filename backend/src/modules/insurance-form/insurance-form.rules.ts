import {
  BILLING_CONSENT,
  BILLING_CONSENT_DECLINE,
  BILLING_CONSENT_PRIVATE,
  COLUMNS,
  DECLINE_REASONS,
  type WritableColumn,
} from "./insurance-form.config.js";
import type { InsuranceFormRecord } from "./insurance-form.types.js";
import {
  error,
  isBlank,
  parseBit,
  parseDate,
  parseInt32,
  parseText,
  toIsoDate,
} from "../../utils/form-values.js";

export { error, toIsoDate };

const columnNames = new Set<string>(Object.keys(COLUMNS));

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
 * Clears what belongs to the other consent answer:
 * - allow (1 or 2): no decline reasons, no decline signature date
 * - decline (3): no consent signature date
 * `consent` is the answer the saved form will have; on update that is the
 * saved value when the body does not change it, so a partial update cannot
 * store fields of the answer that was not chosen.
 */
export function clearDependentFields(p: InsuranceFormRecord, consent: unknown = p.BillingConsent) {
  if (consent === undefined || consent === null) return;

  if (consent === BILLING_CONSENT_DECLINE) {
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
