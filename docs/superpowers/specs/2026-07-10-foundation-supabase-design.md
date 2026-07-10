# Foundation Monorepo and Supabase Platform Design

## Goal

Create a build-verified cross-platform monorepo foundation using Supabase as the
single authentication and backend platform, without entering Phase 2 auth flows
or product features.

## Accepted Decisions

- Supabase Auth, Postgres, RLS, Realtime, and Edge Functions replace Clerk and
  Convex.
- `auth.users.id` is the canonical private-data identity.
- Web uses Next.js App Router.
- Mobile uses Expo Router as a build-verified shell only.
- NativeWind is selected but deferred until mobile UI work begins.
- Shared packages contain contracts, domain logic, constants, config, and
  tokens; they do not contain shared navigation or feature UI.

## Architecture

The root pnpm workspace uses Turborepo to run lint, typecheck, tests, and builds
across `apps/web`, `apps/mobile`, and shared packages. Supabase project files
are versioned, while credentials remain in ignored local environment files and
deployment secret stores. Future product tables use `auth.users.id` as `user_id`
and enforce ownership with RLS policies that compare against `auth.uid()`.

## Scope

Foundation creates workspace configuration, web/mobile shells, empty shared
package foundations, Supabase directory conventions, configuration validation,
test tooling, and CI. It does not create authentication UI, product schema,
RLS policy, Edge Function business logic, chart functionality, AI, shared UI,
or NativeWind configuration.

## Validation

The implementation must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
`pnpm build` from the root workspace. CI runs the same commands without secret
values. A security check verifies that service-role and provider keys remain
outside client source and version control.

## Risks and Mitigations

- Provider configuration may be incomplete locally: validate public versus
  server-only environment variables without embedding live values.
- Expo and Next.js may require distinct build assumptions: keep app ownership
  separate and use the root task graph only for orchestration.
- RLS could be forgotten in future product tables: ADR 0002 and the invariants
  require table-local RLS plus negative ownership tests in each owning story.