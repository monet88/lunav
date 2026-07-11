# US-007 Overview: Web Authentication and Account Flow

## Status

planned

## Lane

high-risk

## Prerequisites

- US-005 identity/session proof is fresh and passing.
- US-006 profile/RLS proof is fresh and passing.

## Current Behavior

The web app renders only the Foundation home page. It has no auth forms,
confirmation callback, protected routes, recovery flow, or account settings.

## Target Behavior

The Next.js app supports email/password signup, mandatory email confirmation,
login, password recovery, protected return paths, persisted sessions, minimal
account settings, and sign-out.

## Exclusive Ownership

- `apps/web/src/app/(auth)/**`
- `apps/web/src/app/(protected)/**`
- `apps/web/src/app/auth/**` callback/recovery route handlers
- web-only auth actions, forms, tests, and E2E fixtures

Shared contracts, Supabase adapters, `apps/web/proxy.ts`, Auth configuration,
and profile migrations remain owned by US-005 and US-006.

## Non-Goals

No OAuth, magic link, avatar, email change, account deletion, or web-owned
database policy.
