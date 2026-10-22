/**
 * Live version of the API's `Calculated` block (backend exit-form.rules.ts),
 * so the Transition Information step updates while the user types.
 * All dates are YYYY-MM-DD and compared in UTC.
 */
import type { ExitFormCalculated } from '../../../types/exit-form';

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateInput(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

function utc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  return Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS);
}

function shift(date: string, { years = 0, months = 0, days = 0 }) {
  const d = utc(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function within90To180(days: number | null) {
  return days === null ? null : days >= 90 && days <= 180;
}

export function thirdBirthday(dob: unknown): string {
  const d = toDateInput(dob);
  return d ? shift(d, { years: 3 }) : '';
}

export function calculateExit(
  values: {
    ExitDate: string;
    CLLEANotificationDate: string;
    TransitionMeeting: string;
    TransitionPlanCompleted: string;
  },
  dob: unknown,
): ExitFormCalculated {
  const birthday = thirdBirthday(dob);
  const exit = values.ExitDate;
  const lea = values.CLLEANotificationDate;

  const conferenceDays = daysBetween(values.TransitionMeeting, exit);
  const planDays = daysBetween(values.TransitionPlanCompleted, exit);

  let leaWindow: boolean | null = null;
  if (lea && birthday) {
    leaWindow = lea >= shift(birthday, { months: -6 }) && lea <= shift(birthday, { days: -90 });
  }

  return {
    thirdBirthday: birthday || null,
    daysLEANotificationBeforeExit: daysBetween(lea, exit),
    daysTransitionConferenceBeforeExit: conferenceDays,
    daysTransitionPlanBeforeExit: planDays,
    daysExitBeforeThirdBirthday: daysBetween(exit, birthday),
    leaNotificationWindowMet: leaWindow,
    transitionConferenceWindowMet: within90To180(conferenceDays),
    transitionPlanWindowMet: within90To180(planDays),
  };
}

/**
 * Suggested exit path for a new form: "at age 3" when the exit falls in
 * the month around the 3rd birthday or later, otherwise "prior to age 3".
 */
export function suggestExitPath(exitDate: string, dob: unknown): 'prior' | 'atAge3' | '' {
  const birthday = thirdBirthday(dob);
  if (!exitDate || !birthday) return '';
  return exitDate >= shift(birthday, { days: -31 }) ? 'atAge3' : 'prior';
}

/** YYYY-MM-DD (or ISO) → MM/DD/YYYY for display, '—' when empty. */
export function formatDate(value: unknown): string {
  const d = toDateInput(value);
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}
