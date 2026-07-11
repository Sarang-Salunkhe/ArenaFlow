import { Link } from 'react-router-dom';

interface BackLinkProps {
  label?: string;
}

export function BackLink({ label = 'Back to home' }: BackLinkProps) {
  return (
    <nav aria-label="Breadcrumb">
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-arena-blue transition-colors hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-accent"
      >
        <span aria-hidden="true">&larr;</span>
        {label}
      </Link>
    </nav>
  );
}
