# US-008 Overview: Mobile Authentication and Account Flow

## Status

in_progress

## Lane

high-risk

## Prerequisites

- US-005 identity/session proof is fresh and passing.
- US-006 profile/RLS proof is fresh and passing.

## Current Behavior

The Expo Router app has a merged mobile auth session shell (PR #12 / `4902f5c`),
signup → confirmation-pending → local `lunav://auth/confirm` exchange
(PR #14 / `5d435d6`, issue #7), and sign-in → protected entry (issue #8):
shared-contract validation, enumeration-safe sign-in failure for bad credentials /
unknown / unconfirmed, rate-limit + generic provider-error mapping, validated
return destination falling back safely to the private shell, post-password
identity refresh via `getUser()` before `signed-in`, session wait for
`authenticated` before replace navigation, unconfirmed sessions still blocked
from private routes by `Stack.Protected`, and focused unit coverage.
Recovery/reset (#9), account `display_name` + sign-out (#10), Android runtime
proof + closeout (#11), and hosted App Link smoke remain open.

## Target Behavior

Android supports the same email/password and confirmed-email semantics as web,
with native session persistence, deep-link confirmation/recovery callbacks,
protected navigation, minimal account settings, and sign-out.

## Exclusive Ownership

- `apps/mobile/src/app/(auth)/**`
- `apps/mobile/src/app/(protected)/**`
- mobile-only auth state integration, screens, tests, and runtime fixtures
- mobile scheme/linking configuration in `apps/mobile/app.json`

Shared contracts and profile migrations remain owned by US-005 and US-006.

## Non-Goals

No OAuth, magic link, avatar, account deletion, iOS runtime certification, or
mobile-owned database policy.
