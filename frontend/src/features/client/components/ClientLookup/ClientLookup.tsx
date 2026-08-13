import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';

import type { Dispatch, SetStateAction } from 'react';

import SearchableSelect, {
  type SelectOption,
} from '../../../../components/select/SearchableSelect';

import type { Client } from '../../../../types/client';

import clientService from '../../../../services/client.service';

export interface ClientLookupRef {
  clearLookup: () => void;
}

interface ClientLookupProps {
  client: Client;
  setClient: Dispatch<SetStateAction<Client>>;
  isLocked: boolean;
}

const ClientLookup = forwardRef<ClientLookupRef, ClientLookupProps>(function ClientLookup(
  { client, setClient, isLocked },
  ref,
) {
  const [lastNames, setLastNames] = useState<SelectOption[]>([]);
  const [firstNames, setFirstNames] = useState<SelectOption[]>([]);
  const [ssns, setSsns] = useState<SelectOption[]>([]);

  const [selectedLastName, setSelectedLastName] = useState<SelectOption | null>(null);

  const [selectedFirstName, setSelectedFirstName] = useState<SelectOption | null>(null);

  const [selectedSSN, setSelectedSSN] = useState<SelectOption | null>(null);

  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    clearLookup() {
      setSelectedLastName(null);
      setSelectedFirstName(null);
      setSelectedSSN(null);
    },
  }));

  async function loadLookups() {
    try {
      const clients = await clientService.getAll();

      setLastNames(
        clients.map((c) => ({
          value: c.childId!,
          label: `${c.lastName} (${c.firstName})`,
        })),
      );

      setFirstNames(
        clients.map((c) => ({
          value: c.childId!,
          label: c.firstName,
        })),
      );

      setSsns(
        clients.map((c) => ({
          value: c.childId!,
          label: c.ss ?? '',
        })),
      );
    } catch (error) {
      console.error('Failed to load client lookups:', error);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  function calculateAge(dob?: string) {
    if (!dob) return '--';

    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const month = today.getMonth() - birth.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  async function loadClient(childId: number) {
    if (!childId || Number.isNaN(childId)) {
      return;
    }

    try {
      setLoading(true);

      const selectedClient = await clientService.getById(childId);

      setClient(selectedClient);

      setSelectedLastName({
        value: selectedClient.childId!,
        label: selectedClient.lastName,
      });

      setSelectedFirstName({
        value: selectedClient.childId!,
        label: selectedClient.firstName,
      });

      setSelectedSSN({
        value: selectedClient.childId!,
        label: selectedClient.ss ?? '',
      });
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="grid grid-cols-12 gap-6">
        {/* =========================================================
            LEFT SECTION - CLIENT LOOKUP
        ========================================================= */}
        <div className="col-span-4">
          <h2 className="mb-3 text-base font-semibold text-green-700">Lookup Client</h2>

          <div className="space-y-3">
            {/* -----------------------------------------------------
                Last Name
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Last</label>

              <SearchableSelect
                options={lastNames}
                placeholder="Search Last Name"
                value={selectedLastName}
                onChange={(option) => {
                  setSelectedLastName(option);
                }}
              />

              <button
                type="button"
                disabled={!selectedLastName || loading}
                onClick={() => {
                  if (!selectedLastName) return;

                  const childId = Number(selectedLastName.value);

                  if (!Number.isNaN(childId)) {
                    loadClient(childId);
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>

            {/* -----------------------------------------------------
                First Name
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">First</label>

              <SearchableSelect
                options={firstNames}
                placeholder="Search First Name"
                value={selectedFirstName}
                onChange={(option) => {
                  setSelectedFirstName(option);
                }}
              />

              <button
                type="button"
                disabled={!selectedFirstName || loading}
                onClick={() => {
                  if (!selectedFirstName) return;

                  const childId = Number(selectedFirstName.value);

                  if (!Number.isNaN(childId)) {
                    loadClient(childId);
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>

            {/* -----------------------------------------------------
                DOB
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">DOB</label>

              <input
                type="date"
                value={client.dob ?? ''}
                readOnly
                className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
              />

              <button
                type="button"
                disabled
                className="h-9 w-9 cursor-not-allowed rounded-md border border-gray-300 text-base opacity-50"
              >
                →
              </button>
            </div>

            {/* -----------------------------------------------------
                SSN
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">SSN</label>

              <SearchableSelect
                options={ssns}
                placeholder="Search SSN"
                value={selectedSSN}
                onChange={(option) => {
                  setSelectedSSN(option);
                }}
              />

              <button
                type="button"
                disabled={!selectedSSN || loading}
                onClick={() => {
                  if (!selectedSSN) return;

                  const childId = Number(selectedSSN.value);

                  if (!Number.isNaN(childId)) {
                    loadClient(childId);
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            DIVIDER
        ========================================================= */}
        <div className="col-span-1 flex justify-center">
          <div className="h-full border-l border-gray-300" />
        </div>

        {/* =========================================================
            RIGHT SECTION - CLIENT DETAILS
        ========================================================= */}
        <div className="col-span-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Client ID</span>

            <span className="text-2xl font-bold text-green-700">{client.childId ?? 'New'}</span>

            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>

          <div className="grid grid-cols-[85px_240px_90px_70px] items-center gap-3">
            {/* =====================================================
                LAST NAME
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">Last Name</label>

            <input
              value={client.lastName}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  lastName: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            />

            {/* =====================================================
                GENDER
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">Gender</label>

            <select
              value={client.gender ?? ''}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  gender: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>

            {/* =====================================================
                FIRST NAME
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">First Name</label>

            <input
              value={client.firstName}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  firstName: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            />

            <div />
            <div />

            {/* =====================================================
                SSN
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">SS#</label>

            <input
              value={client.ss ?? ''}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  ss: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            />

            <div />
            <div />

            {/* =====================================================
                REGION
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">Region</label>

            <input
              value={client.region ?? ''}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  region: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            />

            <div />
            <div />

            {/* =====================================================
                BIRTH DATE
            ===================================================== */}
            <label className="text-xs font-medium text-gray-700">Birth Date</label>

            <input
              type="date"
              value={client.dob ?? ''}
              disabled={isLocked}
              onChange={(e) =>
                setClient({
                  ...client,
                  dob: e.target.value,
                })
              }
              className={`h-9 rounded-md border px-2 text-sm ${
                isLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-white'
              }`}
            />

            {/* =====================================================
                AGE
            ===================================================== */}
            <div className="text-sm">
              <span className="text-gray-600">Age:</span>{' '}
              <span className="font-semibold text-green-700">{calculateAge(client.dob)}</span>
            </div>

            {/* =====================================================
                NON-EI
            ===================================================== */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={isLocked}
                checked={client.nonEarlyIntervention ?? false}
                onChange={(e) =>
                  setClient({
                    ...client,
                    nonEarlyIntervention: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              Non-EI
            </label>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClientLookup;
