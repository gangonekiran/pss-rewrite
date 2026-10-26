import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '../../config/database';
import {
  findByChildId,
  findLatestActive,
  findLatestReferral,
  findOne,
  getClient,
  insert,
  remove,
  update,
} from './exit-form.repository';

vi.mock('../../config/database', () => ({
  getPool: vi.fn(),
  sql: {
    Int: 'Int',
    Bit: 'Bit',
    NVarChar: (length: number) => `NVarChar(${length})`,
    MAX: 'MAX',
  },
}));

const mockInput = vi.fn();
const mockQuery = vi.fn();

const mockRequest = {
  input: mockInput,
  query: mockQuery,
};

function sqlText(call = 0): string {
  return mockQuery.mock.calls[call][0];
}

beforeEach(() => {
  vi.clearAllMocks();

  mockInput.mockReturnValue(mockRequest);

  vi.mocked(getPool).mockReturnValue({
    request: () => mockRequest,
  } as unknown as ReturnType<typeof getPool>);
});

describe('Exit Form Repository - getClient', () => {
  it('should return the client from stblPeople', async () => {
    const client = { ChildID: 123, LastName: 'Austin' };
    mockQuery.mockResolvedValue({ recordset: [client] });

    const result = await getClient(123);

    expect(result).toEqual(client);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(sqlText()).toContain('FROM dbo.stblPeople');
    expect(sqlText()).toContain('WHERE ChildID = @ChildID');
  });

  it('should return null when the client is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await getClient(999)).toBeNull();
  });

  it('should throw when the database is not connected', async () => {
    vi.mocked(getPool).mockImplementation(() => {
      throw new Error('Database is not connected. Call connectDB() first.');
    });

    await expect(getClient(123)).rejects.toThrow('Database is not connected');
  });
});

describe('Exit Form Repository - findByChildId', () => {
  it('should return the forms for the child, newest exit first', async () => {
    const forms = [{ ID: 2 }, { ID: 1 }];
    mockQuery.mockResolvedValue({ recordset: forms });

    const result = await findByChildId(123);

    expect(result).toEqual(forms);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(sqlText()).toContain('FROM dbo.stblExitForm');
    expect(sqlText()).toContain('WHERE ChildID = @ChildID');
    expect(sqlText()).toContain('ExitDate DESC');
  });

  it('should return an empty list when there are no forms', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findByChildId(123)).toEqual([]);
  });
});

describe('Exit Form Repository - findOne', () => {
  it('should find a form by child ID and form ID', async () => {
    const form = { ID: 10, ChildID: 123 };
    mockQuery.mockResolvedValue({ recordset: [form] });

    const result = await findOne(123, 10);

    expect(result).toEqual(form);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 10);
    expect(sqlText()).toContain('WHERE ChildID = @ChildID');
    expect(sqlText()).toContain('AND ID = @ID');
  });

  it('should return null when the form is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findOne(123, 99)).toBeNull();
  });
});

describe('Exit Form Repository - insert', () => {
  it('should insert the form with FormType Exit and return the saved row', async () => {
    const saved = { ID: 11, ChildID: 123, FormType: 'Exit' };
    mockQuery.mockResolvedValueOnce({ recordset: [{ ID: 11 }] }).mockResolvedValueOnce({ recordset: [saved] });

    const result = await insert(123, {
      Region: 2,
      ExitDate: '2025-06-01',
      CAPTA: -1,
      EXFNoPartB1: true,
      MovedOtherRegion: 'Rutland',
      TransitionPlanReason: 'Late',
    });

    expect(result).toEqual(saved);

    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).toHaveBeenCalledWith('FormType', 'NVarChar(12)', 'Exit');
    expect(mockInput).toHaveBeenCalledWith('Region', 'Int', 2);
    expect(mockInput).toHaveBeenCalledWith('ExitDate', 'NVarChar(10)', '2025-06-01');
    expect(mockInput).toHaveBeenCalledWith('CAPTA', 'Int', -1);
    expect(mockInput).toHaveBeenCalledWith('EXFNoPartB1', 'Bit', true);
    expect(mockInput).toHaveBeenCalledWith('MovedOtherRegion', 'NVarChar(255)', 'Rutland');
    expect(mockInput).toHaveBeenCalledWith('TransitionPlanReason', 'NVarChar(MAX)', 'Late');

    const sql = sqlText();
    expect(sql).toContain('INSERT INTO dbo.stblExitForm');
    expect(sql).toContain('[ChildID],[FormType],[Region],[ExitDate]');
    expect(sql).toContain('@ChildID,@FormType,@Region,@ExitDate');
    expect(sql).toContain('OUTPUT INSERTED.ID');

    // Reads the new row back.
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 11);
  });

  // FormType is stripped earlier, by normalizePayload in the service.
  it('should ignore ID, ChildID, unknown and undefined fields', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ ID: 11 }] }).mockResolvedValueOnce({ recordset: [{}] });

    await insert(123, { ID: 5, ChildID: 999, Unknown: 1, Region: undefined, ExitDate: '2025-06-01' });

    const names = mockInput.mock.calls.map((call) => call[0]);
    expect(names).not.toContain('Unknown');
    expect(names).not.toContain('Region');
    expect(mockInput).not.toHaveBeenCalledWith('ChildID', 'Int', 999);
    expect(sqlText()).toContain('[ChildID],[FormType],[ExitDate]');
  });

  it('should throw when no ID is returned', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await expect(insert(123, { ExitDate: '2025-06-01' })).rejects.toThrow(
      'Exit Form was inserted but no ID was returned',
    );
  });
});

