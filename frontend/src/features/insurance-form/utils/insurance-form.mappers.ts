import {
  BILLING_CONSENT_DECLINE,
  DECLINE_REASON_FIELDS,
  type InsuranceFormRecord,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import { toDateInput } from '../../../utils/date';

function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

export function recordToValues(form: InsuranceFormRecord): InsuranceFormValues {
  const consent = Number(form.BillingConsent);

  return {
    FormDate: toDateInput(form.FormDate),
    BranchAddress: str(form.BranchAddress),
    PolicyNumber: str(form.PolicyNumber),
    GroupNumber: str(form.GroupNumber),
    GroupName: str(form.GroupName),
    EffectiveDate: toDateInput(form.EffectiveDate),
    EndDate: toDateInput(form.EndDate),
    PolicyHolder: str(form.PolicyHolder),

    BillingConsent: [1, 2, 3].includes(consent) ? String(consent) : '',
    ParentSignatureDate: toDateInput(form.ParentSignatureDate),
    declineReason: DECLINE_REASON_FIELDS.find((field) => form[field] === true) ?? '',
    ParentSignatureDate2: toDateInput(form.ParentSignatureDate2),
  };
}

/**
 * Form model → API body. Only the fields on the form are sent. The decline
 * reason becomes the four bit columns; fields of the consent answer not
 * chosen are sent empty (the API clears them too).
 */
export function valuesToPayload(values: InsuranceFormValues): Record<string, unknown> {
  const decline = values.BillingConsent === BILLING_CONSENT_DECLINE;

  const reasons = Object.fromEntries(
    DECLINE_REASON_FIELDS.map((field) => [field, decline && values.declineReason === field]),
  );

  return {
    FormDate: values.FormDate || null,
    BranchAddress: nullable(values.BranchAddress),
    PolicyNumber: nullable(values.PolicyNumber),
    GroupNumber: nullable(values.GroupNumber),
    GroupName: nullable(values.GroupName),
    EffectiveDate: values.EffectiveDate || null,
    EndDate: values.EndDate || null,
    PolicyHolder: nullable(values.PolicyHolder),

    BillingConsent: values.BillingConsent ? Number(values.BillingConsent) : null,
    ParentSignatureDate: !decline ? values.ParentSignatureDate || null : null,
    ...reasons,
    ParentSignatureDate2: decline ? values.ParentSignatureDate2 || null : null,
  };
}
