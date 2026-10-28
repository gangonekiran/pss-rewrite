import { formatDate } from '../../../utils/date';

export interface ClientInformationProps {
  client: {
    LastName: string | null;
    FirstName: string | null;
    SS: string | null;
    DOB: string | null;
  };
  regionName?: string | null;
  referralDate?: string | null;
  /** Shown only when passed; forms that do not record County leave it out. */
  county?: string | null;
  /** Shown only when passed; forms that do not record Status leave it out. */
  status?: string | null;
}

function Item({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 min-h-5 text-sm font-semibold text-gray-900">
        {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
      </div>
    </div>
  );
}

/** Read-only client card shown at the top of the input forms. */
export default function ClientInformation({
  client,
  regionName,
  referralDate,
  county,
  status,
}: ClientInformationProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="rounded-t-lg bg-blue-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Client Information</h2>
          <span className="text-xs font-medium text-gray-500">(Read Only)</span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Item label="Child Last Name" value={client.LastName} />
          <Item label="Child First Name" value={client.FirstName} />
          <Item label="SSN" value={client.SS} />
          <Item label="DOB" value={formatDate(client.DOB)} />
          {county !== undefined && <Item label="County" value={county} />}
          <Item label="Region" value={regionName} />
          <Item label="Referral Date (From Referral Form)" value={formatDate(referralDate)} />
          {status !== undefined && <Item label="Status" value={status} />}
        </div>
      </div>
    </section>
  );
}
