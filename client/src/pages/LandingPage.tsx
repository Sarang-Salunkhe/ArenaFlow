import { RoleCard } from '@/components/RoleCard';

const roles = [
  {
    title: 'Operations Staff',
    description:
      'Monitor stadium state, coordinate responses, and access operational decision support during live events.',
    to: '/operations',
    accentClass: 'bg-arena-blue',
  },
  {
    title: 'Fan',
    description:
      'Navigate the venue, discover services, and receive contextual guidance tailored to your match-day experience.',
    to: '/fan',
    accentClass: 'bg-arena-emerald',
  },
  {
    title: 'Volunteer',
    description:
      'Access task-focused tools and clear instructions to support staff and fans throughout the stadium.',
    to: '/volunteer',
    accentClass: 'bg-amber-500',
  },
] as const;

export function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <section aria-labelledby="hero-heading" className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-arena-accent">
          Welcome
        </p>
        <h1
          id="hero-heading"
          className="mt-3 text-4xl font-bold tracking-tight text-arena-navy sm:text-5xl"
        >
          ArenaFlow
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-arena-muted">
          GenAI-Powered Stadium Intelligence &amp; Operations Platform
        </p>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600">
          ArenaFlow connects real-time stadium intelligence with role-based experiences for
          operations teams, fans, and volunteers. Deterministic engines handle operational facts
          and routing decisions, while GenAI provides contextual explanations and communication
          &mdash; all designed for major international football tournament environments.
        </p>
      </section>

      <section aria-labelledby="roles-heading" className="mt-16">
        <h2 id="roles-heading" className="sr-only">
          Choose your role
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard key={role.to} {...role} />
          ))}
        </div>
      </section>
    </div>
  );
}
