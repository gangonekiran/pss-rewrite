import { useFormContext, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { Field } from './FormField';
import DelayReasons from './DelayReasons';
import type { ActiveFormValues, DelayReasonsResponse } from '../../../types/active-form';
import { inputClass } from './formStyles';

export default function InitialEvaluation({
  reasons,
  dob,
}: {
  reasons: DelayReasonsResponse;
  dob: string | null;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActiveFormValues>();
  const referral = useWatch({ name: 'ReferralDate' });
  const evaluation = useWatch({ name: 'InitialEvalDate' });
  const days = referral && evaluation ? dayjs(evaluation).diff(dayjs(referral), 'day') : '';
  const minDate = referral || dob || undefined;
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Initial Evaluation / Assessment</h2>
      </div>
      <div className="grid max-w-2xl grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Date of Initial Evaluation / Assessment">
          <input
            type="date"
            {...register('InitialEvalDate')}
            min={minDate}
            className={inputClass}
          />
        </Field>
        <Field label="Days from Referral">
          <input value={days} readOnly className={`${inputClass} bg-gray-100`} />
        </Field>
      </div>
      <DelayReasons reasons={reasons} prefix="initial" />
      {errors.InitialEvalDate?.message && (
        <p className="mt-2 text-sm text-red-600">{String(errors.InitialEvalDate.message)}</p>
      )}
    </section>
  );
}
