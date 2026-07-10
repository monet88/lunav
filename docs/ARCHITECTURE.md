# Architecture

## Status

This document records the accepted target architecture. Phase 0 has not yet
implemented it.

## Target System

```text
apps/web (Next.js App Router) ----+
                                  |
apps/mobile (Expo Router) --------+--> packages/contracts
                                  |        |
                                  |        v
                                  +--> Convex functions
                                           |
                         +-----------------+------------------+
                         |                 |                  |
                  packages/domain  packages/prompts  server-only engine
                         |                 |                  |
                         +-----------------+------------------+
                                           |
                                      persistence / AI
```

Planned stack:

- pnpm workspaces and Turborepo
- Next.js App Router for web and public growth surfaces
- Expo Router for native iOS and Android
- Convex for realtime backend workflows and persistence
- Clerk for shared authentication
- Zod and strict TypeScript for boundary contracts
- Tailwind plus shadcn/ui on web
- NativeWind or Tamagui on mobile, chosen during Foundation
- Vitest and Playwright, with mobile smoke tests added when a mobile flow exists

## Dependency Direction

- UI apps depend on contracts, locale-neutral constants, approved domain logic,
  and design tokens.
- Convex functions depend on contracts, domain logic, prompts, and server-only
  integrations.
- `packages/contracts` depends only on validation/runtime primitives required to
  express schemas.
- `packages/domain` contains pure business rules and does not depend on UI or
  Convex handlers.
- `packages/prompts` owns versioned prompt definitions.
- The astrology engine is server-only and cannot be reached from a client
  import graph.

## Boundary Flow

```text
untrusted input
  -> contract parse
  -> identity and ownership check
  -> workflow coordination
  -> pure domain or server-only engine work
  -> normalized persisted result
  -> contract parse
  -> platform-specific rendering
```

## Locale Architecture

MVP exposes only `vi`, but locale is explicit at relevant boundaries:

- UI strings resolve from translation keys.
- domain identifiers remain ASCII and locale-neutral.
- birth input, AI requests, AI outputs, and persisted generated content use an
  agreed locale value.
- locale dictionaries translate normalized chart terms.
- raw engine labels never become presentation fallbacks.

The canonical locale format (`vi` or `vi-VN`) is deferred to the contracts story
in Phase 1 or Phase 3 and must be decided before persistence schemas land.

## Security Boundaries

- Clerk identity is verified server-side before private operations.
- Every private record query is scoped to the current user.
- AI providers, engine packages, billing logic, and secrets are server-only.
- Client bundles expose no secret and make no privileged decision.
- External and AI data is parsed before use.

## Workflow Boundaries

Charts, explanations, conversations, vision analyses, and cost-bearing tasks use
durable workflow state. Retry and idempotency are part of each feature contract,
not UI conventions.

## Platform Boundaries

Web and mobile share semantics, not screens. Do not force shared navigation,
forms, modals, or layout primitives before duplication stabilizes.

## Architecture Decisions

- `docs/decisions/0001-clean-room-vietnamese-first-foundation.md`
