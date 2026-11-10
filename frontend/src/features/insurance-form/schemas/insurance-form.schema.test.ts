import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INSURANCE_FORM_VALUES,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import { createInsuranceFormSchema } from './insurance-form.schema';

const DOB = '2024-03-10T00:00:00.000Z';

const privateBilling: InsuranceFormValues = {
  ...DEFAULT_INSURANCE_FORM_VALUES,
  FormDate: '2026-01-15',
  BranchAddress: 'Blue Cross',
  BillingConsent: '1',
  ParentSignatureDate: '2026-01-15',
};

const decline: InsuranceFormValues = {
  ...DEFAULT_INSURANCE_FORM_VALUES,
  FormDate: '2026-01-15',
  BillingConsent: '3',
  declineReason: 'DeclineReasonPremium',
  ParentSignatureDate2: '2026-01-15',
};

/** Field → first error message, for the values given. */
function errors(values: InsuranceFormValues, dob: unknown = DOB) {
  const result = createInsuranceFormSchema(dob).safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
}

describe('createInsuranceFormSchema', () => {
  it('accepts private insurance billing', () => {
    expect(errors(privateBilling)).toEqual({});
  });

  it('accepts Medicaid billing without a company name', () => {
    expect(errors({ ...privateBilling, BillingConsent: '2', BranchAddress: '' })).toEqual({});
  });

  it('accepts a decline with a reason', () => {
    expect(errors(decline)).toEqual({});
  });

  it('works without a date of birth', () => {
    expect(errors(privateBilling, null)).toEqual({});
  });

  it('requires Date Completed and a consent answer', () => {
    expect(errors(DEFAULT_INSURANCE_FORM_VALUES)).toEqual({
      FormDate: 'Date Completed is required.',
      BillingConsent: 'Choose whether we may bill insurance.',
    });
  });

  it.each(['2026-02-30', '01/15/2026'])('rejects the invalid date %s', (value) => {
    expect(errors({ ...privateBilling, EffectiveDate: value })).toEqual({
      EffectiveDate: 'Enter a valid date.',
    });
  });

  it('limits text to 255 characters', () => {
    expect(errors({ ...privateBilling, PolicyNumber: 'x'.repeat(256) })).toEqual({
      PolicyNumber: 'Use 255 characters or fewer.',
    });
  });

  it('rejects Date Completed and the signature date before Date of Birth', () => {
    expect(
      errors({ ...privateBilling, FormDate: '2024-01-01', ParentSignatureDate: '2024-01-01' }),
    ).toEqual({
      FormDate: 'Date Completed cannot be before Date of Birth.',
      ParentSignatureDate: 'Parent or Guardian Signature Date cannot be before Date of Birth.',
    });
  });

  it('rejects the decline signature date before Date of Birth', () => {
    expect(errors({ ...decline, ParentSignatureDate2: '2024-01-01' })).toEqual({
      ParentSignatureDate2: 'Parent or Guardian Signature Date cannot be before Date of Birth.',
    });
  });

  it('ignores the signature date of the answer not chosen', () => {
    expect(errors({ ...decline, ParentSignatureDate: '2020-01-01' })).toEqual({});
    expect(errors({ ...privateBilling, ParentSignatureDate2: '2020-01-01' })).toEqual({});
  });

  it('rejects an end date before the effective date', () => {
    expect(errors({ ...privateBilling, EffectiveDate: '2026-02-01', EndDate: '2026-01-31' })).toEqual({
      EndDate: 'End Date of Policy cannot be before Effective Date of Policy.',
    });
  });

  it('requires the signature date and company name for private billing', () => {
    expect(errors({ ...privateBilling, BranchAddress: '  ', ParentSignatureDate: '' })).toEqual({
      ParentSignatureDate: 'Parent or Guardian Signature Date is required.',
      BranchAddress: 'Insurance Company Name is required for private insurance billing.',
    });
  });

  it('requires a reason and the signature date when billing is declined', () => {
    expect(errors({ ...decline, declineReason: '', ParentSignatureDate2: '' })).toEqual({
      declineReason: 'Choose a reason.',
      ParentSignatureDate2: 'Parent or Guardian Signature Date is required.',
    });
  });
});
