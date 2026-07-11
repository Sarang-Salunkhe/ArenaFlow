import { ShieldCheck, ShieldAlert, TriangleAlert } from 'lucide-react';

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
}

const toneStyles: Record<StatusBadgeTone, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  warning: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  danger: 'border-rose-500/40 bg-rose-500/15 text-rose-100',
  neutral: 'border-slate-700 bg-slate-800/70 text-slate-200',
};

const toneIcons: Record<StatusBadgeTone, typeof ShieldCheck> = {
  success: ShieldCheck,
  warning: TriangleAlert,
  danger: ShieldAlert,
  neutral: ShieldCheck,
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const Icon = toneIcons[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneStyles[tone]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
