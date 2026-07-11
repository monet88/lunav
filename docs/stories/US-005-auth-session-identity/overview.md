# US-005 Overview: Auth Session and Canonical Identity

## Status

implemented

## Lane

high-risk

## Prerequisites

- US-003 Foundation proof is fresh and passing.

## Current Behavior

The apps can parse public Supabase configuration but have no Supabase clients,
session lifecycle, current-user contract, confirmation gate, or cache cleanup.

## Target Behavior

Shared contracts normalize a verified Supabase Auth user without exposing raw
tokens. Web and mobile adapters implement the same session semantics while
owning platform-specific storage and refresh behavior.

## Exclusive Ownership

- `packages/contracts/src/auth.ts`
- `packages/contracts/src/auth.test.ts`
- `apps/web/src/lib/supabase/**`
- `apps/web/proxy.ts`
- `apps/mobile/src/lib/supabase/**`
- Phase 2 Auth settings in `supabase/config.toml`
- auth-only shared test fixtures introduced by this story

## Outcome Consumed Downstream

US-006, US-007, and US-008 consume a canonical `AuthIdentity` contract, a
confirmed-email predicate, validated local return destinations, and documented
sign-out cache-cleanup hooks.

## Non-Goals

No profile table, auth screen, protected route group, password recovery UI, or
hosted email/deep-link smoke test.
