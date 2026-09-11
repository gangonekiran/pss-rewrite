import { useFormContext } from 'react-hook-form';
import { Field } from './FormField';
import type {
  ActiveFormValues,
  DelayReasonsResponse,
} from '../../../types/active-form';
import { inputClass } from './formStyles';

interface Props {
  reasons: DelayReasonsResponse;
  prefix: 'initial' | 'onePlan';
}

export default function DelayReasons({ reasons, prefix }: Props) {
  const { register, watch } = useFormContext<ActiveFormValues>();

  const isInitial = prefix === 'initial';

  const reasonField: 'DelayReason' | 'MeetingDelayReason' =
    isInitial ? 'DelayReason' : 'MeetingDelayReason';

  const detailsField: 'DelayDetails' | 'MeetingDelayDetails' =
    isInitial ? 'DelayDetails' : 'MeetingDelayDetails';

  const selectedReason = watch(reasonField) || '';

  /*
   * Family / Child circumstances
   */
  const familyReasons = reasons.family
    .map((item) => item.Reason)
    .filter(Boolean);

  /*
   * Auto Eligible is required for Initial Evaluation only.
   */
  if (isInitial && !familyReasons.includes('Auto Eligible')) {
    familyReasons.push('Auto Eligible');
  }

  /*
   * Provider / non-family circumstances
   */
  const providerReasons = reasons.provider
    .map((item) => item.Reason)
    .filter(Boolean);

  const selectedFamilyReason = selectedReason.startsWith('family::')
    ? selectedReason.replace(/^family::/, '')
    : '';

  const selectedProviderReason = selectedReason.startsWith('provider::')
    ? selectedReason.replace(/^provider::/, '')
    : '';

  const selectedOther =
    selectedFamilyReason === 'Other reasons' ||
    selectedProviderReason === 'Other reasons';

  return (
    <div className="mt-6">
      <Field label="Reason for Delay">
        <select
          {...register(reasonField)}
          className={inputClass}
        >
          <option value="">
            Select one reason (optional)
          </option>

          <optgroup label="1. Due to family and/or child circumstances">
            {familyReasons.map((reason) => (
              <option
                key={`family-${reason}`}
                value={`family::${reason}`}
              >
                {reason}
              </option>
            ))}
          </optgroup>

          <optgroup label="2. NOT due to family and/or child circumstances (non-compliant)">
            {providerReasons.map((reason) => (
              <option
                key={`provider-${reason}`}
                value={`provider::${reason}`}
              >
                {reason}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <div className="mt-4">
        <Field label="Other reasons - details">
          <textarea
            {...register(detailsField)}
            rows={3}
            className={inputClass}
            placeholder={
              selectedOther
                ? 'Enter details...'
                : 'Select Other reasons to enter details'
            }
          />

          <p className="mt-1 text-xs text-gray-500">
            No character limit.
          </p>
        </Field>
      </div>
    </div>
  );
}