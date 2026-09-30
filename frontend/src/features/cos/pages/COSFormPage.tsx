import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import inputFormService from '../../../services/input-form.service';
import { Field } from '../../active-form/components/FormField';
import type { RegionLookup } from '../../../types/common';

interface COSFormPageProps {
  childId: number;
  formId?: number;
  regions: RegionLookup[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface COSFormData {
  FormDate: string;
  FormType: string;
  Region: string;
  OnePlanDate: string;
  EntryOrExit: -1 | 0;
  ExitDate: string;

  Outcome1: number | null;
  Outcome1Support: number | null;

  Outcome2: number | null;
  Outcome2Support: number | null;

  Outcome3: number | null;
  Outcome3Support: number | null;
}

interface COSFormErrors {
  Region?: string;
  OnePlanDate?: string;
  ExitDate?: string;
  Outcome1?: string;
  Outcome1Support?: string;
  Outcome2?: string;
  Outcome2Support?: string;
  Outcome3?: string;
  Outcome3Support?: string;
}

const OUTCOME_TITLES = [
  'Positive Social-Emotional Skills (including Social Relationships)',
  'Acquiring and Using Knowledge and Skills',
  'Taking Action to Meet Needs',
];

function getToday(): string {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function toDateInput(value: unknown): string {
  if (!value) {
    return '';
  }

  const stringValue = String(value).trim();

  const match = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] ?? '';
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function createInitialForm(): COSFormData {
  return {
    FormDate: getToday(),
    FormType: 'COS',
    Region: '',
    OnePlanDate: '',
    EntryOrExit: -1,
    ExitDate: '',

    Outcome1: null,
    Outcome1Support: null,

    Outcome2: null,
    Outcome2Support: null,

    Outcome3: null,
    Outcome3Support: null,
  };
}

export default function COSFormPage({
  childId,
  formId,
  regions,
  onClose,
  onSaved,
}: COSFormPageProps) {
  console.log(regions);

  const [form, setForm] = useState<COSFormData>(createInitialForm);

  const [errors, setErrors] = useState<COSFormErrors>({});

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  /*
   * Load existing COS form
   */
  useEffect(() => {
    let cancelled = false;

    async function loadForm() {
      if (!formId) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await inputFormService.getOne(
          'cos-cover',
          childId,
          formId,
        );

        if (cancelled) {
          return;
        }

        setForm({
          FormDate: toDateInput(data.FormDate),

          FormType: getString(data.FormType, 'COS'),

          Region: data.Region != null ? String(data.Region) : '',

          OnePlanDate: toDateInput(data.OnePlanDate),

          EntryOrExit: getNumber(data.EntryOrExit) === -1 ? -1 : 0,

          ExitDate: toDateInput(data.ExitDate),

          Outcome1: getNumber(data.Outcome1),

          Outcome1Support: getNumber(data.Outcome1Support),

          Outcome2: getNumber(data.Outcome2),

          Outcome2Support: getNumber(data.Outcome2Support),

          Outcome3: getNumber(data.Outcome3),

          Outcome3Support: getNumber(data.Outcome3Support),
        });
      } catch (err) {
        console.error('Unable to load COS form:', err);

        if (!cancelled) {
          setError('Unable to load COS form.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [childId, formId]);

  function updateForm(changes: Partial<COSFormData>): void {
    setForm((current) => ({
      ...current,
      ...changes,
    }));

    setErrors({});
    setError('');
  }

  function handleEntryExitChange(value: -1 | 0): void {
    updateForm({
      EntryOrExit: value,
      ExitDate: value === -1 ? '' : form.ExitDate,
    });
  }

  function validate(): boolean {
    const nextErrors: COSFormErrors = {};

    if (!form.Region.trim()) {
      nextErrors.Region = 'Region is required.';
    }

    if (!form.OnePlanDate) {
      nextErrors.OnePlanDate = 'One Plan Date is required.';
    }

    if (form.EntryOrExit === 0 && !form.ExitDate) {
      nextErrors.ExitDate = 'Exit Date is required for an Exit COS.';
    }

    if (form.Outcome1 === null) {
      nextErrors.Outcome1 = 'COS Score is required.';
    }

    if (form.Outcome1Support === null) {
      nextErrors.Outcome1Support = 'Progress Met is required.';
    }

    if (form.Outcome2 === null) {
      nextErrors.Outcome2 = 'COS Score is required.';
    }

    if (form.Outcome2Support === null) {
      nextErrors.Outcome2Support = 'Progress Met is required.';
    }

    if (form.Outcome3 === null) {
      nextErrors.Outcome3 = 'COS Score is required.';
    }

    if (form.Outcome3Support === null) {
      nextErrors.Outcome3Support = 'Progress Met is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave(): Promise<void> {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        FormDate: form.FormDate,
        FormType: form.FormType,
        Region: form.Region.trim(),
        OnePlanDate: form.OnePlanDate,
        EntryOrExit: form.EntryOrExit,

        ExitDate: form.EntryOrExit === 0 ? form.ExitDate : undefined,

        Outcome1: form.Outcome1,
        Outcome1Support: form.Outcome1Support,

        Outcome2: form.Outcome2,
        Outcome2Support: form.Outcome2Support,

        Outcome3: form.Outcome3,
        Outcome3Support: form.Outcome3Support,
      };

      if (formId) {
        await inputFormService.update(
          'cos-cover',
          childId,
          formId,
          payload,
        );

        toast.success('COS Form updated successfully.');
      } else {
        await inputFormService.create(
          'cos-cover',
          childId,
          payload,
        );

        toast.success('COS Form added successfully.');
      }

      await onSaved();
    } catch (err) {
      console.error('Unable to save COS form:', err);

      setError('Unable to save COS form.');
      toast.error('Unable to save COS form.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading COS form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      {/* =====================================================
          PAGE TITLE
      ====================================================== */}
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-bold text-[#101b4c]">
          Child Outcome Summary (COS)
        </h1>
      </div>

      <div className="space-y-6 p-5">
        {/* =====================================================
            GENERAL INFORMATION
        ====================================================== */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* REGION */}
            <Field label="Region" required error={errors.Region}>
              <select
                value={form.Region}
                onChange={(event) =>
                  updateForm({
                    Region: event.target.value,
                  })
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select region</option>

                {regions.map((region) => (
                  <option key={region.ID} value={region.ID}>
                    {region.RName}
                  </option>
                ))}
              </select>
            </Field>

            {/* ONE PLAN DATE */}
            <Field
              label="One Plan Date"
              required
              error={errors.OnePlanDate}
            >
              <input
                type="date"
                value={form.OnePlanDate}
                onChange={(event) =>
                  updateForm({
                    OnePlanDate: event.target.value,
                  })
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </Field>

            {/* COS TYPE */}
            <Field label="COS Type" required>
              <div className="flex h-10 items-center gap-8">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="cosType"
                    value="-1"
                    checked={form.EntryOrExit === -1}
                    onChange={() => handleEntryExitChange(-1)}
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span>Entry</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="cosType"
                    value="0"
                    checked={form.EntryOrExit === 0}
                    onChange={() => handleEntryExitChange(0)}
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span>Exit</span>
                </label>
              </div>
            </Field>

            {/* EXIT DATE */}
            <Field label="Exit Date" error={errors.ExitDate}>
              <input
                type="date"
                value={form.ExitDate}
                disabled={form.EntryOrExit !== 0}
                onChange={(event) =>
                  updateForm({
                    ExitDate: event.target.value,
                  })
                }
                className={`h-10 w-full rounded-md border px-3 text-sm outline-none ${
                  form.EntryOrExit === 0
                    ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                }`}
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter an exit date when this is an Exit COS.
              </p>
            </Field>
          </div>
        </section>

        {/* =====================================================
            OUTCOMES
        ====================================================== */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">
              Outcomes
            </h2>
          </div>

          {/* OUTCOME 1 */}
          <OutcomeSection
            outcomeNumber={1}
            title={OUTCOME_TITLES[0]}
            score={form.Outcome1}
            progressMet={form.Outcome1Support}
            scoreError={errors.Outcome1}
            progressError={errors.Outcome1Support}
            onScoreChange={(score) =>
              updateForm({
                Outcome1: score,
              })
            }
            onProgressChange={(value) =>
              updateForm({
                Outcome1Support: value,
              })
            }
          />

          {/* OUTCOME 2 */}
          <OutcomeSection
            outcomeNumber={2}
            title={OUTCOME_TITLES[1]}
            score={form.Outcome2}
            progressMet={form.Outcome2Support}
            scoreError={errors.Outcome2}
            progressError={errors.Outcome2Support}
            onScoreChange={(score) =>
              updateForm({
                Outcome2: score,
              })
            }
            onProgressChange={(value) =>
              updateForm({
                Outcome2Support: value,
              })
            }
          />

          {/* OUTCOME 3 */}
          <OutcomeSection
            outcomeNumber={3}
            title={OUTCOME_TITLES[2]}
            score={form.Outcome3}
            progressMet={form.Outcome3Support}
            scoreError={errors.Outcome3}
            progressError={errors.Outcome3Support}
            onScoreChange={(score) =>
              updateForm({
                Outcome3: score,
              })
            }
            onProgressChange={(value) =>
              updateForm({
                Outcome3Support: value,
              })
            }
          />
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            ACTIONS
        ====================================================== */}
        <div className="flex justify-end gap-3 pb-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 min-w-[150px] rounded-md border border-gray-300 bg-white px-6 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-11 min-w-[150px] rounded-md bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   OUTCOME SECTION
============================================================= */

interface OutcomeSectionProps {
  outcomeNumber: number;
  title: string;
  score: number | null;
  progressMet: number | null;
  scoreError?: string;
  progressError?: string;
  onScoreChange: (score: number) => void;
  onProgressChange: (value: number) => void;
}

function OutcomeSection({
  outcomeNumber,
  title,
  score,
  progressMet,
  scoreError,
  progressError,
  onScoreChange,
  onProgressChange,
}: OutcomeSectionProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 ${
        outcomeNumber > 1 ? 'mt-5' : ''
      }`}
    >
      <h3 className="mb-6 text-base font-semibold text-gray-900">
        Outcome {outcomeNumber}: {title}
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COS SCORE */}
        <div className="lg:col-span-7">
          <Field
            label="COS Score"
            required
            error={scoreError}
          >
            <div className="flex flex-wrap items-center gap-6 pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="radio"
                    name={`outcome-${outcomeNumber}-score`}
                    checked={score === value}
                    onChange={() => onScoreChange(value)}
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span>{value}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* PROGRESS MET */}
        <div className="lg:col-span-5">
          <Field
            label="Progress Met"
            required
            error={progressError}
          >
            <div className="flex items-center gap-8 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name={`outcome-${outcomeNumber}-progress`}
                  checked={progressMet === 1}
                  onChange={() => onProgressChange(1)}
                  className="h-5 w-5 accent-blue-600"
                />

                <span>Yes</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name={`outcome-${outcomeNumber}-progress`}
                  checked={progressMet === 0}
                  onChange={() => onProgressChange(0)}
                  className="h-5 w-5 accent-blue-600"
                />

                <span>No</span>
              </label>
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}