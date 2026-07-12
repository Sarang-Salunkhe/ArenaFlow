interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-400">{eyebrow}</p>
        <h1 className="mt-1.5 fluid-h1 font-black tracking-tight text-white font-sans">{title}</h1>
        {description ? <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 flex items-center gap-2 mt-2 md:mt-0">{action}</div> : null}
    </div>
  );
}
