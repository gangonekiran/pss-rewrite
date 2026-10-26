import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repository from './exit-form.repository.js';
import { create, defaults, get, getOne, lookups, remove, update } from './exit-form.service.js';
import type { ExitFormClient, ExitFormRecord } from './exit-form.types.js';

vi.mock('./exit-form.repository.js', () => ({
  getClient: vi.fn(),
  findByChildId: vi.fn(),
  findOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findLatestReferral: vi.fn(),
  findLatestActive: vi.fn(),
}));

const client: ExitFormClient = {
  ChildID: 123,
  Region: 1,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: null,
  SSTemp: false,
  DOB: '2023-04-10T00:00:00.000Z',
  Gender: 'F',
  Notes: null,
  NonEarlyIntervention: false,
};

const existingForm: ExitFormRecord = {
  ID: 10,
  ChildID: 123,
  FormType: 'Exit',
  Region: 2,
  FormDate: '2026-04-01T00:00:00.000Z',
  ReferralDate: '2025-02-15T00:00:00.000Z',
  ExitDate: '2026-04-01T00:00:00.000Z',
  ExitPriorToAge3: 0,
  ExitAtAge3: 1,
  ReferredTo: 1,
};

const validCreate = {
  Region: 2,
  ReferralDate: '2025-02-15',
  ExitDate: '2025-06-01',
  ExitPriorToAge3: 1,
};

/** The record passed to repository.insert / repository.update. */
function inserted() {
  return vi.mocked(repository.insert).mock.calls[0][1];
}

function updated() {
  return vi.mocked(repository.update).mock.calls[0][2];
}

async function expectError(promise: Promise<unknown>, message: string, status: number) {
  await expect(promise).rejects.toMatchObject({ message, status });
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(repository.getClient).mockResolvedValue(client);
  vi.mocked(repository.findByChildId).mockResolvedValue([existingForm]);
  vi.mocked(repository.findOne).mockResolvedValue(existingForm);
  vi.mocked(repository.insert).mockImplementation(async (childId, p) => ({ ID: 11, ChildID: childId, ...p }));
  vi.mocked(repository.update).mockImplementation(async (_childId, id, p) => ({
    ...existingForm,
    ID: id,
    ...p,
  }));
  vi.mocked(repository.remove).mockResolvedValue(true);
  vi.mocked(repository.findLatestActive).mockResolvedValue(null);
  vi.mocked(repository.findLatestReferral).mockResolvedValue(null);
});

describe('Exit Form Service - get', () => {
  it('should return the client and their forms as stored', async () => {
    const result = await get('123');

    expect(repository.getClient).toHaveBeenCalledWith(123);
    expect(repository.findByChildId).toHaveBeenCalledWith(123);
    expect(result.client).toEqual(client);
    expect(result.forms).toHaveLength(1);
    expect(result.forms).toEqual([existingForm]);
    expect(result.forms[0]).not.toHaveProperty('Calculated');
  });

  it('should return an empty list when the child has no Exit forms', async () => {
    vi.mocked(repository.findByChildId).mockResolvedValue([]);

    expect(await get(123)).toEqual({ client, forms: [] });
  });

  it.each(['abc', '0', '-1', '1.5', undefined])('should reject child ID %s', async (childId) => {
    await expectError(get(childId), 'ChildID must be a positive integer', 400);
    expect(repository.getClient).not.toHaveBeenCalled();
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(get('999'), 'Client not found', 404);
    expect(repository.findByChildId).not.toHaveBeenCalled();
  });
});

describe('Exit Form Service - getOne', () => {
  it('should return one form as stored', async () => {
    const result = await getOne('123', '10');

    expect(repository.findOne).toHaveBeenCalledWith(123, 10);
    expect(result).toEqual(existingForm);
  });

  it('should reject an invalid form ID', async () => {
    await expectError(getOne('123', 'abc'), 'ID must be a positive integer', 400);
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(getOne('123', '10'), 'Client not found', 404);
  });

  it('should return 404 when the form is not found', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expectError(getOne('123', '99'), 'Exit Form not found', 404);
  });
});

