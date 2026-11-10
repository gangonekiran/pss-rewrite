import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '../../config/database.js';
import { findByChildId, findOne, getClient, insert, remove, update } from './insurance-form.repository.js';

vi.mock('../../config/database.js', () => ({
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

describe('Insurance Form Repository - getClient', () => {
  it('returns the client from stblPeople', async () => {
    const client = { ChildID: 123, LastName: 'Austin' };
    mockQuery.mockResolvedValue({ recordset: [client] });

    expect(await getClient(123)).toEqual(client);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(sqlText()).toContain('FROM dbo.stblPeople');
  });

  it('returns null when the client is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await getClient(999)).toBeNull();
  });
});

describe('Insurance Form Repository - findByChildId', () => {
  it('returns the forms, newest Date Completed first', async () => {
    const forms = [{ ID: 2 }, { ID: 1 }];
    mockQuery.mockResolvedValue({ recordset: forms });

    expect(await findByChildId(123)).toEqual(forms);
    expect(sqlText()).toContain('FROM dbo.stblInsuranceForm');
    expect(sqlText()).toMatch(/FormDate DESC,\s*ID DESC/);
  });
});

describe('Insurance Form Repository - findOne', () => {
  it('returns the form for the child', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ID: 10 }] });

    expect(await findOne(123, 10)).toEqual({ ID: 10 });
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 10);
    expect(sqlText()).toContain('AND ID = @ID');
  });

  it('returns null when the form is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findOne(123, 10)).toBeNull();
  });
});

describe('Insurance Form Repository - insert', () => {
  it('inserts the columns with FormType Insurance and reads the form back', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] })
      .mockResolvedValueOnce({ recordset: [{ ID: 11, BillingConsent: 1 }] });

    const result = await insert(123, {
      FormDate: '2026-01-15',
      BranchAddress: 'Blue Cross',
      BillingConsent: 1,
      DeclineReasonCap: false,
      Unknown: 'ignored',
      Skipped: undefined,
    });

    expect(result).toEqual({ ID: 11, BillingConsent: 1 });
    expect(mockInput).toHaveBeenCalledWith('FormType', 'NVarChar(12)', 'Insurance');
    expect(mockInput).toHaveBeenCalledWith('FormDate', 'NVarChar(10)', '2026-01-15');
    expect(mockInput).toHaveBeenCalledWith('BranchAddress', 'NVarChar(255)', 'Blue Cross');
    expect(mockInput).toHaveBeenCalledWith('BillingConsent', 'Int', 1);
    expect(mockInput).toHaveBeenCalledWith('DeclineReasonCap', 'Bit', false);
    expect(mockInput).not.toHaveBeenCalledWith('Unknown', expect.anything(), expect.anything());
    expect(sqlText()).toContain('INSERT INTO dbo.stblInsuranceForm');
    expect(sqlText()).toContain('[ChildID],[FormType],[FormDate],[BranchAddress],[BillingConsent],[DeclineReasonCap]');
    expect(sqlText()).toContain('OUTPUT INSERTED.ID');
  });

  it('throws when no ID comes back', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await expect(insert(123, { FormDate: '2026-01-15' })).rejects.toThrow(
      'Insurance Form was inserted but no ID was returned',
    );
  });
});

describe('Insurance Form Repository - update', () => {
  it('updates the columns and the audit fields', async () => {
    mockQuery.mockResolvedValueOnce({}).mockResolvedValueOnce({ recordset: [{ ID: 10 }] });

    expect(await update(123, 10, { PolicyNumber: 'P-2', EndDate: null })).toEqual({ ID: 10 });
    expect(mockInput).toHaveBeenCalledWith('PolicyNumber', 'NVarChar(255)', 'P-2');
    expect(mockInput).toHaveBeenCalledWith('EndDate', 'NVarChar(10)', null);
    expect(sqlText()).toContain('[PolicyNumber]=@PolicyNumber,[EndDate]=@EndDate');
    expect(sqlText()).toContain('[LastUpdateUser] = SUSER_SNAME()');
  });

  it('only reads the form back when there is nothing to save', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ID: 10 }] });

    expect(await update(123, 10, { Unknown: 'x' })).toEqual({ ID: 10 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(sqlText()).toContain('SELECT *');
  });
});

describe('Insurance Form Repository - remove', () => {
  it('returns true when a row was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 1 }] });

    expect(await remove(123, 10)).toBe(true);
    expect(sqlText()).toContain('DELETE FROM dbo.stblInsuranceForm');
  });

  it('returns false when nothing was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 0 }] });

    expect(await remove(123, 10)).toBe(false);
  });

  it('returns false when the row count is missing', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await remove(123, 10)).toBe(false);
  });
});
