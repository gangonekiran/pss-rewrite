import { useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, inputClass } from '../../common-info';
import type { ExitFormValues } from '../../../types/exit-form';
import { calculateExit, formatDate } from '../utils/exit-form.calculations';
import { Section } from './ExitFormControls';

interface Props {
  dob: string | null;
}

/** Read-only day count. */
function Days({ id, label, value }: { id: string; label: string; value: number | null }) {
  return (
    <Field id={id} label={`${label} (Read Only)`}>
      <div className="flex items-center gap-2">
        <input id={id} value={value ?? ''} readOnly className={`${inputClass} bg-gray-100`} />
        <span className="text-sm text-gray-600">days</span>
      </div>
    </Field>
  );
}

export default function TransitionInformation({ dob }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ExitFormValues>();
  const id = useId();

  const [
    ReferralDate,
    ExitDate,
    CLLEANotificationDate,
    TransitionMeeting,
    TransitionPlanCompleted,
    exitPath,
  ] = useWatch({
    control,
    name: [
      'ReferralDate',
      'ExitDate',
      'CLLEANotificationDate',
      'TransitionMeeting',
      'TransitionPlanCompleted',
      'exitPath',
    ],
  });

  const calc = calculateExit(
    { ReferralDate, ExitDate, CLLEANotificationDate, TransitionMeeting, TransitionPlanCompleted },
    dob,
  );

  const required = exitPath === 'atAge3';

  return (
    <Section
      title="Transition Information"
      description={`Required when the child exits at age 3.${
        calc.thirdBirthday ? ` 3rd birthday: ${formatDate(calc.thirdBirthday)}.` : ''
      }`}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <Field
            id={`${id}-plan`}
            label="Date Written Transition Plan"
            required={required}
            error={errors.TransitionPlanCompleted?.message}
          >
            <input
              id={`${id}-plan`}
              type="date"
              {...register('TransitionPlanCompleted')}
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-plan-reason`} label="Transition Plan Delay Reason">
            <textarea
              id={`${id}-plan-reason`}
              rows={3}
              {...register('TransitionPlanReason')}
              placeholder="Family circumstance or provider circumstance, and details"
              className={`${inputClass} h-auto py-2`}
            />
          </Field>
        </div>
        <Field
          id={`${id}-lea`}
          label="LEA Notification Date"
          required={required}
          error={errors.CLLEANotificationDate?.message}
        >
          <input
            id={`${id}-lea`}
            type="date"
            {...register('CLLEANotificationDate')}
            className={inputClass}
          />
        </Field>
        <Field
          id={`${id}-conference`}
          label="Date of Transition Conference"
          required={required}
          error={errors.TransitionMeeting?.message}
        >
          <input
            id={`${id}-conference`}
            type="date"
            {...register('TransitionMeeting')}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Days
          id={`${id}-days-plan`}
          label="Days Between Referral and Transition Plan"
          value={calc.daysReferralToTransitionPlan}
        />
        <Days
          id={`${id}-days-lea`}
          label="Days Between LEA Notification and Exit"
          value={calc.daysLEANotificationBeforeExit}
        />
        <Days
          id={`${id}-days-conference`}
          label="Days Between Transition Conference and Exit"
          value={calc.daysTransitionConferenceBeforeExit}
        />
        <Days
          id={`${id}-days-birthday`}
          label="Days Between Exit and 3rd Birthday"
          value={calc.daysExitBeforeThirdBirthday}
        />
      </div>
    </Section>
  );
}