describe('Exit Form Service - create', () => {
  it('should save the form and return the saved row', async () => {
    const result = await create('123', validCreate);

    expect(repository.insert).toHaveBeenCalledWith(123, expect.any(Object));
    expect(inserted()).toEqual({
      Region: 2,
      ReferralDate: '2025-02-15',
      ExitDate: '2025-06-01',
      FormDate: '2025-06-01',
      ExitPriorToAge3: 1,
      ExitAtAge3: 0,
      MovedOtherRegion: null,
      EXFNoPartB1: false,
      EXFNoPartB2: false,
      EXFNoPartB3: false,
    });
    expect(result).toMatchObject({ ID: 11, ExitDate: '2025-06-01' });
    expect(result).not.toHaveProperty('Calculated');
  });

  it('should default FormDate to the exit date but keep a given FormDate', async () => {
    await create('123', { ...validCreate, FormDate: '2025-06-05' });

    expect(inserted().FormDate).toBe('2025-06-05');
  });

  it('should store 0 in ExitPriorToAge3 for an exit at age 3', async () => {
    await create('123', {
      ...validCreate,
      ExitDate: '2026-04-01',
      ExitPriorToAge3: undefined,
      ExitAtAge3: 1,
      ReferredTo: 1,
    });

    expect(inserted()).toMatchObject({
      ExitPriorToAge3: 0,
      ExitAtAge3: 1,
      EXFNoPartB1: false,
      EXFNoPartB2: false,
      EXFNoPartB3: false,
    });
  });

  it('should keep MovedOtherRegion only for "Moved to other region"', async () => {
    await create('123', { ...validCreate, ExitPriorToAge3: 2, MovedOtherRegion: ' Rutland ' });
    expect(inserted().MovedOtherRegion).toBe('Rutland');

    vi.mocked(repository.insert).mockClear();

    await create('123', { ...validCreate, ExitPriorToAge3: 3, MovedOtherRegion: 'Rutland' });
    expect(inserted().MovedOtherRegion).toBeNull();
  });

  it('should keep the no-Part-B reasons only for "NOT eligible for Part B"', async () => {
    await create('123', {
      ...validCreate,
      ExitPriorToAge3: undefined,
      ExitAtAge3: 4,
      EXFNoPartB2: true,
      ReferredTo: 99,
    });

    expect(inserted()).toMatchObject({ ExitAtAge3: 4, EXFNoPartB2: true, ReferredTo: 99 });
  });

  it('should save Town and SU# as sent, without looking anything up', async () => {
    await create('123', { ...validCreate, Town: '001', SU_id: 7, status: 'exit-capta' });

    expect(inserted()).toMatchObject({ Town: '001', SU_id: 7 });
    expect(inserted()).not.toHaveProperty('CountyCode');
    expect(inserted()).not.toHaveProperty('SUName');
    expect(inserted()).not.toHaveProperty('CAPTA');
  });

  it('should require a region', async () => {
    await expectError(create('123', { ...validCreate, Region: undefined }), 'Region must be selected', 400);
    await expectError(create('123', { ...validCreate, Region: '' }), 'Region must be selected', 400);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('should require an exit date', async () => {
    await expectError(create('123', { ...validCreate, ExitDate: '' }), 'Date of Exit is required', 400);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('should validate the dates against the DOB', async () => {
    await expectError(
      create('123', { ...validCreate, ReferralDate: '2023-01-01' }),
      'Date of Referral cannot be before Date of Birth',
      400,
    );
  });

  it('should reject an exit before the referral', async () => {
    await expectError(
      create('123', { ...validCreate, ExitDate: '2025-02-01' }),
      'Date of Exit cannot be before Date of Referral',
      400,
    );
  });

  it('should reject both exit paths', async () => {
    await expectError(
      create('123', { ...validCreate, ExitPriorToAge3: 1, ExitAtAge3: 1 }),
      'Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both',
      400,
    );
  });

  it('should reject invalid payload values', async () => {
    await expectError(create('123', { ...validCreate, ExitDate: '06/01/2025' }), 'ExitDate must use YYYY-MM-DD format', 400);
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(create('123', validCreate), 'Client not found', 404);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('should return 500 when the saved form cannot be read back', async () => {
    vi.mocked(repository.insert).mockResolvedValue(null);

    await expectError(create('123', validCreate), 'Exit Form could not be read back after saving', 500);
  });
});

describe('Exit Form Service - update', () => {
  it('should save only the changed fields', async () => {
    const result = await update('123', '10', { ReferredTo: 99 });

    expect(repository.findOne).toHaveBeenCalledWith(123, 10);
    expect(repository.update).toHaveBeenCalledWith(123, 10, { ReferredTo: 99 });
    expect(result).toMatchObject({ ID: 10, ReferredTo: 99 });
  });

  it('should move FormDate with ExitDate while the two match', async () => {
    await update('123', '10', { ExitDate: '2026-03-15' });

    expect(updated()).toEqual({ ExitDate: '2026-03-15', FormDate: '2026-03-15' });
  });

  it('should not move FormDate when it was different from ExitDate', async () => {
    vi.mocked(repository.findOne).mockResolvedValue({ ...existingForm, FormDate: '2026-04-05' });

    await update('123', '10', { ExitDate: '2026-03-15' });

    expect(updated()).toEqual({ ExitDate: '2026-03-15' });
  });

  it('should keep a FormDate sent with the update', async () => {
    await update('123', '10', { ExitDate: '2026-03-15', FormDate: '2026-03-20' });

    expect(updated()).toEqual({ ExitDate: '2026-03-15', FormDate: '2026-03-20' });
  });

  it('should switch the exit path and clear the old one', async () => {
    await update('123', '10', { ExitPriorToAge3: 4, ExitAtAge3: null, ExitDate: '2025-06-01' });

    expect(updated()).toMatchObject({
      ExitPriorToAge3: 4,
      ExitAtAge3: 0,
      MovedOtherRegion: null,
      EXFNoPartB1: false,
      EXFNoPartB2: false,
      EXFNoPartB3: false,
    });
  });

  it('should validate the merged record', async () => {
    // Existing referral is 2025-02-15; moving the exit before it is rejected.
    await expectError(
      update('123', '10', { ExitDate: '2025-01-01' }),
      'Date of Exit cannot be before Date of Referral',
      400,
    );

    // Existing form exits at age 3; adding a prior-to-age-3 reason as well is rejected.
    await expectError(
      update('123', '10', { ExitPriorToAge3: 2, ExitAtAge3: 1 }),
      'Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both',
      400,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should require Referred To when changing to NOT eligible for Part B without a referral', async () => {
    vi.mocked(repository.findOne).mockResolvedValue({ ...existingForm, ReferredTo: null });

    await expectError(
      update('123', '10', { ExitAtAge3: 4 }),
      'Referred To is required when the child is NOT eligible for Part B ' +
        '(choose "Exited with no referral" if there was no referral)',
      400,
    );
  });

  it('should not allow clearing the region or the exit date', async () => {
    await expectError(update('123', '10', { Region: '' }), 'Region must be selected', 400);
    await expectError(update('123', '10', { ExitDate: '' }), 'Date of Exit is required', 400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should reject invalid IDs', async () => {
    await expectError(update('abc', '10', {}), 'ChildID must be a positive integer', 400);
    await expectError(update('123', '0', {}), 'ID must be a positive integer', 400);
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(update('123', '10', {}), 'Client not found', 404);
  });

  it('should return 404 when the form is not found', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expectError(update('123', '99', { ReferredTo: 1 }), 'Exit Form not found', 404);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should return 404 when the form disappears during the update', async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expectError(update('123', '10', { ReferredTo: 1 }), 'Exit Form not found', 404);
  });
});

describe('Exit Form Service - remove', () => {
  it('should delete the form', async () => {
    expect(await remove('123', '10')).toEqual({ success: true });
    expect(repository.remove).toHaveBeenCalledWith(123, 10);
  });

  it('should return 404 when the form is not found', async () => {
    vi.mocked(repository.remove).mockResolvedValue(false);

    await expectError(remove('123', '99'), 'Exit Form not found', 404);
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(remove('123', '10'), 'Client not found', 404);
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('should reject invalid IDs', async () => {
    await expectError(remove('123', 'x'), 'ID must be a positive integer', 400);
  });
});

describe('Exit Form Service - defaults', () => {
  it('should prefill from the latest Active form', async () => {
    vi.mocked(repository.findLatestActive).mockResolvedValue({
      Region: 3,
      ReferralDate: '2025-02-15T00:00:00.000Z',
    });
    vi.mocked(repository.findLatestReferral).mockResolvedValue({
      Region: 4,
      ReferralDate: '2025-01-01T00:00:00.000Z',
    });

    expect(await defaults('123')).toEqual({ Region: 3, ReferralDate: '2025-02-15' });
  });

  it('should fall back to the latest Referral form', async () => {
    vi.mocked(repository.findLatestReferral).mockResolvedValue({
      Region: 4,
      ReferralDate: '2025-01-01T00:00:00.000Z',
    });

    expect(await defaults('123')).toMatchObject({ Region: 4, ReferralDate: '2025-01-01' });
  });

  it('should fill gaps in the Active form from the Referral form', async () => {
    vi.mocked(repository.findLatestActive).mockResolvedValue({ Region: null, ReferralDate: null });
    vi.mocked(repository.findLatestReferral).mockResolvedValue({
      Region: 4,
      ReferralDate: '2025-01-01',
    });

    expect(await defaults('123')).toMatchObject({ Region: 4, ReferralDate: '2025-01-01' });
  });

  it("should fall back to the client's region", async () => {
    expect(await defaults('123')).toMatchObject({ Region: 1, ReferralDate: null });
  });

  it('should return a null region when nothing has one', async () => {
    vi.mocked(repository.getClient).mockResolvedValue({ ...client, Region: null });

    expect((await defaults('123')).Region).toBeNull();
  });

  it('should look up the forms for the child', async () => {
    await defaults('123');

    expect(repository.findLatestActive).toHaveBeenCalledWith(123);
    expect(repository.findLatestReferral).toHaveBeenCalledWith(123);
  });

  it('should return 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expectError(defaults('123'), 'Client not found', 404);
  });

  it('should reject an invalid child ID', async () => {
    await expectError(defaults('abc'), 'ChildID must be a positive integer', 400);
  });
});

describe('Exit Form Service - lookups.options', () => {
  it('should return the Exit form code lists', () => {
    const options = lookups.options();

    expect(Object.keys(options)).toEqual(['exitPriorToAge3', 'exitAtAge3', 'referredTo']);
    expect(options.exitPriorToAge3.map((o) => o.code)).toEqual([7, 8, 1, 2, 3, 4, 5, 6]);
    expect(options.exitAtAge3.map((o) => o.code)).toEqual([1, 2, 3, 4]);
    expect(options.referredTo.map((o) => o.code)).toEqual([1, 2, 3, 4, 5, 99]);
  });
});
