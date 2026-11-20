import {
  DEFAULT_NOPR_FORM_VALUES,
  type NoprFormDefaults,
  type NoprFormRecord,
  type NoprFormValues,
} from '../../../types/nopr-form';
import { toDateInput } from '../../../utils/date';

export function recordToValues(form: NoprFormRecord): NoprFormValues {
  const refStatus = Number(form.RefStatus);

  return {
    Region: Number(form.Region ?? 0),
    RefStatus: Number.isInteger(refStatus) && refStatus > 0 ? String(refStatus) : '',
    InitialEvalDate: toDateInput(form.InitialEvalDate),
    StatusDate: toDateInput(form.StatusDate),
  };
}

export function defaultsToValues(
  defaults: NoprFormDefaults | null,
  clientRegion: unknown,
): NoprFormValues {
  return {
    ...DEFAULT_NOPR_FORM_VALUES,
    Region: Number(defaults?.Region ?? clientRegion ?? 0),
  };
}

/** Form model → API body. The API saves FormDate as the status date. */
export function valuesToPayload(values: NoprFormValues): Record<string, unknown> {
  return {
    Region: values.Region,
    RefStatus: values.RefStatus ? Number(values.RefStatus) : null,
    InitialEvalDate: values.InitialEvalDate || null,
    StatusDate: values.StatusDate || null,
  };
}
