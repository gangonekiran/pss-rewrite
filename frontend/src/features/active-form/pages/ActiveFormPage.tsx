import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, Save } from 'lucide-react';

import PageContainer from '../../../layouts/PageContainer';
import clientService from '../../../services/client.service';
import type { Client } from '../../../types/client';
import SearchableSelect from '../../../components/select/SearchableSelect';
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

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US');
}

function toDateInput(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const valueString = String(value).trim();

  // Never allow boolean values into <input type="date">
  if (valueString === 'true' || valueString === 'false') {
    return '';
  }

  // Only return a valid HTML date value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valueString.slice(0, 10))) {
    return '';
  }

  return valueString.slice(0, 10);
}

function toValues(form: ActiveFormRecord): ActiveFormValues {
  return {
    ...DEFAULT_ACTIVE_FORM_VALUES,
    // ...form,

    status: String(form.status ?? form.FormType ?? ''),

    ReferralDate: toDateInput(form.ReferralDate),
    InitialEvalDate: toDateInput(form.InitialEvalDate),

    onePlanDate: toDateInput(form.onePlanDate ?? form.InitialMeetingDate),

    DelayReason: form.DelayFC
      ? `family::${form.DelayFC}`
      : form.DelayNotFC
        ? `provider::${form.DelayNotFC}`
        : String(form.DelayReason ?? ''),

    DelayDetails: String(
      form.DelayFCOther ??
        form.DelayNotFCOther ??
        form.DelayDetails ??
        '',
    ),

    MeetingDelayReason: form.MeetingDelayFC
      ? `family::${form.MeetingDelayFC}`
      : form.MeetingDelayNC
        ? `provider::${form.MeetingDelayNC}`
        : String(form.MeetingDelayReason ?? ''),

    MeetingDelayDetails: String(
      form.MeetingDelayFCOther ??
        form.MeetingDelayNCOther ??
        form.MeetingDelayDetails ??
        '',
    ),

    Region: Number(form.Region ?? 0),

    SvcCordFirstName: String(form.SvcCordFirstName ?? ''),
    SvcCordLastName: String(form.SvcCordLastName ?? ''),

    AutismDate: toDateInput(form.AutismDate),
    SuspectedDate: toDateInput(form.SuspectedDate),
    BlindDate: toDateInput(form.BlindDate),
    DeafDate: toDateInput(form.DeafDate),

    NMNEI: Boolean(form.NMNEI),

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
  };
}

function toPayload(values: ActiveFormValues): ActiveFormRecord {
  const familyInitial =
    values.DelayReason && !values.DelayReason.startsWith('provider::')
      ? values.DelayReason.replace(/^family::/, '')
      : '';
  const providerInitial = values.DelayReason?.startsWith('provider::')
    ? values.DelayReason.replace(/^provider::/, '')
    : '';
  const familyOnePlan =
    values.MeetingDelayReason && !values.MeetingDelayReason.startsWith('provider::')
      ? values.MeetingDelayReason.replace(/^family::/, '')
      : '';
  const providerOnePlan = values.MeetingDelayReason?.startsWith('provider::')
    ? values.MeetingDelayReason.replace(/^provider::/, '')
    : '';

  return {
    ...values,
    DelayFC: familyInitial,
    DelayNotFC: providerInitial,
    DelayFCOther: familyInitial === 'Other reasons' ? values.DelayDetails : '',
    DelayNotFCOther: providerInitial === 'Other reasons' ? values.DelayDetails : '',
    MeetingDelayFC: familyOnePlan,
    MeetingDelayNC: providerOnePlan,
    MeetingDelayFCOther: familyOnePlan === 'Other reasons' ? values.MeetingDelayDetails : '',
    MeetingDelayNCOther: providerOnePlan === 'Other reasons' ? values.MeetingDelayDetails : '',
  };
}

