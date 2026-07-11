import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  role: string;
  description: string;
  accentClass: string;
  children?: ReactNode;
}

export function PlaceholderPage({
  role,
  description,
  accentClass,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {children}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className={`mb-4 h-1 w-12 rounded-full ${accentClass}`} aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-wider text-arena-muted">
          Role workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-arena-navy">{role}</h1>
        <p className="mt-4 leading-relaxed text-slate-600">{description}</p>
        <p
          className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-arena-muted"
          role="status"
        >
          Placeholder &mdash; module integration coming in a future milestone.
        </p>
      </div>
    </div>
  );
}
