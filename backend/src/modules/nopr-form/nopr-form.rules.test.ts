import { describe, expect, it } from 'vitest';

import {
  applyFormDate,
  checkRetiredReason,
  normalizePayload,
  validateRecord,
} from './nopr-form.rules.js';

const DOB = '2024-03-10';
const REFERRAL = '2026-01-05';

const valid = {
  Region: 3,
  RefStatus: 4,
  InitialEvalDate: '2026-01-20',
  StatusDate: '2026-02-02',
};

describe('normalizePayload', () => {
  it('types each column and drops unknown, legacy and calculated keys', () => {
    expect(
      normalizePayload({
        Region: '3',
        RefStatus: 8,
        InitialEvalDate: '2026-01-20',
        StatusDate: '2026-02-02',
        FormDate: '2020-01-01',
        FormType: 'Other',
        MonthReporting: 5,
        Screening: 2,
        ReferredBack: true,
        ID: 9,
        ChildID: 5,
        LastUpdateUser: 'x',
      }),
    ).toEqual({ Region: 3, RefStatus: 8, InitialEvalDate: '2026-01-20', StatusDate: '2026-02-02' });
  });

  it('only returns the keys that were sent', () => {
    expect(normalizePayload({ RefStatus: 2 })).toEqual({ RefStatus: 2 });
  });

  it('treats blank values as null and skips undefined', () => {
    expect(normalizePayload({ InitialEvalDate: '', Region: null, RefStatus: undefined })).toEqual({
      InitialEvalDate: null,
      Region: null,
    });
  });

  it('handles a missing body', () => {
    expect(normalizePayload(undefined as unknown as Record<string, unknown>)).toEqual({});
  });

  it('accepts the retired reason (checked separately)', () => {
    expect(normalizePayload({ RefStatus: 7 })).toEqual({ RefStatus: 7 });
  });

  it.each([
    [{ StatusDate: '02/02/2026' }, 'StatusDate must use YYYY-MM-DD format'],
    [{ InitialEvalDate: '2026-02-30' }, 'InitialEvalDate must be a valid date'],
    [{ Region: 'abc' }, 'Region must be a whole number'],
    [{ RefStatus: 9 }, 'RefStatus has an unknown value: 9'],
  ])('rejects %j', (body, message) => {
    expect(() => normalizePayload(body)).toThrow(message);
  });
});

describe('checkRetiredReason', () => {
  it('lets a form keep the retired reason it already has', () => {
    expect(() => checkRetiredReason({ RefStatus: 7 }, 7)).not.toThrow();
  });

  it('rejects changing a form to the retired reason', () => {
    expect(() => checkRetiredReason({ RefStatus: 7 }, 4)).toThrow(
      '"Turned 3 during evaluation process" is no longer used; choose another reason',
    );
  });

  it('rejects the retired reason on a new form', () => {
    expect(() => checkRetiredReason({ RefStatus: 7 }, undefined)).toThrow('is no longer used');
  });

  it.each([{ RefStatus: 8 }, {}, { RefStatus: null }])('allows %j', (p) => {
    expect(() => checkRetiredReason(p, 7)).not.toThrow();
  });
});

describe('applyFormDate', () => {
  it('sets FormDate to the status date', () => {
    const p: Record<string, unknown> = { StatusDate: '2026-02-02' };
    applyFormDate(p);
    expect(p.FormDate).toBe('2026-02-02');
  });

  it('follows a cleared status date', () => {
    const p: Record<string, unknown> = { StatusDate: null };
    applyFormDate(p);
    expect(p.FormDate).toBeNull();
  });

  it('leaves FormDate alone when the status date is not sent', () => {
    const p: Record<string, unknown> = { RefStatus: 2 };
    applyFormDate(p);
    expect(p).toEqual({ RefStatus: 2 });
  });
});

describe('validateRecord', () => {
  it('accepts a complete form', () => {
    expect(() => validateRecord(valid, DOB, REFERRAL)).not.toThrow();
  });

  it('accepts a form without a Date of Initial Evaluation', () => {
    expect(() => validateRecord({ ...valid, InitialEvalDate: null }, DOB, REFERRAL)).not.toThrow();
  });

  it('works without a date of birth or a referral', () => {
    expect(() => validateRecord(valid, null, null)).not.toThrow();
  });

  it('accepts a status date on the referral date', () => {
    expect(() => validateRecord({ ...valid, StatusDate: REFERRAL, InitialEvalDate: null }, DOB, REFERRAL)).not.toThrow();
  });

  it('accepts Date of Initial Evaluation on the status date', () => {
    expect(() =>
      validateRecord({ ...valid, InitialEvalDate: '2026-02-02' }, DOB, REFERRAL),
    ).not.toThrow();
  });

  it.each([
    [{ Region: null }, 'Region must be selected'],
    [{ Region: undefined }, 'Region must be selected'],
    [{ RefStatus: null }, 'Select the reason a plan was not created'],
    [{ StatusDate: null }, 'Date above status was determined is required'],
  ])('requires %j', (change, message) => {
    expect(() => validateRecord({ ...valid, ...change }, DOB, REFERRAL)).toThrow(message);
  });

  it('rejects a status date before the date of birth', () => {
    expect(() =>
      validateRecord({ ...valid, StatusDate: '2024-01-01', InitialEvalDate: null }, DOB, null),
    ).toThrow('Date above status was determined cannot be before Date of Birth');
  });

  it('rejects a status date before the most recent referral date', () => {
    expect(() =>
      validateRecord({ ...valid, StatusDate: '2025-12-15', InitialEvalDate: null }, DOB, REFERRAL),
    ).toThrow(
      'Date above status was determined cannot be before the most recent referral date (01/05/2026)',
    );
  });

  it('reads the referral date as returned by the database', () => {
    expect(() =>
      validateRecord({ ...valid, StatusDate: '2026-01-04', InitialEvalDate: null }, DOB, '2026-01-05 00:00:00'),
    ).toThrow('most recent referral date (01/05/2026)');
  });

  it('rejects a Date of Initial Evaluation before the date of birth', () => {
    expect(() => validateRecord({ ...valid, InitialEvalDate: '2024-01-01' }, DOB, REFERRAL)).toThrow(
      'Date of Initial Evaluation cannot be before Date of Birth',
    );
  });

  it('rejects a Date of Initial Evaluation after the status date', () => {
    expect(() => validateRecord({ ...valid, InitialEvalDate: '2026-02-03' }, DOB, REFERRAL)).toThrow(
      'Date of Initial Evaluation cannot be after the date the status was determined',
    );
  });
});
