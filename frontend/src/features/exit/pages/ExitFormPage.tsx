import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, TriangleAlert, X } from 'lucide-react';

import PageContainer from '../../../layouts/PageContainer';
import commonInfoService from '../../../services/common-info.service';
import exitFormService from '../../../services/exit-form.service';
import type { RegionLookup } from '../../../types/common';
import {
  DEFAULT_EXIT_FORM_VALUES,
  type ExitFormClient,
  type ExitFormOptions,
  type ExitFormValues,
} from '../../../types/exit-form';

import ClientInformation from '../../active-form/components/ClientInformation';
import ExitDetails from '../components/ExitDetails';
import GeneralInformation from '../components/GeneralInformation';
import TransitionInformation from '../components/TransitionInformation';
import { createExitFormSchema } from '../schemas/exit-form.schema';
import { defaultsToValues, recordToValues, valuesToPayload } from '../utils/exit-form.mappers';

export interface ExitFormPageProps {
  childId: number;
  /** Omit to create a new Exit form. */
  formId?: number;
  onClose: () => void;
  onSaved?: () => Promise<void>;
}

interface Lookups {
  client: ExitFormClient;
  regions: RegionLookup[];
  options: ExitFormOptions;
  warnings: string[];
}

function apiMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback;
  }
  return fallback;
}

/** Read-only client card + General Information, sharing the live region and referral date. */
function ClientAndGeneral({ lookups, control }: { lookups: Lookups; control: Control<ExitFormValues> }) {
  const [regionId, referralDate] = useWatch({ control, name: ['Region', 'ReferralDate'] });

  return (
    <>
      <ClientInformation
        client={lookups.client}
        regionName={lookups.regions.find((r) => r.ID === regionId)?.RName}
        referralDate={referralDate}
      />

      <GeneralInformation regions={lookups.regions} />
    </>
  );
}

export default function ExitFormPage({ childId, formId, onClose, onSaved }: ExitFormPageProps) {
  const isEdit = formId !== undefined;

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dob = lookups?.client.DOB ?? null;
  const schema = useMemo(() => createExitFormSchema(dob), [dob]);

  const methods = useForm<ExitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_EXIT_FORM_VALUES,
    mode: 'onSubmit',
  });
  const { reset, handleSubmit, control } = methods;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [exitResponse, regions, options, defaults] = await Promise.all([
          exitFormService.get(childId),
          commonInfoService.regions(),
          exitFormService.options(),
          isEdit ? Promise.resolve(null) : exitFormService.defaults(childId),
        ]);
        if (cancelled) return;

        /*
         * EDIT MODE
         */
        const existing = isEdit
          ? exitResponse.forms.find((form) => Number(form.ID) === Number(formId))
          : undefined;

        if (isEdit && !existing) {
          toast.error('Exit Form record not found.');
          onClose();
          return;
        }

        setLookups({
          client: exitResponse.client,
          regions: regions ?? [],
          options,
          warnings: defaults?.warnings ?? [],
        });

        /*
         * NEW MODE: prefill from the latest Active / Referral form.
         */
        reset(existing ? recordToValues(existing) : defaultsToValues(defaults, exitResponse.client.Region));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load Exit Form:', error);
        toast.error(apiMessage(error, 'Failed to load Exit Form.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [childId, formId, isEdit, reset, onClose]);

  async function saveForm(values: ExitFormValues) {
    try {
      setSaving(true);
      const payload = valuesToPayload(values);

      if (formId !== undefined) {
        await exitFormService.update(childId, formId, payload);
        toast.success('Exit Form updated successfully.');
      } else {
        await exitFormService.create(childId, payload);
        toast.success('Exit Form saved successfully.');
      }

      /*
       * Refresh parent history after a successful save.
       */
      if (onSaved) await onSaved();
      else onClose();
    } catch (error) {
      console.error('Failed to save Exit Form:', error);
      toast.error(apiMessage(error, 'Failed to save Exit Form.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading Exit Form...</div>
        </div>
      </PageContainer>
    );
  }

  if (!lookups) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-red-600">Exit Form could not be loaded.</div>
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
          <h1 className="text-lg font-semibold text-gray-800">{isEdit ? 'Edit Exit Form' : 'New Exit Form'}</h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5">
          <div className="space-y-6">
            {lookups.warnings.length > 0 && (
              <div
                role="alert"
                className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <div>
                  {lookups.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Client Information + 2. General Information */}
            <ClientAndGeneral lookups={lookups} control={control} />

            {/* 3. Transition Information */}
            <TransitionInformation dob={dob} />

            {/* 4. Exit Details */}
            <ExitDetails options={lookups.options} dob={dob} />
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
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
