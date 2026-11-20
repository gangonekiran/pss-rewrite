import { describe, expect, it } from 'vitest';

import type { NoprFormValues } from '../../../types/nopr-form';
import { createNoprFormSchema } from './nopr-form.schema';

const DOB = '2024-03-10T00:00:00.000Z';
const REFERRAL = '2026-01-05';

const valid: NoprFormValues = {
  Region: 3,
  RefStatus: '4',
  InitialEvalDate: '2026-01-20',
  StatusDate: '2026-02-02',
};

/** Field → first error message, for the values given. */
function errors(values: NoprFormValues, dob: unknown = DOB, referral: unknown = REFERRAL) {
  const result = createNoprFormSchema(dob, referral).safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
}

describe('createNoprFormSchema', () => {
  it('accepts a complete form', () => {
    expect(errors(valid)).toEqual({});
  });

  it('accepts a form without a Date of Initial Evaluation', () => {
    expect(errors({ ...valid, InitialEvalDate: '' })).toEqual({});
  });

  it('works without a date of birth or a referral', () => {
    expect(errors(valid, null, null)).toEqual({});
  });

  it('requires Region, the reason and the status date', () => {
    expect(errors({ Region: 0, RefStatus: '', InitialEvalDate: '', StatusDate: '' })).toEqual({
      Region: 'Region is required.',
      RefStatus: 'Select the reason a plan was not created.',
      StatusDate: 'Date above status was determined is required.',
    });
  });

  it.each(['2026-02-30', '02/02/2026'])('rejects the invalid date %s', (value) => {
    expect(errors({ ...valid, StatusDate: value, InitialEvalDate: '' })).toEqual({
      StatusDate: 'Enter a valid date.',
    });
  });

  it('rejects a status date before the date of birth', () => {
    expect(errors({ ...valid, StatusDate: '2024-01-01', InitialEvalDate: '' }, DOB, null)).toEqual({
      StatusDate: 'Date above status was determined cannot be before Date of Birth.',
    });
  });

  it('rejects a status date before the most recent referral date', () => {
    expect(errors({ ...valid, StatusDate: '2025-12-15', InitialEvalDate: '' })).toEqual({
      StatusDate: 'Cannot be before the most recent referral date (01/05/2026).',
    });
  });

  it('accepts a status date on the referral date', () => {
    expect(errors({ ...valid, StatusDate: REFERRAL, InitialEvalDate: '' })).toEqual({});
  });

  it('rejects a Date of Initial Evaluation before the date of birth', () => {
    expect(errors({ ...valid, InitialEvalDate: '2024-01-01' })).toEqual({
      InitialEvalDate: 'Date of Initial Evaluation cannot be before Date of Birth.',
    });
  });

  it('rejects a Date of Initial Evaluation after the status date', () => {
    expect(errors({ ...valid, InitialEvalDate: '2026-02-03' })).toEqual({
      InitialEvalDate: 'Cannot be after the date the status was determined.',
    });
  });

  it('does not compare an invalid Date of Initial Evaluation', () => {
    expect(errors({ ...valid, InitialEvalDate: '2026-02-30' })).toEqual({
      InitialEvalDate: 'Enter a valid date.',
    });
  });

  it('only reports the missing status date when Date of Initial Evaluation is set', () => {
    expect(errors({ ...valid, StatusDate: '' })).toEqual({
      StatusDate: 'Date above status was determined is required.',
    });
  });
});
