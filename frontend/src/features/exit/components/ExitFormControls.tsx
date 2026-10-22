import type { ReactNode } from 'react';

export { Field } from '../../active-form/components/FormField';

/** Same card as the Active Form sections. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** A labelled group inside a section. */
export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}