describe('Exit Form Repository - update', () => {
  it('should update only the given fields and return the saved row', async () => {
    const saved = { ID: 10, ReferredTo: 99 };
    mockQuery.mockResolvedValueOnce({ recordset: [] }).mockResolvedValueOnce({ recordset: [saved] });

    const result = await update(123, 10, { ReferredTo: 99, ExitDate: null });

    expect(result).toEqual(saved);
    expect(mockInput).toHaveBeenCalledWith('ReferredTo', 'Int', 99);
    expect(mockInput).toHaveBeenCalledWith('ExitDate', 'NVarChar(10)', null);

    const sql = sqlText();
    expect(sql).toContain('UPDATE dbo.stblExitForm');
    expect(sql).toContain('[ReferredTo]=@ReferredTo,[ExitDate]=@ExitDate');
    expect(sql).toContain('[LastUpdateDate] = GETDATE()');
    expect(sql).toContain('[LastUpdateUser] = SUSER_SNAME()');
    expect(sql).toContain('WHERE ChildID = @ChildID');
    expect(sql).toContain('AND ID = @ID');
  });

  it('should only read the form when nothing writable was sent', async () => {
    const form = { ID: 10 };
    mockQuery.mockResolvedValue({ recordset: [form] });

    const result = await update(123, 10, { ID: 5, Unknown: 'x' });

    expect(result).toEqual(form);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(sqlText()).not.toContain('UPDATE');
  });

  it('should return null when the form is not found afterwards', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [] }).mockResolvedValueOnce({ recordset: [] });

    expect(await update(123, 99, { ReferredTo: 1 })).toBeNull();
  });
});

describe('Exit Form Repository - remove', () => {
  it('should return true when a row was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 1 }] });

    expect(await remove(123, 10)).toBe(true);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 10);
    expect(sqlText()).toContain('DELETE FROM dbo.stblExitForm');
  });

  it('should return false when no row was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 0 }] });

    expect(await remove(123, 99)).toBe(false);
  });

  it('should return false when the count is missing', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await remove(123, 99)).toBe(false);
  });
});

describe('Exit Form Repository - findLatestReferral', () => {
  it('should return the latest Referral form by (re)referral date', async () => {
    const row = { Region: 2, ReferralDate: '2025-02-15' };
    mockQuery.mockResolvedValue({ recordset: [row] });

    expect(await findLatestReferral(123)).toEqual(row);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(sqlText()).toContain('FROM dbo.stblReferralForm');
    expect(sqlText()).toContain('SELECT TOP 1 Region, ReferralDate\n');
    expect(sqlText()).toContain('COALESCE(ReReferralDate, ReferralDate, FormDate) DESC');
  });

  it('should return null when there is no Referral form', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findLatestReferral(123)).toBeNull();
  });
});

describe('Exit Form Repository - findLatestActive', () => {
  it('should return the latest Active form by form date', async () => {
    const row = { Region: 3, ReferralDate: '2025-02-15' };
    mockQuery.mockResolvedValue({ recordset: [row] });

    expect(await findLatestActive(123)).toEqual(row);
    expect(sqlText()).toContain('SELECT TOP 1 Region, ReferralDate\n');
    expect(sqlText()).toContain('FROM dbo.stblActiveForm');
    expect(sqlText()).toContain('FormDate DESC');
  });

  it('should return null when there is no Active form', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findLatestActive(123)).toBeNull();
  });
});
