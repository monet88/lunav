# US-007 Overview: Web Authentication and Account Flow

## Status

implemented-local-e2e-hosted-signup-login-accepted

## Lane

high-risk

## Prerequisites

- US-005 identity/session proof is fresh and passing.
- US-006 profile/RLS proof is fresh and passing.

## Current Behavior

Local web auth/account is implemented and proven with unit tests plus Playwright
browser E2E against Supabase local and Mailpit. Hosted signup, confirmation,
sign-in, and protected `/account` session are accepted on
`https://lunav-web.vercel.app`. Hosted recovery email and cookie/profile polish
are deferred to `docs/stories/backlog.md` and do not block this story.

## Target Behavior

The Next.js app supports email/password signup, mandatory email confirmation,
login, password recovery, protected return paths, persisted sessions, minimal
account settings, and sign-out.

## Exclusive Ownership

- `apps/web/src/app/(auth)/**`
- `apps/web/src/app/(protected)/**`
- `apps/web/src/app/auth/**` callback/recovery route handlers
- web-only auth actions, forms, tests, and E2E fixtures
- `apps/web/proxy.ts` and `apps/web/proxy.test.ts` only for preserving the
	canonical `/account` return destination through sign-in
- `packages/contracts/src/web-auth.ts` and its exports/tests for web form
	boundary validation
- `apps/web/.env.example` only for the non-secret canonical web origin contract

Existing shared auth/profile contracts, Supabase adapters, Auth configuration,
and profile migrations remain owned by US-005 and US-006. The listed handoff
surfaces may not change upstream identity, session, profile, or RLS semantics.

## Non-Goals

No OAuth, magic link, avatar, email change, account deletion, or web-owned
database policy.
