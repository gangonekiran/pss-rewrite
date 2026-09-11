import type { ActiveFormClient } from '../../../types/active-form';

interface ClientInformationProps {
  client: ActiveFormClient;
  county?: string | null;
  regionName?: string | null;
  referralDate?: string | null;
  status?: string | null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US');
}

function Item({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">
        {label}
      </div>

      <div className="mt-1 min-h-5 text-sm font-semibold text-gray-900">
        {value !== null && value !== undefined && value !== ''
          ? String(value)
          : '—'}
      </div>
    </div>
  );
}

export default function ClientInformation({
  client,
  county,
  regionName,
  referralDate,
  status,
}: ClientInformationProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="rounded-t-lg bg-blue-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            Client Information
          </h2>

          <span className="text-xs font-medium text-gray-500">
            (Read Only)
          </span>
        </div>
      </div>

      {/* Client information */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Item
            label="Child Last Name"
            value={client.LastName}
          />

          <Item
            label="Child First Name"
            value={client.FirstName}
          />

          <Item
            label="SSN"
            value={client.SS}
          />

          <Item
            label="DOB"
            value={formatDate(client.DOB)}
          />

          <Item
            label="County"
            value={county}
          />

          <Item
            label="Region"
            value={regionName}
          />

          <Item
            label="Referral Date (From Referral Form)"
            value={formatDate(referralDate)}
          />

          <Item
            label="Status"
            value={status}
          />
        </div>
      </div>
    </section>
  );
}