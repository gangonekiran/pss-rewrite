import { useId } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, FieldGroup, inputClass } from '../../common-info';
import { Section, SubSection } from '../../exit-form/components/ExitFormControls';
import {
  BILLING_CONSENT_DECLINE,
  type InsuranceFormOptions,
  type InsuranceFormValues,
} from '../../../types/insurance-form';

interface Props {
  options: InsuranceFormOptions;
}

const radioClass = 'mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500';
const optionClass =
  'flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50';

export default function ConsentToBill({ options }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InsuranceFormValues>();
  const id = useId();

  const consent = useWatch({ control, name: 'BillingConsent' });
  const declined = consent === BILLING_CONSENT_DECLINE;

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
