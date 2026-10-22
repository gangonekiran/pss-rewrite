import { z } from 'zod';

import type { ExitFormValues } from '../../../types/exit-form';
import { toDateInput } from '../utils/exit-form.calculations';

const date = z
  .string()
  .refine(
    (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))),
    'Enter a valid date.',
  );

const DATE_LABELS: Array<[keyof ExitFormValues, string]> = [
  ['ReferralDate', 'Date of Referral'],
  ['ExitDate', 'Date of Exit'],
  ['TransitionPlanCompleted', 'Date Written Transition Plan'],
  ['CLLEANotificationDate', 'Date LEA Notified'],
  ['TransitionMeeting', 'Date of Transition Conference'],
];

const TRANSITION_DATES: Array<keyof ExitFormValues> = [
  'TransitionPlanCompleted',
  'CLLEANotificationDate',
  'TransitionMeeting',
];

/**
 * Field-level rules plus the cross-field rules the API also enforces.
 * Transition dates are only required for children exiting at age 3.
 */
export function createExitFormSchema(dob: unknown) {
  const dobDate = toDateInput(dob);

  return z
    .object({
      Region: z.number().int().min(1, 'Region is required.'),
      ReferralDate: date.refine(Boolean, 'Date of Referral is required.'),
      ExitDate: date.refine(Boolean, 'Date of Exit is required.'),

      TransitionPlanCompleted: date,
      CLLEANotificationDate: date,
      TransitionMeeting: date,

      exitPath: z.enum(['', 'prior', 'atAge3']),
      ExitPriorToAge3: z.string(),
      MovedOtherRegion: z.string().max(255, 'Use 255 characters or fewer.'),
      ExitAtAge3: z.string(),
      EXFNoPartB1: z.boolean(),
      EXFNoPartB2: z.boolean(),
      EXFNoPartB3: z.boolean(),
      ReferredTo: z.string(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof ExitFormValues, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      for (const [field, label] of DATE_LABELS) {
        const value = v[field] as string;
        if (dobDate && value && value < dobDate) issue(field, `${label} cannot be before Date of Birth.`);
      }

      if (v.ExitDate && v.ReferralDate && v.ExitDate < v.ReferralDate) {
        issue('ExitDate', 'Date of Exit cannot be before Date of Referral.');
      }

      for (const field of TRANSITION_DATES) {
        const value = v[field] as string;
        if (v.ExitDate && value && value > v.ExitDate) issue(field, 'Cannot be after Date of Exit.');
      }

      if (!v.exitPath) issue('exitPath', 'Choose when the child exited.');
      if (v.exitPath === 'prior' && !v.ExitPriorToAge3) issue('ExitPriorToAge3', 'Select the reason for exit.');

      if (v.exitPath === 'atAge3') {
        if (!v.ExitAtAge3) issue('ExitAtAge3', 'Select an option.');
        if (!v.ReferredTo) issue('ReferredTo', 'Select where the child was referred.');
        if (!v.TransitionPlanCompleted) issue('TransitionPlanCompleted', 'Date Written Transition Plan is required.');
        if (!v.CLLEANotificationDate) issue('CLLEANotificationDate', 'Date LEA Notified is required.');
        if (!v.TransitionMeeting) issue('TransitionMeeting', 'Date of Transition Conference is required.');
      }
    });
}
