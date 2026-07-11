import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneStyles = {
  default: 'border-slate-700/70 bg-slate-900/70 text-slate-50',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-50',
  danger: 'border-rose-500/40 bg-rose-500/10 text-rose-50',
};

export function KpiCard({ label, value, helper, icon: Icon, tone = 'default' }: KpiCardProps) {
  return (
    <article className={`rounded-2xl border p-4 shadow-lg shadow-slate-950/20 backdrop-blur ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
          {helper ? <p className="mt-2 text-xs text-slate-300">{helper}</p> : null}
        </div>
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-slate-200" aria-hidden="true" /> : null}
      </div>
    </article>
  );
}
