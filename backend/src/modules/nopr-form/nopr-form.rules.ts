import { COLUMNS, REF_STATUS, RETIRED_REF_STATUS, type WritableColumn } from "./nopr-form.config.js";
import type { NoprFormRecord } from "./nopr-form.types.js";
import { error, parseDate, parseInt32, toIsoDate } from "../../utils/form-values.js";

export { error, toIsoDate };

const columnNames = new Set<string>(Object.keys(COLUMNS));

const label = (code: unknown) =>
  [...REF_STATUS, ...RETIRED_REF_STATUS].find((o) => o.code === code)?.label;

/**
 * Turns a raw request body into column → typed value.
 * - Unknown keys, FormDate, FormType, the unused legacy columns and audit
 *   columns are dropped.
 * Only keys present in the body are returned, so it works for partial updates.
 */
export function normalizePayload(raw: NoprFormRecord): NoprFormRecord {
  const out: NoprFormRecord = {};

  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!columnNames.has(key) || value === undefined) continue;
    const spec: { kind: string } = COLUMNS[key as WritableColumn];
    out[key] = spec.kind === "date" ? parseDate(value, key) : parseInt32(value, key);
  }

  if (out.RefStatus !== undefined && out.RefStatus !== null && !label(out.RefStatus)) {
    error(`RefStatus has an unknown value: ${String(out.RefStatus)}`);
  }

  return out;
}

/**
 * A retired reason can be kept on a form that already has it, but a form
 * can't be changed to it.
 */
export function checkRetiredReason(p: NoprFormRecord, savedRefStatus: unknown) {
  const retired = RETIRED_REF_STATUS.find((o) => o.code === p.RefStatus);
  if (retired && p.RefStatus !== savedRefStatus) {
    error(`"${retired.label}" is no longer used; choose another reason`);
  }
}

/** FITP reads FormDate as the date the voucher is turned off, so it follows StatusDate. */
export function applyFormDate(p: NoprFormRecord) {
  if (p.StatusDate !== undefined) p.FormDate = p.StatusDate;
}

/** Cross-field rules, run on the merged record (existing + changes). */
export function validateRecord(
  record: NoprFormRecord,
  dobRaw: unknown,
  mostRecentReferralRaw: unknown,
) {
  const dob = toIsoDate(dobRaw);
  const referral = toIsoDate(mostRecentReferralRaw);
  const statusDate = toIsoDate(record.StatusDate);
  const evalDate = toIsoDate(record.InitialEvalDate);

  if (record.Region === undefined || record.Region === null) error("Region must be selected");
  if (record.RefStatus === undefined || record.RefStatus === null) {
    error("Select the reason a plan was not created");
  }
  if (!statusDate) error("Date above status was determined is required");

  if (dob && statusDate < dob) {
    error("Date above status was determined cannot be before Date of Birth");
  }
  if (referral && statusDate < referral) {
    const [y, m, d] = referral.split("-");
    error(
      `Date above status was determined cannot be before the most recent referral date (${m}/${d}/${y})`,
    );
  }

  if (dob && evalDate && evalDate < dob) {
    error("Date of Initial Evaluation cannot be before Date of Birth");
  }
  if (evalDate && evalDate > statusDate) {
    error("Date of Initial Evaluation cannot be after the date the status was determined");
  }
}
