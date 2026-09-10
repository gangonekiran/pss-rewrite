import { useFormContext } from 'react-hook-form';
import { Field } from './FormField';
import type { ActiveFormValues, DelayReasonsResponse } from '../../../types/active-form';
import { inputClass } from './formStyles';

export default function DelayReasons({
  reasons,
  prefix,
}: {
  reasons: DelayReasonsResponse;
  prefix: 'initial' | 'onePlan';
}) {
  const { register } = useFormContext<ActiveFormValues>();
  const family = prefix === 'initial' ? 'DelayFC' : 'MeetingDelayFC';
  const familyOther = prefix === 'initial' ? 'DelayFCOther' : 'MeetingDelayFCOther';
  const provider = prefix === 'initial' ? 'DelayNotFC' : 'MeetingDelayNC';
  const providerOther = prefix === 'initial' ? 'DelayNotFCOther' : 'MeetingDelayNCOther';
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-md border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Family / Circumstance</h3>
        <Field label="Reason">
          <select {...register(family)} className={inputClass}>
            <option value="">Select reason</option>
            {reasons.family.map((x) => (
              <option key={x.Reason} value={x.Reason}>
                {x.Reason}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <Field label="Other reasons">
            <input
              {...register(familyOther)}
              className={inputClass}
              placeholder="Enter other reason"
            />
          </Field>
        </div>
      </div>
      <div className="rounded-md border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Provider / Non-compliant</h3>
        <Field label="Reason">
          <select {...register(provider)} className={inputClass}>
            <option value="">Select reason</option>
            {reasons.provider.map((x) => (
              <option key={x.Reason} value={x.Reason}>
                {x.Reason}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <Field label="Other reasons">
            <input
              {...register(providerOther)}
              className={inputClass}
              placeholder="Enter other reason"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
