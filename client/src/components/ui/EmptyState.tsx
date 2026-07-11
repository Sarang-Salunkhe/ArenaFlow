import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
      <AlertCircle className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
    </div>
  );
}
