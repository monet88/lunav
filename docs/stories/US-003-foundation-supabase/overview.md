# US-003 Overview: Foundation Monorepo and Supabase Platform

## Status

implemented

## Lane

high-risk

## Current Behavior

The repository has a pnpm and Turborepo monorepo, minimal Next.js and Expo
Router shells, shared package boundaries, a local Supabase project directory,
root quality gates, and a GitHub Actions workflow. No sign-in flow, product
schema, or live Supabase service is present.

## Target Behavior

The repository has a pnpm and Turborepo monorepo with a strict-TypeScript
Next.js App Router web shell, a build-verified Expo Router mobile shell, shared
non-UI packages, Supabase project structure, and root quality gates for lint,
typecheck, tests, and builds. Supabase is documented as the unified backend,
but this story does not create user-facing authentication flows or product
tables.

## Affected Users

- Engineers and agents extending the MVP from Phase 2 onward.
- Product owner evaluating whether the selected platform can be built and
  checked locally.

## Product and Architecture Docs

- `SPEC.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/INVARIANTS.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0002-supabase-unified-backend.md`

## Non-Goals

- Sign-up, sign-in, sign-out, profile sync, or protected routes.
- Product tables, chart contracts, RLS policies, or user data migrations.
- AI providers, astrology engine integration, chat, payments, and billing.
- NativeWind installation, mobile business screens, or shared web/mobile UI.