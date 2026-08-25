import type { ReactNode } from 'react';
type Props = { title?: string; children: ReactNode };
export default function PageContainer({ title, children }: Props) {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
      {children}
      </div>
    </section>
  );
}
