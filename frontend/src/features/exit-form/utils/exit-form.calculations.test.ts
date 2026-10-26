import { describe, expect, it } from 'vitest';

import {
  calculateExit,
  formatDate,
  suggestExitPath,
  thirdBirthday,
  toDateInput,
} from './exit-form.calculations';

const noDates = {
  ReferralDate: '',
  ExitDate: '',
  CLLEANotificationDate: '',
  TransitionMeeting: '',
  TransitionPlanCompleted: '',
};

describe('toDateInput', () => {
  it('reads YYYY-MM-DD strings and ISO timestamps', () => {
    expect(toDateInput('2025-06-01')).toBe('2025-06-01');
    expect(toDateInput('2025-06-01T00:00:00.000Z')).toBe('2025-06-01');
  });

  it('returns an empty string for blank or unreadable values', () => {
    expect(toDateInput(null)).toBe('');
    expect(toDateInput(undefined)).toBe('');
    expect(toDateInput('')).toBe('');
    expect(toDateInput('06/01/2025')).toBe('');
  });
});

describe('thirdBirthday', () => {
  it('adds three years to the DOB', () => {
    expect(thirdBirthday('2023-04-10T00:00:00.000Z')).toBe('2026-04-10');
  });

  it('moves a 29 February birthday to 1 March', () => {
    expect(thirdBirthday('2024-02-29')).toBe('2027-03-01');
  });

  it('returns an empty string without a DOB', () => {
    expect(thirdBirthday(null)).toBe('');
  });
});

describe('calculateExit', () => {
  it('works out the 3rd birthday and the four day counts', () => {
    const calc = calculateExit(
      {
        ReferralDate: '2025-02-15',
        ExitDate: '2026-04-01',
        CLLEANotificationDate: '2025-11-01',
        TransitionMeeting: '2025-12-15',
        TransitionPlanCompleted: '2025-10-01',
      },
      '2023-04-10T00:00:00.000Z',
    );

    expect(calc).toEqual({
      thirdBirthday: '2026-04-10',
      daysReferralToTransitionPlan: 228,
      daysLEANotificationBeforeExit: 151,
      daysTransitionConferenceBeforeExit: 107,
      daysExitBeforeThirdBirthday: 9,
    });
  });

  it('returns nulls when the dates are missing', () => {
    expect(calculateExit(noDates, null)).toEqual({
      thirdBirthday: null,
      daysReferralToTransitionPlan: null,
      daysLEANotificationBeforeExit: null,
      daysTransitionConferenceBeforeExit: null,
      daysExitBeforeThirdBirthday: null,
    });
  });

  it('counts the days from the referral to the transition plan', () => {
    const calc = calculateExit(
      { ...noDates, ReferralDate: '2025-02-15', TransitionPlanCompleted: '2025-10-01' },
      null,
    );

    expect(calc.daysReferralToTransitionPlan).toBe(228);
    expect(
      calculateExit({ ...noDates, ReferralDate: '2025-02-15' }, null).daysReferralToTransitionPlan,
    ).toBeNull();
  });

  it('gives the 3rd birthday before an exit date is entered', () => {
    const calc = calculateExit(noDates, '2023-04-10');

    expect(calc.thirdBirthday).toBe('2026-04-10');
    expect(calc.daysExitBeforeThirdBirthday).toBeNull();
  });

  it('is negative when the exit is after the 3rd birthday', () => {
    expect(
      calculateExit({ ...noDates, ExitDate: '2026-04-15' }, '2023-04-10')
        .daysExitBeforeThirdBirthday,
    ).toBe(-5);
  });

  it.each([
    ['2026-01-01', 90],
    ['2025-10-03', 180],
    ['2026-04-01', 0],
  ])('conference on %s is %i days before exit', (date, days) => {
    const calc = calculateExit(
      {
        ...noDates,
        ExitDate: '2026-04-01',
        TransitionMeeting: date,
      },
      null,
    );

    expect(calc.daysTransitionConferenceBeforeExit).toBe(days);
  });
});

describe('suggestExitPath - edge cases', () => {
  it('suggests "at age 3" from 31 days before the 3rd birthday', () => {
    expect(suggestExitPath('2026-03-10', '2023-04-10')).toBe('atAge3');
    expect(suggestExitPath('2026-03-09', '2023-04-10')).toBe('prior');
  });

  it('suggests "at age 3" after the 3rd birthday', () => {
    expect(suggestExitPath('2026-06-01', '2023-04-10')).toBe('atAge3');
  });

  it('suggests from the exit date', () => {
    expect(suggestExitPath('2026-04-01', '2023-04-10')).toBe('atAge3');
    expect(suggestExitPath('2025-01-01', '2023-04-10')).toBe('prior');
  });

  it('suggests nothing without an exit date', () => {
    expect(suggestExitPath('', '2023-04-10')).toBe('');
  });

  it('suggests nothing without a DOB', () => {
    expect(suggestExitPath('2026-04-01', null)).toBe('');
  });
});

describe('formatDate - edge cases', () => {
  it('formats plain dates and ISO timestamps', () => {
    expect(formatDate('2025-06-01')).toBe('06/01/2025');
    expect(formatDate('2026-04-01T00:00:00.000Z')).toBe('04/01/2026');
  });

  it('shows a dash for blank or unreadable values', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
});
