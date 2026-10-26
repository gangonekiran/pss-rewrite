import { describe, expect, it } from 'vitest';

import {
  applyExitPath,
  clearDependentFields,
  error,
  normalizePayload,
  toIsoDate,
  validateRecord,
} from './exit-form.rules.js';
import type { ExitFormRecord } from './exit-form.types.js';

describe('Exit Form Rules - error', () => {
  it('should throw an error with a 400 status by default', () => {
    expect(() => error('Bad input')).toThrow('Bad input');

    try {
      error('Bad input');
    } catch (e) {
      expect((e as { status: number }).status).toBe(400);
    }
  });

  it('should throw an error with the given status', () => {
    try {
      error('Not found', 404);
    } catch (e) {
      expect((e as { status: number }).status).toBe(404);
    }
  });
});

describe('Exit Form Rules - toIsoDate', () => {
  it('should return null for blank values', () => {
    expect(toIsoDate(undefined)).toBeNull();
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate('')).toBeNull();
    expect(toIsoDate('   ')).toBeNull();
  });

  it('should read YYYY-MM-DD strings and ISO timestamps', () => {
    expect(toIsoDate('2025-06-01')).toBe('2025-06-01');
    expect(toIsoDate('2025-06-01T00:00:00.000Z')).toBe('2025-06-01');
    expect(toIsoDate(' 2025-06-01 ')).toBe('2025-06-01');
  });

  it('should read Date objects in UTC', () => {
    expect(toIsoDate(new Date('2025-06-01T00:00:00Z'))).toBe('2025-06-01');
  });

  it('should return null for invalid dates and other formats', () => {
    expect(toIsoDate(new Date('not a date'))).toBeNull();
    expect(toIsoDate('06/01/2025')).toBeNull();
  });
});

