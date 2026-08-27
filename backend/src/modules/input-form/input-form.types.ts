/**
 * Supported input-form types.
 *
 * Each value corresponds to an entry in FORM_CONFIGS
 * and therefore to a specific database table.
 */
export type FormName =
  | "active"
  | "cos-cover"
  | "exit"
  | "insurance"
  | "no-one-plan"
  | "referral"
  | "service-grid";

/**
 * Generic input-form record.
 *
 * Input forms contain different fields depending on the
 * selected form type, so the record uses dynamic string keys.
 */
export interface InputFormRecord {
  [key: string]: unknown;
}

/**
 * Configuration used by the input-form repository.
 *
 * This defines the database mapping for each form:
 * - name: application form name
 * - table: SQL Server table
 * - idColumn: primary-key column
 * - childIdColumn: client/child foreign-key column
 * - writableColumns: fields allowed during insert/update
 */
export interface FormConfig {
  name: FormName;

  table: string;

  idColumn: string;

  childIdColumn: string;

  writableColumns: readonly string[];
}

/**
 * Represents one row in the combined Input Form History grid.
 *
 * Different form types provide different date fields.
 * Fields that do not apply to a particular form are returned
 * as null by the history repository.
 */
export interface InputFormHistoryRow {
  /** Primary key of the form record. */
  id: number;

  /** General form date. */
  date: string | null;

  /** Form type. */
  formType: string | null;

  /** Referral date. */
  referral: string | null;

  /** No One Plan date. */
  nopr: string | null;

  /** Interim date. */
  interim: string | null;

  /** One Plan date. */
  op: string | null;

  /** Exit date. */
  exit: string | null;

  /** Indicates whether the form has a loop error. */
  loopError: boolean;

  /** Identifies the input-form type. */
  formName: FormName;
}