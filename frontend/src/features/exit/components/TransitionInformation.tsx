import { useFormContext, useWatch } from 'react-hook-form';

import type { ExitFormValues } from '../../../types/exit-form';
import { calculateExit, formatDate } from '../utils/exit-form.calculations';
import { Field, Section } from './ExitFormControls';
import { inputClass } from './exitFormStyles';

interface Props {
  dob: string | null;
}

/** Read-only day count, styled like the Active Form's day calculators. */
function Days({ label, value }: { label: string; value: number | null }) {
  return (
    <Field label={`${label} (Read Only)`}>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} (Read Only)`}
          value={value ?? ''}
          readOnly
          className={`${inputClass} bg-gray-100`}
        />
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

  const [ExitDate, CLLEANotificationDate, TransitionMeeting, TransitionPlanCompleted, exitPath] =
    useWatch({
      control,
      name: ['ExitDate', 'CLLEANotificationDate', 'TransitionMeeting', 'TransitionPlanCompleted', 'exitPath'],
    });

  const calc = calculateExit(
    { ExitDate, CLLEANotificationDate, TransitionMeeting, TransitionPlanCompleted },
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
        <Field label="Date Written Transition Plan" required={required} error={errors.TransitionPlanCompleted?.message}>
          <input
            type="date"
            aria-label="Date Written Transition Plan"
            {...register('TransitionPlanCompleted')}
            className={inputClass}
          />
        </Field>
        <Field
          label="Date LEA Notified of Child's Name"
          required={required}
          error={errors.CLLEANotificationDate?.message}
        >
          <input
            type="date"
            aria-label="Date LEA Notified of Child's Name"
            {...register('CLLEANotificationDate')}
            className={inputClass}
          />
        </Field>
        <Field label="Date of Transition Conference" required={required} error={errors.TransitionMeeting?.message}>
          <input
            type="date"
            aria-label="Date of Transition Conference"
            {...register('TransitionMeeting')}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Days
          label="Days Between Transition Plan and Exit"
          value={calc.daysTransitionPlanBeforeExit}
        />
        <Days
          label="Days Between LEA Notification and Exit"
          value={calc.daysLEANotificationBeforeExit}
        />
        <Days
          label="Days Between Transition Conference and Exit"
          value={calc.daysTransitionConferenceBeforeExit}
        />
        <Days
          label="Days Between Exit and 3rd Birthday"
          value={calc.daysExitBeforeThirdBirthday}
        />
      </div>
    </Section>
  );
}
