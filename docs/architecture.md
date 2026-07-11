# ArenaFlow Architecture Overview

ArenaFlow is designed as a pipeline that combines deterministic operational engines with GenAI-assisted communication. This document describes the planned system flow; only the application shell and API foundation exist in the current milestone.

## Planned Pipeline

```
Stadium Digital State Simulator
        ↓
Crowd Intelligence Engine
        ↓
Smart Routing Engine  +  Operational Decision Engine
        ↓
AI Context Orchestrator
        ↓
GenAI Copilot
        ↓
Role-Based Experiences (Operations Staff · Fan · Volunteer)
```

## Layer Responsibilities

### Deterministic Engines

These modules compute **operational facts and decisions** from stadium state, crowd data, and business rules:

- **Stadium Digital State Simulator** — Models venues, zones, capacity, and real-time operational state.
- **Crowd Intelligence Engine** — Analyzes density, flow patterns, and situational crowd metrics.
- **Smart Routing Engine** — Produces optimal paths and wayfinding guidance under constraints.
- **Operational Decision Engine** — Applies rules and policies to recommend or trigger operational actions.

### GenAI Layer

GenAI is **not** the source of operational truth. It is used for:

- Contextual explanation of engine outputs
- Summarization of complex operational situations
- Multilingual assistance for international audiences
- Natural-language communication tailored to each role

The **AI Context Orchestrator** gathers structured outputs from the deterministic engines and prepares safe, scoped context for the **GenAI Copilot**.

### Role-Based Experiences

The frontend presents role-specific interfaces:

| Role | Purpose |
|------|---------|
| Operations Staff | Monitor, decide, and coordinate stadium operations |
| Fan | Navigate, discover, and receive contextual guidance |
| Volunteer | Access task-focused operational support |

## Current Milestone Scope

What exists today:

- Monorepo workspace (`client/`, `server/`)
- React application shell with landing page and placeholder role routes
- Express API with `GET /api/health`
- Environment-based CORS and configuration
- Testing foundation (Vitest, React Testing Library, Supertest)

What is intentionally deferred:

- All simulation, intelligence, routing, and decision logic
- OpenAI API integration
- Authentication and database persistence
