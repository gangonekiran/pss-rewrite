import Notes from '../Notes';
import ServiceHistoryTable from '../ServiceHistory/ServiceHistory';
import type { ServiceHistoryItem } from '../ServiceHistory/ServiceHistoryItem';

export default function ClientStatus() {
  const services: ServiceHistoryItem[] = [];
  /*const services: ServiceHistoryItem[] = [
    {
      id: 1,
      date: '01/10/2026',
      serviceName: 'Early Intervention',
      frequency: 'Weekly',
      consent: 'Yes',
      casePlan: 'Open',
    },
    {
      id: 2,
      date: '01/20/2026',
      serviceName: 'Speech Therapy',
      frequency: 'Monthly',
      consent: 'Yes',
      casePlan: 'Closed',
    },
    {
      id: 3,
      date: '02/05/2026',
      serviceName: 'Occupational Therapy',
      frequency: 'Weekly',
      consent: 'Pending',
      casePlan: 'Open',
    },
  ];*/

  return (
    <div className="rounded-md border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 p-3">
        <label className="text-sm font-medium text-gray-700">Client Status On</label>

        <input
          type="date"
          defaultValue="2026-05-23"
          className="h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <button className="flex h-9 items-center rounded-md border border-blue-600 px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50">
          Go
        </button>

        <button className="flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
          Today
        </button>
      </div>

      {/* Body */}
      <div className="grid grid-cols-12">
        {/* Left Panel (45%) */}
        <div className="col-span-6 border-gray-200 p-4" style={{ paddingRight: 0 }}>
          <div className="grid grid-cols-12 gap-4 ">
            <div className="col-span-6 pr-4 border-r border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">Status</td>
                    <td className="py-2 font-semibold text-green-700">Active</td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">Referral Date</td>
                    <td className="py-2">1/31/2026</td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">No One Plan Date</td>
                    <td className="py-2">—</td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">Interim Date</td>
                    <td className="py-2">—</td>
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">One Plan Date</td>
                    <td className="py-2">3/1/2026</td>
                  </tr>

                  <tr>
                    <td className="py-2 font-medium text-gray-700">Exit Date</td>
                    <td className="py-2">—</td>
                  </tr>
                </tbody>
              </table>

              {/* Information */}
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                <div className="flex items-start gap-2">
                  <span className="text-base">ℹ️</span>

                  <p>
                    To view client status for an earlier date, change
                    <strong> Client Status On </strong>
                    and click <strong>Go</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-span-6 border-gray-200">
              <Notes />
            </div>
          </div>
        </div>

        {/* Right Panel (55%) */}
        <div className="col-span-6 p-4">
          <div className="grid grid-cols-12">
            <div className="col-span-12">
              <ServiceHistoryTable services={services} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