function validateAgainstDob(values: ActiveFormValues, dob: string | null) {
  if (!dob) return null;
  const childDob = toDateInput(dob);
  const checks: Array<[string, string, string]> = [
    ['ReferralDate', values.ReferralDate, "Referral date cannot be before the child's DOB."],
    [
      'InitialEvalDate',
      values.InitialEvalDate,
      "Initial evaluation cannot be before the child's DOB.",
    ],
    ['onePlanDate', values.onePlanDate, "One Plan date cannot be before the child's DOB."],
    ['AutismDate', values.AutismDate, "ASD diagnosis date cannot be before the child's DOB."],
    [
      'SuspectedDate',
      values.SuspectedDate,
      "Suspected ASD diagnosis date cannot be before the child's DOB.",
    ],
    ['BlindDate', values.BlindDate, "Vision diagnosis date cannot be before the child's DOB."],
    ['DeafDate', values.DeafDate, "Hearing diagnosis date cannot be before the child's DOB."],
  ];

  const invalid = checks.find(([, value]) => value && value < childDob);
  return invalid ? invalid[2] : null;
}

function ClientSelector({
  clients,
  value,
  onChange,
  loading,
}: {
  clients: Client[];
  value?: number;
  onChange: (childId: number) => void;
  loading: boolean;
}) {
  const options = clients
    .filter((client) => client.childId != null)
    .map((client) => ({
      value: client.childId!,
      label: [
        client.childId,
        client.firstName,
        client.lastName,
        client.ss ? `SSN: ${client.ss}` : '',
      ]
        .filter(Boolean)
        .join(' — '),
    }));

  const selectedOption =
    value != null ? (options.find((option) => option.value === value) ?? null) : null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Select Client</h2>
        <p className="text-xs text-gray-500">
          Select an existing client before starting the Active Form.
        </p>
      </div>
      <div className="max-w-xl">
        <SearchableSelect
          options={options}
          value={selectedOption}
          onChange={(option) => {
            const childId = Number(option?.value);
            if (Number.isInteger(childId) && childId > 0) onChange(childId);
          }}
          placeholder={loading ? 'Loading clients…' : 'Search and select a client'}
          isDisabled={loading}
        />
      </div>
    </section>
  );
}

