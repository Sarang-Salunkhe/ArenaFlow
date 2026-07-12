import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneStyles = {
  default: 'border-slate-800/80 bg-slate-900/40 text-slate-100 border-l-4 border-l-blue-500/80 hover:border-r-white/5',
  success: 'border-emerald-500/20 bg-emerald-950/10 text-emerald-100 border-l-4 border-l-emerald-500 hover:border-r-emerald-500/10',
  warning: 'border-amber-500/20 bg-amber-950/10 text-amber-100 border-l-4 border-l-amber-500 hover:border-r-amber-500/10',
  danger: 'border-rose-500/20 bg-rose-950/10 text-rose-100 border-l-4 border-l-rose-500 hover:border-r-rose-500/10',
};

const iconToneColor = {
  default: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export function KpiCard({ label, value, helper, icon: Icon, tone = 'default' }: KpiCardProps) {
  const accentClass = iconToneColor[tone] || iconToneColor.default;
  
  return (
    <article className={`rounded-2xl border p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${toneStyles[tone]}`} id="kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 truncate">{label}</p>
          <p className="mt-2 responsive-kpi-value font-black tracking-tight text-white font-mono break-all">{value}</p>
          {helper ? <p className="mt-2 text-xs text-slate-300 leading-normal font-sans">{helper}</p> : null}
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border p-2 shadow-inner ${accentClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