describe('Exit Form Rules - normalizePayload', () => {
  it('should ignore status, which is no longer on the form', () => {
    expect(normalizePayload({ status: 'exit-capta' })).toEqual({});
  });

  it("should not change the caller's body", () => {
    const body = { ExitDate: '2025-06-01', Unknown: 'x' };
    normalizePayload(body);
    expect(body).toEqual({ ExitDate: '2025-06-01', Unknown: 'x' });
  });

  it('should return an empty object for an empty or missing body', () => {
    expect(normalizePayload({})).toEqual({});
    expect(normalizePayload(undefined as unknown as ExitFormRecord)).toEqual({});
  });

  it('should drop unknown keys, ID, ChildID, audit columns and undefined values', () => {
    const result = normalizePayload({
      ID: 5,
      ChildID: 123,
      InsertDate: '2025-01-01',
      LastUpdateUser: 'someone',
      Unknown: 'x',
      Region: undefined,
      ExitDate: '2025-06-01',
    });

    expect(result).toEqual({ ExitDate: '2025-06-01' });
  });

  it('should never return FormType, which is always saved as Exit', () => {
    expect(normalizePayload({ FormType: 'Active' })).toEqual({});
  });

  describe('dates', () => {
    it('should keep valid YYYY-MM-DD dates', () => {
      expect(normalizePayload({ ExitDate: '2025-06-01' })).toEqual({ ExitDate: '2025-06-01' });
    });

    it('should convert Date objects', () => {
      expect(normalizePayload({ ExitDate: new Date('2025-06-01T00:00:00Z') })).toEqual({
        ExitDate: '2025-06-01',
      });
    });

    it('should store blank dates as null', () => {
      expect(normalizePayload({ ExitDate: '', TransitionMeeting: null })).toEqual({
        ExitDate: null,
        TransitionMeeting: null,
      });
    });

    it('should reject dates in another format', () => {
      expect(() => normalizePayload({ ExitDate: '06/01/2025' })).toThrow(
        'ExitDate must use YYYY-MM-DD format',
      );
      expect(() => normalizePayload({ ExitDate: '2025-06-01T00:00:00Z' })).toThrow(
        'ExitDate must use YYYY-MM-DD format',
      );
    });

    it('should reject dates that do not exist', () => {
      expect(() => normalizePayload({ ExitDate: '2025-02-30' })).toThrow(
        'ExitDate must be a valid date',
      );
      expect(() => normalizePayload({ ReferralDate: '2025-13-01' })).toThrow(
        'ReferralDate must be a valid date',
      );
    });
  });

  describe('whole numbers', () => {
    it('should convert numeric strings to numbers', () => {
      expect(normalizePayload({ Region: '2', SU_id: 7 })).toEqual({ Region: 2, SU_id: 7 });
    });

    it('should store blank numbers as null', () => {
      expect(normalizePayload({ Region: '', SU_id: null })).toEqual({ Region: null, SU_id: null });
    });

    it('should reject values that are not whole numbers', () => {
      expect(() => normalizePayload({ Region: 'abc' })).toThrow('Region must be a whole number');
      expect(() => normalizePayload({ Region: 1.5 })).toThrow('Region must be a whole number');
    });
  });

  describe('Yes/No columns', () => {
    it.each([true, -1, 1, '-1', '1', 'yes', 'Y', 'TRUE'])('should store %s as -1 (Yes)', (value) => {
      expect(normalizePayload({ CAPTA: value })).toEqual({ CAPTA: -1 });
    });

    it.each([false, 0, '0', 'no', 'N', 'false'])('should store %s as 0 (No)', (value) => {
      expect(normalizePayload({ CAPTA: value })).toEqual({ CAPTA: 0 });
    });

    it('should store blank as null', () => {
      expect(normalizePayload({ Notified90Days: '' })).toEqual({ Notified90Days: null });
    });

    it('should reject other values', () => {
      expect(() => normalizePayload({ Notified90Days: 'maybe' })).toThrow(
        'Notified90Days must be Yes or No',
      );
    });
  });

  describe('bit columns', () => {
    it.each([true, 1, -1, '1', '-1', 'true', 'yes'])('should store %s as true', (value) => {
      expect(normalizePayload({ EXFNoPartB1: value })).toEqual({ EXFNoPartB1: true });
    });

    it.each([false, 0, '0', 'false', 'no', '', null])('should store %s as false', (value) => {
      expect(normalizePayload({ EXFNoPartB1: value })).toEqual({ EXFNoPartB1: false });
    });

    it('should reject other values', () => {
      expect(() => normalizePayload({ EXFNoPartB2: 'maybe' })).toThrow(
        'EXFNoPartB2 must be true or false',
      );
    });
  });

  describe('text columns', () => {
    it('should trim text', () => {
      expect(normalizePayload({ MovedOtherRegion: '  Rutland  ' })).toEqual({
        MovedOtherRegion: 'Rutland',
      });
    });

    it('should store blank text as null', () => {
      expect(normalizePayload({ MovedOtherRegion: '   ' })).toEqual({ MovedOtherRegion: null });
    });

    it('should accept text up to the column length', () => {
      expect(normalizePayload({ Town: '001' })).toEqual({ Town: '001' });
    });

    it('should reject text longer than the column', () => {
      expect(() => normalizePayload({ Town: '0001' })).toThrow('Town must be 3 characters or fewer');
      expect(() => normalizePayload({ MovedOtherRegion: 'x'.repeat(256) })).toThrow(
        'MovedOtherRegion must be 255 characters or fewer',
      );
    });

    it('should allow long text in columns without a limit', () => {
      const reason = 'x'.repeat(1000);
      expect(normalizePayload({ TransitionPlanReason: reason })).toEqual({
        TransitionPlanReason: reason,
      });
    });
  });

  describe('code lists', () => {
    it('should accept the Non-EI and Referral to CIS-EI codes', () => {
      expect(normalizePayload({ ExitPriorToAge3: 7 })).toEqual({ ExitPriorToAge3: 7 });
      expect(normalizePayload({ ExitPriorToAge3: 8 })).toEqual({ ExitPriorToAge3: 8 });
    });

    it('should accept known codes', () => {
      expect(normalizePayload({ ExitPriorToAge3: 2, ExitAtAge3: 4, ReferredTo: 99 })).toEqual({
        ExitPriorToAge3: 2,
        ExitAtAge3: 4,
        ReferredTo: 99,
      });
    });

    it('should accept 0 for the unused exit path', () => {
      expect(normalizePayload({ ExitPriorToAge3: 0, ExitAtAge3: 0 })).toEqual({
        ExitPriorToAge3: 0,
        ExitAtAge3: 0,
      });
    });

    it('should accept null codes', () => {
      expect(normalizePayload({ ExitPriorToAge3: null, ReferredTo: '' })).toEqual({
        ExitPriorToAge3: null,
        ReferredTo: null,
      });
    });

    it('should reject an unknown ExitPriorToAge3', () => {
      expect(() => normalizePayload({ ExitPriorToAge3: 9 })).toThrow(
        'ExitPriorToAge3 has an unknown value: 9',
      );
    });

    it('should reject an unknown ExitAtAge3', () => {
      expect(() => normalizePayload({ ExitAtAge3: 5 })).toThrow('ExitAtAge3 has an unknown value: 5');
    });

    it('should reject an unknown ReferredTo, including 0', () => {
      expect(() => normalizePayload({ ReferredTo: 6 })).toThrow('ReferredTo has an unknown value: 6');
      expect(() => normalizePayload({ ReferredTo: 0 })).toThrow('ReferredTo has an unknown value: 0');
    });
  });
});

