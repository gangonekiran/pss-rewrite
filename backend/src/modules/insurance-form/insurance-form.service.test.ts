import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repository from './insurance-form.repository.js';
import { create, get, getOne, lookups, remove, update } from './insurance-form.service.js';
import type { InsuranceFormClient, InsuranceFormRecord } from './insurance-form.types.js';

vi.mock('./insurance-form.repository.js', () => ({
  getClient: vi.fn(),
  findByChildId: vi.fn(),
  findOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const client: InsuranceFormClient = {
  ChildID: 123,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: '123-45-6789',
  DOB: '2024-03-10T00:00:00.000Z',
};

const existingForm: InsuranceFormRecord = {
  ID: 10,
  ChildID: 123,
  FormType: 'Insurance',
  FormDate: '2026-01-15T00:00:00.000Z',
  BranchAddress: 'Blue Cross',
  BillingConsent: 1,
  ParentSignatureDate: '2026-01-15T00:00:00.000Z',
  DeclineReasonCap: false,
  DeclineReasonPremium: false,
  DeclineReasonBenefits: false,
  DeclineReasonEligibility: false,
  ParentSignatureDate2: null,
  InsCoNumber: 'BCB',
};

const validCreate = {
  FormDate: '2026-01-15',
  BranchAddress: 'Blue Cross',
  BillingConsent: 1,
  ParentSignatureDate: '2026-01-15',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repository.getClient).mockResolvedValue(client);
});

describe('Insurance Form Service - get', () => {
  it('returns the client and their forms', async () => {
    vi.mocked(repository.findByChildId).mockResolvedValue([existingForm]);

    await expect(get('123')).resolves.toEqual({ client, forms: [existingForm] });
    expect(repository.findByChildId).toHaveBeenCalledWith(123);
  });

  it.each(['abc', '0', '-1', '1.5'])('rejects ChildID %j', async (childId) => {
    await expect(get(childId)).rejects.toThrow('ChildID must be a positive integer');
  });

  it('returns 404 when the client does not exist', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(get('999')).rejects.toMatchObject({ message: 'Client not found', status: 404 });
  });
});

describe('Insurance Form Service - getOne', () => {
  it('returns the form', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(existingForm);

    await expect(getOne('123', '10')).resolves.toEqual(existingForm);
    expect(repository.findOne).toHaveBeenCalledWith(123, 10);
  });

  it('rejects an invalid ID', async () => {
    await expect(getOne('123', 'x')).rejects.toThrow('ID must be a positive integer');
  });

  it('returns 404 when the form does not exist', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(getOne('123', '10')).rejects.toMatchObject({
      message: 'Insurance Form not found',
      status: 404,
    });
  });
});

