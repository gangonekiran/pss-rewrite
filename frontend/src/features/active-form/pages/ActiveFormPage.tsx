import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import axios from 'axios';

import PageContainer from '../../../layouts/PageContainer';
import activeFormService from '../../../services/active-form.service';

import ClientInformation from '../components/ClientInformation';
import GeneralInformation from '../components/GeneralInformation';
import InitialEvaluation from '../components/InitialEvaluation';
import OnePlan from '../components/OnePlan';
import Eligibility from '../components/Eligibility';

import { activeFormSchema } from '../schemas/active-form.schema';

import {
  DEFAULT_ACTIVE_FORM_VALUES,
  type ActiveFormRecord,
  type ActiveFormValues,
  type ActiveFormClient,
  type DelayReasonsResponse,
  type RegionLookup,
} from '../../../types/active-form';

interface ActiveFormPageProps {
  childId: number;
  onClose: () => void;
  onSaved?: () => Promise<void>;
  formId?: number;
}

function toDateInput(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toValues(form: ActiveFormRecord): ActiveFormValues {
  const delayReason = form.DelayFC
    ? `family::${String(form.DelayFC)}`
    : form.DelayNotFC
      ? `provider::${String(form.DelayNotFC)}`
      : String(form.DelayReason ?? '');

  const meetingDelayReason = form.MeetingDelayFC
    ? `family::${String(form.MeetingDelayFC)}`
    : form.MeetingDelayNC
      ? `provider::${String(form.MeetingDelayNC)}`
      : String(form.MeetingDelayReason ?? '');

  return {
    Region: Number(form.Region ?? 0),

    SvcCordFirstName: String(form.SvcCordFirstName ?? ''),
    SvcCordLastName: String(form.SvcCordLastName ?? ''),

    ReferralDate: toDateInput(form.ReferralDate),
    status: String(form.status ?? form.FormType ?? ''),

    InitialEvalDate: toDateInput(form.InitialEvalDate),

    DelayReason: delayReason,
    DelayDetails: String(form.DelayDetails ?? ''),

    MeetingDelayReason: meetingDelayReason,
    MeetingDelayDetails: String(form.MeetingDelayDetails ?? ''),

    onePlanDate: toDateInput(
      (form.onePlanDate ?? form.InitialMeetingDate) as string | null | undefined,
    ),

    DDAll: Boolean(form.DDAll),
    DDAdaptive: Boolean(form.DDAdaptive),
    DDCognitive: Boolean(form.DDCognitive),
    DDCommunication: Boolean(form.DDCommunication),
    DDMotor: Boolean(form.DDMotor),
    DDSocial: Boolean(form.DDSocial),

    DCAttachment: Boolean(form.DCAttachment),
    DCAutism: Boolean(form.DCAutism),
    DCSuspected: Boolean(form.DCSuspected),
    DCBlind: Boolean(form.DCBlind),
    DCDeaf: Boolean(form.DCDeaf),
    DCDown: Boolean(form.DCDown),

    DCCerebral: Boolean(form.DCCerebral),
    DCCraniofacial: Boolean(form.DCCraniofacial),
    DCFragile: Boolean(form.DCFragile),
    DCOral: Boolean(form.DCOral),

    DCBirth: Boolean(form.DCBirth),
    DCTorticollis: Boolean(form.DCTorticollis),
    DCPlagiocephaly: Boolean(form.DCPlagiocephaly),
    DCPrematurity: Boolean(form.DCPrematurity),

    DCBehavior: Boolean(form.DCBehavior),
    DCNutrition: Boolean(form.DCNutrition),
    DCNAS: Boolean(form.DCNAS),
    DCCysticFibrosis: Boolean(form.DCCysticFibrosis),

    DCHIE: Boolean(form.DCHIE),
    DCFeeding: Boolean(form.DCFeeding),

    DCOtherDesc: String(form.DCOtherDesc ?? ''),

    NMNEI: Boolean(form.NMNEI),

    AutismDate: toDateInput(form.AutismDate),
    SuspectedDate: toDateInput(form.SuspectedDate),
    BlindDate: toDateInput(form.BlindDate),
    DeafDate: toDateInput(form.DeafDate),
  };
}

function toPayload(values: ActiveFormValues, isNew: boolean) {
  const familyDelay = values.DelayReason?.startsWith('family::')
    ? values.DelayReason.replace('family::', '')
    : '';

  const providerDelay = values.DelayReason?.startsWith('provider::')
    ? values.DelayReason.replace('provider::', '')
    : '';

  const familyMeetingDelay = values.MeetingDelayReason?.startsWith('family::')
    ? values.MeetingDelayReason.replace('family::', '')
    : '';

  const providerMeetingDelay = values.MeetingDelayReason?.startsWith('provider::')
    ? values.MeetingDelayReason.replace('provider::', '')
    : '';

  return {
    ...(isNew
    ? {
        FormDate: new Date().toISOString().slice(0, 10),
      }
    : {}),
    Region: values.Region,

    SvcCordFirstName: values.SvcCordFirstName,
    SvcCordLastName: values.SvcCordLastName,

    ReferralDate: values.ReferralDate || null,
    status: values.status,

    InitialEvalDate: values.InitialEvalDate || null,

    DelayReason: values.DelayReason || null,
    DelayDetails: values.DelayDetails || null,

    DelayFC: familyDelay || null,
    DelayNotFC: providerDelay || null,

    MeetingDelayReason: values.MeetingDelayReason || null,
    MeetingDelayDetails: values.MeetingDelayDetails || null,

    MeetingDelayFC: familyMeetingDelay || null,
    MeetingDelayNC: providerMeetingDelay || null,

    /*
     * Active Form One Plan date
     * -> legacy InitialMeetingDate column
     */
    InitialMeetingDate: values.onePlanDate || null,

    DDAll: values.DDAll,
    DDAdaptive: values.DDAdaptive,
    DDCognitive: values.DDCognitive,
    DDCommunication: values.DDCommunication,
    DDMotor: values.DDMotor,
    DDSocial: values.DDSocial,

    DCAttachment: values.DCAttachment,
    DCAutism: values.DCAutism,
    DCSuspected: values.DCSuspected,
    DCBlind: values.DCBlind,
    DCDeaf: values.DCDeaf,
    DCDown: values.DCDown,

    DCCerebral: values.DCCerebral,
    DCCraniofacial: values.DCCraniofacial,
    DCFragile: values.DCFragile,
    DCOral: values.DCOral,

    DCBirth: values.DCBirth,
    DCTorticollis: values.DCTorticollis,
    DCPlagiocephaly: values.DCPlagiocephaly,
    DCPrematurity: values.DCPrematurity,

    DCBehavior: values.DCBehavior,
    DCNutrition: values.DCNutrition,
    DCNAS: values.DCNAS,
    DCCysticFibrosis: values.DCCysticFibrosis,

    DCHIE: values.DCHIE,
    DCFeeding: values.DCFeeding,

    DCOtherDesc: values.DCOtherDesc,

    NMNEI: values.NMNEI,

    AutismDate: values.AutismDate || null,
    SuspectedDate: values.SuspectedDate || null,
    BlindDate: values.BlindDate || null,
    DeafDate: values.DeafDate || null,
  };
}

function validateDates(
  values: ActiveFormValues,
  dob: string | null | undefined,
): string | null {
  if (!dob) {
    return null;
  }

  const dobDate = new Date(dob);

  if (Number.isNaN(dobDate.getTime())) {
    return null;
  }

  const dates: Array<[string, string]> = [
    ['Referral Date', values.ReferralDate],
    ['Initial Evaluation Date', values.InitialEvalDate],
    ['One Plan Date', values.onePlanDate],
    ['ASD Diagnosis Date', values.AutismDate],
    ['Suspected ASD Diagnosis Date', values.SuspectedDate],
    ['Vision Diagnosis Date', values.BlindDate],
    ['Hearing Diagnosis Date', values.DeafDate],
  ];

  for (const [label, value] of dates) {
    if (!value) continue;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) continue;

    if (date < dobDate) {
      return `${label} cannot be before Date of Birth.`;
    }
  }

  if (values.ReferralDate && values.InitialEvalDate) {
    const referralDate = new Date(values.ReferralDate);
    const initialEvalDate = new Date(values.InitialEvalDate);

    if (initialEvalDate < referralDate) {
      return 'Initial Evaluation Date cannot be before Referral Date.';
    }
  }

  if (values.ReferralDate && values.onePlanDate) {
    const referralDate = new Date(values.ReferralDate);
    const onePlanDate = new Date(values.onePlanDate);

    if (onePlanDate < referralDate) {
      return 'One Plan Date cannot be before Referral Date.';
    }
  }

  return null;
}

