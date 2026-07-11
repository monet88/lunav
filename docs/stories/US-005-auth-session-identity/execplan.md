# US-005 Exec Plan: Auth Session and Canonical Identity

## Goal

Create the smallest shared auth interface and platform adapters needed by the
profile and UI stories without implementing user-facing flows.

## Work Phases

1. Add failing contract tests for normalized identity, confirmation state, and
   safe return destinations.
2. Add the auth contract without raw token fields.
3. Add failing web adapter tests, then implement browser/server clients and
   Next.js 16 `proxy.ts` cookie refresh behavior.
4. Add failing mobile adapter tests, then implement persistent storage,
   auth-state subscription, and foreground auto-refresh.
5. Enable and test mandatory email confirmation in local Auth configuration.
6. Add sign-out cleanup, cleanup-failure, relaunch, and cross-identity cache
   isolation tests plus the cleanup-hook interface.
7. Run focused tests, root typecheck, and the client-secret scan.

## Stop Conditions

Pause if official Supabase guidance conflicts with the installed package
versions, a service-role key appears necessary in a client, or adapters require
overlapping edits with US-006 through US-008.