describe('Insurance Form Service - create', () => {
  it('saves a private insurance consent and clears the decline fields', async () => {
    vi.mocked(repository.insert).mockResolvedValue({ ID: 11, ...validCreate });

    await expect(create('123', validCreate)).resolves.toEqual({ ID: 11, ...validCreate });
    expect(repository.insert).toHaveBeenCalledWith(123, {
      ...validCreate,
      DeclineReasonCap: false,
      DeclineReasonPremium: false,
      DeclineReasonBenefits: false,
      DeclineReasonEligibility: false,
      ParentSignatureDate2: null,
    });
  });

  it('saves a decline and clears the consent signature date', async () => {
    const body = {
      FormDate: '2026-01-15',
      BillingConsent: 3,
      DeclineReasonBenefits: true,
      ParentSignatureDate: '2026-01-15',
      ParentSignatureDate2: '2026-01-16',
    };
    vi.mocked(repository.insert).mockResolvedValue({ ID: 12 });

    await create('123', body);

    expect(repository.insert).toHaveBeenCalledWith(123, {
      ...body,
      ParentSignatureDate: null,
    });
  });

  it('does not save unused legacy columns', async () => {
    vi.mocked(repository.insert).mockResolvedValue({ ID: 11 });

    await create('123', { ...validCreate, InsCoNumber: 'X', CoverageCode: '01', Phone: '1' });

    const saved = vi.mocked(repository.insert).mock.calls[0][1];
    expect(saved).not.toHaveProperty('InsCoNumber');
    expect(saved).not.toHaveProperty('CoverageCode');
    expect(saved).not.toHaveProperty('Phone');
  });

  it('validates against the date of birth', async () => {
    await expect(create('123', { ...validCreate, FormDate: '2024-01-01' })).rejects.toThrow(
      'Date Completed cannot be before Date of Birth',
    );
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('returns 500 when the saved form cannot be read back', async () => {
    vi.mocked(repository.insert).mockResolvedValue(null);

    await expect(create('123', validCreate)).rejects.toMatchObject({ status: 500 });
  });

  it('returns 404 when the client does not exist', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(create('999', validCreate)).rejects.toMatchObject({ status: 404 });
  });
});

describe('Insurance Form Service - update', () => {
  beforeEach(() => {
    vi.mocked(repository.findOne).mockResolvedValue(existingForm);
  });

  it('saves the changed fields, keeping the decline fields cleared for the saved consent', async () => {
    vi.mocked(repository.update).mockResolvedValue({ ...existingForm, PolicyNumber: 'P-2' });

    await update('123', '10', { PolicyNumber: 'P-2' });

    expect(repository.update).toHaveBeenCalledWith(123, 10, {
      PolicyNumber: 'P-2',
      DeclineReasonCap: false,
      DeclineReasonPremium: false,
      DeclineReasonBenefits: false,
      DeclineReasonEligibility: false,
      ParentSignatureDate2: null,
    });
  });

  it('does not store decline fields on a form that allows billing', async () => {
    vi.mocked(repository.update).mockResolvedValue(existingForm);

    await update('123', '10', { DeclineReasonCap: true, ParentSignatureDate2: '2026-02-01' });

    expect(repository.update).toHaveBeenCalledWith(
      123,
      10,
      expect.objectContaining({ DeclineReasonCap: false, ParentSignatureDate2: null }),
    );
  });

  it('does not store the consent signature date on a declined form', async () => {
    vi.mocked(repository.findOne).mockResolvedValue({
      ...existingForm,
      BillingConsent: 3,
      ParentSignatureDate: null,
      DeclineReasonPremium: true,
      ParentSignatureDate2: '2026-01-16T00:00:00.000Z',
    });
    vi.mocked(repository.update).mockResolvedValue(existingForm);

    await update('123', '10', { ParentSignatureDate: '2026-02-01' });

    expect(repository.update).toHaveBeenCalledWith(123, 10, { ParentSignatureDate: null });
  });

  it('validates the merged record', async () => {
    await expect(update('123', '10', { BranchAddress: '' })).rejects.toThrow(
      'Insurance Company Name is required when private insurance billing is allowed',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('switching to decline clears the consent date and needs a reason', async () => {
    await expect(update('123', '10', { BillingConsent: 3, ParentSignatureDate2: '2026-02-01' })).rejects.toThrow(
      'Choose one reason for denying permission to bill private insurance',
    );

    vi.mocked(repository.update).mockResolvedValue(existingForm);
    await update('123', '10', {
      BillingConsent: 3,
      DeclineReasonCap: true,
      ParentSignatureDate2: '2026-02-01',
    });

    expect(repository.update).toHaveBeenCalledWith(123, 10, {
      BillingConsent: 3,
      DeclineReasonCap: true,
      ParentSignatureDate2: '2026-02-01',
      ParentSignatureDate: null,
    });
  });

  it('returns 404 when the form does not exist', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(update('123', '10', {})).rejects.toMatchObject({
      message: 'Insurance Form not found',
      status: 404,
    });
  });

  it('returns 404 when the form disappears while saving', async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(update('123', '10', { PolicyNumber: 'P-2' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('Insurance Form Service - remove', () => {
  it('deletes the form', async () => {
    vi.mocked(repository.remove).mockResolvedValue(true);

    await expect(remove('123', '10')).resolves.toEqual({ success: true });
    expect(repository.remove).toHaveBeenCalledWith(123, 10);
  });

  it('returns 404 when nothing was deleted', async () => {
    vi.mocked(repository.remove).mockResolvedValue(false);

    await expect(remove('123', '10')).rejects.toMatchObject({ status: 404 });
  });
});

describe('Insurance Form Service - lookups', () => {
  it('returns the billing consent choices and decline reasons', () => {
    const options = lookups.options();

    expect(options.billingConsent.map((o) => o.code)).toEqual([1, 2, 3]);
    expect(options.declineReasons.map((o) => o.field)).toEqual([
      'DeclineReasonCap',
      'DeclineReasonBenefits',
      'DeclineReasonPremium',
      'DeclineReasonEligibility',
    ]);
  });
});
