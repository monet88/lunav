# Lunav

Lunav is the Vietnamese-first ZIWEI AI product. The monorepo contains a
Next.js web application, an Expo mobile application, shared TypeScript
packages, and a Supabase backend boundary.

## Product Direction

The MVP lets a user use the same account on web and mobile, create and reopen
Zi Wei charts, request AI explanations, continue assistant conversations, and
return to persisted history.

The authoritative roadmap and product contracts are:

- `SPEC.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/INVARIANTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`

## Current State

- Phase 0 reference audit and product contract: implemented.
- Foundation monorepo and Supabase platform: implemented as US-003.
- Auth and User: US-005 auth session identity seam implemented; US-006 through
  US-008 remain planned.
- Chart, AI explanation, assistant conversation, and stabilization phases:
  not implemented.

Planned behavior must not be described as implemented until its story proof
passes.

## Repository Structure

```text
apps/
  web/             Next.js App Router application
  mobile/          Expo Router application
packages/
  config/          Shared configuration parsing
  constants/       Locale-neutral constants
  contracts/       Shared boundary schemas
  domain/          Framework-independent business rules
  ui-tokens/       Platform-neutral design tokens
supabase/
  migrations/      Versioned database and RLS changes
  functions/       Privileged Edge Functions
docs/
  stories/         Story contracts, designs, plans, and validation
  decisions/       Durable architecture decisions
scripts/           Repository checks and Harness utilities
```

## Prerequisites

- Node.js 22
- pnpm 10.28.2
- Git
- Docker when a story requires the local Supabase stack

## Setup

```powershell
pnpm install --frozen-lockfile
```

Client Supabase configuration belongs in local, ignored environment files. Use
the committed `.env.example` files as the variable-name contract. Never place a
service-role key or provider secret in client configuration.

## Development

Start the web application:

```powershell
pnpm --filter @lunav/web dev
```

Start the Expo application:

```powershell
pnpm --filter @lunav/mobile start
```

## Quality Gates

Run the complete Foundation gate from the repository root:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:client
```

The root build creates a production Next.js build and an Android Expo export.
An Expo export is bundle proof only; stories that require native runtime proof
must also run on the declared emulator or device.

## Story Entry Points

- Foundation: `docs/stories/US-003-foundation-supabase/`
- Auth and User epic: `docs/stories/US-004-auth-user-epic/`
- Auth implementation plan:
  `docs/superpowers/plans/2026-07-10-auth-user-epic.md`

Do not start a story implementation until its prerequisites, ownership, and
validation contract are confirmed.