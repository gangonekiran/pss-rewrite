import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';

import PageContainer from '../../../layouts/PageContainer';
import clientService from '../../../services/client.service';
import type { Client } from '../../../types/client';

import ClientInformation from '../components/ClientInformation';
import GeneralInformation from '../components/GeneralInformation';
import InitialEvaluation from '../components/InitialEvaluation';
import OnePlan from '../components/OnePlan';
import Eligibility from '../components/Eligibility';

import SearchableSelect from '../../../components/select/SearchableSelect';

import activeFormService from '../../../services/active-form.service';
import { activeFormSchema } from '../schemas/active-form.schema';

import {
  DEFAULT_ACTIVE_FORM_VALUES,
  type ActiveFormRecord,
  type ActiveFormValues,
  type DelayReasonsResponse,
  type ActiveFormClient,
  type SupervisoryUnionLookup,
  type TownLookup,
  type ServiceCoordinatorTypeLookup,
  type RegionLookup,
} from '../../../types/active-form';

type Tab = 'general' | 'evaluation' | 'onePlan' | 'eligibility';

type FormMode = 'choose' | 'new' | 'edit';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'evaluation', label: 'Initial Evaluation' },
  { id: 'onePlan', label: 'One Plan' },
  { id: 'eligibility', label: 'Eligibility' },
];

/* -------------------------------------------------------------------------- */
/* Client Selector                                                            */
/* -------------------------------------------------------------------------- */

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
            if (!option) {
              return;
            }

            const childId = Number(option.value);

            if (Number.isInteger(childId) && childId > 0) {
              onChange(childId);
            }
          }}
          placeholder={loading ? 'Loading clients…' : 'Search and select a client'}
          isDisabled={loading}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Mapping                                                               */
/* -------------------------------------------------------------------------- */

function toValues(form: ActiveFormRecord): ActiveFormValues {
  return {
    ...DEFAULT_ACTIVE_FORM_VALUES,
    ...form,

    status: String(form.status ?? form.FormType ?? ''),

    onePlanDate: String(form.onePlanDate ?? form.InitialMeetingDate ?? ''),

    SU_id: form.SU_id == null ? null : Number(form.SU_id),

    ReferralDate: String(form.ReferralDate ?? ''),

    InitialEvalDate: String(form.InitialEvalDate ?? ''),

    Region: String(form.Region ?? ''),

    SUName: String(form.SUName ?? ''),

    Town: String(form.Town ?? ''),

    CountyCode: String(form.CountyCode ?? ''),

    SvcCordFirstName: String(form.SvcCordFirstName ?? ''),

    SvcCordLastName: String(form.SvcCordLastName ?? ''),

    SvcCordType: String(form.SvcCordType ?? ''),
  } as ActiveFormValues;
}

