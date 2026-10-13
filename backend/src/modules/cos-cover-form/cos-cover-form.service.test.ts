import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IRecordSet } from 'mssql';

import * as repository from './cos-cover-form.repository';
import { create, get, getOne, remove, update } from './cos-cover-form.service';

vi.mock('./cos-cover-form.repository', () => ({
  getClient: vi.fn(),
  findByChildId: vi.fn(),
  findOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const client = {
  ChildID: 123,
  Region: '1',
  LastName: 'Doe',
  FirstName: 'John',
  SS: null,
  SSTemp: false,
  DOB: '2020-01-15',
  Gender: 'M',
  Notes: null,
  NonEarlyIntervention: false,
};

const existingForm = {
  ID: 10,
  ChildID: 123,
  FormType: 'COS',
  FormDate: '2024-03-01',
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(repository.getClient).mockResolvedValue(client);
  vi.mocked(repository.findOne).mockResolvedValue(existingForm);
  vi.mocked(repository.insert).mockResolvedValue({ ID: 11 });
  vi.mocked(repository.update).mockResolvedValue({ ID: 10 });
  vi.mocked(repository.remove).mockResolvedValue(true);
});

describe('COS Cover Form Service - get', () => {
  it('should return the client and their forms', async () => {
    const forms = [existingForm] as unknown as IRecordSet<unknown>;
    vi.mocked(repository.findByChildId).mockResolvedValue(forms);

    const result = await get('123');

    expect(result).toEqual({ client, forms });
    expect(repository.getClient).toHaveBeenCalledWith(123);
    expect(repository.findByChildId).toHaveBeenCalledWith(123);
  });

  it('should throw when child ID is not a number', async () => {
    await expect(get('abc')).rejects.toThrow('ChildID must be a positive integer');

    expect(repository.getClient).not.toHaveBeenCalled();
  });

  it('should throw when child ID is zero or negative', async () => {
    await expect(get('0')).rejects.toThrow('ChildID must be a positive integer');
    await expect(get('-1')).rejects.toThrow('ChildID must be a positive integer');
  });

  it('should throw when child ID is a decimal', async () => {
    await expect(get('1.5')).rejects.toThrow('ChildID must be a positive integer');
  });

  it('should throw 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(get(999)).rejects.toMatchObject({
      message: 'Client not found',
      status: 404,
    });

    expect(repository.findByChildId).not.toHaveBeenCalled();
  });
});

describe('COS Cover Form Service - getOne', () => {
  it('should return the form', async () => {
    const result = await getOne('123', '10');

    expect(result).toEqual(existingForm);
    expect(repository.findOne).toHaveBeenCalledWith(123, 10);
  });

  it('should throw when form ID is invalid', async () => {
    await expect(getOne(123, 'abc')).rejects.toThrow('ID must be a positive integer');

    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('should throw 404 when the form is not found', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(getOne(123, 10)).rejects.toMatchObject({
      message: 'COS Form not found',
      status: 404,
    });
  });

  it('should throw 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(getOne(999, 10)).rejects.toThrow('Client not found');
    expect(repository.findOne).not.toHaveBeenCalled();
  });
});

