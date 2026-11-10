import { z } from 'zod';

import {
  BILLING_CONSENT_DECLINE,
  BILLING_CONSENT_PRIVATE,
  DECLINE_REASON_FIELDS,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import { toDateInput } from '../../../utils/date';

/** YYYY-MM-DD that is a real calendar day (the browser rolls 2026-02-30 over to March). */
function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const date = z.string().refine((value) => !value || isDate(value), 'Enter a valid date.');

const text = z.string().max(255, 'Use 255 characters or fewer.');

/** Dates the parent signs or the form is completed on: none can be before the child's birth. */
const AFTER_BIRTH: Array<[keyof InsuranceFormValues, string]> = [
  ['FormDate', 'Date Completed'],
  ['ParentSignatureDate', 'Parent or Guardian Signature Date'],
  ['ParentSignatureDate2', 'Parent or Guardian Signature Date'],
];

/**
 * Field-level rules plus the cross-field rules the API also enforces.
 * Only the signature date and fields of the chosen consent answer are checked.
 */
export function createInsuranceFormSchema(dob: unknown) {
  const dobDate = toDateInput(dob);

  return z
    .object({
      FormDate: date.refine(Boolean, 'Date Completed is required.'),
      BranchAddress: text,
      PolicyNumber: text,
      GroupNumber: text,
      GroupName: text,
      EffectiveDate: date,
      EndDate: date,
      PolicyHolder: text,

      BillingConsent: z.string(),
      ParentSignatureDate: date,
      declineReason: z.enum(['', ...DECLINE_REASON_FIELDS]),
      ParentSignatureDate2: date,
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof InsuranceFormValues, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      const decline = v.BillingConsent === BILLING_CONSENT_DECLINE;

      for (const [field, label] of AFTER_BIRTH) {
        if (field === 'ParentSignatureDate' && decline) continue;
        if (field === 'ParentSignatureDate2' && !decline) continue;
        const value = v[field] as string;
        if (dobDate && value && value < dobDate) issue(field, `${label} cannot be before Date of Birth.`);
      }

      if (v.EffectiveDate && v.EndDate && v.EndDate < v.EffectiveDate) {
        issue('EndDate', 'End Date of Policy cannot be before Effective Date of Policy.');
      }

      if (!v.BillingConsent) {
        issue('BillingConsent', 'Choose whether we may bill insurance.');
        return;
      }

      if (decline) {
        if (!v.declineReason) issue('declineReason', 'Choose a reason.');
        if (!v.ParentSignatureDate2)
          issue('ParentSignatureDate2', 'Parent or Guardian Signature Date is required.');
        return;
      }

      if (!v.ParentSignatureDate)
        issue('ParentSignatureDate', 'Parent or Guardian Signature Date is required.');
      if (v.BillingConsent === BILLING_CONSENT_PRIVATE && !v.BranchAddress.trim())
        issue('BranchAddress', 'Insurance Company Name is required for private insurance billing.');
    });
}
