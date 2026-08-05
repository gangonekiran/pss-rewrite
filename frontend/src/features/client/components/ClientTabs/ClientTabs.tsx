import { useState } from 'react';
import { ClipboardList, FileText } from 'lucide-react';

import ClientStatus from '../ClientStatus/ClientStatus';

type Tab = 'status' | 'forms';

export default function ClientTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('status');

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'status'
              ? 'border-green-700 bg-white text-green-700'
              : 'border-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ClipboardList size={16} />
          Client Status
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'forms'
              ? 'border-green-700 bg-white text-green-700'
              : 'border-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText size={16} />
          Input Forms
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'status' && <ClientStatus />}

        {activeTab === 'forms' && (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">
            Input Forms Coming Soon...
          </div>
        )}
      </div>
    </div>
  );
}