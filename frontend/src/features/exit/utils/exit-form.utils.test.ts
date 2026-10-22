import { describe, expect, it } from 'vitest';

import { DEFAULT_EXIT_FORM_VALUES } from '../../../types/exit-form';
import { calculateExit, formatDate, suggestExitPath } from './exit-form.calculations';
import { defaultsToValues, recordToValues, valuesToPayload } from './exit-form.mappers';

describe('calculateExit', () => {
  it('matches the API calculation', () => {
    const calc = calculateExit(
      {
        ExitDate: '2026-04-01',
        CLLEANotificationDate: '2025-11-01',
        TransitionMeeting: '2025-12-15',
        TransitionPlanCompleted: '2025-10-01',
      },
      '2023-04-10T00:00:00.000Z',
    );

    expect(calc).toEqual({
      thirdBirthday: '2026-04-10',
      daysLEANotificationBeforeExit: 151,
      daysTransitionConferenceBeforeExit: 107,
      daysTransitionPlanBeforeExit: 182,
      daysExitBeforeThirdBirthday: 9,
      leaNotificationWindowMet: true,
      transitionConferenceWindowMet: true,
      transitionPlanWindowMet: false,
    });
  });

  it('suggests the exit path from the exit date', () => {
    expect(suggestExitPath('2026-04-01', '2023-04-10')).toBe('atAge3');
    expect(suggestExitPath('2025-01-01', '2023-04-10')).toBe('prior');
    expect(suggestExitPath('', '2023-04-10')).toBe('');
  });

  it('formats dates for display', () => {
    expect(formatDate('2026-04-01T00:00:00.000Z')).toBe('04/01/2026');
    expect(formatDate(null)).toBe('—');
  });
});

describe('record ↔ form values', () => {
  it('reads a legacy record (unused exit path stored as 0)', () => {
    const values = recordToValues({
      Region: 2,
      ReferralDate: '2025-02-15T00:00:00.000Z',
      ExitDate: '2026-04-01T00:00:00.000Z',
      TransitionPlanCompleted: '2025-12-01T00:00:00.000Z',
      // columns no longer on the form are ignored
      SU_id: 12,
      Town: '001',
      Notified90Days: -1,
      ExitPriorToAge3: 0,
      ExitAtAge3: 4,
      EXFNoPartB2: true,
      ReferredTo: 99,
    });

    expect(values).toEqual({
      Region: 2,
      ReferralDate: '2025-02-15',
      ExitDate: '2026-04-01',
      TransitionPlanCompleted: '2025-12-01',
      CLLEANotificationDate: '',
      TransitionMeeting: '',
      exitPath: 'atAge3',
      ExitPriorToAge3: '',
      MovedOtherRegion: '',
      ExitAtAge3: '4',
      EXFNoPartB1: false,
      EXFNoPartB2: true,
      EXFNoPartB3: false,
      ReferredTo: '99',
    });
  });

  it('prefills a new form with only the region and referral date', () => {
    const values = defaultsToValues(
      { Region: 3, ReferralDate: '2025-02-15', previousFormType: 'Active', warnings: [] },
      1,
    );

    expect(values).toEqual({ ...DEFAULT_EXIT_FORM_VALUES, Region: 3, ReferralDate: '2025-02-15' });
    expect(defaultsToValues(null, 1).Region).toBe(1);
  });

  it('sends only the fields on the form and only the chosen exit path', () => {
    const payload = valuesToPayload({
      ...DEFAULT_EXIT_FORM_VALUES,
      Region: 1,
      ReferralDate: '2024-10-01',
      ExitDate: '2025-01-01',
      exitPath: 'prior',
      ExitPriorToAge3: '2',
      MovedOtherRegion: ' Rutland ',
      ExitAtAge3: '4',
      EXFNoPartB1: true,
      ReferredTo: '5',
    });

    expect(payload).toEqual({
      Region: 1,
      ReferralDate: '2024-10-01',
      ExitDate: '2025-01-01',
      TransitionPlanCompleted: null,
      CLLEANotificationDate: null,
      TransitionMeeting: null,
      ExitPriorToAge3: 2,
      MovedOtherRegion: 'Rutland',
      ExitAtAge3: null,
      EXFNoPartB1: false,
      EXFNoPartB2: false,
      EXFNoPartB3: false,
      ReferredTo: 5,
    });
  });
});
