import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-arena-navy/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
          aria-label="ArenaFlow home"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/30 bg-arena-blue text-sm font-bold text-white shadow-lg shadow-blue-950/40"
            aria-hidden="true"
          >
            AF
          </span>
          <span>
            <span className="block text-xl font-semibold tracking-tight text-white group-hover:text-blue-200">
              ArenaFlow
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:block">
              Tournament Command
            </span>
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap justify-end gap-1 sm:gap-2">
            {[
              { to: '/operations', label: 'Operations' },
              { to: '/fan', label: 'Fan' },
              { to: '/volunteer', label: 'Volunteer' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
