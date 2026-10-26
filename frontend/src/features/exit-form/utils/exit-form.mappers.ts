import {
  DEFAULT_EXIT_FORM_VALUES,
  type ExitFormDefaults,
  type ExitFormRecord,
  type ExitFormValues,
} from '../../../types/exit-form';
import { toDateInput } from './exit-form.calculations';

/** Legacy rows store 0 in the unused exit-path column; treat 0 / null as "not chosen". */
function codeString(value: unknown): string {
  const n = Number(value);
  return value === null || value === undefined || !Number.isInteger(n) || n === 0 ? '' : String(n);
}

function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export function recordToValues(form: ExitFormRecord): ExitFormValues {
  const prior = codeString(form.ExitPriorToAge3);
  const atAge3 = codeString(form.ExitAtAge3);

  return {
    Region: Number(form.Region ?? 0),
    ReferralDate: toDateInput(form.ReferralDate),
    ExitDate: toDateInput(form.ExitDate),

    TransitionPlanCompleted: toDateInput(form.TransitionPlanCompleted),
    TransitionPlanReason: str(form.TransitionPlanReason),
    CLLEANotificationDate: toDateInput(form.CLLEANotificationDate),
    TransitionMeeting: toDateInput(form.TransitionMeeting),

    exitPath: prior ? 'prior' : atAge3 ? 'atAge3' : '',
    ExitPriorToAge3: prior,
    MovedOtherRegion: str(form.MovedOtherRegion),
    ExitAtAge3: atAge3,
    ReferredTo: codeString(form.ReferredTo),
  };
}

export function defaultsToValues(
  defaults: ExitFormDefaults | null,
  clientRegion: unknown,
): ExitFormValues {
  return {
    ...DEFAULT_EXIT_FORM_VALUES,
    Region: Number(defaults?.Region ?? clientRegion ?? 0),
    ReferralDate: toDateInput(defaults?.ReferralDate),
  };
}

function code(value: string): number | null {
  return value ? Number(value) : null;
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

/**
 * Form model → API body. Only the fields on the form are sent. The API
 * stores the unused exit path as 0 and clears fields that do not apply
 * to the chosen answer.
 */
export function valuesToPayload(values: ExitFormValues): Record<string, unknown> {
  const prior = values.exitPath === 'prior';
  const atAge3 = values.exitPath === 'atAge3';

  return {
    Region: values.Region,
    ReferralDate: values.ReferralDate || null,
    ExitDate: values.ExitDate || null,

    TransitionPlanCompleted: values.TransitionPlanCompleted || null,
    TransitionPlanReason: nullable(values.TransitionPlanReason),
    CLLEANotificationDate: values.CLLEANotificationDate || null,
    TransitionMeeting: values.TransitionMeeting || null,

    ExitPriorToAge3: prior ? code(values.ExitPriorToAge3) : null,
    MovedOtherRegion: prior ? nullable(values.MovedOtherRegion) : null,
    ExitAtAge3: atAge3 ? code(values.ExitAtAge3) : null,
    ReferredTo: code(values.ReferredTo),
  };
}
