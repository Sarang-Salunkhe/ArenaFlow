import { Link } from 'react-router-dom';

interface RoleCardProps {
  title: string;
  description: string;
  to: string;
  accentClass: string;
}

export function RoleCard({ title, description, to, accentClass }: RoleCardProps) {
  return (
    <article className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20 backdrop-blur transition hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/[0.09]">
      <div className={`mb-4 h-1 w-12 rounded-full ${accentClass}`} aria-hidden="true" />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">{description}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-arena-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
        aria-label={`Enter as ${title}`}
      >
        Enter as {title}
      </Link>
    </article>
  );
}
