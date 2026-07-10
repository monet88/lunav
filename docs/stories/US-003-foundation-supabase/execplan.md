# US-003 Exec Plan: Foundation Monorepo and Supabase Platform

## Goal

Create a build-verified pnpm and Turborepo foundation for web, mobile, shared
packages, and future Supabase work without implementing Phase 2 authentication
or product behavior.

## Risk Classification

Risk flags:

- authentication and authorization architecture
- future persisted data and RLS conventions
- external Supabase platform configuration
- cross-platform workspace and build behavior
- source-of-truth architecture change

Hard gates:

- ADR 0002 remains the source of truth for the selected Supabase platform.
- No live Supabase credential or service-role key enters the repository.
- The root lint, typecheck, test, and build commands pass before the story is
  marked implemented.

## Work Phases

1. Create the root pnpm workspace, Turbo task graph, strict TypeScript base,
   formatting, linting, and deterministic test runner.
2. Create shared packages and test public Supabase configuration parsing.
3. Scaffold the Next.js App Router shell and connect it to root checks.
4. Scaffold the Expo Router shell and prove a static Android export path that
  does not require an Android SDK or emulator.
5. Initialize the Supabase directory and document the RLS and secret boundary.
6. Add CI and run all root acceptance commands.

## Stop Conditions

Pause for human direction if a dependency requires a paid plan, a Supabase
credential must be committed, the current Node or pnpm version is unsupported,
or a generated scaffold conflicts with the ADR boundaries.

## Progress

- [x] (2026-07-10) Product owner approved Supabase Auth as the sole identity
  provider and Supabase as the unified backend.
- [x] (2026-07-10) Product owner approved Next.js and Expo Router shells, with
  NativeWind deferred until Phase 2 UI work.
- [x] (2026-07-10) Recorded ADR 0002, US-003 planning intake, packet, and
  validation strategy.
- [x] (2026-07-10) Product owner approved the written Foundation design and
  plan.
- [x] (2026-07-10) Implemented the approved workspace, web, mobile, shared
  package, and Supabase Foundation boundaries.
- [x] (2026-07-10) Ran and recorded the Foundation acceptance gates.