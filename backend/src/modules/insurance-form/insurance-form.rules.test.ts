import { describe, expect, it } from 'vitest';

import {
  clearDependentFields,
  error,
  normalizePayload,
  toIsoDate,
  validateRecord,
} from './insurance-form.rules.js';

const DOB = '2024-03-10';

const allowPrivate = {
  FormDate: '2026-01-15',
  BranchAddress: 'Blue Cross',
  BillingConsent: 1,
  ParentSignatureDate: '2026-01-15',
};

const decline = {
  FormDate: '2026-01-15',
  BillingConsent: 3,
  DeclineReasonCap: false,
  DeclineReasonPremium: true,
  DeclineReasonBenefits: false,
  DeclineReasonEligibility: false,
  ParentSignatureDate2: '2026-01-15',
};

describe('error', () => {
  it('throws with a 400 status by default', () => {
    expect(() => error('Bad')).toThrow(expect.objectContaining({ message: 'Bad', status: 400 }));
  });

  it('throws with the given status', () => {
    expect(() => error('Missing', 404)).toThrow(expect.objectContaining({ status: 404 }));
  });
});

describe('toIsoDate', () => {
  it.each([
    ['2026-01-15', '2026-01-15'],
    ['2026-01-15T00:00:00.000Z', '2026-01-15'],
    [new Date('2026-01-15T00:00:00Z'), '2026-01-15'],
  ])('reads %j', (value, expected) => {
    expect(toIsoDate(value)).toBe(expected);
  });

  it.each([null, undefined, '', '  ', 'not a date', new Date('invalid')])(
    'returns null for %j',
    (value) => {
      expect(toIsoDate(value)).toBeNull();
    },
  );
});

describe('normalizePayload', () => {
  it('types each column and drops unknown and legacy-only keys', () => {
    expect(
      normalizePayload({
        FormDate: '2026-01-15',
        BranchAddress: '  Blue Cross  ',
        BillingConsent: '1',
        DeclineReasonCap: 'true',
        DeclineReasonPremium: 0,
        ID: 99,
        ChildID: 5,
        FormType: 'Other',
        InsCoNumber: 'ABC',
        CoverageCode: '01',
        Phone: '555',
        InsuranceName: 'Name',
        LastUpdateUser: 'x',
        Unknown: 'y',
      }),
    ).toEqual({
      FormDate: '2026-01-15',
      BranchAddress: 'Blue Cross',
      BillingConsent: 1,
      DeclineReasonCap: true,
      DeclineReasonPremium: false,
    });
  });

  it('only returns the keys that were sent', () => {
    expect(normalizePayload({ PolicyNumber: 'P-1' })).toEqual({ PolicyNumber: 'P-1' });
  });

  it('treats blank values as null, and blank bits as false', () => {
    expect(
      normalizePayload({ PolicyNumber: ' ', EndDate: '', BillingConsent: null, DeclineReasonCap: '' }),
    ).toEqual({ PolicyNumber: null, EndDate: null, BillingConsent: null, DeclineReasonCap: false });
  });

  it('skips undefined values', () => {
    expect(normalizePayload({ PolicyNumber: undefined })).toEqual({});
  });

  it('handles a missing body', () => {
    expect(normalizePayload(undefined as unknown as Record<string, unknown>)).toEqual({});
  });

  it('accepts Date objects and boolean bits', () => {
    expect(
      normalizePayload({ EffectiveDate: new Date('2026-02-01T00:00:00Z'), DeclineReasonCap: true }),
    ).toEqual({ EffectiveDate: '2026-02-01', DeclineReasonCap: true });
  });

  it.each([
    [{ FormDate: '01/15/2026' }, 'FormDate must use YYYY-MM-DD format'],
    [{ FormDate: '2026-02-30' }, 'FormDate must be a valid date'],
    [{ BillingConsent: '1.5' }, 'BillingConsent must be a whole number'],
    [{ BillingConsent: 4 }, 'BillingConsent has an unknown value: 4'],
    [{ DeclineReasonCap: 'maybe' }, 'DeclineReasonCap must be true or false'],
    [{ PolicyNumber: 'x'.repeat(256) }, 'PolicyNumber must be 255 characters or fewer'],
  ])('rejects %j', (body, message) => {
    expect(() => normalizePayload(body)).toThrow(message);
  });
});

