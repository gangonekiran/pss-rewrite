export const INSURANCE_FORM_TABLE = "dbo.stblInsuranceForm";

/** Legacy value stored in FormType (the column default and slstFormNames). */
export const INSURANCE_FORM_TYPE = "Insurance";

/**
 * Column types drive both payload validation and SQL parameter binding.
 * nvarchar(255) columns are listed with max 255.
 *
 * Not written by the new form, so existing values are kept on update:
 * - InsCoNumber, CoverageCode, Phone: no longer used (Get_CIS_FITP_Output
 *   still sends InsCoNumber and CoverageCode, blank when empty).
 * - InsuranceName: staff type the company name into BranchAddress instead.
 * InsertDate/InsertUser/LastUpdateDate/LastUpdateUser are left to the
 * column defaults and are never written from the API.
 */
export type ColumnKind = "int" | "bit" | "date" | "text";

export const COLUMNS = {
  FormDate: { kind: "date" },
  BranchAddress: { kind: "text", max: 255 },
  PolicyNumber: { kind: "text", max: 255 },
  GroupNumber: { kind: "text", max: 255 },
  GroupName: { kind: "text", max: 255 },
  EffectiveDate: { kind: "date" },
  EndDate: { kind: "date" },
  PolicyHolder: { kind: "text", max: 255 },
  BillingConsent: { kind: "int" },
  ParentSignatureDate: { kind: "date" },
  DeclineReasonCap: { kind: "bit" },
  DeclineReasonPremium: { kind: "bit" },
  DeclineReasonBenefits: { kind: "bit" },
  DeclineReasonEligibility: { kind: "bit" },
  ParentSignatureDate2: { kind: "date" },
} as const satisfies Record<string, { kind: ColumnKind; max?: number }>;

export type WritableColumn = keyof typeof COLUMNS;

/**
 * BillingConsent is one int column (an Access option group). Only 3 is
 * named in dbCDD: Get_CIS_FITP_Output and sqryFITPExtractD treat 3 as
 * "Do Not Bill" and every other value, including NULL, as "Bill".
 * 1 and 2 follow the order of the options on the legacy form.
 */
export const BILLING_CONSENT = [
  {
    code: 1,
    label:
      "My private insurance for services provided to my child for Part C Early Intervention. " +
      "I understand that information about my child's early intervention services may be shared in that process.",
  },
  {
    code: 2,
    label:
      "For services billed to Medicaid, I understand that information about my child's " +
      "early intervention services may be shared in that process.",
  },
  {
    code: 3,
    label:
      "I decline permission for Children's Integrated Services – Part C Early Intervention to bill " +
      "my private insurance for services provided to my child for Part C Early Intervention.",
  },
] as const;

export const BILLING_CONSENT_PRIVATE = 1;
export const BILLING_CONSENT_DECLINE = 3;

/** The four "I choose to deny permission..." reasons, one bit column each. */
export const DECLINE_REASONS = [
  { field: "DeclineReasonCap", label: "My available life-time cap would be affected" },
  { field: "DeclineReasonBenefits", label: "My other health insurance benefits would decrease" },
  { field: "DeclineReasonPremium", label: "My health insurance premiums would increase" },
  {
    field: "DeclineReasonEligibility",
    label: "I risk loss of eligibility for me/my child for home and community waivers",
  },
] as const;

export type DeclineReasonField = (typeof DECLINE_REASONS)[number]["field"];
