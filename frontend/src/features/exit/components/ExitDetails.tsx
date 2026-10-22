import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { ExitFormOptions, ExitFormValues } from '../../../types/exit-form';
import { suggestExitPath } from '../utils/exit-form.calculations';
import { Field, Section, SubSection } from './ExitFormControls';
import { inputClass } from './exitFormStyles';

interface Props {
  options: ExitFormOptions;
  dob: string | null;
}

const radioClass = 'mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500';
const optionClass =
  'flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50';

export default function ExitDetails({ options, dob }: Props) {
  const {
    register,
    control,
    setValue,
    getFieldState,
    formState: { errors, defaultValues },
  } = useFormContext<ExitFormValues>();

  const [exitPath, exitDate, priorCode, atAge3Code] = useWatch({
    control,
    name: ['exitPath', 'ExitDate', 'ExitPriorToAge3', 'ExitAtAge3'],
  });

  // New forms: follow the exit date until the user picks a path themselves.
  useEffect(() => {
    if (defaultValues?.exitPath || getFieldState('exitPath').isDirty) return;
    const suggested = suggestExitPath(exitDate, dob);
    if (suggested) setValue('exitPath', suggested);
  }, [exitDate, dob, defaultValues?.exitPath, getFieldState, setValue]);

  return (
    <Section title="Exit Details" description="Select the reason the child exited and where they were referred.">
      <Field label="When did the child exit?" required error={errors.exitPath?.message}>
        <div role="radiogroup" aria-label="When did the child exit?" className="flex h-10 flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="prior" {...register('exitPath')} className={radioClass} />
            Prior to age 3
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="atAge3" {...register('exitPath')} className={radioClass} />
            At age 3
          </label>
        </div>
      </Field>

      {exitPath === 'prior' && (
        <SubSection title="Exit Prior to Age 3">
          <Field label="Reason for Exit" required error={errors.ExitPriorToAge3?.message}>
            <div role="radiogroup" aria-label="Reason for Exit" className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {options.exitPriorToAge3.map((option) => (
                <label key={option.code} className={optionClass}>
                  <input
                    type="radio"
                    value={String(option.code)}
                    {...register('ExitPriorToAge3')}
                    className={radioClass}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          {priorCode === '2' && (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Region Moved To" error={errors.MovedOtherRegion?.message}>
                <input type="text" aria-label="Region Moved To" {...register('MovedOtherRegion')} className={inputClass} />
              </Field>
            </div>
          )}
        </SubSection>
      )}

      {exitPath === 'atAge3' && (
        <SubSection title="Exit at Age 3">
          <Field label="Child Exited at Age 3" required error={errors.ExitAtAge3?.message}>
            <div role="radiogroup" aria-label="Child Exited at Age 3" className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {options.exitAtAge3.map((option) => (
                <label key={option.code} className={optionClass}>
                  <input type="radio" value={String(option.code)} {...register('ExitAtAge3')} className={radioClass} />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          {atAge3Code === '4' && (
            <div className="mt-5">
              <Field label="Why is the child not eligible for Part B?">
                <div role="group" aria-label="Why is the child not eligible for Part B?" className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {options.noPartBReasons.map((reason) => (
                    <label key={reason.column} className="flex items-start gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        {...register(reason.column)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {reason.label}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </SubSection>
      )}

      {exitPath && (
        <SubSection title="Referral">
          <Field label="Referred To" required={exitPath === 'atAge3'} error={errors.ReferredTo?.message}>
            <div role="radiogroup" aria-label="Referred To" className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {options.referredTo.map((option) => (
                <label key={option.code} className={optionClass}>
                  <input type="radio" value={String(option.code)} {...register('ReferredTo')} className={radioClass} />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>
        </SubSection>
      )}
    </Section>
  );
}