describe('Exit Form Rules - applyExitPath', () => {
  it('should set ExitAtAge3 to 0 when a reason prior to age 3 is chosen', () => {
    const p: ExitFormRecord = { ExitPriorToAge3: 2 };
    applyExitPath(p);
    expect(p).toEqual({ ExitPriorToAge3: 2, ExitAtAge3: 0 });
  });

  it('should set ExitPriorToAge3 to 0 when an exit at age 3 outcome is chosen', () => {
    const p: ExitFormRecord = { ExitAtAge3: 1, ExitPriorToAge3: null };
    applyExitPath(p);
    expect(p).toEqual({ ExitAtAge3: 1, ExitPriorToAge3: 0 });
  });

  it('should leave both codes alone when both are chosen (validateRecord rejects it)', () => {
    const p: ExitFormRecord = { ExitPriorToAge3: 2, ExitAtAge3: 1 };
    applyExitPath(p);
    expect(p).toEqual({ ExitPriorToAge3: 2, ExitAtAge3: 1 });
  });

  it('should do nothing when no exit path is chosen', () => {
    const p: ExitFormRecord = { ExitDate: '2025-06-01' };
    applyExitPath(p);
    expect(p).toEqual({ ExitDate: '2025-06-01' });

    const zeros: ExitFormRecord = { ExitPriorToAge3: 0, ExitAtAge3: null };
    applyExitPath(zeros);
    expect(zeros).toEqual({ ExitPriorToAge3: 0, ExitAtAge3: null });
  });
});

describe('Exit Form Rules - clearDependentFields', () => {
  it('should keep MovedOtherRegion for "Moved to other region"', () => {
    const p: ExitFormRecord = { ExitPriorToAge3: 2, MovedOtherRegion: 'Rutland' };
    clearDependentFields(p);
    expect(p.MovedOtherRegion).toBe('Rutland');
  });

  it('should clear MovedOtherRegion for any other ExitPriorToAge3', () => {
    for (const code of [0, 1, 3, null]) {
      const p: ExitFormRecord = { ExitPriorToAge3: code, MovedOtherRegion: 'Rutland' };
      clearDependentFields(p);
      expect(p.MovedOtherRegion).toBeNull();
    }
  });

  it('should keep the no-Part-B reasons for "NOT eligible for Part B"', () => {
    const p: ExitFormRecord = { ExitAtAge3: 4, EXFNoPartB1: true, EXFNoPartB3: true };
    clearDependentFields(p);
    expect(p).toEqual({ ExitAtAge3: 4, EXFNoPartB1: true, EXFNoPartB3: true });
  });

  it('should clear the no-Part-B reasons for any other ExitAtAge3', () => {
    for (const code of [0, 1, 2, 3, null]) {
      const p: ExitFormRecord = { ExitAtAge3: code, EXFNoPartB1: true };
      clearDependentFields(p);
      expect(p).toEqual({
        ExitAtAge3: code,
        EXFNoPartB1: false,
        EXFNoPartB2: false,
        EXFNoPartB3: false,
      });
    }
  });

  it('should leave the fields alone when the answers are not part of the save', () => {
    const p: ExitFormRecord = { MovedOtherRegion: 'Rutland', EXFNoPartB1: true };
    clearDependentFields(p);
    expect(p).toEqual({ MovedOtherRegion: 'Rutland', EXFNoPartB1: true });
  });
});

