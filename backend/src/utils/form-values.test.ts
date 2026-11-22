import { describe, expect, it } from 'vitest';

import {
  error,
  isBlank,
  parseBit,
  parseDate,
  parseInt32,
  parseText,
  toIsoDate,
} from './form-values.js';

describe('error', () => {
  it('throws with a 400 status by default', () => {
    expect(() => error('Bad value')).toThrow(
      expect.objectContaining({ message: 'Bad value', status: 400 }),
    );
  });

  it('throws with the given status', () => {
    expect(() => error('Not found', 404)).toThrow(
      expect.objectContaining({ message: 'Not found', status: 404 }),
    );
  });
});

describe('isBlank', () => {
  it.each([undefined, null, '', '   '])('is true for %j', (value) => {
    expect(isBlank(value)).toBe(true);
  });

  it.each([0, false, 'x', ' a '])('is false for %j', (value) => {
    expect(isBlank(value)).toBe(false);
  });
});

describe('toIsoDate', () => {
  it.each([
    ['2026-01-15', '2026-01-15'],
    ['2026-01-15T00:00:00.000Z', '2026-01-15'],
    ['2026-01-15 00:00:00', '2026-01-15'],
    [' 2026-01-15 ', '2026-01-15'],
    [new Date('2026-01-15T00:00:00Z'), '2026-01-15'],
  ])('reads %j', (value, expected) => {
    expect(toIsoDate(value)).toBe(expected);
  });

  it.each([null, undefined, '', '01/15/2026', 'not a date', new Date('invalid')])(
    'returns null for %j',
    (value) => {
      expect(toIsoDate(value)).toBeNull();
    },
  );
});

describe('parseDate', () => {
  it('returns a YYYY-MM-DD date', () => {
    expect(parseDate(' 2026-01-15 ', 'FormDate')).toBe('2026-01-15');
  });

  it('accepts a Date object', () => {
    expect(parseDate(new Date('2026-01-15T00:00:00Z'), 'FormDate')).toBe('2026-01-15');
  });

  it.each([null, undefined, ''])('returns null for %j', (value) => {
    expect(parseDate(value, 'FormDate')).toBeNull();
  });

  it.each(['01/15/2026', '2026-1-15', '2026-01-15T00:00:00Z'])(
    'rejects the format %j',
    (value) => {
      expect(() => parseDate(value, 'FormDate')).toThrow('FormDate must use YYYY-MM-DD format');
    },
  );

  it.each(['2026-02-30', '2026-13-01', '2026-00-10'])('rejects the impossible date %j', (value) => {
    expect(() => parseDate(value, 'FormDate')).toThrow('FormDate must be a valid date');
  });
});

describe('parseInt32', () => {
  it.each([
    [2, 2],
    ['3', 3],
    [' 4 ', 4],
    [-1, -1],
    [0, 0],
  ])('reads %j as %j', (value, expected) => {
    expect(parseInt32(value, 'Region')).toBe(expected);
  });

  it.each([null, undefined, ''])('returns null for %j', (value) => {
    expect(parseInt32(value, 'Region')).toBeNull();
  });

  it.each(['1.5', 'abc', 2.5])('rejects %j', (value) => {
    expect(() => parseInt32(value, 'Region')).toThrow('Region must be a whole number');
  });

  it.each([['+5', 5], [2147483647, 2147483647], [-2147483648, -2147483648]])(
    'reads %j as %j',
    (value, expected) => {
      expect(parseInt32(value, 'Region')).toBe(expected);
    },
  );

  it.each([true, false, [4], { a: 1 }, '0x4', '4e0', '1_000', 'Infinity', Number.NaN, Infinity])(
    'rejects %j instead of coercing it',
    (value) => {
      expect(() => parseInt32(value, 'RefStatus')).toThrow('RefStatus must be a whole number');
    },
  );

  it.each([2147483648, -2147483649, '9999999999'])('rejects %j as out of the SQL int range', (value) => {
    expect(() => parseInt32(value, 'Region')).toThrow('Region is out of range');
  });
});

describe('parseBit', () => {
  it.each([true, 1, -1, '1', '-1', 'true', 'TRUE', 'yes', ' Yes '])('reads %j as true', (value) => {
    expect(parseBit(value, 'Flag')).toBe(true);
  });

  it.each([false, 0, '0', 'false', 'no', null, undefined, ''])('reads %j as false', (value) => {
    expect(parseBit(value, 'Flag')).toBe(false);
  });

  it.each(['maybe', 2, 'y'])('rejects %j', (value) => {
    expect(() => parseBit(value, 'Flag')).toThrow('Flag must be true or false');
  });
});

describe('parseText', () => {
  it('trims the value', () => {
    expect(parseText('  Blue Cross  ', 'Name')).toBe('Blue Cross');
  });

  it('turns numbers into text', () => {
    expect(parseText(123, 'Name')).toBe('123');
  });

  it.each([null, undefined, '', '   '])('returns null for %j', (value) => {
    expect(parseText(value, 'Name')).toBeNull();
  });

  it('accepts text up to the maximum length', () => {
    expect(parseText('x'.repeat(5), 'Name', 5)).toBe('xxxxx');
  });

  it('measures the length after trimming', () => {
    expect(parseText('  xxxxx  ', 'Name', 5)).toBe('xxxxx');
  });

  it('rejects text longer than the maximum', () => {
    expect(() => parseText('x'.repeat(6), 'Name', 5)).toThrow(
      'Name must be 5 characters or fewer',
    );
  });

  it('has no limit when no maximum is given', () => {
    expect(parseText('x'.repeat(5000), 'Notes')).toHaveLength(5000);
  });
});