describe('clearDependentFields', () => {
  it('clears the decline reasons and decline signature date when billing is allowed', () => {
    const p: Record<string, unknown> = { BillingConsent: 2, DeclineReasonCap: true, ParentSignatureDate2: '2026-01-01' };

    clearDependentFields(p);

    expect(p).toEqual({
      BillingConsent: 2,
      DeclineReasonCap: false,
      DeclineReasonPremium: false,
      DeclineReasonBenefits: false,
      DeclineReasonEligibility: false,
      ParentSignatureDate2: null,
    });
  });

  it('clears the consent signature date when billing is declined', () => {
    const p: Record<string, unknown> = { BillingConsent: 3, ParentSignatureDate: '2026-01-01' };

    clearDependentFields(p);

    expect(p).toEqual({ BillingConsent: 3, ParentSignatureDate: null });
  });

  it.each([undefined, null])('leaves the record alone when BillingConsent is %j', (consent) => {
    const p: Record<string, unknown> = { BillingConsent: consent, ParentSignatureDate: '2026-01-01' };

    clearDependentFields(p);

    expect(p).toEqual({ BillingConsent: consent, ParentSignatureDate: '2026-01-01' });
  });
});

describe('validateRecord', () => {
  it('accepts private insurance billing', () => {
    expect(() => validateRecord(allowPrivate, DOB)).not.toThrow();
  });

  it('accepts Medicaid billing without a company name', () => {
    expect(() =>
      validateRecord({ FormDate: '2026-01-15', BillingConsent: 2, ParentSignatureDate: '2026-01-15' }, DOB),
    ).not.toThrow();
  });

  it('accepts a decline with one reason', () => {
    expect(() => validateRecord(decline, DOB)).not.toThrow();
  });

  it('works without a date of birth', () => {
    expect(() => validateRecord(allowPrivate, null)).not.toThrow();
  });

  it('requires Date Completed', () => {
    expect(() => validateRecord({ ...allowPrivate, FormDate: null }, DOB)).toThrow(
      'Date Completed is required',
    );
  });

  it.each([
    ['FormDate', 'Date Completed'],
    ['ParentSignatureDate', 'Parent or Guardian Signature Date'],
  ])('rejects %s before Date of Birth', (field, label) => {
    expect(() => validateRecord({ ...allowPrivate, [field]: '2024-01-01' }, DOB)).toThrow(
      `${label} cannot be before Date of Birth`,
    );
  });

  it('rejects a decline signature date before Date of Birth', () => {
    expect(() => validateRecord({ ...decline, ParentSignatureDate2: '2024-01-01' }, DOB)).toThrow(
      'Parent or Guardian Signature Date cannot be before Date of Birth',
    );
  });

  it('rejects an end date before the effective date', () => {
    expect(() =>
      validateRecord({ ...allowPrivate, EffectiveDate: '2026-02-01', EndDate: '2026-01-31' }, DOB),
    ).toThrow('End Date of Policy cannot be before Effective Date of Policy');
  });

  it('accepts an end date on the effective date', () => {
    expect(() =>
      validateRecord({ ...allowPrivate, EffectiveDate: '2026-02-01', EndDate: '2026-02-01' }, DOB),
    ).not.toThrow();
  });

  it.each([undefined, null])('requires a billing consent answer (%j)', (consent) => {
    expect(() => validateRecord({ ...allowPrivate, BillingConsent: consent }, DOB)).toThrow(
      "Choose whether Children's Integrated Services may bill insurance",
    );
  });

  it.each([1, 2])('requires the signature date when billing is allowed (%i)', (consent) => {
    expect(() =>
      validateRecord({ ...allowPrivate, BillingConsent: consent, ParentSignatureDate: null }, DOB),
    ).toThrow('Parent or Guardian Signature Date is required when billing is allowed');
  });

  it('requires the company name for private insurance billing', () => {
    expect(() => validateRecord({ ...allowPrivate, BranchAddress: ' ' }, DOB)).toThrow(
      'Insurance Company Name is required when private insurance billing is allowed',
    );
  });

  it('requires a reason when billing is declined', () => {
    expect(() => validateRecord({ ...decline, DeclineReasonPremium: false }, DOB)).toThrow(
      'Choose one reason for denying permission to bill private insurance',
    );
  });

  it('rejects more than one reason', () => {
    expect(() => validateRecord({ ...decline, DeclineReasonCap: true }, DOB)).toThrow(
      'Choose one reason for denying permission to bill private insurance',
    );
  });

  it('requires the decline signature date when billing is declined', () => {
    expect(() => validateRecord({ ...decline, ParentSignatureDate2: null }, DOB)).toThrow(
      'Parent or Guardian Signature Date is required when billing is declined',
    );
  });
});
