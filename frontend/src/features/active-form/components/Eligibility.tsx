import { useFormContext, useWatch, type Path } from 'react-hook-form';
import { Field } from './FormField';
import type { ActiveFormValues } from '../../../types/active-form';
import { inputClass } from './formStyles';

const checks: Array<[keyof ActiveFormValues, string]> = [
  ['DDAll', 'All developmental delays'],
  ['DDAdaptive', 'Adaptive'],
  ['DDCognitive', 'Cognitive'],
  ['DDCommunication', 'Communication (speech/lang)'],
  ['DDMotor', 'Motor'],
  ['DDSocial', 'Social/emotional'],
  ['DCAttachment', 'Attachment disorder'],
  ['DCAutism', 'Autism/PDD'],
  ['DCSuspected', 'Suspected Autism'],
  ['DCBlind', 'Blind/Visually Impaired'],
  ['DCDeaf', 'Deaf/Hard of Hearing'],
  ['DCDown', 'Down Syndrome'],
  ['DCCerebral', 'Cerebral Palsy'],
  ['DCCraniofacial', 'Craniofacial Disorder'],
  ['DCFragile', 'Medically Fragile'],
  ['DCOral', 'Oral Motor/Swallowing'],
  ['DCBirth', 'Severe Complications at Birth'],
];
const dates: Array<[keyof ActiveFormValues, keyof ActiveFormValues, string]> = [
  ['DCAutism', 'AutismDate', 'Autism/PDD diagnosis date'],
  ['DCSuspected', 'SuspectedDate', 'Suspected Autism diagnosis date'],
  ['DCBlind', 'BlindDate', 'Blind/Visually Impaired diagnosis date'],
  ['DCDeaf', 'DeafDate', 'Deaf/Hard of Hearing diagnosis date'],
];

export default function Eligibility() {
  const { register } = useFormContext<ActiveFormValues>();
  const values = useWatch<ActiveFormValues>();
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Eligibility</h2>
        <p className="text-xs text-gray-500">Select all applicable eligibility reasons.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {checks.map(([key, label]) => (
          <label
            key={String(key)}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800"
          >
            <input
              type="checkbox"
              {...register(key as Path<ActiveFormValues>)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {dates.map(([check, date, label]) => (
          <Field key={String(date)} label={label}>
            <input
              type="date"
              {...register(date as Path<ActiveFormValues>)}
              disabled={!values?.[check]}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      <div className="mt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            {...register('DCOther')}
            className="h-4 w-4 rounded border-gray-300"
          />
          Other
        </label>
        <textarea
          {...register('DCOtherDesc')}
          rows={4}
          className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          placeholder="Enter other eligibility reason. No limit."
        />
      </div>
    </section>
  );
}
