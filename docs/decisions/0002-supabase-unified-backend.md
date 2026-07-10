# ADR 0002: Supabase Unified Backend

## Status

Accepted on 2026-07-10.

## Context

The original roadmap named Clerk for authentication and Convex for persistence
and realtime workflows. The product owner already uses Supabase and selected it
as the Foundation platform. Keeping Supabase Auth alongside Convex would require
a JWT bridge and two authorization surfaces before the MVP has a user-facing
feature.

## Decision

1. Use Supabase Auth as the sole identity provider for web and mobile.
2. Use Supabase Postgres for persisted product data, with Row Level Security on
   every private product table.
3. Use Supabase Realtime only when a later feature needs live delivery.
4. Use Supabase Edge Functions for privileged orchestration, provider calls,
   and server-only engine coordination.
5. Treat `auth.users.id` as the canonical user identifier. A user-supplied ID
   never establishes authorization.
6. Scaffold Expo Router as a build-verified shell in Foundation. Do not add
   mobile business UI or NativeWind until Phase 2 mobile UI work begins.

## Consequences

- Clerk and Convex are not installed or configured.
- Web, mobile, database policies, and Edge Functions share one identity model.
- Every new private table requires an RLS policy in its migration and
  ownership-negative integration coverage in its owning story.
- Client applications can use only the Supabase URL and publishable/anon key;
  service-role credentials are limited to server-only execution.
- Foundation establishes project structure and checks, but does not create an
  authentication UI, profile sync, or product persistence schema.

## Alternatives Considered

### Clerk plus Convex

Rejected because it introduces two external systems when the product owner
already operates Supabase and the MVP does not need Convex-specific workflows.

### Supabase Auth plus Convex

Rejected because a Supabase JWT bridge, identity mapping, and duplicated
ownership rules would add complexity without a current product benefit.

### Supabase Auth only

Rejected because the MVP also requires persistence, RLS, Realtime, and
server-only workflow execution.

## Validation

- Foundation must prove its web build, mobile shell build, strict typechecking,
  linting, and tests from the root workspace.
- Later private-data stories must prove RLS and cross-user denial cases.
- No secret may appear in client source, committed environment files, or build
  output.