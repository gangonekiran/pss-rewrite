export interface NoprFormClient {
  ChildID: number;
  Region: number | null;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  DOB: string | null;
}

/** A stblNoOnePlanForm row as returned by /api/nopr-forms (the columns the form uses). */
export interface NoprFormRecord {
  ID?: number;
  ChildID?: number;
  FormDate?: string | null;
  FormType?: string | null;
  Region?: number | null;
  RefStatus?: number | null;
  InitialEvalDate?: string | null;
  StatusDate?: string | null;
  [key: string]: unknown;
}

export interface NoprFormResponse {
  client: NoprFormClient;
  forms: NoprFormRecord[];
}

/** Region for a new form, and the referral date the status date can't be before. */
export interface NoprFormDefaults {
  Region: number | null;
  MostRecentReferralDate: string | null;
}

export interface CodeOption {
  code: number;
  label: string;
}

export interface NoprFormOptions {
  /** Reasons that can be chosen, in display order. */
  refStatus: CodeOption[];
  /** Reasons no longer offered; shown only on a form that already has one. */
  retiredRefStatus: CodeOption[];
}

/** react-hook-form model. Radios hold strings; mapping to the API is in nopr-form.mappers.ts. */
export interface NoprFormValues {
  Region: number;
  RefStatus: string;
  InitialEvalDate: string;
  StatusDate: string;
}

export const DEFAULT_NOPR_FORM_VALUES: NoprFormValues = {
  Region: 0,
  RefStatus: '',
  InitialEvalDate: '',
  StatusDate: '',
};
