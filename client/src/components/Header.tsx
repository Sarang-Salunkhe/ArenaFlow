import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
          aria-label="ArenaFlow home"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-arena-blue text-sm font-bold text-white"
            aria-hidden="true"
          >
            AF
          </span>
          <span className="text-xl font-semibold tracking-tight text-arena-navy group-hover:text-arena-blue">
            ArenaFlow
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex gap-1 sm:gap-2">
            {[
              { to: '/operations', label: 'Operations' },
              { to: '/fan', label: 'Fan' },
              { to: '/volunteer', label: 'Volunteer' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-arena-muted transition-colors hover:bg-slate-100 hover:text-arena-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
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
