/*import { LockOpen, Trash2, UserPlus, CheckCircle } from 'lucide-react';

export default function ClientActions() {
  return (
    <div className="my-4 flex items-center gap-3">
      
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-green-700 px-3 text-sm font-medium text-white transition-colors hover:bg-green-800">
        <LockOpen size={16} />
        Unlock
      </button>

      
      <button
        disabled
        className="flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-400"
      >
        <Trash2 size={16} className="text-gray-400" />
        Delete Client
      </button>

     
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50">
        <UserPlus size={16} />
        Add New Client
      </button>

      
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-800">
        <CheckCircle size={16} />
        Done
      </button>
    </div>
  );
}*/

import { LockOpen, Trash2, UserPlus, CheckCircle } from 'lucide-react';

import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';
import type { Dispatch, SetStateAction } from 'react';

interface ClientActionsProps {
  client: Client;
  setClient: Dispatch<SetStateAction<Client>>;
}

const emptyClient: Client = {
  childId: undefined,
  region: '',
  lastName: '',
  firstName: '',
  ss: '',
  ssTemp: false,
  dob: '',
  gender: '',
  notes: '',
  nonEarlyIntervention: false,
};

export default function ClientActions({ client, setClient }: ClientActionsProps) {
  async function saveClient() {
    try {
      if (!client.lastName.trim()) {
        alert('Last Name is required.');
        return;
      }

      if (!client.firstName.trim()) {
        alert('First Name is required.');
        return;
      }

      if (client.childId) {
        await clientService.update(client.childId, client);

        alert('Client updated successfully.');
      } else {
        await clientService.create(client);

        alert('Client created successfully.');
      }
    } catch (error) {
      console.error(error);
      alert('Unable to save client.');
    }
  }

  async function deleteClient() {
    if (!client.childId) {
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this client?');

    if (!confirmDelete) {
      return;
    }

    try {
      await clientService.delete(client.childId);

      alert('Client deleted successfully.');

      setClient(emptyClient);
    } catch (error) {
      console.error(error);
      alert('Unable to delete client.');
    }
  }

  function addNewClient() {
    saveClient();
    setClient(emptyClient);
  }

  return (
    <div className="my-4 flex items-center gap-3">
      {/* Unlock */}

      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-green-700 px-3 text-sm font-medium text-white hover:bg-green-800">
        <LockOpen size={16} />
        Unlock
      </button>

      {/* Delete */}

      <button
        disabled={!client.childId}
        onClick={deleteClient}
        className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition

          ${
            client.childId
              ? 'border border-red-600 text-red-600 hover:bg-red-50'
              : 'cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400'
          }
        `}
      >
        <Trash2 size={16} />
        Delete Client
      </button>

      {/* Add New */}

      <button
        onClick={addNewClient}
        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        <UserPlus size={16} />
        Add New Client
      </button>

      {/* Save */}

      <button
        onClick={saveClient}
        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-medium text-white hover:bg-blue-800"
      >
        <CheckCircle size={16} />
        Done
      </button>
    </div>
  );
}