describe('Exit Form Rules - validateRecord', () => {
  const dob = '2023-04-10T00:00:00.000Z';

  const valid: ExitFormRecord = {
    ReferralDate: '2025-02-15',
    ExitDate: '2026-04-01',
    TransitionPlanCompleted: '2025-10-01',
    CLLEANotificationDate: '2025-11-01',
    TransitionMeeting: '2025-12-15',
    ExitPriorToAge3: 0,
    ExitAtAge3: 1,
    ReferredTo: 1,
  };

  it('should accept a valid record', () => {
    expect(() => validateRecord(valid, dob)).not.toThrow();
  });

  it('should accept a record without dates or a DOB', () => {
    expect(() => validateRecord({}, null)).not.toThrow();
  });

  it.each([
    ['ReferralDate', 'Date of Referral'],
    ['ReReferralDate', 'Re-referral Date'],
    ['ExitDate', 'Date of Exit'],
    ['TransitionPlanCompleted', 'Date Written Transition Plan'],
    ['CLLEANotificationDate', 'LEA Notification Date'],
    ['TransitionMeeting', 'Date of Transition Conference'],
  ])('should reject %s before the date of birth', (field, label) => {
    expect(() => validateRecord({ [field]: '2023-04-09' }, dob)).toThrow(
      `${label} cannot be before Date of Birth`,
    );
  });

  it('should allow dates on the date of birth', () => {
    expect(() => validateRecord({ ReferralDate: '2023-04-10' }, dob)).not.toThrow();
  });

  it('should reject an exit date before the referral date', () => {
    expect(() =>
      validateRecord({ ReferralDate: '2025-02-15', ExitDate: '2025-02-14' }, dob),
    ).toThrow('Date of Exit cannot be before Date of Referral');
  });

  it('should allow an exit on the referral date', () => {
    expect(() =>
      validateRecord({ ReferralDate: '2025-02-15', ExitDate: '2025-02-15' }, dob),
    ).not.toThrow();
  });

  it.each([
    ['TransitionPlanCompleted', 'Date Written Transition Plan'],
    ['CLLEANotificationDate', 'LEA Notification Date'],
    ['TransitionMeeting', 'Date of Transition Conference'],
  ])('should reject %s after the exit date', (field, label) => {
    expect(() => validateRecord({ ExitDate: '2026-04-01', [field]: '2026-04-02' }, dob)).toThrow(
      `${label} cannot be after Date of Exit`,
    );
  });

  it.each([
    ['TransitionPlanCompleted', 'Date Written Transition Plan'],
    ['CLLEANotificationDate', 'LEA Notification Date'],
  ])('should reject %s before the referral date', (field, label) => {
    expect(() => validateRecord({ ReferralDate: '2025-02-15', [field]: '2025-02-14' }, dob)).toThrow(
      `${label} cannot be before Date of Referral`,
    );
  });

  it('should allow the transition plan and LEA dates on the referral date', () => {
    expect(() =>
      validateRecord(
        { ReferralDate: '2025-02-15', TransitionPlanCompleted: '2025-02-15', CLLEANotificationDate: '2025-02-15' },
        dob,
      ),
    ).not.toThrow();
  });

  it('should allow a transition conference before the referral date', () => {
    expect(() => validateRecord({ ReferralDate: '2025-02-15', TransitionMeeting: '2025-02-01' }, dob)).not.toThrow();
  });

  it('should allow a re-referral date after the exit date', () => {
    expect(() =>
      validateRecord({ ExitDate: '2026-04-01', ReReferralDate: '2026-05-01' }, dob),
    ).not.toThrow();
  });

  it('should read dates stored as ISO timestamps', () => {
    expect(() =>
      validateRecord(
        { ReferralDate: '2025-02-15T00:00:00.000Z', ExitDate: '2025-02-01T00:00:00.000Z' },
        dob,
      ),
    ).toThrow('Date of Exit cannot be before Date of Referral');
  });

  it('should reject both exit paths at once', () => {
    expect(() => validateRecord({ ExitPriorToAge3: 2, ExitAtAge3: 1 }, dob)).toThrow(
      'Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both',
    );
  });

  it('should require Referred To when the child is NOT eligible for Part B', () => {
    expect(() => validateRecord({ ExitPriorToAge3: 0, ExitAtAge3: 4, ReferredTo: null }, dob)).toThrow(
      'Referred To is required when the child is NOT eligible for Part B',
    );
  });

  it('should accept NOT eligible for Part B with a referral', () => {
    expect(() =>
      validateRecord({ ExitPriorToAge3: 0, ExitAtAge3: 4, ReferredTo: 99 }, dob),
    ).not.toThrow();
  });
});