function toPayload(values: ActiveFormValues): ActiveFormRecord {
  const { status, onePlanDate, ...rest } = values;

  return {
    ...rest,
    status,
    onePlanDate,
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ActiveFormPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('general');

  const [loading, setLoading] = useState(false);

  const [clientLoading, setClientLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);

  const [selectedChildId, setSelectedChildId] = useState<number | undefined>();

  const [client, setClient] = useState<ActiveFormClient | null>(null);

  const [currentForm, setCurrentForm] = useState<ActiveFormRecord | undefined>();

  const [existingForms, setExistingForms] = useState<ActiveFormRecord[]>([]);

  const [formMode, setFormMode] = useState<FormMode>('choose');

  const [regions, setRegions] = useState<RegionLookup[]>([]);

  const [unions, setUnions] = useState<SupervisoryUnionLookup[]>([]);

  const [towns, setTowns] = useState<TownLookup[]>([]);

  const [coordinatorTypes, setCoordinatorTypes] = useState<ServiceCoordinatorTypeLookup[]>([]);

  const [reasons, setReasons] = useState<DelayReasonsResponse>({
    family: [],
    provider: [],
  });

  const methods = useForm<ActiveFormValues>({
    resolver: zodResolver(activeFormSchema),
    defaultValues: DEFAULT_ACTIVE_FORM_VALUES,
    mode: 'onBlur',
  });

  const { reset, handleSubmit } = methods;

  /* ------------------------------------------------------------------------ */
  /* Load all clients                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setClientLoading(true);

        const data = await clientService.getAll();

        if (!cancelled) {
          setClients(data);
        }
      } catch (error) {
        console.error(error);
        toast.error('Unable to load clients.');
      } finally {
        if (!cancelled) {
          setClientLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Client selection                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
  if (!selectedChildId) {
    return;
  }

  let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [data, regionRows, suRows, townRows, typeRows, delayRows] = await Promise.all([
          activeFormService.get(selectedChildId),
          activeFormService.regions(),
          activeFormService.supervisoryUnions(),
          activeFormService.towns(),
          activeFormService.serviceCoordinatorTypes(),
          activeFormService.delayReasons(),
        ]);

        if (cancelled) return;

        /* Client */

        setClient(data.client);

        /* Region lookup */

        setRegions(regionRows);

        /* Other lookups */

        setUnions(suRows);

        setTowns(townRows);

        setCoordinatorTypes(typeRows);

        setReasons(delayRows);

        /* Existing Active Forms */

        const forms = Array.isArray(data.forms) ? data.forms : [];

        setExistingForms(forms);

        setCurrentForm(undefined);

        /*
         * If forms exist, let the user choose.
         *
         * If no forms exist, start a new blank Active Form.
         */

        if (forms.length > 0) {
          setFormMode('choose');
        } else {
          setFormMode('new');

          reset({
            ...DEFAULT_ACTIVE_FORM_VALUES,
            Region: data.client.Region ?? '',
          });
        }
      } catch (error) {
        console.error(error);

        setClient(null);

        setCurrentForm(undefined);

        setExistingForms([]);

        setFormMode('choose');

        toast.error('Unable to load Active Form.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChildId, reset]);

  /* ------------------------------------------------------------------------ */
  /* Start new Active Form                                                    */
  /* ------------------------------------------------------------------------ */

  const startNewForm = () => {
    setCurrentForm(undefined);

    setFormMode('new');

    reset({
      ...DEFAULT_ACTIVE_FORM_VALUES,
      Region: client?.Region ?? '',
    });

    setTab('general');
  };

  /* ------------------------------------------------------------------------ */
  /* Open existing Active Form                                                */
  /* ------------------------------------------------------------------------ */

  const openExistingForm = (form: ActiveFormRecord) => {
    setCurrentForm(form);

    setFormMode('edit');

    reset(toValues(form));

    setTab('general');
  };

  /* ------------------------------------------------------------------------ */
  /* Create / Update Active Form                                              */
  /* ------------------------------------------------------------------------ */

  const onSubmit = async (values: ActiveFormValues) => {
    if (!selectedChildId) {
      toast.error('Select a client first.');
      return;
    }

    try {
      setSaving(true);

      const saved = currentForm?.ID
        ? await activeFormService.update(selectedChildId, currentForm.ID, toPayload(values))
        : await activeFormService.create(selectedChildId, toPayload(values));

      setCurrentForm(saved);

      setExistingForms((forms) => forms.map((form) => (form.ID === saved.ID ? saved : form)));

      reset(toValues(saved));

      toast.success(
        currentForm?.ID ? 'Active Form updated successfully.' : 'Active Form created successfully.',
      );
    } catch (error) {
      console.error(error);

      toast.error('Unable to save Active Form.');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Tabs                                                                     */
  /* ------------------------------------------------------------------------ */

  const index = tabs.findIndex((item) => item.id === tab);

  const next = () => setTab(tabs[Math.min(index + 1, tabs.length - 1)].id);

  const previous = () => setTab(tabs[Math.max(index - 1, 0)].id);

  const title = formMode === 'edit' ? 'Active Form' : 'Add Active Form';

  /* ------------------------------------------------------------------------ */
  /* Client selection screen                                                  */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* Loading screen                                                           */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading Active Form…
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Client failed to load                                                    */
  /* ------------------------------------------------------------------------ */

  if (!client) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <ClientSelector
            clients={clients}
            value={selectedChildId}
            onChange={setSelectedChildId}
            loading={clientLoading}
          />

          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Client could not be loaded.
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Existing forms selection                                                 */
  /* ------------------------------------------------------------------------ */

  if (formMode === 'choose') {
    return (
      <PageContainer>
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Active Form</h1>

              <p className="mt-1 text-sm text-gray-500">
                {client.FirstName} {client.LastName}
                {' — '}
                Child ID: {client.ChildID}
              </p>
            </div>

            <div className="space-y-3">
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
                      Form Date: {form.FormDate || 'Not entered'}
                      {' · '}
                      Referral Date: {form.ReferralDate || 'Not entered'}
                    </div>
                  </div>

                  <span className="text-sm font-medium text-green-700">Open</span>
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-gray-200 pt-5">
              <button
                type="button"
                onClick={startNewForm}
                className="inline-flex h-10 items-center rounded-md bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800"
              >
                + New Active Form
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={() => {
              setSelectedChildId(undefined);

              setExistingForms([]);

              setCurrentForm(undefined);

              setFormMode('choose');

              navigate('/active-form');
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            Back to Client Selection
          </button>
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Active Form                                                              */
  /* ------------------------------------------------------------------------ */

  return (
    <PageContainer>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

              <p className="text-sm text-gray-500">Child ID: {client.ChildID}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentForm(undefined);

                  setFormMode(existingForms.length > 0 ? 'choose' : 'new');

                  if (existingForms.length === 0) {
                    reset({
                      ...DEFAULT_ACTIVE_FORM_VALUES,
                      Region: client.Region ?? '',
                    });
                  }

                  setTab('general');
                }}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
              >
                <Save size={16} />

                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <ClientInformation client={client} form={currentForm} />

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
              {tabs.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium ${
                    tab === item.id
                      ? 'border-green-700 bg-white text-green-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-5">
              {tab === 'general' && (
                <GeneralInformation
                  regions={regions}
                  unions={unions}
                  towns={towns}
                  coordinatorTypes={coordinatorTypes}
                />
              )}

              {tab === 'evaluation' && <InitialEvaluation reasons={reasons} dob={client.DOB} />}

              {tab === 'onePlan' && <OnePlan reasons={reasons} dob={client.DOB} />}

              {tab === 'eligibility' && <Eligibility />}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={previous}
              disabled={index === 0}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {index < tabs.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-green-700 px-5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
              >
                <Check size={16} />
                Save Active Form
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </PageContainer>
  );
}
