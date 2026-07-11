# ArenaFlow

ArenaFlow is a GenAI-powered stadium intelligence and operations platform designed for smart stadium operations in major international football tournament environments. It connects deterministic operational engines with contextual AI assistance to support staff, fans, and volunteers through role-based experiences.

## Current Milestone

**Milestone 1 — Project Foundation & Application Shell**

This release establishes the monorepo workspace, React frontend shell, Express API with a health endpoint, shared layout and placeholder role routes, testing foundation, and architecture documentation. Simulation, crowd intelligence, routing, operational decision engines, and OpenAI integration are planned for later milestones.

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript, Zod |
| Testing | Vitest, React Testing Library, Supertest |

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

## Planned Modules

The following capabilities are **not** included in this milestone and will be added incrementally:

- Stadium Digital State Simulator
- Crowd Intelligence Engine
- Smart Routing Engine
- Operational Decision Engine
- AI Context Orchestrator & GenAI Copilot
- Authentication and persistent data storage

See [docs/architecture.md](docs/architecture.md) for the planned system pipeline.
