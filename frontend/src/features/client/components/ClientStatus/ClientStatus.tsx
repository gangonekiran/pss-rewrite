import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Notes from '../Notes';
import ServiceHistoryTable from '../ServiceHistory/ServiceHistory';
import type { ServiceHistoryItem } from '../ServiceHistory/ServiceHistoryItem';

import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';

interface ClientStatusProps {
  client: Client;
}

interface ClientStatusData {
  notes: string;
  status: string | null;
  referralDate: string | null;
  noOnePlanDate: string | null;
  interimDate: string | null;
  onePlanDate: string | null;
  exitDate: string | null;
}

export default function ClientStatus({
  client,
}: ClientStatusProps) {
  const [services, setServices] = useState<
    ServiceHistoryItem[]
  >([]);

  const getToday = (): string => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const [statusDate, setStatusDate] = useState<string>(
    getToday(),
  );

  const [statusData, setStatusData] =
    useState<ClientStatusData | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  /**
   * Load client status from backend
   */
  const loadStatus = useCallback(
    async (date: string): Promise<void> => {
      if (!client.childId) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await clientService.getStatus(
          client.childId,
          date,
        );

        setStatusData(data);
      } catch (error) {
        console.error(
          'Failed to load client status:',
          error,
        );

        setStatusData(null);
        setError('Unable to load client status.');
      } finally {
        setLoading(false);
      }
    },
    [client.childId],
  );

  /**
   * Load service history from backend
   */
  const loadServiceHistory = useCallback(
    async (childId: number): Promise<void> => {
      try {
        const data =
          await clientService.getServiceHistory(
            childId,
          );

        setServices(data);
      } catch (error) {
        console.error(
          'Unable to load service history:',
          error,
        );

        setServices([]);
      }
    },
    [],
  );

  /**
   * Automatically load status when
   * client or status date changes.
   */
  useEffect(() => {
    if (!client.childId) {
      return;
    }

    // API call intentionally updates component state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus(statusDate);
  }, [
    client.childId,
    statusDate,
    loadStatus,
  ]);

  /**
   * Automatically load service history
   * when selected client changes.
   */
  useEffect(() => {
    if (!client.childId) {
      return;
    }

    // API call intentionally updates component state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadServiceHistory(client.childId);
  }, [
    client.childId,
    loadServiceHistory,
  ]);

  /**
   * Go button
   */
  function handleGo(): void {
    void loadStatus(statusDate);
  }

  /**
   * Today button
   */
  function handleToday(): void {
    const today = getToday();

    setStatusDate(today);
    void loadStatus(today);
  }

  /**
   * Format backend date
   */
  function formatDate(
    value: string | null | undefined,
  ): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-US');
  }

  /**
   * Status text color
   */
  function getStatusClass(
    status: string | null | undefined,
  ): string {
    if (!status) {
      return 'text-gray-700';
    }

    if (status.toLowerCase() === 'active') {
      return 'text-green-700';
    }

    if (status.toLowerCase() === 'inactive') {
      return 'text-red-700';
    }

    return 'text-gray-700';
  }

  return (
    <div className="rounded-md border-gray-200 bg-white">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 p-3">
        <label className="text-sm font-medium text-gray-700">
          Client Status On
        </label>

        <input
          type="date"
          value={statusDate}
          onChange={(e) =>
            setStatusDate(e.target.value)
          }
          className="h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        {/* GO */}
        <button
          type="button"
          onClick={handleGo}
          disabled={loading || !client.childId}
          className="flex h-9 items-center rounded-md border border-blue-600 px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Go'}
        </button>

        {/* TODAY */}
        <button
          type="button"
          onClick={handleToday}
          disabled={!client.childId}
          className="flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Today
        </button>
      </div>

      {/* =========================================================
          BODY
      ========================================================= */}
      <div className="grid grid-cols-12">
        {/* =======================================================
            LEFT PANEL
        ======================================================= */}
        <div
          className="col-span-6 border-gray-200 p-4"
          style={{ paddingRight: 0 }}
        >
          <div className="grid grid-cols-12 gap-4">
            {/* ===================================================
                STATUS DETAILS
            =================================================== */}
            <div className="col-span-6 border-r border-gray-200 pr-4">
              {/* No client selected */}
              {!client.childId && (
                <div className="py-8 text-center text-sm text-gray-500">
                  Select a client to view status.
                </div>
              )}

              {/* Error */}
              {client.childId && error && (
                <div className="py-8 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Data */}
              {client.childId && !error && (
                <table className="w-full text-sm">
                  <tbody>
                    {/* STATUS */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">
                        Status
                      </td>

                      <td
                        className={`py-2 font-semibold ${getStatusClass(
                          statusData?.status,
                        )}`}
                      >
                        {statusData?.status ?? '—'}
                      </td>
                    </tr>

                    {/* REFERRAL DATE */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">
                        Referral Date
                      </td>

                      <td className="py-2">
                        {formatDate(
                          statusData?.referralDate,
                        )}
                      </td>
                    </tr>

                    {/* NO ONE PLAN DATE */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">
                        No One Plan Date
                      </td>

                      <td className="py-2">
                        {formatDate(
                          statusData?.noOnePlanDate,
                        )}
                      </td>
                    </tr>

                    {/* INTERIM DATE */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">
                        Interim Date
                      </td>

                      <td className="py-2">
                        {formatDate(
                          statusData?.interimDate,
                        )}
                      </td>
                    </tr>

                    {/* ONE PLAN DATE */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">
                        One Plan Date
                      </td>

                      <td className="py-2">
                        {formatDate(
                          statusData?.onePlanDate,
                        )}
                      </td>
                    </tr>

                    {/* EXIT DATE */}
                    <tr>
                      <td className="py-2 font-medium text-gray-700">
                        Exit Date
                      </td>

                      <td className="py-2">
                        {formatDate(
                          statusData?.exitDate,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* INFORMATION */}
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                <div className="flex items-start gap-2">
                  <span className="text-base">ℹ️</span>

                  <p>
                    To view client status for an
                    earlier date, change
                    <strong> Client Status On </strong>
                    and click <strong>Go</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* ===================================================
                NOTES
            =================================================== */}
            <div className="col-span-6 border-gray-200">
              <Notes
                value={statusData?.notes ?? ''}
                readOnly={false}
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            RIGHT PANEL
        ======================================================= */}
        <div className="col-span-6 p-4">
          <div className="grid grid-cols-12">
            <div className="col-span-12">
              <ServiceHistoryTable
                services={services}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}