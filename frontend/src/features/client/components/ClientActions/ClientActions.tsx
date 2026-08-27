import {
  Lock,
  LockOpen,
  Trash2,
  UserPlus,
  CheckCircle,
} from "lucide-react";

import type { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";

import clientService from "../../../../services/client.service";
import type { Client } from "../../../../types/client";

interface ClientActionsProps {
  client: Client;
  setClient: Dispatch<SetStateAction<Client>>;

  isNewClient: boolean;
  setIsNewClient: Dispatch<SetStateAction<boolean>>;

  clearClient: () => void;

  isLocked: boolean;
  setIsLocked: Dispatch<SetStateAction<boolean>>;
  clearClientLookup: () => void;
}

const emptyClient: Client = {
  childId: undefined,
  region: "",
  lastName: "",
  firstName: "",
  ss: "",
  ssTemp: false,
  dob: "",
  gender: "",
  notes: "",
  nonEarlyIntervention: false,
};

export default function ClientActions({
  client,
  setClient,
  setIsNewClient,
  isLocked,
  setIsLocked,
  clearClientLookup
}: ClientActionsProps) {
  /**
   * Save / Update Client
   */
  async function saveClient() {
    // Do not allow saving while locked
    if (isLocked) {
      return;
    }

    try {
      // Validation
      if (!client.lastName.trim()) {
        toast.error("Last Name is required.");
        return;
      }

      if (!client.firstName.trim()) {
        toast.error("First Name is required.");
        return;
      }

      let savedClient: Client;

      if (client.childId) {
        // UPDATE existing client
        savedClient = await clientService.update(
          client.childId,
          client,
        );
        clearClientLookup();
        toast.success("Client updated successfully");
      } else {
        // CREATE new client
        savedClient = await clientService.create(client);
        clearClientLookup();
        toast.success("Client created successfully");
      }

      // Update state with database response
      setClient(savedClient);

      // No longer a new client
      setIsNewClient(false);

      // Lock after successful save
      setIsLocked(true);
    } catch (error) {
      console.error("Unable to save client:", error);
      toast.error("Failed to save client.");
    }
  }

  /**
   * Delete Client
   */
  async function deleteClient() {
    // Do not allow delete while locked
    if (isLocked) {
      return;
    }

    if (!client.childId) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await clientService.delete(client.childId);

      toast.success("Client deleted successfully.");

      // Clear client after deletion
      setClient(emptyClient);
      setIsNewClient(true);

      // Lock screen again
      setIsLocked(true);
    } catch (error) {
      console.error("Unable to delete client:", error);
      toast.error("Failed to delete client.");
    }
  }

  /**
   * Add New Client
   *
   * Does NOT save the existing client.
   * It simply clears the form and enables editing.
   */
  function addNewClient() {
    setClient(emptyClient);   

    // New client should be editable
    setIsLocked(false);

    clearClientLookup();
  }

  /**
   * Toggle Lock / Unlock
   */
  function toggleLock() {
    setIsLocked((previous) => !previous);
  }

  return (
    <div className="my-4 flex items-center gap-3">
      {/* =========================================================
          LOCK / UNLOCK
      ========================================================= */}
      <button
        type="button"
        onClick={toggleLock}
        className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
          isLocked
            ? "bg-green-700 text-white hover:bg-green-800"
            : "border border-orange-500 bg-white text-orange-600 hover:bg-orange-50"
        }`}
      >
        {isLocked ? (
          <LockOpen size={16} />
        ) : (
          <Lock size={16} />
        )}

        {isLocked ? "Unlock" : "Lock"}
      </button>

      {/* =========================================================
          DELETE CLIENT
      ========================================================= */}
      <button
        type="button"
        disabled={!client.childId || isLocked}
        onClick={deleteClient}
        className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
          client.childId && !isLocked
            ? "border border-red-600 text-red-600 hover:bg-red-50"
            : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400"
        }`}
      >
        <Trash2 size={16} />

        Delete Client
      </button>

      {/* =========================================================
          ADD NEW CLIENT
      ========================================================= */}
      <button
        type="button"
        onClick={addNewClient}
        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        <UserPlus size={16} />

        Add New Client
      </button>

      {/* =========================================================
          DONE / SAVE
      ========================================================= */}
      <button
        type="button"
        disabled={isLocked}
        onClick={saveClient}
        className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
          isLocked
            ? "cursor-not-allowed bg-gray-300 text-gray-500"
            : "bg-blue-700 text-white hover:bg-blue-800"
        }`}
      >
        <CheckCircle size={16} />

        Done
      </button>
    </div>
  );
}