import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Pencil, Plus, Trash2, X } from 'lucide-react';

import inputFormService from '../../../../services/input-form.service';
import type { InputFormHistoryItem, InputFormName } from '../../../../types/input-form';
import { INPUT_FORM_OPTIONS } from '../../../../types/input-form';

interface InputFormsProps {
  childId?: number;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '–';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function FormType({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  let className = 'text-blue-700';

  if (normalized.includes('active')) {
    className = 'text-green-700';
  } else if (normalized.includes('service')) {
    className = 'text-purple-700';
  }

  return <span className={`font-medium ${className}`}>{value}</span>;
}

export default function InputForms({ childId }: InputFormsProps) {
  const [forms, setForms] = useState<InputFormHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedForm, setSelectedForm] = useState<InputFormName | null>(null);
  const [editing, setEditing] = useState<InputFormHistoryItem | null>(null);

  // Controls which form types are visible in the history table.
  // All form types are checked by default.
  const [visibleForms, setVisibleForms] = useState<Record<InputFormName, boolean>>(
    () =>
      Object.fromEntries(INPUT_FORM_OPTIONS.map((option) => [option.name, true])) as Record<
        InputFormName,
        boolean
      >,
  );

  const loadForms = useCallback(async () => {
    if (!childId) {
      setForms([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await inputFormService.getHistory(childId);
      setForms(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load input forms.');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  function toggleFormVisibility(formName: InputFormName) {
    setVisibleForms((current) => ({
      ...current,
      [formName]: !current[formName],
    }));
  }

  const visibleHistoryForms = forms.filter((item) => visibleForms[item.formName]);

  async function handleDelete(item: InputFormHistoryItem) {
    if (!childId) return;

    const confirmed = window.confirm(`Delete ${item.formType} dated ${formatDate(item.date)}?`);

    if (!confirmed) return;

    try {
      await inputFormService.remove(item.formName, childId, item.id);
      await loadForms();
    } catch (err) {
      console.error(err);
      setError('Unable to delete the form.');
    }
  }

  function handleAddForm(formName: InputFormName) {
    setEditing(null);
    setSelectedForm(formName);
  }

  function handleEdit(item: InputFormHistoryItem) {
    setSelectedForm(item.formName);
    setEditing(item);
  }

  if (!childId) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        Select a client to view input forms.
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white">
      {selectedForm && (
        <InputFormEditor
          childId={childId}
          formName={selectedForm}
          existing={editing}
          onClose={() => {
            setSelectedForm(null);
            setEditing(null);
          }}
          onSaved={async () => {
            setSelectedForm(null);
            setEditing(null);
            await loadForms();
          }}
        />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_170px]">
        {/* History */}
        <div className="min-w-0 border-t border-b border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left font-semibold text-gray-700">
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Form Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Referral</th>
                  <th className="whitespace-nowrap px-4 py-3">NOPR</th>
                  <th className="whitespace-nowrap px-4 py-3">interim</th>
                  <th className="whitespace-nowrap px-4 py-3">OP</th>
                  <th className="whitespace-nowrap px-4 py-3">Exit</th>
                  <th className="whitespace-nowrap px-4 py-3">Loop Error</th>
                  <th className="whitespace-nowrap px-4 py-3">View/Edit</th>
                  <th className="whitespace-nowrap px-4 py-3">Delete</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      Loading input forms...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : visibleHistoryForms.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      No input forms available.
                    </td>
                  </tr>
                ) : (
                  visibleHistoryForms.map((item) => (
                    <tr
                      key={`${item.formName}-${item.id}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                        {formatDate(item.date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <FormType value={item.formType} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">{formatDate(item.referral)}</td>

                      <td className="whitespace-nowrap px-4 py-3">{formatDate(item.nopr)}</td>

                      <td className="whitespace-nowrap px-4 py-3">{formatDate(item.interim)}</td>

                      <td className="whitespace-nowrap px-4 py-3">{formatDate(item.op)}</td>

                      <td className="whitespace-nowrap px-4 py-3">{formatDate(item.exit)}</td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {item.loopError ? (
                          <span title="Loop error" className="font-bold text-red-600">
                            X
                          </span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                        >
                          <Pencil size={12} />
                          View/Edit
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Form */}
        <aside className="border-l border-gray-200 bg-white">
          <div className="flex h-10 items-center justify-between border-gray-200 bg-gray-50 px-4">
            <h3 className="text-sm font-semibold text-gray-700">Add New Form</h3>

            <input
              type="checkbox"
              checked={INPUT_FORM_OPTIONS.every((option) => visibleForms[option.name])}
              onChange={(event) => {
                const checked = event.target.checked;

                setVisibleForms(
                  Object.fromEntries(
                    INPUT_FORM_OPTIONS.map((option) => [option.name, checked]),
                  ) as Record<InputFormName, boolean>,
                );
              }}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="divide-y divide-gray-100">
            {INPUT_FORM_OPTIONS.map((option) => (
              <label
                key={option.name}
                className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50"
              >
                <span className="select-none">{option.label}</span>

                <input
                  type="checkbox"
                  checked={visibleForms[option.name]}
                  onChange={() => toggleFormVisibility(option.name)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

interface InputFormEditorProps {
  childId: number;
  formName: InputFormName;
  existing: InputFormHistoryItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function InputFormEditor({ childId, formName, existing, onClose, onSaved }: InputFormEditorProps) {
  const option = INPUT_FORM_OPTIONS.find((item) => item.name === formName);

  const [formDate, setFormDate] = useState(existing?.date?.substring(0, 10) ?? '');
  const [region, setRegion] = useState('');
  const [formType, setFormType] = useState(option?.label ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!formDate) {
      setError('Form Date is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        FormDate: formDate,
        FormType: formType,
        Region: region || undefined,
        InsertUser: 'SYSTEM',
      };

      if (existing) {
        await inputFormService.update(formName, childId, existing.id, payload);
      } else {
        await inputFormService.create(formName, childId, payload);
      }

      await onSaved();
    } catch (err) {
      console.error(err);
      setError('Unable to save the form.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {existing ? 'View / Edit' : 'Add New'} {option?.label} Form
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">Client ID: {childId}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                Form Date <span className="text-red-600">*</span>
              </span>
              <input
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">Form Type</span>
              <input
                value={formType}
                onChange={(event) => setFormType(event.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-2 text-sm outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Region</span>
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Enter region"
              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <p>
                This is the common input-form shell. The individual form fields and business
                validations should be added per form (Referral, Active, NOPR, COS, Insurance,
                Service Grid and Exit) before production use.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Check size={15} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
