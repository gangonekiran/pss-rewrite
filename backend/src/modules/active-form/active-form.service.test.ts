import { expect, test, vi } from 'vitest';
import * as service from './active-form.service.js';

const {
  getMock,
  getClientMock,
  getOneMock,
  createMock,
  updateMock,
  removeMock,
  supervisoryUnionsMock,
  townMock,
  townsMock,
  serviceCoordinatorTypesMock,
  delayReasonsMock,
} = vi.hoisted(() => ({
  getMock: vi.fn(),
  getClientMock: vi.fn(),
  getOneMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
  supervisoryUnionsMock: vi.fn(),
  townMock: vi.fn(),
  townsMock: vi.fn(),
  serviceCoordinatorTypesMock: vi.fn(),
  delayReasonsMock: vi.fn(),
}));

vi.mock(import('./active-form.repository.js'), () => {
  return {
    findByChildId: getMock,
    getClient: getClientMock,
    findOne: getOneMock,
    insert: createMock,
    update: updateMock,
    remove: removeMock,
    getSupervisoryUnions: supervisoryUnionsMock,
    getServiceCoordinatorTypes: serviceCoordinatorTypesMock,
    getDelayReasons: delayReasonsMock,
  };
});

// Town lookups live in the shared common-info module, not the active-form repository.
vi.mock(import('../common-info/common-info.service.js'), () => {
  return {
    lookups: {
      regions: vi.fn(),
      town: townMock,
      towns: townsMock,
    },
  };
});

const records = [
  { id: 1, DOB: '2025-01-01' },
  { id: 2, DOB: '2025-01-02' },
];

const form = {
  FormType: 'active',
  InitialMeetingDate: '2026-01-01',
};

test('get calls repo.findBychildId and getClient', async () => {
  getMock.mockResolvedValue(records);
  getClientMock.mockResolvedValue(records);

  const ret = await service.get(123);

  expect(ret).toStrictEqual({ client: records, forms: records });
  expect(getMock).toHaveBeenCalledWith(123);
  expect(getClientMock).toHaveBeenCalledWith(123);
});

test('get value not a number throws error', async () => {
  await expect(async () => await service.get('bogus')).rejects.toThrow(
    'ChildID must be a positive integer'
  );
  expect(getMock).not.toHaveBeenCalled();
  expect(getClientMock).not.toHaveBeenCalled();
});

test('get calls repo.getClient throws client not found', async () => {
  getClientMock.mockResolvedValue(null);
  await expect(async () => await service.get(123)).rejects.toThrow(
    'Client not found'
  );

  expect(getMock).not.toHaveBeenCalledWith(123);
  expect(getClientMock).toHaveBeenCalledWith(123);
});

test('getOne throws error when no form found', async () => {
  getOneMock.mockResolvedValue(null);
  getClientMock.mockResolvedValue(records);

  await expect(async () => await service.getOne(123, 456)).rejects.toThrow(
    'Active Form not found'
  );

  expect(getOneMock).toHaveBeenCalledWith(123, 456);
  expect(getClientMock).toHaveBeenCalledWith(123);
});

test('getOne is mapped to repo.getOne', async () => {
  getOneMock.mockResolvedValue(records);
  getClientMock.mockResolvedValue(records);

  const ret = await service.getOne(123, 456);

  expect(ret).toStrictEqual(records);
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(getOneMock).toHaveBeenCalledWith(123, 456);
});

test('create empty calls insert', async () => {
  getClientMock.mockResolvedValue(records);

  const ret = await service.create(123, {});

  expect(ret).toStrictEqual(undefined);
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).toHaveBeenCalledWith(123, {});
});

test('create with region empty throws error', async () => {
  getClientMock.mockResolvedValue(records);

  await expect(
    async () => await service.create(123, { Region: '' })
  ).rejects.toThrow('Region must be selected');

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
});

