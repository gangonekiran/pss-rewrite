import { FolderOpen } from 'lucide-react';
import type { ServiceHistoryItem } from './ServiceHistoryItem';

interface ServiceHistoryTableProps {
  services: ServiceHistoryItem[];
}

export default function ServiceHistoryTable({ services }: ServiceHistoryTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
        <h2 className="text-lg font-semibold text-green-700">Service History</h2>

        <div className="flex gap-8 text-sm font-medium text-blue-600">
          <button className="hover:underline">Freq.</button>
          <button className="hover:underline">Consent</button>
          <button className="hover:underline">Case Plan</button>
        </div>
      </div>
      <div className="h-[250px] overflow-y-auto">
        {services.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center">
            <div className="mb-4 rounded-full bg-gray-100 p-5">
              <FolderOpen className="text-gray-400" size={30} />
            </div>

            <p className="text-gray-500">No service history available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-100 text-left text-sm font-semibold text-gray-700">
                  <th className="px-4 py-3">Date</th>

                  <th className="px-4 py-3">Service</th>

                  <th className="px-4 py-3">Freq.</th>

                  <th className="px-4 py-3">Consent</th>

                  <th className="px-4 py-3">Case Plan</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b text-sm hover:bg-gray-50">
                    <td className="px-4 py-3">{service.date}</td>

                    <td className="px-4 py-3">{service.serviceName}</td>

                    <td className="px-4 py-3">{service.frequency}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium
                        ${
                          service.consent === 'Yes'
                            ? 'bg-green-100 text-green-700'
                            : service.consent === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {service.consent}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium
                        ${
                          service.casePlan === 'Open'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {service.casePlan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
