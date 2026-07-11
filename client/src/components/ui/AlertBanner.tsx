import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  title: string;
  message: string;
  tone?: 'success' | 'warning' | 'danger';
}

const toneStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-50',
  danger: 'border-rose-500/40 bg-rose-500/10 text-rose-50',
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

export function AlertBanner({ title, message, tone = 'warning' }: AlertBannerProps) {
  const Icon = icons[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-lg shadow-slate-950/30 ${toneStyles[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
