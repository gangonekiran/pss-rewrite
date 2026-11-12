import { useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, inputClass, Section } from '../../common-info';
import { BILLING_CONSENT_PRIVATE, type InsuranceFormValues } from '../../../types/insurance-form';
import { toDateInput } from '../../../utils/date';

type TextField = 'PolicyNumber' | 'GroupNumber' | 'GroupName' | 'PolicyHolder';
type DateField = 'EffectiveDate' | 'EndDate';

const TEXT_FIELDS: Array<[TextField, string]> = [
  ['PolicyNumber', 'Policy #'],
  ['GroupNumber', 'Group # (Contract #)'],
  ['GroupName', 'Group/Employer Name'],
];

const DATE_FIELDS: Array<[DateField, string]> = [
  ['EffectiveDate', 'Effective Date of Policy'],
  ['EndDate', 'End Date of Policy'],
];

interface Props {
  dob: string | null;
}

/** Text columns are nvarchar(255). */
const MAX_TEXT = 255;

export default function InsuranceInformation({ dob }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InsuranceFormValues>();
  const id = useId();

  const [consent, effectiveDate] = useWatch({ control, name: ['BillingConsent', 'EffectiveDate'] });
  const dobDate = toDateInput(dob) || undefined;

  return (
    <Section
      title="Insurance Information"
      description="Primary insurance details from the family's insurance card."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field
          id={`${id}-FormDate`}
          label="Date Completed"
          required
          error={errors.FormDate?.message}
        >
          <input
            id={`${id}-FormDate`}
            type="date"
            min={dobDate}
            {...register('FormDate')}
            className={inputClass}
          />
        </Field>

        <div className="md:col-span-2">
          {/* Saved to BranchAddress, where staff have always typed the company name. */}
          <Field
            id={`${id}-BranchAddress`}
            label="Insurance Company Name"
            required={consent === BILLING_CONSENT_PRIVATE}
            error={errors.BranchAddress?.message}
          >
            <input
              id={`${id}-BranchAddress`}
              type="text"
              maxLength={MAX_TEXT}
              {...register('BranchAddress')}
              className={inputClass}
            />
          </Field>
        </div>

        {TEXT_FIELDS.map(([name, label]) => (
          <Field key={name} id={`${id}-${name}`} label={label} error={errors[name]?.message}>
            <input
              id={`${id}-${name}`}
              type="text"
              maxLength={MAX_TEXT}
              {...register(name)}
              className={inputClass}
            />
          </Field>
        ))}

        {DATE_FIELDS.map(([name, label]) => (
          <Field key={name} id={`${id}-${name}`} label={label} error={errors[name]?.message}>
            <input
              id={`${id}-${name}`}
              type="date"
              min={name === 'EndDate' ? effectiveDate || undefined : undefined}
              {...register(name)}
              className={inputClass}
            />
          </Field>
        ))}

        <Field
          id={`${id}-PolicyHolder`}
          label="Individual Policy Holder"
          error={errors.PolicyHolder?.message}
        >
          <input
            id={`${id}-PolicyHolder`}
            type="text"
            maxLength={MAX_TEXT}
            {...register('PolicyHolder')}
            className={inputClass}
          />
        </Field>
      </div>
    </Section>
  );
}
