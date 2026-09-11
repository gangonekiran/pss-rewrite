import { useFormContext, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { Field } from './FormField';
import DelayReasons from './DelayReasons';
import type {
  ActiveFormValues,
  DelayReasonsResponse,
} from '../../../types/active-form';
import { inputClass } from './formStyles';

interface InitialEvaluationProps {
  reasons: DelayReasonsResponse;
  dob: string | null;
}

export default function InitialEvaluation({
  reasons,
  dob,
}: InitialEvaluationProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActiveFormValues>();

  const referralDate = useWatch({
    name: 'ReferralDate',
  });

  const evaluationDate = useWatch({
    name: 'InitialEvalDate',
  });

  const days =
    referralDate && evaluationDate
      ? dayjs(evaluationDate).diff(dayjs(referralDate), 'day')
      : '';

  /*
   * The Initial Evaluation date cannot be before:
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
          Initial Evaluation / Assessment
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Date of Initial Evaluation / Assessment */}
        <Field
          label="Date of Initial Evaluation / Assessment"
          error={errors.InitialEvalDate?.message}
        >
          <input
            type="date"
            {...register('InitialEvalDate')}
            min={minDate}
            className={inputClass}
          />
        </Field>

        {/* Automatic Day Calculator */}
        <Field label="Days Between Referral and Initial Evaluation (Read Only)">
          <div className="flex items-center gap-2">
            <input
              value={days}
              readOnly
              className={`${inputClass} bg-gray-100`}
            />
            <span className="text-sm text-gray-600">days</span>
          </div>
        </Field>
      </div>

      {/* Initial Evaluation Delay Reason */}
      <DelayReasons
        reasons={reasons}
        prefix="initial"
      />
    </section>
  );
}