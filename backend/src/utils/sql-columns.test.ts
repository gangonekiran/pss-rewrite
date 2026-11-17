import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'mssql';

import { bindColumn, pickColumns, quoteColumn, type ColumnSpec } from './sql-columns.js';

vi.mock('../config/database.js', () => ({
  sql: {
    Int: 'Int',
    Bit: 'Bit',
    NVarChar: (length: number | string) => `NVarChar(${length})`,
    MAX: 'MAX',
  },
}));

const COLUMNS: Record<string, ColumnSpec> = {
  FormDate: { kind: 'date' },
  Region: { kind: 'int' },
  CAPTA: { kind: 'yesNo' },
  DeclineReasonCap: { kind: 'bit' },
  PolicyNumber: { kind: 'text', max: 255 },
  Notes: { kind: 'text' },
};

function fakeRequest() {
  const req = { input: vi.fn() };
  req.input.mockReturnValue(req);
  return req;
}

describe('pickColumns', () => {
  it('keeps only the listed columns', () => {
    expect(
      pickColumns({ Region: 2, PolicyNumber: 'P-1', ID: 9, ChildID: 5, Unknown: 'x' }, COLUMNS),
    ).toEqual({ Region: 2, PolicyNumber: 'P-1' });
  });

  it('keeps null values, which clear a column', () => {
    expect(pickColumns({ FormDate: null }, COLUMNS)).toEqual({ FormDate: null });
  });

  it('drops undefined values', () => {
    expect(pickColumns({ Region: undefined, Notes: 'n' }, COLUMNS)).toEqual({ Notes: 'n' });
  });

  it('ignores inherited keys such as toString', () => {
    expect(pickColumns({ toString: 'x', constructor: 'y' }, COLUMNS)).toEqual({});
  });

  it('handles a missing payload', () => {
    expect(pickColumns(undefined as unknown as Record<string, unknown>, COLUMNS)).toEqual({});
  });
});

describe('bindColumn', () => {
  it.each([
    ['FormDate', '2026-01-15', 'NVarChar(10)'],
    ['Region', 2, 'Int'],
    ['CAPTA', -1, 'Int'],
    ['DeclineReasonCap', true, 'Bit'],
    ['PolicyNumber', 'P-1', 'NVarChar(255)'],
    ['Notes', 'long text', 'NVarChar(MAX)'],
  ])('binds %s as %s', (key, value, type) => {
    const req = fakeRequest();

    const result = bindColumn(req as unknown as Request, key, value, COLUMNS[key]);

    expect(req.input).toHaveBeenCalledWith(key, type, value);
    expect(result).toBe(req);
  });

  it('binds null values with the column type', () => {
    const req = fakeRequest();

    bindColumn(req as unknown as Request, 'FormDate', null, COLUMNS.FormDate);

    expect(req.input).toHaveBeenCalledWith('FormDate', 'NVarChar(10)', null);
  });
});

describe('quoteColumn', () => {
  it('wraps the name in brackets', () => {
    expect(quoteColumn('FormDate')).toBe('[FormDate]');
  });

  it('escapes a closing bracket in the name', () => {
    expect(quoteColumn('Odd]Name')).toBe('[Odd]]Name]');
  });
});
