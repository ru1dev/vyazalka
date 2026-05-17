import type { ReactNode } from 'react';

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
