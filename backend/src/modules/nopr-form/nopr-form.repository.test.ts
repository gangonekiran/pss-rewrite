import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '../../config/database.js';
import {
  findByChildId,
  findLatestRegion,
  findMostRecentReferralDate,
  findOne,
  getClient,
  insert,
  regionExists,
  remove,
  update,
} from './nopr-form.repository.js';

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

describe('NOPR Form Repository - getClient', () => {
  it('returns the client from stblPeople', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ChildID: 123 }] });

    expect(await getClient(123)).toEqual({ ChildID: 123 });
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(sqlText()).toContain('FROM dbo.stblPeople');
  });

  it('returns null when the client is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await getClient(999)).toBeNull();
  });
});

describe('NOPR Form Repository - findByChildId', () => {
  it('returns the forms, newest first', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ID: 2 }, { ID: 1 }] });

    expect(await findByChildId(123)).toEqual([{ ID: 2 }, { ID: 1 }]);
    expect(sqlText()).toContain('FROM dbo.stblNoOnePlanForm');
    expect(sqlText()).toMatch(/FormDate DESC,\s*ID DESC/);
  });
});

describe('NOPR Form Repository - findOne', () => {
  it('returns the form for the child', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ID: 10 }] });

    expect(await findOne(123, 10)).toEqual({ ID: 10 });
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 10);
  });

  it('returns null when the form is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findOne(123, 10)).toBeNull();
  });
});

describe('NOPR Form Repository - insert', () => {
  it('inserts the columns with FormType No One Plan and reads the form back', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] })
      .mockResolvedValueOnce({ recordset: [{ ID: 11, RefStatus: 8 }] });

    const result = await insert(123, {
      Region: 3,
      RefStatus: 8,
      InitialEvalDate: null,
      StatusDate: '2026-02-02',
      FormDate: '2026-02-02',
      Screening: 1,
    });

    expect(result).toEqual({ ID: 11, RefStatus: 8 });
    expect(mockInput).toHaveBeenCalledWith('FormType', 'NVarChar(12)', 'No One Plan');
    expect(mockInput).toHaveBeenCalledWith('Region', 'Int', 3);
    expect(mockInput).toHaveBeenCalledWith('RefStatus', 'Int', 8);
    expect(mockInput).toHaveBeenCalledWith('InitialEvalDate', 'NVarChar(10)', null);
    expect(mockInput).toHaveBeenCalledWith('StatusDate', 'NVarChar(10)', '2026-02-02');
    expect(mockInput).toHaveBeenCalledWith('FormDate', 'NVarChar(10)', '2026-02-02');
    expect(mockInput).not.toHaveBeenCalledWith('Screening', expect.anything(), expect.anything());
    expect(sqlText()).toContain('INSERT INTO dbo.stblNoOnePlanForm');
    expect(sqlText()).toContain('[ChildID],[FormType],[Region],[RefStatus],[InitialEvalDate],[StatusDate],[FormDate]');
  });

  it('throws when no ID comes back', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await expect(insert(123, { RefStatus: 8 })).rejects.toThrow(
      'NOPR Form was inserted but no ID was returned',
    );
  });
});

describe('NOPR Form Repository - update', () => {
  it('updates the columns and the audit fields', async () => {
    mockQuery.mockResolvedValueOnce({}).mockResolvedValueOnce({ recordset: [{ ID: 10 }] });

    expect(await update(123, 10, { StatusDate: '2026-02-10', FormDate: '2026-02-10' })).toEqual({ ID: 10 });
    expect(sqlText()).toContain('[StatusDate]=@StatusDate,[FormDate]=@FormDate');
    expect(sqlText()).toContain('[LastUpdateUser] = SUSER_SNAME()');
  });

  it('only reads the form back when there is nothing to save', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ ID: 10 }] });

    expect(await update(123, 10, { Unknown: 'x' })).toEqual({ ID: 10 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('NOPR Form Repository - remove', () => {
  it('returns true when a row was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 1 }] });

    expect(await remove(123, 10)).toBe(true);
    expect(sqlText()).toContain('DELETE FROM dbo.stblNoOnePlanForm');
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

describe('NOPR Form Repository - findMostRecentReferralDate', () => {
  it('returns the latest Referral Date or Re-referral Date', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ MostRecentReferralDate: '2026-01-05 00:00:00' }] });

    expect(await findMostRecentReferralDate(123)).toBe('2026-01-05 00:00:00');
    expect(sqlText()).toContain('FROM dbo.stblReferralForm');
    expect(sqlText()).toContain('(rf.ReferralDate), (rf.ReReferralDate)');
  });

  it('returns null when the child has no referral', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ MostRecentReferralDate: null }] });

    expect(await findMostRecentReferralDate(123)).toBeNull();
  });

  it('returns null when nothing comes back', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await findMostRecentReferralDate(123)).toBeNull();
  });
});

describe('NOPR Form Repository - findLatestRegion', () => {
  it('returns the region of the latest Active form or Referral form', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Region: 3 }] });

    expect(await findLatestRegion(123)).toBe(3);
    expect(sqlText()).toContain('FROM dbo.stblActiveForm');
    expect(sqlText()).toContain('FROM dbo.stblReferralForm');
  });

  it.each([[{ Region: null }], [undefined]])('returns null when there is no region (%j)', async (row) => {
    mockQuery.mockResolvedValue({ recordset: row ? [row] : [] });

    expect(await findLatestRegion(123)).toBeNull();
  });
});

describe('NOPR Form Repository - regionExists', () => {
  it('returns true when the region is in stblReportingRegion', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Found: 1 }] });

    expect(await regionExists(3)).toBe(true);
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 3);
    expect(sqlText()).toContain('FROM dbo.stblReportingRegion');
  });

  it('returns false when the region is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Found: 0 }] });

    expect(await regionExists(99999)).toBe(false);
  });

  it('returns false when nothing comes back', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    expect(await regionExists(1)).toBe(false);
  });
});