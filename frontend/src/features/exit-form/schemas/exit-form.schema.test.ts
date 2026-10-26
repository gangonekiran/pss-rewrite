import { describe, expect, it } from 'vitest';

import { DEFAULT_EXIT_FORM_VALUES, type ExitFormValues } from '../../../types/exit-form';
import { createExitFormSchema } from './exit-form.schema';

const DOB = '2023-04-10T00:00:00.000Z';

const prior: ExitFormValues = {
  ...DEFAULT_EXIT_FORM_VALUES,
  Region: 2,
  ReferralDate: '2025-02-15',
  ExitDate: '2025-06-01',
  exitPath: 'prior',
  ExitPriorToAge3: '1',
};

const atAge3: ExitFormValues = {
  ...DEFAULT_EXIT_FORM_VALUES,
  Region: 2,
  ReferralDate: '2025-02-15',
  ExitDate: '2026-04-01',
  TransitionPlanCompleted: '2025-10-01',
  CLLEANotificationDate: '2025-11-01',
  TransitionMeeting: '2025-12-15',
  exitPath: 'atAge3',
  ExitAtAge3: '1',
  ReferredTo: '1',
};

/** Field → first error message, for the values given. */
function errors(values: ExitFormValues, dob: unknown = DOB) {
  const result = createExitFormSchema(dob).safeParse(values);
  if (result.success) return {};

  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message;
  }
  return out;
}

describe('createExitFormSchema - valid forms', () => {
  it('should accept an exit prior to age 3', () => {
    expect(errors(prior)).toEqual({});
  });

  it('should accept an exit at age 3', () => {
    expect(errors(atAge3)).toEqual({});
  });

  it('should accept a form without a DOB', () => {
    expect(errors(prior, null)).toEqual({});
  });

  it('should not require Referred To or transition dates prior to age 3', () => {
    expect(errors({ ...prior, ReferredTo: '' })).toEqual({});
  });
});

describe('createExitFormSchema - General Information', () => {
  it('should require a region', () => {
    expect(errors({ ...prior, Region: 0 })).toMatchObject({ Region: 'Region is required.' });
  });

  it('should reject a region that is not a number (empty select with valueAsNumber)', () => {
    expect(errors({ ...prior, Region: Number.NaN })).toHaveProperty('Region');
  });

  it('should require the referral date', () => {
    expect(errors({ ...prior, ReferralDate: '' })).toMatchObject({
      ReferralDate: 'Date of Referral is required.',
    });
  });

  it('should require the exit date', () => {
    expect(errors({ ...prior, ExitDate: '' })).toMatchObject({
      ExitDate: 'Date of Exit is required.',
    });
  });

  it.each(['2025-13-01', '2025-6-1', '06/01/2025', 'abc'])(
    'should reject the invalid date %s',
    (date) => {
      expect(errors({ ...prior, ExitDate: date })).toMatchObject({
        ExitDate: 'Enter a valid date.',
      });
    },
  );
});

describe('createExitFormSchema - date order', () => {
  it.each([
    ['ReferralDate', 'Date of Referral'],
    ['ExitDate', 'Date of Exit'],
    ['TransitionPlanCompleted', 'Date Written Transition Plan'],
    ['CLLEANotificationDate', 'LEA Notification Date'],
    ['TransitionMeeting', 'Date of Transition Conference'],
  ] as const)('should reject %s before the date of birth', (field, label) => {
    expect(errors({ ...prior, ReferralDate: '2023-01-01', [field]: '2023-04-09' })).toMatchObject({
      [field]: `${label} cannot be before Date of Birth.`,
    });
  });

  it('should allow dates on the date of birth', () => {
    expect(errors({ ...prior, ReferralDate: '2023-04-10' })).toEqual({});
  });

  it('should reject an exit before the referral', () => {
    expect(errors({ ...prior, ExitDate: '2025-02-14' })).toMatchObject({
      ExitDate: 'Date of Exit cannot be before Date of Referral.',
    });
  });

  it('should allow an exit on the referral date', () => {
    expect(errors({ ...prior, ExitDate: '2025-02-15' })).toEqual({});
  });

  it.each(['TransitionPlanCompleted', 'CLLEANotificationDate', 'TransitionMeeting'] as const)(
    'should reject %s after the exit date',
    (field) => {
      expect(errors({ ...atAge3, [field]: '2026-04-02' })).toMatchObject({
        [field]: 'Cannot be after Date of Exit.',
      });
    },
  );

  it.each([
    ['TransitionPlanCompleted', 'Date Written Transition Plan'],
    ['CLLEANotificationDate', 'LEA Notification Date'],
  ] as const)('should reject %s before the referral date', (field, label) => {
    expect(errors({ ...atAge3, [field]: '2025-02-14' })).toMatchObject({
      [field]: `${label} cannot be before Date of Referral.`,
    });
  });

  it('should allow the transition plan and LEA dates on the referral date', () => {
    expect(
      errors({
        ...atAge3,
        TransitionPlanCompleted: '2025-02-15',
        CLLEANotificationDate: '2025-02-15',
      }),
    ).toEqual({});
  });

  it('should allow a transition conference before the referral date', () => {
    expect(errors({ ...atAge3, TransitionMeeting: '2025-02-01' })).toEqual({});
  });

  it('should allow transition dates on the exit date', () => {
    expect(errors({ ...atAge3, TransitionMeeting: '2026-04-01' })).toEqual({});
  });
});

describe('createExitFormSchema - Exit Details', () => {
  it('should require the exit path', () => {
    expect(errors({ ...prior, exitPath: '' })).toMatchObject({
      exitPath: 'Choose when the child exited.',
    });
  });

  it('should require a reason prior to age 3', () => {
    expect(errors({ ...prior, ExitPriorToAge3: '' })).toMatchObject({
      ExitPriorToAge3: 'Select the reason for exit.',
    });
  });

  it('should limit Region Moved To to 255 characters', () => {
    expect(errors({ ...prior, ExitPriorToAge3: '2', MovedOtherRegion: 'x'.repeat(255) })).toEqual(
      {},
    );
    expect(
      errors({ ...prior, ExitPriorToAge3: '2', MovedOtherRegion: 'x'.repeat(256) }),
    ).toMatchObject({
      MovedOtherRegion: 'Use 255 characters or fewer.',
    });
  });

  it('should require the outcome at age 3', () => {
    expect(errors({ ...atAge3, ExitAtAge3: '' })).toMatchObject({
      ExitAtAge3: 'Select an option.',
    });
  });

  it('should require Referred To at age 3', () => {
    expect(errors({ ...atAge3, ReferredTo: '' })).toMatchObject({
      ReferredTo: 'Select where the child was referred.',
    });
  });

  it('should require the three transition dates at age 3', () => {
    expect(
      errors({
        ...atAge3,
        TransitionPlanCompleted: '',
        CLLEANotificationDate: '',
        TransitionMeeting: '',
      }),
    ).toMatchObject({
      TransitionPlanCompleted: 'Date Written Transition Plan is required.',
      CLLEANotificationDate: 'LEA Notification Date is required.',
      TransitionMeeting: 'Date of Transition Conference is required.',
    });
  });

  it("should ignore the other path's answers", () => {
    expect(errors({ ...prior, ExitAtAge3: '', ReferredTo: '' })).toEqual({});
    expect(errors({ ...atAge3, ExitPriorToAge3: '' })).toEqual({});
  });
});