export default function ActiveFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ childId?: string; id?: string }>();
  const routeChildId = Number(params.childId);
  const routeFormId = Number(params.id);
  const routeEdit =
    Number.isInteger(routeChildId) &&
    routeChildId > 0 &&
    Number.isInteger(routeFormId) &&
    routeFormId > 0;
  const routeNew = Number.isInteger(routeChildId) && routeChildId > 0 && !params.id;
  const isEdit = Boolean(params.id);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientLoading, setClientLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(
    routeChildId > 0 ? routeChildId : undefined,
  );
  const [client, setClient] = useState<ActiveFormClient | null>(null);
  const [existingForms, setExistingForms] = useState<ActiveFormRecord[]>([]);
  const [currentForm, setCurrentForm] = useState<ActiveFormRecord | undefined>();
  const [regions, setRegions] = useState<RegionLookup[]>([]);
  const [reasons, setReasons] = useState<DelayReasonsResponse>({ family: [], provider: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const methods = useForm<ActiveFormValues>({
    resolver: zodResolver(activeFormSchema),
    defaultValues: DEFAULT_ACTIVE_FORM_VALUES,
    mode: 'onBlur',
  });
  const { reset, getValues, handleSubmit } = methods;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await clientService.getAll();
        if (!cancelled) setClients(data);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load clients.');
      } finally {
        if (!cancelled) setClientLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const [data, regionRows, delayRows] = await Promise.all([
          activeFormService.get(selectedChildId),
          activeFormService.regions(),
          activeFormService.delayReasons(),
        ]);
        if (cancelled) return;

        setClient(data.client);
        setRegions(regionRows);
        setReasons(delayRows);
        setExistingForms(Array.isArray(data.forms) ? data.forms : []);

        if (routeEdit) {
          const selected = data.forms.find((form) => Number(form.ID) === routeFormId);
          if (!selected) {
            toast.error('Active Form record not found.');
            navigate('/active-form');
            return;
          }
          setCurrentForm(selected);
          reset(toValues(selected));
          return;
        }

        if (routeNew) {
          setCurrentForm(undefined);
          reset({ ...DEFAULT_ACTIVE_FORM_VALUES, Region: Number(data.client.Region ?? 0) });
          return;
        }

        setCurrentForm(undefined);
        reset(DEFAULT_ACTIVE_FORM_VALUES);
      } catch (error) {
        console.error(error);
        setClient(null);
        toast.error('Unable to load Active Form.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChildId, reset, routeEdit, routeNew, routeFormId, navigate]);

  const startNewForm = () => {
    if (!client) return;
    setCurrentForm(undefined);
    reset({ ...DEFAULT_ACTIVE_FORM_VALUES, Region: Number(client.Region ?? 0) });
    navigate(`/active-form/new/${client.ChildID}`);
  };

  const openExistingForm = (form: ActiveFormRecord) => {
    if (!selectedChildId || !form.ID) return;
    navigate(`/active-form/edit/${selectedChildId}/${form.ID}`);
  };

  const saveForm = async (values: ActiveFormValues, draft: boolean) => {
    if (!selectedChildId) {
      toast.error('Select a client first.');
      return;
    }

    const dobError = validateAgainstDob(values, client?.DOB ?? null);
    if (dobError) {
      toast.error(dobError);
      return;
    }

    try {
      setSaving(true);
      const saved = currentForm?.ID
        ? await activeFormService.update(selectedChildId, currentForm.ID, toPayload(values))
        : await activeFormService.create(selectedChildId, toPayload(values));

      setCurrentForm(saved);
      setExistingForms((forms) => {
        const exists = forms.some((form) => form.ID === saved.ID);
        return exists
          ? forms.map((form) => (form.ID === saved.ID ? saved : form))
          : [saved, ...forms];
      });
      reset(toValues(saved));

      if (saved.ID) navigate(`/active-form/edit/${selectedChildId}/${saved.ID}`, { replace: true });
      toast.success(
        draft
          ? 'Active Form draft saved.'
          : isEdit
            ? 'Active Form updated successfully.'
            : 'Active Form saved successfully.',
      );
    } catch (error) {
      console.error(error);
      toast.error(draft ? 'Unable to save Active Form draft.' : 'Unable to save Active Form.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => saveForm(getValues(), true);
  const save = handleSubmit((values) => saveForm(values, false));

  const title = currentForm?.ID ? 'Edit Active Form' : 'Add New Active Form';

  const clientInfo = useMemo(() => {
    if (!client) return null;
    return {
      childName: `${client.FirstName ?? ''} ${client.LastName ?? ''}`.trim(),
      dob: formatDate(client.DOB),
    };
  }, [client]);

  if (!selectedChildId) {
    return (
      <PageContainer>
        <ClientSelector
          clients={clients}
          value={selectedChildId}
          onChange={setSelectedChildId}
          loading={clientLoading}
        />
      </PageContainer>
    );
  }

  if (loading || !client) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {loading ? 'Loading Active Form…' : 'Client could not be loaded.'}
        </div>
      </PageContainer>
    );
  }

  if (!routeEdit && !routeNew && existingForms.length > 0) {
    return (
      <PageContainer>
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Active Form</h1>
            <p className="mt-1 text-sm text-gray-500">
              {clientInfo?.childName} — Child ID: {client.ChildID}
            </p>
            <div className="mt-5 space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Existing Active Forms</h2>
              {existingForms.map((form) => (
                <button
                  key={form.ID}
                  type="button"
                  onClick={() => openExistingForm(form)}
                  className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white p-4 text-left hover:border-green-600 hover:bg-green-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">Active Form #{form.ID}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Referral Date:{' '}
                      {form.ReferralDate ? formatDate(form.ReferralDate) : 'Not entered'}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-700">Open</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={startNewForm}
              className="mt-5 inline-flex h-10 items-center rounded-md bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800"
            >
              + New Active Form
            </button>
          </section>
          <button
            type="button"
            onClick={() => {
              setSelectedChildId(undefined);
              setClient(null);
              setExistingForms([]);
              navigate('/active-form');
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={16} /> Back to Client Selection
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FormProvider {...methods}>
        <form onSubmit={save} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">Child ID: {client.ChildID}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/active-form')}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <Save size={16} /> Save Draft
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-green-700 px-5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
              >
                <Save size={16} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <ClientInformation client={client} />
          <GeneralInformation regions={regions} />
          <InitialEvaluation reasons={reasons} dob={client.DOB} />
          <OnePlan reasons={reasons} dob={client.DOB} />
          <Eligibility dob={client.DOB} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/active-form')}
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-green-700 px-6 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
            >
              <Save size={16} /> Save
            </button>
          </div>
        </form>
      </FormProvider>
    </PageContainer>
  );
}
