import type { ActiveFormClient, ActiveFormRecord } from '../../../types/active-form'; 

function Item({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 min-h-5 text-sm text-gray-900">{value || '—'}</div>
    </div>
  );
}

export default function ClientInformation({
  client,
  form,
}: {
  client: ActiveFormClient;
  form?: ActiveFormRecord;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Client Information</h2>
        <p className="text-xs text-gray-500">
          Read-only information from the client record and active form.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Item label="SSN" value={client.SS} />
        <Item label="Last Name" value={client.LastName} />
        <Item label="First Name" value={client.FirstName} />
        <Item label="DOB" value={client.DOB} />
        <Item label="Region" value={form?.Region ?? client.Region} />
        <Item label="County" value={form?.CountyCode} />
        <Item label="Referral Date" value={form?.ReferralDate} />
        <Item label="Status" value={form?.FormType ?? form?.status} />
      </div>
    </section>
  );
}
