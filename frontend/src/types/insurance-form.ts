export interface InsuranceFormClient {
  ChildID: number;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  DOB: string | null;
}

/** A stblInsuranceForm row as returned by /api/insurance-forms (the columns the form uses). */
export interface InsuranceFormRecord {
  ID?: number;
  ChildID?: number;
  FormDate?: string | null;
  FormType?: string | null;
  BranchAddress?: string | null;
  PolicyNumber?: string | null;
  GroupNumber?: string | null;
  GroupName?: string | null;
  EffectiveDate?: string | null;
  EndDate?: string | null;
  PolicyHolder?: string | null;
  BillingConsent?: number | null;
  ParentSignatureDate?: string | null;
  DeclineReasonCap?: boolean | null;
  DeclineReasonPremium?: boolean | null;
  DeclineReasonBenefits?: boolean | null;
  DeclineReasonEligibility?: boolean | null;
  ParentSignatureDate2?: string | null;
  [key: string]: unknown;
}

export interface InsuranceFormResponse {
  client: InsuranceFormClient;
  forms: InsuranceFormRecord[];
}

export type DeclineReasonField =
  | 'DeclineReasonCap'
  | 'DeclineReasonPremium'
  | 'DeclineReasonBenefits'
  | 'DeclineReasonEligibility';

export const DECLINE_REASON_FIELDS: DeclineReasonField[] = [
  'DeclineReasonCap',
  'DeclineReasonPremium',
  'DeclineReasonBenefits',
  'DeclineReasonEligibility',
];

export interface InsuranceFormOptions {
  /** 1 = private insurance, 2 = Medicaid, 3 = decline. */
  billingConsent: { code: number; label: string }[];
  declineReasons: { field: DeclineReasonField; label: string }[];
}

/** BillingConsent radio values. 3 is what the FITP extract reads as "Do Not Bill". */
export const BILLING_CONSENT_PRIVATE = '1';
export const BILLING_CONSENT_DECLINE = '3';

/** react-hook-form model. Radios hold strings; mapping to the API is in insurance-form.mappers.ts. */
export interface InsuranceFormValues {
  // Insurance Information
  FormDate: string;
  BranchAddress: string;
  PolicyNumber: string;
  GroupNumber: string;
  GroupName: string;
  EffectiveDate: string;
  EndDate: string;
  PolicyHolder: string;

  // Consent to Bill Insurance
  BillingConsent: string;
  ParentSignatureDate: string;
  declineReason: '' | DeclineReasonField;
  ParentSignatureDate2: string;
}

export const DEFAULT_INSURANCE_FORM_VALUES: InsuranceFormValues = {
  FormDate: '',
  BranchAddress: '',
  PolicyNumber: '',
  GroupNumber: '',
  GroupName: '',
  EffectiveDate: '',
  EndDate: '',
  PolicyHolder: '',

  BillingConsent: '',
  ParentSignatureDate: '',
  declineReason: '',
  ParentSignatureDate2: '',
};
