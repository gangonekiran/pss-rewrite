import { describe, expect, it } from 'vitest';

import { DEFAULT_EXIT_FORM_VALUES } from '../../../types/exit-form';
import { defaultsToValues, recordToValues, valuesToPayload } from './exit-form.mappers';

describe('recordToValues', () => {
  it('reads a legacy record (unused exit path stored as 0)', () => {
    const values = recordToValues({
      Region: 2,
      ReferralDate: '2025-02-15T00:00:00.000Z',
      ExitDate: '2026-04-01T00:00:00.000Z',
      TransitionPlanCompleted: '2025-12-01T00:00:00.000Z',
      TransitionPlanReason: 'Family circumstance: parent ill',
      // columns no longer on the form are ignored
      SU_id: 12,
      Town: '001',
      Notified90Days: -1,
      EXFNoPartB2: true,
      ExitPriorToAge3: 0,
      ExitAtAge3: 4,
      ReferredTo: 99,
    });

    expect(values).toEqual({
      Region: 2,
      ReferralDate: '2025-02-15',
      ExitDate: '2026-04-01',
      TransitionPlanCompleted: '2025-12-01',
      TransitionPlanReason: 'Family circumstance: parent ill',
      CLLEANotificationDate: '',
      TransitionMeeting: '',
      exitPath: 'atAge3',
      ExitPriorToAge3: '',
      MovedOtherRegion: '',
      ExitAtAge3: '4',
      ReferredTo: '99',
    });
  });

  it('reads an exit prior to age 3', () => {
    const values = recordToValues({
      Region: 1,
      ExitDate: '2025-06-01',
      ExitPriorToAge3: 2,
      MovedOtherRegion: 'Rutland',
      ExitAtAge3: 0,
      ReferredTo: 5,
    });

    expect(values).toMatchObject({
      exitPath: 'prior',
      ExitPriorToAge3: '2',
      MovedOtherRegion: 'Rutland',
      ExitAtAge3: '',
      ReferredTo: '5',
    });
  });

  it('has no exit path when neither code is set', () => {
    expect(recordToValues({ ExitPriorToAge3: null, ExitAtAge3: null }).exitPath).toBe('');
    expect(recordToValues({ ExitPriorToAge3: 0, ExitAtAge3: 0 }).exitPath).toBe('');
  });

  it('reads the transition plan delay reason', () => {
    expect(
      recordToValues({ TransitionPlanReason: 'Family circumstance: illness' }).TransitionPlanReason,
    ).toBe('Family circumstance: illness');
  });

  it('fills blanks for an empty record', () => {
    expect(recordToValues({})).toEqual(DEFAULT_EXIT_FORM_VALUES);
  });

  it('treats unreadable codes as not chosen', () => {
    expect(recordToValues({ ReferredTo: 'abc' as unknown as number }).ReferredTo).toBe('');
  });
});

describe('defaultsToValues', () => {
  it('prefills a new form with only the region and referral date', () => {
    expect(defaultsToValues({ Region: 3, ReferralDate: '2025-02-15' }, 1)).toEqual({
      ...DEFAULT_EXIT_FORM_VALUES,
      Region: 3,
      ReferralDate: '2025-02-15',
    });
    expect(defaultsToValues(null, 1).Region).toBe(1);
  });

  it('falls back to region 0 without defaults or a client region', () => {
    expect(defaultsToValues(null, null)).toEqual(DEFAULT_EXIT_FORM_VALUES);
  });

  it('uses the client region when the defaults have none', () => {
    expect(defaultsToValues({ Region: null, ReferralDate: null }, 4).Region).toBe(4);
  });

  it('reads an ISO referral date', () => {
    expect(
      defaultsToValues({ Region: 1, ReferralDate: '2025-02-15T00:00:00.000Z' }, 1).ReferralDate,
    ).toBe('2025-02-15');
  });
});

describe('valuesToPayload', () => {
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
      ReferredTo: '5',
    });

    expect(payload).toEqual({
      Region: 1,
      ReferralDate: '2024-10-01',
      ExitDate: '2025-01-01',
      TransitionPlanCompleted: null,
      TransitionPlanReason: null,
      CLLEANotificationDate: null,
      TransitionMeeting: null,
      ExitPriorToAge3: 2,
      MovedOtherRegion: 'Rutland',
      ExitAtAge3: null,
      ReferredTo: 5,
    });
  });

  it('sends only the at-age-3 answers for an exit at age 3', () => {
    const payload = valuesToPayload({
      ...DEFAULT_EXIT_FORM_VALUES,
      Region: 1,
      ExitDate: '2026-04-01',
      TransitionPlanCompleted: '2025-10-01',
      CLLEANotificationDate: '2025-11-01',
      TransitionMeeting: '2025-12-15',
      exitPath: 'atAge3',
      ExitPriorToAge3: '2',
      MovedOtherRegion: 'Rutland',
      TransitionPlanReason: '  Provider circumstance: staffing  ',
      ExitAtAge3: '4',
      ReferredTo: '99',
    });

    expect(payload).toEqual({
      Region: 1,
      ReferralDate: null,
      ExitDate: '2026-04-01',
      TransitionPlanCompleted: '2025-10-01',
      TransitionPlanReason: 'Provider circumstance: staffing',
      CLLEANotificationDate: '2025-11-01',
      TransitionMeeting: '2025-12-15',
      ExitPriorToAge3: null,
      MovedOtherRegion: null,
      ExitAtAge3: 4,
      ReferredTo: 99,
    });
  });

  it('never sends the removed no-Part-B reasons, so stored values are kept', () => {
    const payload = valuesToPayload({
      ...DEFAULT_EXIT_FORM_VALUES,
      exitPath: 'atAge3',
      ExitAtAge3: '4',
    });

    expect(payload).not.toHaveProperty('EXFNoPartB1');
    expect(payload).not.toHaveProperty('EXFNoPartB2');
    expect(payload).not.toHaveProperty('EXFNoPartB3');
  });

  it('sends a blank delay reason as null', () => {
    expect(
      valuesToPayload({ ...DEFAULT_EXIT_FORM_VALUES, TransitionPlanReason: '  ' })
        .TransitionPlanReason,
    ).toBeNull();
  });

  it('sends a blank Region Moved To as null', () => {
    const payload = valuesToPayload({
      ...DEFAULT_EXIT_FORM_VALUES,
      exitPath: 'prior',
      ExitPriorToAge3: '2',
      MovedOtherRegion: '   ',
    });

    expect(payload.MovedOtherRegion).toBeNull();
  });

  it('sends null codes when nothing is chosen', () => {
    expect(valuesToPayload(DEFAULT_EXIT_FORM_VALUES)).toMatchObject({
      ExitPriorToAge3: null,
      ExitAtAge3: null,
      ReferredTo: null,
    });
  });
});