export default function ActiveFormPage({
  childId,
  onClose,
  onSaved,
  formId,
}: ActiveFormPageProps) {
  const [client, setClient] = useState<ActiveFormClient | null>(null);

  const [regions, setRegions] = useState<RegionLookup[]>([]);

  const [reasons, setReasons] = useState<DelayReasonsResponse>({
    family: [],
    provider: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const methods = useForm<ActiveFormValues>({
    resolver: zodResolver(activeFormSchema),
    defaultValues: DEFAULT_ACTIVE_FORM_VALUES,
    mode: 'onSubmit',
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [activeResponse, regionResponse, reasonResponse] = await Promise.all([
          activeFormService.get(childId),
          activeFormService.regions(),
          activeFormService.delayReasons(),
        ]);

        if (cancelled) return;

        const loadedClient = activeResponse.client;

        setClient(loadedClient);
        setRegions(regionResponse ?? []);

        setReasons(
          reasonResponse ?? {
            family: [],
            provider: [],
          },
        );

        /*
         * EDIT MODE
         */
        if (formId !== undefined) {
          const existing = activeResponse.forms.find(
            (form) => Number(form.ID) === Number(formId),
          );

          if (!existing) {
            toast.error('Active Form record not found.');
            onClose();
            return;
          }

          reset(toValues(existing));
          return;
        }

        /*
         * NEW MODE
         */
        reset({
          ...DEFAULT_ACTIVE_FORM_VALUES,
          Region: Number(loadedClient.Region ?? 0),
        });
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to load Active Form:', error);

        toast.error('Failed to load Active Form.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [childId, formId, reset, onClose]);

  async function saveForm(values: ActiveFormValues) {
    if (!client) {
      toast.error('Client information is not available.');
      return;
    }

    const dateError = validateDates(values, client.DOB);

    if (dateError) {
      toast.error(dateError);
      return;
    }

    try {
      setSaving(true);

      const payload = toPayload(values, formId === undefined);

      /*
       * EDIT
       */
      if (formId !== undefined) {
        await activeFormService.update(childId, formId, payload);

        toast.success('Active Form updated successfully.');
      } else {
        /*
         * NEW
         */
        await activeFormService.create(childId, payload);

        toast.success('Active Form saved successfully.');
      }

      /*
       * Refresh parent history after a successful save/update.
       */
      if (onSaved) {
        await onSaved();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save Active Form:', error);

      let message = 'Failed to save Active Form.';

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ??
          error.response?.data?.error ??
          message;
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-gray-500">
            Loading Active Form...
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!client) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-sm text-red-600">
            Client information could not be loaded.
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(saveForm)}
        className="flex min-h-full flex-col bg-white"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {formId !== undefined ? 'Edit Active Form' : 'New Active Form'}
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5">
          <div className="space-y-6">
            {/* 1. Client Information */}
            <ClientInformation client={client} />

            {/* 2. General Information */}
            <GeneralInformation regions={regions} />

            {/* 3. Initial Evaluation / Assessment */}
            <InitialEvaluation reasons={reasons} dob={client.DOB} />

            {/* 4. One Plan */}
            <OnePlan reasons={reasons} dob={client.DOB} />

            {/* 5. Eligibility */}
            <Eligibility dob={client.DOB} />
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