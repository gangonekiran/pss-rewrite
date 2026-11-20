import { useId } from 'react';
import { useFormContext } from 'react-hook-form';

import { Field, inputClass, RegionSelect, Section } from '../../common-info';
import type { RegionLookup } from '../../../types/common';
import type { NoprFormValues } from '../../../types/nopr-form';

interface Props {
  regions: RegionLookup[];
}

export default function GeneralInformation({ regions }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<NoprFormValues>();
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
      </div>
    </Section>
  );
}
