import type { ColumnSpec } from "../../utils/sql-columns.js";

export const NOPR_FORM_TABLE = "dbo.stblNoOnePlanForm";
export const REFERRAL_FORM_TABLE = "dbo.stblReferralForm";
export const ACTIVE_FORM_TABLE = "dbo.stblActiveForm";

/**
 * Legacy value stored in FormType (the column default). The FITP extract
 * reports it as the exit type of the No One Plan form.
 */
export const NOPR_FORM_TYPE = "No One Plan";

/**
 * Column types drive both payload validation and SQL parameter binding.
 *
 * Not written by the new form, so existing values are kept on update:
 * - MonthReporting: removed from the screen (same as the Exit Form).
 * - Screening, ReferredBack: "Periodic Screening" and "Referred back to CIS
 *   Intake Team" are no longer used.
 * FormDate is not taken from the request: it always follows StatusDate,
 * because FITP reads FormDate as the date the voucher is turned off.
 * InsertDate/InsertUser/LastUpdateDate/LastUpdateUser are left to the
 * column defaults and are never written from the API.
 */
export const COLUMNS = {
  Region: { kind: "int" },
  RefStatus: { kind: "int" },
  InitialEvalDate: { kind: "date" },
  StatusDate: { kind: "date" },
} as const satisfies Record<string, ColumnSpec>;

export type WritableColumn = keyof typeof COLUMNS;

/** Columns the repository writes: the request columns plus FormDate. */
export const SAVED_COLUMNS = {
  ...COLUMNS,
  FormDate: { kind: "date" },
} as const satisfies Record<string, ColumnSpec>;

/**
 * Reasons no plan resulted (RefStatus), in the order shown on the form.
 * There is no lookup table in dbCDD. 1–7 follow the order of the legacy
 * options; 8 is new and listed first.
 */
export const REF_STATUS = [
  { code: 8, label: "Initial Contact Not Made" },
  { code: 1, label: "Initial visit made - Screening/evaluation declined" },
  { code: 2, label: "Screened - No further evaluation needed" },
  { code: 3, label: "Further Evaluation Declined by Family - Eligibility Not Determined" },
  { code: 4, label: "Evaluated - Not Eligible" },
  { code: 5, label: "Eligible - Services Declined by Family" },
  { code: 6, label: "Moved or Lost Contact" },
] as const;

/**
 * Reasons no longer offered. A form that already has one keeps it when it is
 * saved again, but a form can't be changed to it.
 */
export const RETIRED_REF_STATUS = [
  { code: 7, label: "Turned 3 during evaluation process" },
] as const;
