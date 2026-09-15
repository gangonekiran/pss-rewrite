import { useEffect } from 'react';
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
  ['DCTorticollis', 'Torticollis'],
  ['DCPlagiocephaly', 'Plagiocephaly'],
  ['DCPrematurity', 'Prematurity'],
  ['DCBehavior', 'Behavior'],
  ['DCNutrition', 'Nutrition'],
  ['DCNAS', 'Neonatal Abstinence Syndrome (NAS)'],
  ['DCCysticFibrosis', 'Cystic Fibrosis'],
  ['DCHIE', 'Hypoxic-Ischemic Encephalopathy (HIE)'],
  ['DCFeeding', 'Feeding'],
];

const dates: Array<
  [keyof ActiveFormValues, keyof ActiveFormValues, string]
> = [
  ['DCAutism', 'AutismDate', 'ASD Diagnosis Date'],
  ['DCSuspected', 'SuspectedDate', 'Suspected ASD Diagnosis Date'],
  ['DCBlind', 'BlindDate', 'Vision Diagnosis Date'],
  ['DCDeaf', 'DeafDate', 'Hearing Diagnosis Date'],
];

export default function Eligibility({
  dob,
}: {
  dob: string | null;
}) {
  const {
    register,
    setValue,
    getValues,
  } = useFormContext<ActiveFormValues>();

  const nmnei = useWatch({
    name: 'NMNEI',
  });

  /*
   * NMNEI is a selectable eligibility item.
   * When selected, maintain "NMNEI" automatically
   * in the Other field.
   */
  useEffect(() => {
    const current = String(getValues('DCOtherDesc') ?? '');

    const lines = current
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const hasNmnei = lines.some(
      (line) => line.toUpperCase() === 'NMNEI',
    );

    if (nmnei && !hasNmnei) {
      setValue(
        'DCOtherDesc',
        lines.length > 0
          ? `${lines.join('\n')}\nNMNEI`
          : 'NMNEI',
      );
    }

    if (!nmnei && hasNmnei) {
      const cleaned = lines
        .filter(
          (line) => line.toUpperCase() !== 'NMNEI',
        )
        .join('\n');

      setValue('DCOtherDesc', cleaned);
    }
  }, [nmnei, getValues, setValue]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Eligibility
        </h2>

        <p className="text-xs text-gray-500">
          Select all that apply.
        </p>
      </div>

      {/* Eligibility selections */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-4">
        {checks.map(([key, label]) => (
          <label
            key={String(key)}
            className="flex items-center gap-2 py-1 text-sm text-gray-800"
          >
            <input
              type="checkbox"
              {...register(
                key as Path<ActiveFormValues>,
              )}
              className="h-4 w-4 rounded border-gray-300"
            />

            <span>{label}</span>
          </label>
        ))}

        {/* NMNEI */}
        <label className="flex items-center gap-2 py-1 text-sm text-gray-800">
          <input
            type="checkbox"
            {...register('NMNEI')}
            className="h-4 w-4 rounded border-gray-300"
          />

          <span>NMNEI</span>
        </label>
      </div>

      {/* Diagnosis dates - always available */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {dates.map(([, date, label]) => (
          <Field
            key={String(date)}
            label={label}
          >
            <input
              type="date"
              {...register(date as Path<ActiveFormValues>)}
              min={dob || undefined}
              className={inputClass}
            />
          </Field>
        ))}
      </div>

      {/* Other */}
      <div className="mt-5">
        <Field label="Other">
          <textarea
            {...register('DCOtherDesc')}
            rows={4}
            className={inputClass}
            placeholder="Enter specific diagnosis or other details..."
          />

          <p className="text-xs text-gray-500">
            No character limit.
          </p>
        </Field>
      </div>
    </section>
  );
}