import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INSURANCE_FORM_VALUES,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import { recordToValues, valuesToPayload } from './insurance-form.mappers';

describe('recordToValues', () => {
  it('maps a saved record to the form model', () => {
    expect(
      recordToValues({
        ID: 7,
        FormDate: '2026-01-15 00:00:00',
        BranchAddress: 'Blue Cross',
        PolicyNumber: 'P-1',
        GroupNumber: 'G-1',
        GroupName: 'Acme',
        EffectiveDate: '2026-01-01T00:00:00.000Z',
        EndDate: null,
        PolicyHolder: 'Jane Austin',
        BillingConsent: 3,
        ParentSignatureDate: null,
        DeclineReasonCap: false,
        DeclineReasonPremium: true,
        ParentSignatureDate2: '2026-01-16',
        InsCoNumber: 'BCB',
      }),
    ).toEqual({
      FormDate: '2026-01-15',
      BranchAddress: 'Blue Cross',
      PolicyNumber: 'P-1',
      GroupNumber: 'G-1',
      GroupName: 'Acme',
      EffectiveDate: '2026-01-01',
      EndDate: '',
      PolicyHolder: 'Jane Austin',
      BillingConsent: '3',
      ParentSignatureDate: '',
      declineReason: 'DeclineReasonPremium',
      ParentSignatureDate2: '2026-01-16',
    });
  });

  it('leaves an empty or unknown BillingConsent unchosen', () => {
    expect(recordToValues({ BillingConsent: null }).BillingConsent).toBe('');
    expect(recordToValues({ BillingConsent: 7 }).BillingConsent).toBe('');
  });

  it('reads the first reason whose bit is set', () => {
    expect(recordToValues({ DeclineReasonEligibility: true }).declineReason).toBe(
      'DeclineReasonEligibility',
    );
  });

  it('has no reason when no bit is set', () => {
    expect(recordToValues({}).declineReason).toBe('');
  });
});

describe('valuesToPayload', () => {
  const values: InsuranceFormValues = {
    ...DEFAULT_INSURANCE_FORM_VALUES,
    FormDate: '2026-01-15',
    BranchAddress: '  Blue Cross ',
    PolicyNumber: '',
    BillingConsent: '1',
    ParentSignatureDate: '2026-01-15',
    declineReason: 'DeclineReasonCap',
    ParentSignatureDate2: '2026-01-16',
  };

  it('sends the consent signature date and no decline fields when billing is allowed', () => {
    expect(valuesToPayload(values)).toEqual({
      FormDate: '2026-01-15',
      BranchAddress: 'Blue Cross',
      PolicyNumber: null,
      GroupNumber: null,
      GroupName: null,
      EffectiveDate: null,
      EndDate: null,
      PolicyHolder: null,
      BillingConsent: 1,
      ParentSignatureDate: '2026-01-15',
      DeclineReasonCap: false,
      DeclineReasonPremium: false,
      DeclineReasonBenefits: false,
      DeclineReasonEligibility: false,
      ParentSignatureDate2: null,
    });
  });

  it('sends the chosen reason and the decline signature date when billing is declined', () => {
    expect(valuesToPayload({ ...values, BillingConsent: '3' })).toMatchObject({
      BillingConsent: 3,
      ParentSignatureDate: null,
      DeclineReasonCap: true,
      DeclineReasonPremium: false,
      DeclineReasonBenefits: false,
      DeclineReasonEligibility: false,
      ParentSignatureDate2: '2026-01-16',
    });
  });

  it('sends null for an unanswered consent and empty dates', () => {
    expect(
      valuesToPayload({ ...DEFAULT_INSURANCE_FORM_VALUES, BillingConsent: '' }),
    ).toMatchObject({ FormDate: null, BillingConsent: null, ParentSignatureDate: null });
  });
});
