import { ReactNode } from 'react';
type Props = { title?: string; children: ReactNode };
export default function PageContainer({ title, children }: Props) {
  return (
    <section className="space-y-4 p-6">
      {title && <h1 className="text-2xl font-semibold">{title}</h1>}
      {children}
    </section>
  );
}
