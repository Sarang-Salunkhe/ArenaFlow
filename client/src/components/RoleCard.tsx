import { Link } from 'react-router-dom';

interface RoleCardProps {
  title: string;
  description: string;
  to: string;
  accentClass: string;
}

export function RoleCard({ title, description, to, accentClass }: RoleCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className={`mb-4 h-1 w-12 rounded-full ${accentClass}`} aria-hidden="true" />
      <h2 className="text-lg font-semibold text-arena-navy">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-arena-muted">{description}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-arena-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
        aria-label={`Enter as ${title}`}
      >
        Enter as {title}
      </Link>
    </article>
  );
}
