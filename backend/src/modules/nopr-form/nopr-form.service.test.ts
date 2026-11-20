import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repository from './nopr-form.repository.js';
import { create, defaults, get, getOne, lookups, remove, update } from './nopr-form.service.js';
import type { NoprFormClient, NoprFormRecord } from './nopr-form.types.js';

vi.mock('./nopr-form.repository.js', () => ({
  getClient: vi.fn(),
  findByChildId: vi.fn(),
  findOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findMostRecentReferralDate: vi.fn(),
  findLatestRegion: vi.fn(),
}));

const client: NoprFormClient = {
  ChildID: 123,
  Region: 1,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: '123-45-6789',
  DOB: '2024-03-10 00:00:00',
};

const existingForm: NoprFormRecord = {
  ID: 10,
  ChildID: 123,
  FormType: 'No One Plan',
  FormDate: '2026-02-02 00:00:00',
  Region: 3,
  RefStatus: 4,
  InitialEvalDate: '2026-01-20 00:00:00',
  StatusDate: '2026-02-02 00:00:00',
  Screening: 2,
  ReferredBack: true,
};

const validCreate = { Region: 3, RefStatus: 8, StatusDate: '2026-02-02' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repository.getClient).mockResolvedValue(client);
  vi.mocked(repository.findMostRecentReferralDate).mockResolvedValue('2026-01-05 00:00:00');
});

describe('NOPR Form Service - get', () => {
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

describe('NOPR Form Service - getOne', () => {
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
      message: 'NOPR Form not found',
      status: 404,
    });
  });
});

describe('NOPR Form Service - create', () => {
  it('saves the form with FormDate set to the status date', async () => {
    vi.mocked(repository.insert).mockResolvedValue({ ID: 11 });

    await expect(create('123', { ...validCreate, InitialEvalDate: '2026-01-20' })).resolves.toEqual({ ID: 11 });
    expect(repository.insert).toHaveBeenCalledWith(123, {
      ...validCreate,
      InitialEvalDate: '2026-01-20',
      FormDate: '2026-02-02',
    });
    expect(repository.findMostRecentReferralDate).toHaveBeenCalledWith(123);
  });

  it('does not save the unused legacy columns or a FormDate from the request', async () => {
    vi.mocked(repository.insert).mockResolvedValue({ ID: 11 });

    await create('123', { ...validCreate, Screening: 1, ReferredBack: true, MonthReporting: 2, FormDate: '2020-01-01' });

    expect(repository.insert).toHaveBeenCalledWith(123, { ...validCreate, FormDate: '2026-02-02' });
  });

  it('rejects a status date before the most recent referral', async () => {
    await expect(create('123', { ...validCreate, StatusDate: '2025-12-15' })).rejects.toThrow(
      'cannot be before the most recent referral date (01/05/2026)',
    );
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('rejects the retired reason on a new form', async () => {
    await expect(create('123', { ...validCreate, RefStatus: 7 })).rejects.toThrow('is no longer used');
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

describe('NOPR Form Service - update', () => {
  beforeEach(() => {
    vi.mocked(repository.findOne).mockResolvedValue(existingForm);
  });

  it('saves the changed fields and moves FormDate with the status date', async () => {
    vi.mocked(repository.update).mockResolvedValue(existingForm);

    await update('123', '10', { StatusDate: '2026-02-10' });

    expect(repository.update).toHaveBeenCalledWith(123, 10, {
      StatusDate: '2026-02-10',
      FormDate: '2026-02-10',
    });
  });

  it('keeps FormDate when the status date is not changed', async () => {
    vi.mocked(repository.update).mockResolvedValue(existingForm);

    await update('123', '10', { RefStatus: 6 });

    expect(repository.update).toHaveBeenCalledWith(123, 10, { RefStatus: 6 });
  });

  it('validates the merged record', async () => {
    await expect(update('123', '10', { InitialEvalDate: '2026-03-01' })).rejects.toThrow(
      'Date of Initial Evaluation cannot be after the date the status was determined',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('lets a form keep the retired reason it already has', async () => {
    vi.mocked(repository.findOne).mockResolvedValue({ ...existingForm, RefStatus: 7 });
    vi.mocked(repository.update).mockResolvedValue(existingForm);

    await update('123', '10', { RefStatus: 7, StatusDate: '2026-02-02' });

    expect(repository.update).toHaveBeenCalled();
  });

  it('rejects changing a form to the retired reason', async () => {
    await expect(update('123', '10', { RefStatus: 7 })).rejects.toThrow('is no longer used');
  });

  it('returns 404 when the form does not exist', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(update('123', '10', {})).rejects.toMatchObject({
      message: 'NOPR Form not found',
      status: 404,
    });
  });

  it('returns 404 when the form disappears while saving', async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(update('123', '10', { RefStatus: 6 })).rejects.toMatchObject({ status: 404 });
  });
});

describe('NOPR Form Service - remove', () => {
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

describe('NOPR Form Service - defaults', () => {
  it('returns the latest region and the most recent referral date', async () => {
    vi.mocked(repository.findLatestRegion).mockResolvedValue(3);

    await expect(defaults('123')).resolves.toEqual({ Region: 3, MostRecentReferralDate: '2026-01-05' });
  });

  it("falls back to the client's region", async () => {
    vi.mocked(repository.findLatestRegion).mockResolvedValue(null);
    vi.mocked(repository.findMostRecentReferralDate).mockResolvedValue(null);

    await expect(defaults('123')).resolves.toEqual({ Region: 1, MostRecentReferralDate: null });
  });

  it('returns null when nothing has a region', async () => {
    vi.mocked(repository.findLatestRegion).mockResolvedValue(null);
    vi.mocked(repository.getClient).mockResolvedValue({ ...client, Region: null });

    await expect(defaults('123')).resolves.toMatchObject({ Region: null });
  });
});

describe('NOPR Form Service - lookups', () => {
  it('returns the reasons with the new one first, and the retired reason', () => {
    const options = lookups.options();

    expect(options.refStatus.map((o) => o.code)).toEqual([8, 1, 2, 3, 4, 5, 6]);
    expect(options.retiredRefStatus.map((o) => o.code)).toEqual([7]);
  });
});
