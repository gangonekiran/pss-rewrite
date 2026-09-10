import { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import Select from 'react-select';
import { Field } from './FormField';
import type {
  ActiveFormValues,
  SupervisoryUnionLookup,
  TownLookup,
  ServiceCoordinatorTypeLookup,
  RegionLookup,
} from '../../../types/active-form';
import { inputClass } from './formStyles';

interface Props {
  regions: RegionLookup[];
  unions: SupervisoryUnionLookup[];
  towns: TownLookup[];
  coordinatorTypes: ServiceCoordinatorTypeLookup[];
}

export default function GeneralInformation({ regions, unions, towns, coordinatorTypes }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ActiveFormValues>();
  const town = watch('Town');
  const suName = watch('SUName');
  const selectedTown = towns.find((item) => item.Town === town || item.TownName === town);

  useEffect(() => {
    if (!selectedTown) return;
    setValue('CountyCode', selectedTown.CountyCode ?? '');
    if (selectedTown.SU_id != null) setValue('SU_id', selectedTown.SU_id);
    const union = unions.find((item) => item.SU_id === selectedTown.SU_id);
    if (union) setValue('SUName', union.SUName);
  }, [selectedTown, unions, setValue]);

  const suOptions = unions.map((u) => ({ value: u.SU_id, label: u.SUName }));
  const townOptions = towns.map((t) => ({ value: t.Town, label: t.TownName }));
  const typeOptions = coordinatorTypes.map((t) => ({
    value: t.SvcCordType,
    label: t.SvcCordTypeDesc,
  }));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">General Information</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Region" required error={errors.Region?.message}>
          <select {...register('Region')} className={inputClass}>
            <option value="">Select region</option>

            {regions
              .filter((r) => r != null)
              .map((r) => (
                <option key={r.ID} value={r.ID}>
                  {r.RName}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Supervisory Union #">
          <Controller
            name="SU_id"
            control={control}
            render={({ field }) => (
              <Select
                value={suOptions.find((o) => o.value === field.value) ?? null}
                onChange={(o) => {
                  field.onChange(o?.value ?? null);
                  const u = unions.find((x) => x.SU_id === o?.value);
                  setValue('SUName', u?.SUName ?? '');
                }}
                options={suOptions}
                isClearable
                placeholder="Select SU"
              />
            )}
          />
        </Field>
        <Field label="Supervisory Union Name">
          <input {...register('SUName')} value={suName} className={inputClass} />
        </Field>
        <Field label="Town">
          <Controller
            name="Town"
            control={control}
            render={({ field }) => (
              <Select
                value={townOptions.find((o) => o.value === field.value) ?? null}
                onChange={(o) => field.onChange(o?.value ?? '')}
                options={townOptions}
                isClearable
                placeholder="Search town"
              />
            )}
          />
        </Field>
        <Field label="County">
          <input {...register('CountyCode')} className={`${inputClass} bg-gray-100`} readOnly />
        </Field>
        <Field label="Service Coordinator Type">
          <Controller
            name="SvcCordType"
            control={control}
            render={({ field }) => (
              <Select
                value={typeOptions.find((o) => o.value === field.value) ?? null}
                onChange={(o) => field.onChange(o?.value ?? '')}
                options={typeOptions}
                isClearable
                placeholder="Select type"
              />
            )}
          />
        </Field>
        <Field label="Service Coordinator First Name">
          <input {...register('SvcCordFirstName')} className={inputClass} />
        </Field>
        <Field label="Service Coordinator Last Name">
          <input {...register('SvcCordLastName')} className={inputClass} />
        </Field>
        <Field label="Date of Referral">
          <input type="date" {...register('ReferralDate')} className={inputClass} />
        </Field>
        <Field label="Status">
          <select {...register('status')} className={inputClass}>
            <option value="">Select status</option>
            <option value="Active One Plan">Active One Plan</option>
            <option value="Active One Plan- CAPTA">Active One Plan- CAPTA</option>
          </select>
        </Field>
      </div>
    </section>
  );
}
