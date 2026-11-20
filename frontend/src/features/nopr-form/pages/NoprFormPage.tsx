import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

import PageContainer from '../../../layouts/PageContainer';
import { apiMessage } from '../../../utils/api-message';
import commonInfoService from '../../../services/common-info.service';
import noprFormService from '../../../services/nopr-form.service';
import type { RegionLookup } from '../../../types/common';
import {
  DEFAULT_NOPR_FORM_VALUES,
  type NoprFormClient,
  type NoprFormOptions,
  type NoprFormValues,
} from '../../../types/nopr-form';

import { ClientInformation } from '../../common-info';
import GeneralInformation from '../components/GeneralInformation';
import NoprStatus from '../components/NoprStatus';
import { createNoprFormSchema } from '../schemas/nopr-form.schema';
import { defaultsToValues, recordToValues, valuesToPayload } from '../utils/nopr-form.mappers';

export interface NoprFormPageProps {
  childId: number;
  /** Omit to create a new NOPR form. */
  formId?: number;
  onClose: () => void;
  onSaved?: () => Promise<void>;
}

interface Lookups {
  client: NoprFormClient;
  regions: RegionLookup[];
  options: NoprFormOptions;
  mostRecentReferralDate: string | null;
  savedRefStatus: number | null;
}

export default function NoprFormPage({ childId, formId, onClose, onSaved }: NoprFormPageProps) {
  const isEdit = formId !== undefined;

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dob = lookups?.client.DOB ?? null;
  const referral = lookups?.mostRecentReferralDate ?? null;
  const schema = useMemo(() => createNoprFormSchema(dob, referral), [dob, referral]);

  const methods = useForm<NoprFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_NOPR_FORM_VALUES,
    mode: 'onSubmit',
  });
  const { reset, handleSubmit, control } = methods;
  const regionId = useWatch({ control, name: 'Region' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [response, regions, options, defaults] = await Promise.all([
          noprFormService.get(childId),
          commonInfoService.regions(),
          noprFormService.options(),
          noprFormService.defaults(childId),
        ]);
        if (cancelled) return;

        const existing = isEdit
          ? response.forms.find((form) => Number(form.ID) === Number(formId))
          : undefined;

        if (isEdit && !existing) {
          toast.error('NOPR Form record not found.');
          onClose();
          return;
        }

        setLookups({
          client: response.client,
          regions: regions ?? [],
          options,
          mostRecentReferralDate: defaults.MostRecentReferralDate,
          savedRefStatus: existing?.RefStatus ?? null,
        });

        reset(
          existing ? recordToValues(existing) : defaultsToValues(defaults, response.client.Region),
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load NOPR Form:', error);
        toast.error(apiMessage(error, 'Failed to load NOPR Form.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [childId, formId, isEdit, reset, onClose]);

  async function saveForm(values: NoprFormValues) {
    try {
      setSaving(true);
      const payload = valuesToPayload(values);

      if (formId !== undefined) {
        await noprFormService.update(childId, formId, payload);
        toast.success('NOPR Form updated successfully.');
      } else {
        await noprFormService.create(childId, payload);
        toast.success('NOPR Form saved successfully.');
      }

      if (onSaved) await onSaved();
      else onClose();
    } catch (error) {
      console.error('Failed to save NOPR Form:', error);
      toast.error(apiMessage(error, 'Failed to save NOPR Form.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading NOPR Form...</div>
        </div>
      </PageContainer>
    );
  }

  if (!lookups) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-red-600">NOPR Form could not be loaded.</div>
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
            {isEdit ? 'Edit No One Plan Resulting Form' : 'New No One Plan Resulting Form'}
          </h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5">
          <div className="space-y-6">
            {/* 1. Client Information */}
            <ClientInformation
              client={lookups.client}
              regionName={lookups.regions.find((r) => r.ID === regionId)?.RName}
              referralDate={lookups.mostRecentReferralDate}
            />

            {/* 2. General Information */}
            <GeneralInformation regions={lookups.regions} />

            {/* 3. Status */}
            <NoprStatus
              options={lookups.options}
              dob={lookups.client.DOB}
              mostRecentReferralDate={lookups.mostRecentReferralDate}
              savedRefStatus={lookups.savedRefStatus}
            />
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
