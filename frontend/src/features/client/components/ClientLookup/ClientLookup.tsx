import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

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
  const [firstNames, setFirstNames] = useState<SelectOption[]>([]);
  const [lastNames, setLastNames] = useState<SelectOption[]>([]);
  const [ssns, setSsns] = useState<SelectOption[]>([]);

  const [selectedFirstName, setSelectedFirstName] = useState<SelectOption | null>(null);

  const [selectedLastName, setSelectedLastName] = useState<SelectOption | null>(null);

  const [selectedSSN, setSelectedSSN] = useState<SelectOption | null>(null);

  const [regions, setRegions] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    clearLookup() {
      setSelectedFirstName(null);
      setSelectedLastName(null);
      setSelectedSSN(null);

      setFirstNames([]);
      setLastNames([]);
      setSsns([]);
    },
  }));

  /**
   * Load regions.
   *
   * Names are no longer loaded here because name lookup
   * is performed through the dedicated search APIs.
   */
  async function loadLookups() {
    try {
      const regionData = await clientService.getAllRegions();

      setRegions(
        regionData.map((region) => ({
          value: region.ID,
          label: region.RName,
        })),
      );
    } catch (error) {
      console.error('Failed to load client lookups:', error);
    }
  }

  useEffect(() => {
    void loadLookups();
  }, []);

  /**
   * Convert client results to full-name options.
   */
  function mapClientToOption(client: Client): SelectOption {
    return {
      value: String(client.childId!),
      label: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim(),
    };
  }

  /**
   * Search by First Name only.
   */
  async function handleFirstNameSearch(search: string) {
    const value = search.trim();

    if (!value) {
      setFirstNames([]);
      return;
    }

    try {
      const clients = await clientService.searchFirstName(value);

      setFirstNames(clients.map(mapClientToOption));
    } catch (error) {
      console.error('Failed to search first name:', error);
      setFirstNames([]);
    }
  }

  /**
   * Search by Last Name only.
   */
  async function handleLastNameSearch(search: string) {
    const value = search.trim();

    if (!value) {
      setLastNames([]);
      return;
    }

    try {
      const clients = await clientService.searchLastName(value);

      setLastNames(clients.map(mapClientToOption));
    } catch (error) {
      console.error('Failed to search last name:', error);
      setLastNames([]);
    }
  }

  /**
   * Search by SSN.
   */
  async function handleSSNSearch(search: string) {
    const value = search.trim();

    if (!value) {
      setSsns([]);
      return;
    }

    try {
      const clients = await clientService.searchSSN(value);

      setSsns(
        clients.map((client) => ({
          value: String(client.childId!),
          label: client.ss ?? '',
        })),
      );
    } catch (error) {
      console.error('Failed to search SSN:', error);
      setSsns([]);
    }
  }

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

      const fullName = `${selectedClient.firstName ?? ''} ${selectedClient.lastName ?? ''}`.trim();

      setSelectedFirstName({
        value: String(selectedClient.childId!),
        label: fullName,
      });

      setSelectedLastName({
        value: String(selectedClient.childId!),
        label: fullName,
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
                FIRST NAME SEARCH
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">First Name</label>

              <SearchableSelect
                options={firstNames}
                placeholder="Search First Name"
                value={selectedFirstName}
                onInputChange={(value, actionMeta) => {
                  if (actionMeta.action === 'input-change' || actionMeta.action === 'menu-close') {
                    void handleFirstNameSearch(value);
                  }
                }}
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
                    void loadClient(childId);
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>

            {/* -----------------------------------------------------
                LAST NAME SEARCH
            ----------------------------------------------------- */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Last Name</label>

              <SearchableSelect
                options={lastNames}
                placeholder="Search Last Name"
                value={selectedLastName}
                onInputChange={(value, actionMeta) => {
                  if (actionMeta.action === 'input-change' || actionMeta.action === 'menu-close') {
                    void handleLastNameSearch(value);
                  }
                }}
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
                    void loadClient(childId);
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

              <div className="relative">
                <input
                  type="date"
                  value={client.dob ?? ''}
                  onChange={(e) =>
                    setClient({
                      ...client,
                      dob: e.target.value,
                    })
                  }
                  style={{ borderColor: 'oklch(0.278 0.033 256.848)' }}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 pr-8 text-sm"
                />

                {client.dob && (
                  <button
                    type="button"
                    onClick={() =>
                      setClient({
                        ...client,
                        dob: undefined,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                    aria-label="Clear DOB"
                  >
                    ×
                  </button>
                )}
              </div>

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
                onInputChange={(value, actionMeta) => {
                  if (actionMeta.action === 'input-change' || actionMeta.action === 'menu-close') {
                    void handleSSNSearch(value);
                  }
                }}
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
                    void loadClient(childId);
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

          <div className="grid grid-cols-[85px_240px_70px_90px] items-center gap-3">
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
              maxLength={10}
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

            <SearchableSelect
              options={regions}
              value={
                regions.find((option) => String(option.value) === String(client.region ?? '')) ??
                null
              }
              isDisabled={isLocked}
              onChange={(option) =>
                setClient({
                  ...client,
                  region: option ? Number(option.value) : undefined,
                })
              }
              placeholder="Select Region"
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
