import { useId } from 'react';
import { useFormContext } from 'react-hook-form';

import { Field, inputClass, RegionSelect } from '../../common-info';
import type { RegionLookup } from '../../../types/common';
import type { ExitFormValues } from '../../../types/exit-form';
import { Section } from './ExitFormControls';

interface Props {
  regions: RegionLookup[];
}

export default function GeneralInformation({ regions }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ExitFormValues>();
  const id = useId();

  return (
    <Section title="General Information">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field id={`${id}-region`} label="Region" required error={errors.Region?.message}>
          <RegionSelect
            id={`${id}-region`}
            {...register('Region', { valueAsNumber: true })}
            regions={regions}
            placeholderValue="0"
            className={inputClass}
          />
        </Field>

        <Field
          id={`${id}-referral`}
          label="Date of Referral"
          required
          error={errors.ReferralDate?.message}
        >
          <input
            id={`${id}-referral`}
            type="date"
            {...register('ReferralDate')}
            className={inputClass}
          />
        </Field>

        <Field id={`${id}-exit`} label="Date of Exit" required error={errors.ExitDate?.message}>
          <input id={`${id}-exit`} type="date" {...register('ExitDate')} className={inputClass} />
        </Field>
      </div>
    </Section>
  );
}
