# ArenaFlow

ArenaFlow is a GenAI-powered stadium intelligence and operations platform designed for smart stadium operations in major international football tournament environments. It connects deterministic operational engines with contextual AI assistance to support staff, fans, and volunteers through role-based experiences.

## Current Experience

ArenaFlow now presents a finals-ready command platform for high-volume football tournament operations. The backend engines remain deterministic and API-driven, while the frontend provides role-specific experiences for operations staff, fans, and volunteers.

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript, Zod |
| Testing | Vitest, React Testing Library, Supertest |

## Product Surfaces

- **Operations Dashboard**: command center layout with live KPIs, active incidents, decision-engine recommendations, an interactive stadium map, PA broadcast generation, and an AI operations copilot.
- **Fan Experience**: mobile-first match-day companion with live alerts, route calculation, accessibility routing, walking time, nearby service context, route summaries, and AI route explanations.
- **Volunteer Experience**: mission console with assigned sector posture, priority tasks, dispatch broadcasts, incident reporting, and a volunteer support assistant.
- **Floating AI Assistant**: role-aware expandable drawer with conversation history, suggested prompts, typing state, fallback labeling, markdown rendering, and structured AI response cards.

## UI Architecture

Reusable frontend components live under `client/src/components/ui`:

- `KpiCard`, `StatusBadge`, `AlertBanner`, `LoadingSkeleton`, and `LoadingState` define the command-center design primitives.
- `AIResponseCard`, `MarkdownRenderer`, `ChatBubble`, `PromptSuggestion`, and `FloatingAssistant` handle structured AI output, markdown, chat history, and prompt shortcuts.
- Page files compose these primitives without changing backend contracts or deterministic engine behavior.

The visual language uses deep navy `#081229`, surface `#101828`, primary blue `#2563EB`, success `#10B981`, warning `#F59E0B`, and danger `#EF4444` with glass panels, soft elevation, accessible focus rings, and reduced-motion support.

## AI Assistant

ArenaFlow AI responses are rendered as structured cards instead of long text blocks when the response includes sections such as Situation Summary, Priority, Affected Areas, Recommended Actions, Reasoning, Helpful Tips, and Generated Time. Markdown, bullet lists, numbered lists, bold text, inline code, and code blocks are supported through the local renderer.

If OpenAI credentials are unavailable, the assistant surfaces deterministic fallback responses from the existing backend while clearly labeling fallback mode in the UI.

## Deterministic Engine

Operational facts are produced by the existing simulator, crowd intelligence, routing, and decision engines. The frontend consumes those outputs through REST APIs and does not alter routing algorithms, simulator logic, decision logic, or API contracts.

## Screenshots

Add current demo screenshots here after running the app locally:

- `docs/screenshots/operations-dashboard.png`
- `docs/screenshots/fan-companion.png`
- `docs/screenshots/volunteer-mission-console.png`
- `docs/screenshots/floating-ai-assistant.png`

## Local Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ArenaFlow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Adjust `PORT` and `CLIENT_ORIGIN` if needed. OpenAI variables are placeholders for future milestones.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend and backend together |
| `npm run dev:client` | Start Vite dev server (default `http://localhost:5173`) |
| `npm run dev:server` | Start Express API (default `http://localhost:3001`) |
| `npm test` | Run all workspace tests |
| `npm run build` | Build frontend and backend for production |

See [docs/architecture.md](docs/architecture.md) for the system pipeline.
