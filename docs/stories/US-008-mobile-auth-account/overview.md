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
(PR #14 / `5d435d6`, issue #7), sign-in → protected entry
(PR #16 / `340f2ae`, issue #8), password recovery/reset
(PR #18 / `9cf8ec7`, issue #9), and account `display_name` + ordered sign-out
(branch commits `c808d83` / `7b113e2` / `eb922e7`, issue #10): shared-contract
validation, enumeration-safe messaging, local `lunav://auth/recovery` PKCE
exchange with recovery-only redirectType, SecureStore-bound recovery proof
with delete-fail expire fallback, gated `/auth/reset-password`, StrictMode-safe
callback work, history-stripping replace navigation, and unit coverage including
boot-refresh anonymous fallback when identity lookup fails. Android emulator
runtime was partially exercised on `emulator-5554` (Expo Go + Metro; sign-up
form reached) but the full signup → logout loop is **not** claimed complete.
Hosted App Link / real email smoke remains residual (`BL-US008-01` /
`BL-US008-02`). iOS runtime remains unproven.

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
