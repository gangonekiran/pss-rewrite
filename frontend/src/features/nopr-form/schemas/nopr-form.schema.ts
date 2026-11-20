import { z } from 'zod';

import type { NoprFormValues } from '../../../types/nopr-form';
import { formatDate, isCalendarDate, toDateInput } from '../../../utils/date';

const date = z.string().refine((value) => !value || isCalendarDate(value), 'Enter a valid date.');

/**
 * Field-level rules plus the cross-field rules the API also enforces.
 * The status date can't be before the child's most recent referral date.
 */
export function createNoprFormSchema(dob: unknown, mostRecentReferral: unknown) {
  const dobDate = toDateInput(dob);
  const referral = toDateInput(mostRecentReferral);

  return z
    .object({
      Region: z.number().int().min(1, 'Region is required.'),
      RefStatus: z.string().min(1, 'Select the reason a plan was not created.'),
      InitialEvalDate: date,
      StatusDate: date.refine(Boolean, 'Date above status was determined is required.'),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof NoprFormValues, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      // Only compare dates that are real dates; an invalid one already has its own message.
      const statusDate = isCalendarDate(v.StatusDate) ? v.StatusDate : '';
      const evalDate = isCalendarDate(v.InitialEvalDate) ? v.InitialEvalDate : '';

      if (statusDate) {
        if (dobDate && statusDate < dobDate) {
          issue('StatusDate', 'Date above status was determined cannot be before Date of Birth.');
        } else if (referral && statusDate < referral) {
          issue(
            'StatusDate',
            `Cannot be before the most recent referral date (${formatDate(referral)}).`,
          );
        }
      }

      if (evalDate) {
        if (dobDate && evalDate < dobDate) {
          issue('InitialEvalDate', 'Date of Initial Evaluation cannot be before Date of Birth.');
        } else if (statusDate && evalDate > statusDate) {
          issue('InitialEvalDate', 'Cannot be after the date the status was determined.');
        }
      }
    });
}
