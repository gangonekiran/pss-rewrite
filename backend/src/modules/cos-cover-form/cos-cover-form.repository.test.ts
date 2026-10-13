import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '../../config/database';
import {
  findByChildId,
  findOne,
  getClient,
  insert,
  remove,
  update,
} from './cos-cover-form.repository';

vi.mock('../../config/database', () => ({
  getPool: vi.fn(),
  sql: {
    Int: 'Int',
    Bit: 'Bit',
    NVarChar: 'NVarChar',
  },
}));

const mockInput = vi.fn();
const mockQuery = vi.fn();

const mockRequest = {
  input: mockInput,
  query: mockQuery,
};

beforeEach(() => {
  vi.clearAllMocks();

  mockInput.mockReturnValue(mockRequest);

  vi.mocked(getPool).mockReturnValue({
    request: () => mockRequest,
  } as unknown as ReturnType<typeof getPool>);
});

describe('COS Cover Form Repository - getClient', () => {
  it('should return the client from stblPeople', async () => {
    const client = { ChildID: 123, LastName: 'Doe' };
    mockQuery.mockResolvedValue({ recordset: [client] });

    const result = await getClient(123);

    expect(result).toEqual(client);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockQuery.mock.calls[0][0]).toContain('FROM dbo.stblPeople');
  });

  it('should return null when the client is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    const result = await getClient(999);

    expect(result).toBeNull();
  });
});

describe('COS Cover Form Repository - findByChildId', () => {
  it('should return the forms for the child, newest first', async () => {
    const forms = [{ FormDate: '2024-03-01' }, { FormDate: '2024-01-01' }];
    mockQuery.mockResolvedValue({ recordset: forms });

    const result = await findByChildId(123);

    expect(result).toEqual(forms);
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('FROM dbo.stblCOSCoverForm');
    expect(sql).toContain('WHERE ChildID = @ChildID');
    expect(sql).toContain('FormDate DESC');
  });

  it('should throw when the database is not connected', async () => {
    vi.mocked(getPool).mockImplementation(() => {
      throw new Error('Database is not connected. Call connectDB() first.');
    });

    await expect(findByChildId(123)).rejects.toThrow('Database is not connected');
  });
});

describe('COS Cover Form Repository - findOne', () => {
  it('should look up the form by child and form ID', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ FormType: 'COS' }] });

    const result = await findOne(123, 10);

    expect(result).toEqual({ FormType: 'COS' });
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).toHaveBeenCalledWith('ID', 'Int', 10);
    expect(mockQuery.mock.calls[0][0]).toContain('WHERE ChildID = @ChildID');
  });

  it('should return null when the form is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    const result = await findOne(123, 10);

    expect(result).toBeNull();
  });

  // The primary key of stblCOSCoverForm is COSCoverID, there is no ID column.
  it.todo('should use COSCoverID instead of ID');
});

describe('COS Cover Form Repository - insert', () => {
  it('should insert the form and return the saved row', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] })
      .mockResolvedValueOnce({ recordset: [{ ID: 11, FormType: 'COS' }] });

    const result = await insert(123, {
      FormType: 'COS',
      Region: 2,
      FormDate: '2024-03-01',
    });

    expect(result).toEqual({ ID: 11, FormType: 'COS' });
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).toHaveBeenCalledWith('FormType', 'NVarChar', 'COS');
    expect(mockInput).toHaveBeenCalledWith('Region', 'Int', 2);
    expect(mockInput).toHaveBeenCalledWith('FormDate', 'NVarChar', '2024-03-01');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('INSERT INTO dbo.stblCOSCoverForm');
    expect(sql).toContain('[ChildID],[FormType],[Region],[FormDate]');
    expect(sql).toContain('@ChildID,@FormType,@Region,@FormDate');
  });

  it('should bind booleans as Bit and nulls as NVarChar', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] })
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] });

    await insert(123, { Outcome1Support: true, ExitDate: null });

    expect(mockInput).toHaveBeenCalledWith('Outcome1Support', 'Bit', true);
    expect(mockInput).toHaveBeenCalledWith('ExitDate', 'NVarChar', null);
  });

  it('should ignore ID, ChildID and columns that are not writable', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] })
      .mockResolvedValueOnce({ recordset: [{ ID: 11 }] });

    await insert(123, {
      ID: 99,
      ChildID: 555,
      InsertUser: 'someone',
      Unknown: 'x',
      FormType: 'COS',
    });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).not.toContain('InsertUser');
    expect(sql).not.toContain('Unknown');

    // ChildID always comes from the route, not the body
    expect(mockInput).toHaveBeenCalledWith('ChildID', 'Int', 123);
    expect(mockInput).not.toHaveBeenCalledWith('ChildID', 'Int', 555);
  });

  it('should throw when no ID is returned', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [] });

    await expect(insert(123, { FormType: 'COS' })).rejects.toThrow(
      'COS form was inserted but no ID was returned',
    );
  });
});

describe('COS Cover Form Repository - update', () => {
  it('should update the changed columns and LastUpdateDate', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [{ ID: 10, Outcome1: 5 }] });

    const result = await update(123, 10, { Outcome1: 5 });

    expect(result).toEqual({ ID: 10, Outcome1: 5 });
    expect(mockInput).toHaveBeenCalledWith('Outcome1', 'Int', 5);

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('UPDATE dbo.stblCOSCoverForm');
    expect(sql).toContain('[Outcome1]=@Outcome1');
    expect(sql).toContain('[LastUpdateDate] = GETDATE()');
    expect(sql).toContain('WHERE ChildID = @ChildID');
  });

  it('should not let the body set LastUpdateDate', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [{ ID: 10 }] });

    await update(123, 10, { Outcome1: 5, LastUpdateDate: '2000-01-01' });

    expect(mockInput).not.toHaveBeenCalledWith(
      'LastUpdateDate',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should only read the form when there is nothing to update', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ ID: 10 }] });

    const result = await update(123, 10, { Unknown: 'x' });

    expect(result).toEqual({ ID: 10 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).not.toContain('UPDATE');
  });
});

describe('COS Cover Form Repository - remove', () => {
  it('should return true when the form was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 1 }] });

    const result = await remove(123, 10);

    expect(result).toBe(true);
    expect(mockQuery.mock.calls[0][0]).toContain('DELETE FROM dbo.stblCOSCoverForm');
  });

  it('should return false when nothing was deleted', async () => {
    mockQuery.mockResolvedValue({ recordset: [{ Affected: 0 }] });

    const result = await remove(123, 10);

    expect(result).toBe(false);
  });
});
