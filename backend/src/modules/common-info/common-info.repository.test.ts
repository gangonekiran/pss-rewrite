import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '../../config/database';
import { getAllRegions, getTown, getTowns } from './common-info.repository';

vi.mock('../../config/database', () => ({
  getPool: vi.fn(),
  sql: {
    VarChar: (length: number) => `VarChar(${length})`,
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

describe('Common Info Repository - getAllRegions', () => {
  it('should return active regions ordered by name', async () => {
    const regions = [
      { ID: 1, RName: 'Burlington', Description: null, Inactive: false },
      { ID: 2, RName: 'St Albans', Description: 'Franklin', Inactive: false },
    ];

    mockQuery.mockResolvedValue({ recordset: regions });

    const result = await getAllRegions();

    expect(result).toEqual(regions);

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('FROM dbo.stblReportingRegion');
    expect(sql).toContain('WHERE Inactive = 0');
    expect(sql).toContain('ORDER BY RName');
    expect(mockInput).not.toHaveBeenCalled();
  });

  it('should throw when the database is not connected', async () => {
    vi.mocked(getPool).mockImplementation(() => {
      throw new Error('Database is not connected. Call connectDB() first.');
    });

    await expect(getAllRegions()).rejects.toThrow('Database is not connected');
  });
});

describe('Common Info Repository - getTowns', () => {
  it('should return all towns with county name when there is no search', async () => {
    const towns = [
      {
        Town: '001',
        TownName: 'St. Albans Town',
        SU_id: 12,
        CountyCode: 'FR',
        CountyName: 'Franklin',
      },
    ];

    mockQuery.mockResolvedValue({ recordset: towns });

    const result = await getTowns();

    expect(result).toEqual(towns);

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('FROM dbo.slstTownCodes t');
    expect(sql).toContain('LEFT JOIN dbo.slstCounties c');
    expect(sql).toContain('ORDER BY t.TownName');
    expect(sql).not.toContain('WHERE');
    expect(mockInput).not.toHaveBeenCalled();
  });

  it('should not filter when search is empty or only spaces', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await getTowns('');
    await getTowns('   ');

    expect(mockQuery.mock.calls[0][0]).not.toContain('WHERE');
    expect(mockQuery.mock.calls[1][0]).not.toContain('WHERE');
    expect(mockInput).not.toHaveBeenCalled();
  });

  it('should filter by town name or code using a trimmed search parameter', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await getTowns('  Alb ');

    expect(mockInput).toHaveBeenCalledWith('Search', 'VarChar(100)', '%Alb%');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('t.TownName LIKE @Search');
    expect(sql).toContain('t.Town LIKE @Search');
  });

  it('should pass the search as a parameter and not put it in the SQL', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    await getTowns("x'; DROP TABLE dbo.slstTownCodes; --");

    expect(mockQuery.mock.calls[0][0]).not.toContain('DROP TABLE');
    expect(mockInput).toHaveBeenCalledWith(
      'Search',
      'VarChar(100)',
      "%x'; DROP TABLE dbo.slstTownCodes; --%",
    );
  });
});

describe('Common Info Repository - getTown', () => {
  it('should return the town matching the code or name', async () => {
    const town = {
      Town: '001',
      TownName: 'St. Albans Town',
      SU_id: 12,
      CountyCode: 'FR',
      CountyName: 'Franklin',
    };

    mockQuery.mockResolvedValue({ recordset: [town] });

    const result = await getTown('001');

    expect(result).toEqual(town);
    expect(mockInput).toHaveBeenCalledWith('Town', 'VarChar(100)', '001');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('SELECT TOP 1');
    expect(sql).toContain('t.Town = @Town');
    expect(sql).toContain('t.TownName = @Town');
  });

  it('should return undefined when the town is not found', async () => {
    mockQuery.mockResolvedValue({ recordset: [] });

    const result = await getTown('ZZZ');

    expect(result).toBeUndefined();
  });
});
