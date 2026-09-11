import { useFormContext, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { Field } from './FormField';
import DelayReasons from './DelayReasons';
import type {
  ActiveFormValues,
  DelayReasonsResponse,
} from '../../../types/active-form';
import { inputClass } from './formStyles';

interface OnePlanProps {
  reasons: DelayReasonsResponse;
  dob: string | null;
}

export default function OnePlan({
  reasons,
  dob,
}: OnePlanProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActiveFormValues>();

  const referralDate = useWatch({
    name: 'ReferralDate',
  });

  const onePlanDate = useWatch({
    name: 'onePlanDate',
  });

  const days =
    referralDate && onePlanDate
      ? dayjs(onePlanDate).diff(dayjs(referralDate), 'day')
      : '';

  /*
   * Date of One Plan cannot be before:
   * 1. Child DOB
   * 2. Referral Date
   */
  const minDate =
    referralDate && dob
      ? dayjs(referralDate).isAfter(dayjs(dob), 'day')
        ? referralDate
        : dob
      : referralDate || dob || undefined;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          One Plan
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Date of One Plan */}
        <Field
          label="Date of One Plan"
          error={errors.onePlanDate?.message}
        >
          <input
            type="date"
            {...register('onePlanDate')}
            min={minDate}
            className={inputClass}
          />
        </Field>

        {/* Automatic Day Calculator */}
        <Field label="Days Between Referral and One Plan (Read Only)">
          <div className="flex items-center gap-2">
            <input
              value={days}
              readOnly
              className={`${inputClass} bg-gray-100`}
            />
            <span className="text-sm text-gray-600">
              days
            </span>
          </div>
        </Field>
      </div>

      {/* One Plan Delay Reason */}
      <DelayReasons
        reasons={reasons}
        prefix="onePlan"
      />
    </section>
  );
}