/**
 * Day counts and 3rd birthday for the Transition Information step,
 * updated while the user types. All dates are YYYY-MM-DD and compared in UTC.
 */
import type { ExitFormCalculated } from '../../../types/exit-form';
import { addToDate, daysBetween, toDateInput } from '../../../utils/date';

export function thirdBirthday(dob: unknown): string {
  const d = toDateInput(dob);
  return d ? addToDate(d, { years: 3 }) : '';
}

export function calculateExit(
  values: {
    ReferralDate: string;
    ExitDate: string;
    CLLEANotificationDate: string;
    TransitionMeeting: string;
    TransitionPlanCompleted: string;
  },
  dob: unknown,
): ExitFormCalculated {
  const birthday = thirdBirthday(dob);
  const exit = values.ExitDate;

  return {
    thirdBirthday: birthday || null,
    daysReferralToTransitionPlan: daysBetween(values.ReferralDate, values.TransitionPlanCompleted),
    daysLEANotificationBeforeExit: daysBetween(values.CLLEANotificationDate, exit),
    daysTransitionConferenceBeforeExit: daysBetween(values.TransitionMeeting, exit),
    daysExitBeforeThirdBirthday: daysBetween(exit, birthday),
  };
}

/**
 * Suggested exit path for a new form: "at age 3" when the exit falls in
 * the month around the 3rd birthday or later, otherwise "prior to age 3".
 */
export function suggestExitPath(exitDate: string, dob: unknown): 'prior' | 'atAge3' | '' {
  const birthday = thirdBirthday(dob);
  if (!exitDate || !birthday) return '';
  return exitDate >= addToDate(birthday, { days: -31 }) ? 'atAge3' : 'prior';
}
