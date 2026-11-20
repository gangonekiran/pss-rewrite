import { useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, FieldGroup, inputClass, optionClass, radioClass, Section } from '../../common-info';
import type { NoprFormOptions, NoprFormValues } from '../../../types/nopr-form';
import { formatDate, toDateInput } from '../../../utils/date';

interface Props {
  options: NoprFormOptions;
  dob: string | null;
  mostRecentReferralDate: string | null;
  /** The reason saved on the form being edited; a retired reason is shown only for it. */
  savedRefStatus: number | null;
}

export default function NoprStatus({
  options,
  dob,
  mostRecentReferralDate,
  savedRefStatus,
}: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<NoprFormValues>();
  const id = useId();

  const statusDate = useWatch({ control, name: 'StatusDate' });
  const dobDate = toDateInput(dob) || undefined;
  const referral = toDateInput(mostRecentReferralDate);

  const reasons = [
    ...options.refStatus,
    ...options.retiredRefStatus
      .filter((o) => o.code === savedRefStatus)
      .map((o) => ({ ...o, label: `${o.label} (no longer used)` })),
  ];

  return (
    <Section
      title="Status: Referred with No One Plan Resulting for Early Intervention Services"
      description="Select the one reason why a plan was not created."
    >
      <FieldGroup label="Reason" required error={errors.RefStatus?.message}>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {reasons.map((reason) => (
            <label key={reason.code} className={optionClass}>
              <input
                type="radio"
                value={String(reason.code)}
                {...register('RefStatus')}
                className={radioClass}
              />
              <span>{reason.label}</span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field
          id={`${id}-eval`}
          label="Date of Initial Evaluation"
          error={errors.InitialEvalDate?.message}
        >
          <input
            id={`${id}-eval`}
            type="date"
            min={dobDate}
            max={statusDate || undefined}
            {...register('InitialEvalDate')}
            className={inputClass}
          />
          {!errors.InitialEvalDate && (
            <p className="text-xs text-gray-500">
              Optional. Cannot be after the date the status was determined.
            </p>
          )}
        </Field>

        <Field
          id={`${id}-status`}
          label="Date above status was determined"
          required
          error={errors.StatusDate?.message}
        >
          <input
            id={`${id}-status`}
            type="date"
            min={referral || dobDate}
            {...register('StatusDate')}
            className={inputClass}
          />
          {!errors.StatusDate && referral && (
            <p className="text-xs text-gray-500">
              Cannot be before the most recent referral date ({formatDate(referral)}).
            </p>
          )}
        </Field>
      </div>

      <p className="mt-5 text-xs text-gray-500">
        The date above status was determined is used by HP Enterprises (FITP) to turn off the Early
        Intervention voucher.
      </p>
    </Section>
  );
}
