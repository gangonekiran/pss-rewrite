import { describe, expect, it } from 'vitest';

import { addToDate, daysBetween, formatDate, toDateInput } from './date';

describe('toDateInput', () => {
  it('reads YYYY-MM-DD strings and ISO timestamps', () => {
    expect(toDateInput('2025-06-01')).toBe('2025-06-01');
    expect(toDateInput('2025-06-01T00:00:00.000Z')).toBe('2025-06-01');
    expect(toDateInput(' 2025-06-01 ')).toBe('2025-06-01');
  });

  it.each([null, undefined, '', '06/01/2025', 0])('returns blank for %j', (value) => {
    expect(toDateInput(value)).toBe('');
  });
});

describe('daysBetween', () => {
  it('counts the days from the first date to the second', () => {
    expect(daysBetween('2025-02-15', '2025-10-01')).toBe(228);
  });

  it('is negative when the second date is earlier', () => {
    expect(daysBetween('2026-04-10', '2026-04-01')).toBe(-9);
  });

  it('is 0 for the same day', () => {
    expect(daysBetween('2025-06-01', '2025-06-01')).toBe(0);
  });

  it('counts whole days across a daylight saving change', () => {
    expect(daysBetween('2025-03-08', '2025-03-10')).toBe(2);
    expect(daysBetween('2025-11-01', '2025-11-03')).toBe(2);
  });

  it.each([
    ['', '2025-06-01'],
    ['2025-06-01', ''],
  ])('returns null when a date is blank (%j, %j)', (from, to) => {
    expect(daysBetween(from, to)).toBeNull();
  });
});

describe('addToDate', () => {
  it('adds years', () => {
    expect(addToDate('2023-04-10', { years: 3 })).toBe('2026-04-10');
  });

  it('rolls 29 February over to 1 March in a non-leap year', () => {
    expect(addToDate('2024-02-29', { years: 3 })).toBe('2027-03-01');
  });

  it('adds months', () => {
    expect(addToDate('2025-01-15', { months: 2 })).toBe('2025-03-15');
  });

  it('subtracts days across a month end', () => {
    expect(addToDate('2026-04-10', { days: -31 })).toBe('2026-03-10');
  });
});

describe('formatDate', () => {
  it('formats plain dates and ISO timestamps as MM/DD/YYYY', () => {
    expect(formatDate('2025-06-01')).toBe('06/01/2025');
    expect(formatDate('2026-04-01T00:00:00.000Z')).toBe('04/01/2026');
  });

  it.each(['', null, undefined, 'not a date'])('shows a dash for %j', (value) => {
    expect(formatDate(value)).toBe('—');
  });
});
