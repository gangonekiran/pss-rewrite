import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import SearchableSelect, {
  type SelectOption,
} from '../../../../components/select/SearchableSelect';

import type { Client } from '../../../../types/client';

import clientService from '../../../../services/client.service';

interface ClientLookupProps {
  client: Client;
  setClient: Dispatch<SetStateAction<Client>>;
}

export default function ClientLookup({ client, setClient }: ClientLookupProps) {
  const [lastNames, setLastNames] = useState<SelectOption[]>([]);
  const [firstNames, setFirstNames] = useState<SelectOption[]>([]);
  const [ssns, setSsns] = useState<SelectOption[]>([]);

  const [selectedLastName, setSelectedLastName] = useState<SelectOption | null>(null);

  const [selectedFirstName, setSelectedFirstName] = useState<SelectOption | null>(null);

  const [selectedSSN, setSelectedSSN] = useState<SelectOption | null>(null);

  const [loading, setLoading] = useState(false);

  async function loadLookups() {
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
    try {
      setLoading(true);

      const client = await clientService.getById(childId);

      setClient(client);

      setSelectedLastName({
        value: client.childId!,
        label: client.lastName,
      });

      setSelectedFirstName({
        value: client.childId!,
        label: client.firstName,
      });

      setSelectedSSN({
        value: client.childId!,
        label: client.ss ?? '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Section */}
        <div className="col-span-4">
          <h2 className="mb-3 text-base font-semibold text-green-700">Lookup Client</h2>

          <div className="space-y-3">
            {/* Last Name */}
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
                onClick={() => {
                  if (selectedLastName) {
                    loadClient(Number(selectedLastName.value));
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100"
              >
                →
              </button>
            </div>

            {/* First Name */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">First</label>
              <SearchableSelect
                options={firstNames}
                placeholder="Search First Name"
                value={selectedFirstName}
                onChange={async (option) => {
                  setSelectedFirstName(option);
                }}
              />
              <button
                onClick={() => {
                  if (selectedFirstName) {
                    loadClient(Number(selectedFirstName.value));
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100"
              >
                →
              </button>
            </div>

            {/* DOB */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">DOB</label>

              <input
                type="date"
                className="h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
              />

              <button className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100">
                →
              </button>
            </div>

            {/* SSN */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">SSN</label>
              <SearchableSelect
                options={ssns}
                placeholder="Search SSN"
                value={selectedSSN}
                onChange={async (option) => {
                  setSelectedSSN(option);
                }}
              />

              <button
                onClick={() => {
                  if (selectedSSN) {
                    loadClient(Number(selectedSSN.value));
                  }
                }}
                className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="col-span-1 flex justify-center">
          <div className="h-full border-l border-gray-300"></div>
        </div>

        {/* Right Section */}
        <div className="col-span-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Client ID</span>

            <span className="text-2xl font-bold text-green-700">{client.childId ?? 'New'}</span>
          </div>

          <div className="grid grid-cols-[85px_240px_90px_70px] items-center gap-3">
            <label className="text-xs font-medium text-gray-700">Last Name</label>

            <input
              value={client.lastName}

              onChange={(e) =>
                setClient({
                  ...client,

                  lastName: e.target.value,
                })
              }

              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <label className="text-xs font-medium text-gray-700">Gender</label>

            <select
              value={client.gender ?? ''}

              onChange={(e) =>
                setClient({
                  ...client,

                  gender: e.target.value,
                })
              }

              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            >
              <option value="">Select</option>

              <option value="M">Male</option>

              <option value="F">Female</option>
            </select>

            <label className="text-xs font-medium text-gray-700">First Name</label>

            <input
              value={client.firstName}

              onChange={(e) =>
                setClient({
                  ...client,

                  firstName: e.target.value,
                })
              }

              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">SS#</label>

            <input
              value={client.ss ?? ''}
              onChange={(e) =>
                setClient({
                  ...client,

                  ss: e.target.value,
                })
              }
              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">Region</label>

            <input
              value={client.region ?? ''}

              onChange={(e) =>
                setClient({
                  ...client,

                  region: e.target.value,
                })
              }

              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            />
            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">Birth Date</label>

            <input
              type="date"

              value={client.dob ?? ''}

              onChange={(e) =>
                setClient({
                  ...client,

                  dob: e.target.value,
                })
              }

              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            />

            <div className="text-sm">
              <span className="text-gray-600">Age:</span>{' '}
              <span className="font-semibold text-green-700">{calculateAge(client.dob)}</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"

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
}
