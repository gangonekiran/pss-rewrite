import { useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  Field,
  FieldGroup,
  inputClass,
  optionClass,
  radioClass,
  Section,
  SubSection,
} from '../../common-info';
import {
  BILLING_CONSENT_DECLINE,
  type InsuranceFormOptions,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import { toDateInput } from '../../../utils/date';

interface Props {
  options: InsuranceFormOptions;
  dob: string | null;
}

export default function ConsentToBill({ options, dob }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InsuranceFormValues>();
  const id = useId();

  const consent = useWatch({ control, name: 'BillingConsent' });
  const declined = consent === BILLING_CONSENT_DECLINE;
  const dobDate = toDateInput(dob) || undefined;

  return (
    <Section
      title="Consent to Bill Insurance"
      description="I certify that the information provided on this form is correct and agree that I will notify DCF/CDD at the address above of any changes in this information."
    >
      <FieldGroup
        label="I give permission for Children's Integrated Services – Part C Early Intervention to bill:"
        required
        error={errors.BillingConsent?.message}
      >
        <div className="mt-2 grid grid-cols-1 gap-2">
          {options.billingConsent.map((option) => (
            <label key={option.code} className={optionClass}>
              <input
                type="radio"
                value={String(option.code)}
                {...register('BillingConsent')}
                className={radioClass}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FieldGroup>

      {consent && !declined && (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field
            id={`${id}-ParentSignatureDate`}
            label="Parent or Guardian Signature Date"
            required
            error={errors.ParentSignatureDate?.message}
          >
            <input
              id={`${id}-ParentSignatureDate`}
              type="date"
              min={dobDate}
              {...register('ParentSignatureDate')}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {declined && (
        <SubSection title="Decline">
          <FieldGroup
            label="I choose to deny permission for my private insurance to be billed because:"
            required
            error={errors.declineReason?.message}
          >
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {options.declineReasons.map((reason) => (
                <label key={reason.field} className={optionClass}>
                  <input
                    type="radio"
                    value={reason.field}
                    {...register('declineReason')}
                    className={radioClass}
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>
          </FieldGroup>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field
              id={`${id}-ParentSignatureDate2`}
              label="Parent or Guardian Signature Date"
              required
              error={errors.ParentSignatureDate2?.message}
            >
              <input
                id={`${id}-ParentSignatureDate2`}
                type="date"
                min={dobDate}
                {...register('ParentSignatureDate2')}
                className={inputClass}
              />
            </Field>
          </div>
        </SubSection>
      )}
    </Section>
  );
}