test('create with invalid OnePlanDate throws error', async () => {
  getClientMock.mockResolvedValue(records);

  const form = {
    onePlanDate: 'bogus',
  };

  await expect(async () => await service.create(123, form)).rejects.toThrow(
    'OnePlanDate must use YYYY-MM-DD format'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
});

test('create with invalid OnePlanDate before dob throws error', async () => {
  getClientMock.mockResolvedValue(records[0]);

  const form = {
    InitialMeetingDate: '2024-01-01',
    onePlanDate: '2024-01-01',
  };

  await expect(async () => await service.create(123, form)).rejects.toThrow(
    'OnePlanDate cannot be before child DOB'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
});

test('create with invalid InitialEvalDate before dob throws error', async () => {
  getClientMock.mockResolvedValue(records[0]);

  const form = {
    InitialEvalDate: '2024-01-01',
  };

  await expect(async () => await service.create(123, form)).rejects.toThrow(
    'InitialEvalDate cannot be before child DOB'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
});

test('create with invalid ReferralDate before dob throws error', async () => {
  getClientMock.mockResolvedValue(records[0]);

  const form = {
    ReferralDate: '2024-01-01',
  };

  await expect(async () => await service.create(123, form)).rejects.toThrow(
    'ReferralDate cannot be before child DOB'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
});

test('create with town not found throws error', async () => {
  getClientMock.mockResolvedValue(records);
  townMock.mockResolvedValue(null);

  const form = {
    Town: 't',
  };

  await expect(async () => await service.create(123, form)).rejects.toThrow(
    'Town was not found in slstTownCodes'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).not.toHaveBeenCalled();
  expect(townMock).toHaveBeenCalledWith(form.Town);
});

test('create record overwrites aliased columns and calls insert', async () => {
  const town = 'Hobbiton';
  const county = 'Shire';
  const suId = 'su12';

  getClientMock.mockResolvedValue(records);
  townMock.mockResolvedValue({ Town: town, CountyCode: county, SU_id: suId });

  const keepDate = '2023-12-13';
  const keepForm = 'keep';

  const form = {
    status: keepForm,
    FormType: undefined,
    onePlanDate: keepDate,
    InitialMeetingDate: undefined,
    Town: 't',
    CountyCode: 'c',
  };

  const ret = await service.create(123, form);

  expect(ret).toStrictEqual(undefined);
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(createMock).toHaveBeenCalledWith(123, {
    InitialMeetingDate: keepDate,
    FormType: keepForm,
    Town: town,
    CountyCode: county,
    SU_id: suId,
  });
  expect(townMock).toHaveBeenCalledWith(form.Town);
});

test('update record updates', async () => {
  getClientMock.mockResolvedValue(records);
  getOneMock.mockResolvedValue(form);

  const updatedForm = {
    ...form,
    InitialMeetingDate: '2026-01-02',
  };

  const ret = await service.update(123, 456, updatedForm);

  expect(ret).toStrictEqual(undefined);
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(updateMock).toHaveBeenCalledWith(123, 456, updatedForm);
});

test('update throws error when no form found', async () => {
  getOneMock.mockResolvedValue(null);
  getClientMock.mockResolvedValue(records);

  await expect(
    async () => await service.update(123, 456, form)
  ).rejects.toThrow('Active Form not found');

  expect(getOneMock).toHaveBeenCalledWith(123, 456);
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(updateMock).not.toHaveBeenCalled();
});

test('remove record removes', async () => {
  getClientMock.mockResolvedValue(records);
  removeMock.mockResolvedValue(form);

  const ret = await service.remove(123, 456);

  expect(ret).toStrictEqual({ success: true });
  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(removeMock).toHaveBeenCalledWith(123, 456);
});

test('remove throws error when no form found', async () => {
  removeMock.mockResolvedValue(null);
  getClientMock.mockResolvedValue(records);

  await expect(async () => await service.remove(123, 456)).rejects.toThrow(
    'Active Form not found'
  );

  expect(getClientMock).toHaveBeenCalledWith(123);
  expect(removeMock).toHaveBeenCalled();
});

test('supervisoryUnions returns repo.supervisoryUnions', () => {
  service.lookups.supervisoryUnions();
  expect(supervisoryUnionsMock).toHaveBeenCalledOnce();
});

test('serviceCoordinatorTypes returns repo.serviceCoordinatorTypes', () => {
  service.lookups.serviceCoordinatorTypes();
  expect(serviceCoordinatorTypesMock).toHaveBeenCalledOnce();
});

test('delayReasons returns repo.delayReasons', () => {
  service.lookups.delayReasons();
  expect(delayReasonsMock).toHaveBeenCalledOnce();
});
