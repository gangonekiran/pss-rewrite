import type { Dispatch, SetStateAction } from 'react';
import type { Client } from '../../../../types/client';

interface ClientFormProps {
  client: Client;
  setClient: Dispatch<SetStateAction<Client>>;
}

export default function ClientForm({ client, setClient }: ClientFormProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Client ID</span>

        <span className="text-2xl font-bold text-green-700">{client.childId ?? 'New'}</span>
      </div>

      {/* Form */}

      <div className="grid grid-cols-[100px_260px_100px_140px] gap-4">
        {/* Last Name */}

        <label className="self-center text-sm font-medium">Last Name</label>

        <input
          type="text"
          value={client.lastName}
          onChange={(e) =>
            setClient({
              ...client,
              lastName: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        />

        {/* Gender */}

        <label className="self-center text-sm font-medium">Gender</label>

        <select
          value={client.gender ?? ''}
          onChange={(e) =>
            setClient({
              ...client,
              gender: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        >
          <option value="">Select</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        {/* First Name */}

        <label className="self-center text-sm font-medium">First Name</label>

        <input
          type="text"
          value={client.firstName}
          onChange={(e) =>
            setClient({
              ...client,
              firstName: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        />

        <div />
        <div />

        {/* SSN */}

        <label className="self-center text-sm font-medium">SS#</label>

        <input
          type="text"
          value={client.ss ?? ''}
          onChange={(e) =>
            setClient({
              ...client,
              ss: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        />

        <div />
        <div />

        {/* Region */}

        <label className="self-center text-sm font-medium">Region</label>

        <input
          type="text"
          value={client.region ?? ''}
          onChange={(e) =>
            setClient({
              ...client,
              region: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        />

        <div />
        <div />

        {/* Birth Date */}

        <label className="self-center text-sm font-medium">Birth Date</label>

        <input
          type="date"
          value={client.dob ?? ''}
          onChange={(e) =>
            setClient({
              ...client,
              dob: e.target.value,
            })
          }
          className="h-10 rounded-md border border-gray-300 px-3"
        />

        <div className="flex items-center">
          <span className="text-sm text-gray-600">Age:</span>

          <span className="ml-2 font-semibold text-green-700">--</span>
        </div>

        {/* Non-EI */}

        <div />

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={client.nonEarlyIntervention ?? false}
            onChange={(e) =>
              setClient({
                ...client,
                nonEarlyIntervention: e.target.checked,
              })
            }
            className="h-4 w-4"
          />
          Non-EI
        </label>
      </div>

      {/* Notes */}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium">Notes</label>

        <textarea
          rows={5}
          value={client.notes ?? ''}
          onChange={(e) =>
            setClient({
              ...client,
              notes: e.target.value,
            })
          }
          className="w-full rounded-md border border-gray-300 p-3"
        />
      </div>
    </div>
  );
}
