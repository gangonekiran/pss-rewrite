import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

import PageContainer from '../../../layouts/PageContainer';
import insuranceFormService from '../../../services/insurance-form.service';
import {
  DEFAULT_INSURANCE_FORM_VALUES,
  type InsuranceFormClient,
  type InsuranceFormOptions,
  type InsuranceFormValues,
} from '../../../types/insurance-form';

import { ClientInformation } from '../../common-info';
import ConsentToBill from '../components/ConsentToBill';
import InsuranceInformation from '../components/InsuranceInformation';
import { createInsuranceFormSchema } from '../schemas/insurance-form.schema';
import { recordToValues, valuesToPayload } from '../utils/insurance-form.mappers';

export interface InsuranceFormPageProps {
  childId: number;
  /** Omit to create a new Insurance form. */
  formId?: number;
  onClose: () => void;
  onSaved?: () => Promise<void>;
}

interface Lookups {
  client: InsuranceFormClient;
  options: InsuranceFormOptions;
}

function apiMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback;
  }
  return fallback;
}

export default function InsuranceFormPage({
  childId,
  formId,
  onClose,
  onSaved,
}: InsuranceFormPageProps) {
  const isEdit = formId !== undefined;

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dob = lookups?.client.DOB ?? null;
  const schema = useMemo(() => createInsuranceFormSchema(dob), [dob]);

  const methods = useForm<InsuranceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_INSURANCE_FORM_VALUES,
    mode: 'onSubmit',
  });
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [response, options] = await Promise.all([
          insuranceFormService.get(childId),
          insuranceFormService.options(),
        ]);
        if (cancelled) return;

        const existing = isEdit
          ? response.forms.find((form) => Number(form.ID) === Number(formId))
          : undefined;

        if (isEdit && !existing) {
          toast.error('Insurance Form record not found.');
          onClose();
          return;
        }

        setLookups({ client: response.client, options });
        reset(existing ? recordToValues(existing) : DEFAULT_INSURANCE_FORM_VALUES);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load Insurance Form:', error);
        toast.error(apiMessage(error, 'Failed to load Insurance Form.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [childId, formId, isEdit, reset, onClose]);

  async function saveForm(values: InsuranceFormValues) {
    try {
      setSaving(true);
      const payload = valuesToPayload(values);

      if (formId !== undefined) {
        await insuranceFormService.update(childId, formId, payload);
        toast.success('Insurance Form updated successfully.');
      } else {
        await insuranceFormService.create(childId, payload);
        toast.success('Insurance Form saved successfully.');
      }

      if (onSaved) await onSaved();
      else onClose();
    } catch (error) {
      console.error('Failed to save Insurance Form:', error);
      toast.error(apiMessage(error, 'Failed to save Insurance Form.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading Insurance Form...</div>
        </div>
      </PageContainer>
    );
  }

  if (!lookups) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-red-600">Insurance Form could not be loaded.</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(saveForm, () => toast.error('Please fix the highlighted fields.'))}
        noValidate
        className="flex min-h-full flex-col bg-white"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <h1 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Insurance Form' : 'New Insurance Form'}
          </h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5">
          <div className="space-y-6">
            {/* 1. Client Information */}
            <ClientInformation client={lookups.client} childOnly />

            {/* 2. Insurance Information */}
            <InsuranceInformation />

            {/* 3. Consent to Bill Insurance */}
            <ConsentToBill options={lookups.options} />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 z-20 flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
