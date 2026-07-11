# US-006 Overview: Profile Persistence and RLS

## Status

implemented

## Lane

high-risk

## Prerequisites

- US-005 shared identity interface and adapters have fresh passing proof.

## Implemented Behavior

`public.profiles` is the application-owned one-to-one profile lifecycle for
Supabase Auth identities. Database triggers create and timestamp the row, and
forced Row Level Security keeps it private to its owner.

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
