# US-006 Overview: Profile Persistence and RLS

## Status

planned

## Lane

high-risk

## Prerequisites

- US-005 shared identity interface and adapters have fresh passing proof.

## Current Behavior

No application table or RLS policy exists. Supabase Auth identities have no
application-owned profile lifecycle.

## Target Behavior

Every new Auth user receives exactly one private profile. The owner can read
the profile and update only `display_name`; another user cannot read or mutate
it. Clients never choose the profile owner identifier.

## Exclusive Ownership

- `supabase/migrations/**` migration introduced by this story
- `packages/contracts/src/profile.ts`
- `packages/contracts/src/profile.test.ts`
- profile database integration tests and fixtures
- profile sections of `docs/DATA_MODEL.md`

## Non-Goals

No avatar, locale preference, role system, account deletion, public profile,
email duplication, or client-side profile creation.
