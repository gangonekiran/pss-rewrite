import { LockOpen, Trash2, UserPlus, CheckCircle } from 'lucide-react';

export default function ClientActions() {
  return (
    <div className="my-4 flex items-center gap-3">
      {/* Unlock */}
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-green-700 px-3 text-sm font-medium text-white transition-colors hover:bg-green-800">
        <LockOpen size={16} />
        Unlock
      </button>

      {/* Delete Client - Disabled */}
      <button
        disabled
        className="flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-400"
      >
        <Trash2 size={16} className="text-gray-400" />
        Delete Client
      </button>

      {/* Add New Client */}
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50">
        <UserPlus size={16} />
        Add New Client
      </button>

      {/* Done */}
      <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-800">
        <CheckCircle size={16} />
        Done
      </button>
    </div>
  );
}