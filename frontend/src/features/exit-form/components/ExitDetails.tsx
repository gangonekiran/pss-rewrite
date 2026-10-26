import { useEffect, useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, FieldGroup, inputClass } from '../../common-info';
import type { ExitFormOptions, ExitFormValues } from '../../../types/exit-form';
import { suggestExitPath } from '../utils/exit-form.calculations';
import { Section, SubSection } from './ExitFormControls';

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
  const id = useId();

  const [exitPath, exitDate, priorCode] = useWatch({
    control,
    name: ['exitPath', 'ExitDate', 'ExitPriorToAge3'],
  });

  // New forms: follow the exit date until the user picks a path themselves.
  useEffect(() => {
    if (defaultValues?.exitPath || getFieldState('exitPath').isDirty) return;
    const suggested = suggestExitPath(exitDate, dob);
    if (suggested) setValue('exitPath', suggested);
  }, [exitDate, dob, defaultValues?.exitPath, getFieldState, setValue]);

  return (
    <Section
      title="Exit Details"
      description="Select the reason the child exited and where they were referred."
    >
      <FieldGroup label="When did the child exit?" required error={errors.exitPath?.message}>
        <div className="flex h-10 flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="prior" {...register('exitPath')} className={radioClass} />
            Prior to age 3
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="atAge3" {...register('exitPath')} className={radioClass} />
            At age 3
          </label>
        </div>
      </FieldGroup>

      {exitPath === 'prior' && (
        <SubSection title="Child Exited this region PRIOR TO AGE 3 OR NON-EI Client: Please check one">
          <FieldGroup label="Reason for Exit" required error={errors.ExitPriorToAge3?.message}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
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
          </FieldGroup>

          {priorCode === '2' && (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field
                id={`${id}-moved`}
                label="Region Moved To"
                error={errors.MovedOtherRegion?.message}
              >
                <input
                  id={`${id}-moved`}
                  type="text"
                  {...register('MovedOtherRegion')}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </SubSection>
      )}

      {exitPath === 'atAge3' && (
        <SubSection title="Child Exited AT AGE 3">
          <FieldGroup label="Child Exited at Age 3" required error={errors.ExitAtAge3?.message}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {options.exitAtAge3.map((option) => (
                <label key={option.code} className={optionClass}>
                  <input
                    type="radio"
                    value={String(option.code)}
                    {...register('ExitAtAge3')}
                    className={radioClass}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FieldGroup>
        </SubSection>
      )}

      {exitPath && (
        <SubSection title="Referred to">
          <FieldGroup
            label="Referred To"
            required={exitPath === 'atAge3'}
            error={errors.ReferredTo?.message}
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {options.referredTo.map((option) => (
                <label key={option.code} className={optionClass}>
                  <input
                    type="radio"
                    value={String(option.code)}
                    {...register('ReferredTo')}
                    className={radioClass}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FieldGroup>
        </SubSection>
      )}
    </Section>
  );
}