describe('COS Cover Form Service - create', () => {
  it('should insert a valid form', async () => {
    const result = await create(123, {
      FormType: 'COS',
      Region: 2,
      FormDate: '2024-03-01',
      OnePlanDate: '2024-02-15',
      Outcome1: '5',
      Outcome1Support: '1',
      Outcome2: 3,
      Outcome2Support: 0,
    });

    expect(result).toEqual({ ID: 11 });
    expect(repository.insert).toHaveBeenCalledWith(123, {
      FormType: 'COS',
      Region: 2,
      FormDate: '2024-03-01',
      OnePlanDate: '2024-02-15',
      ExitDate: null,
      Outcome1: 5,
      Outcome1Support: 1,
      Outcome2: 3,
      Outcome2Support: 0,
    });
  });

  it('should trim dates', async () => {
    await create(123, { FormDate: ' 2024-03-01 ' });

    expect(repository.insert).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ FormDate: '2024-03-01' }),
    );
  });

  it('should save empty dates as null', async () => {
    await create(123, { FormDate: '', OnePlanDate: null });

    expect(repository.insert).toHaveBeenCalledWith(123, {
      FormDate: null,
      OnePlanDate: null,
      ExitDate: null,
    });
  });

  it('should use an empty object when the body is missing', async () => {
    await create(123, undefined as never);

    expect(repository.insert).toHaveBeenCalledWith(123, {
      FormDate: null,
      OnePlanDate: null,
      ExitDate: null,
    });
  });

  it('should not change the object that was passed in', async () => {
    const body = { Outcome1: '5', FormDate: ' 2024-03-01 ' };

    await create(123, body);

    expect(body).toEqual({ Outcome1: '5', FormDate: ' 2024-03-01 ' });
  });

  it('should throw when a date is not in YYYY-MM-DD format', async () => {
    await expect(create(123, { FormDate: '03/01/2024' })).rejects.toThrow(
      'FormDate must use YYYY-MM-DD format',
    );

    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('should throw when a date does not exist', async () => {
    await expect(create(123, { ExitDate: '2024-02-30' })).rejects.toThrow(
      'ExitDate must be a valid date',
    );

    await expect(create(123, { OnePlanDate: '2023-13-01' })).rejects.toThrow(
      'OnePlanDate must be a valid date',
    );
  });

  it('should throw when FormType is blank', async () => {
    await expect(create(123, { FormType: '  ' })).rejects.toThrow(
      'FormType cannot be empty',
    );
  });

  it('should throw when Region is blank', async () => {
    await expect(create(123, { Region: '' })).rejects.toThrow(
      'Region cannot be empty',
    );
  });

  it('should accept outcome scores from 1 to 7', async () => {
    await create(123, { Outcome1: 1, Outcome2: '4', Outcome3: 7 });

    expect(repository.insert).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ Outcome1: 1, Outcome2: 4, Outcome3: 7 }),
    );
  });

  it('should throw when an outcome score is out of range', async () => {
    await expect(create(123, { Outcome2: 0 })).rejects.toThrow(
      'Outcome2 must be between 1 and 7',
    );

    await expect(create(123, { Outcome2: 8 })).rejects.toThrow(
      'Outcome2 must be between 1 and 7',
    );
  });

  it('should throw when an outcome score is not a whole number', async () => {
    await expect(create(123, { Outcome1: '2.5' })).rejects.toThrow(
      'Outcome1 must be between 1 and 7',
    );

    await expect(create(123, { Outcome1: 'abc' })).rejects.toThrow(
      'Outcome1 must be between 1 and 7',
    );
  });

  it('should skip empty outcome scores', async () => {
    await create(123, { Outcome3: '', Outcome3Support: null });

    expect(repository.insert).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ Outcome3: '', Outcome3Support: null }),
    );
  });

  it('should throw when outcome support is not 0 or 1', async () => {
    await expect(create(123, { Outcome3Support: '2' })).rejects.toThrow(
      'Outcome3Support must be 0 or 1',
    );

    await expect(create(123, { Outcome3Support: 'yes' })).rejects.toThrow(
      'Outcome3Support must be 0 or 1',
    );
  });

  it('should throw when EntryOrExit is not Entry or Exit', async () => {
    await expect(create(123, { EntryOrExit: 'Both' })).rejects.toThrow(
      'EntryOrExit must be Entry or Exit',
    );
  });

  it('should clear ExitDate for an Entry form', async () => {
    await create(123, { EntryOrExit: 'Entry', ExitDate: '2024-06-30' });

    expect(repository.insert).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ EntryOrExit: 'Entry', ExitDate: null }),
    );
  });

  it('should keep ExitDate for an Exit form', async () => {
    await create(123, { EntryOrExit: 'Exit', ExitDate: '2024-06-30' });

    expect(repository.insert).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ EntryOrExit: 'Exit', ExitDate: '2024-06-30' }),
    );
  });

  it('should throw 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(create(999, {})).rejects.toThrow('Client not found');
    expect(repository.insert).not.toHaveBeenCalled();
  });

  // EntryOrExit is an int column (-1 = Entry, 0 = Exit) and the COS page sends -1 / 0.
  it.todo('should accept EntryOrExit as -1 (Entry) or 0 (Exit)');
});

describe('COS Cover Form Service - update', () => {
  it('should update the form', async () => {
    const result = await update('123', '10', {
      Outcome1: '6',
      FormDate: '2024-04-01',
    });

    expect(result).toEqual({ ID: 10 });
    expect(repository.findOne).toHaveBeenCalledWith(123, 10);
    expect(repository.update).toHaveBeenCalledWith(
      123,
      10,
      expect.objectContaining({ Outcome1: 6, FormDate: '2024-04-01' }),
    );
  });

  it('should throw when form ID is invalid', async () => {
    await expect(update(123, 0, {})).rejects.toThrow('ID must be a positive integer');
  });

  it('should throw 404 when the form is not found', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(update(123, 10, {})).rejects.toMatchObject({
      message: 'COS Form not found',
      status: 404,
    });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should not update when the data is invalid', async () => {
    await expect(update(123, 10, { Outcome1: 9 })).rejects.toThrow(
      'Outcome1 must be between 1 and 7',
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(update(999, 10, {})).rejects.toThrow('Client not found');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('COS Cover Form Service - remove', () => {
  it('should delete the form', async () => {
    const result = await remove('123', '10');

    expect(result).toEqual({ success: true });
    expect(repository.remove).toHaveBeenCalledWith(123, 10);
  });

  it('should throw when form ID is invalid', async () => {
    await expect(remove(123, -4)).rejects.toThrow('ID must be a positive integer');
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('should throw 404 when nothing was deleted', async () => {
    vi.mocked(repository.remove).mockResolvedValue(false);

    await expect(remove(123, 10)).rejects.toMatchObject({
      message: 'COS Form not found',
      status: 404,
    });
  });

  it('should throw 404 when the client is not found', async () => {
    vi.mocked(repository.getClient).mockResolvedValue(null);

    await expect(remove(999, 10)).rejects.toThrow('Client not found');
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
