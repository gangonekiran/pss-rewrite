import { useFormContext } from 'react-hook-form';
import { Field } from './FormField';
import type { ActiveFormValues, RegionLookup } from '../../../types/active-form';
import { inputClass } from './formStyles';

interface Props {
  regions: RegionLookup[];
}

export default function GeneralInformation({ regions }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActiveFormValues>();

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {/* Section header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">General Information</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Region */}
        <Field label="Region" required error={errors.Region?.message}>
          <select
            {...register('Region', {
              valueAsNumber: true,
              required: 'Region is required',
              validate: (value) => value > 0 || 'Region is required',
            })}
            className={inputClass}
          >
            <option value="0">Select region</option>

            {regions.map((region) => (
              <option key={region.ID} value={region.ID}>
                {region.RName}
              </option>
            ))}
          </select>
        </Field>

        {/* Date of Referral */}
        <Field label="Date of Referral" required error={errors.ReferralDate?.message}>
          <input
            type="date"
            {...register('ReferralDate', {
              required: 'Date of Referral is required',
            })}
            className={inputClass}
          />
        </Field>

        {/* Status */}
        <Field label="Status" required error={errors.status?.message}>
          <select
            {...register('status', {
              required: 'Status is required',
            })}
            className={inputClass}
          >
            <option value="">Select status</option>
            <option value="aop">Active One Plan</option>
            <option value="aop-capta">Active One Plan - CAPTA</option>
          </select>
        </Field>
      </div>
    </section>
  );
}
