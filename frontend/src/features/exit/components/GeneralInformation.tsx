import { useFormContext } from 'react-hook-form';

import { RegionSelect } from '../../common-info';
import type { RegionLookup } from '../../../types/common';
import type { ExitFormValues } from '../../../types/exit-form';
import { Field, Section } from './ExitFormControls';
import { inputClass } from './exitFormStyles';

interface Props {
  regions: RegionLookup[];
}

export default function GeneralInformation({ regions }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ExitFormValues>();

  return (
    <Section title="General Information">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Region" required error={errors.Region?.message}>
          <RegionSelect
            aria-label="Region"
            {...register('Region', { valueAsNumber: true })}
            regions={regions}
            placeholderValue="0"
            className={inputClass}
          />
        </Field>

        <Field label="Date of Referral" required error={errors.ReferralDate?.message}>
          <input type="date" aria-label="Date of Referral" {...register('ReferralDate')} className={inputClass} />
        </Field>

        <Field label="Date of Exit" required error={errors.ExitDate?.message}>
          <input type="date" aria-label="Date of Exit" {...register('ExitDate')} className={inputClass} />
        </Field>
      </div>
    </Section>
  );
}
