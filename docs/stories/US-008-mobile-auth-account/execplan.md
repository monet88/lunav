# US-008 Exec Plan: Mobile Authentication and Account Flow

## Goal

Implement the complete Phase 2 Android auth and minimal account workflow using
the approved shared identity and profile modules.

## Work Phases

1. ~~Protect the private route group with `Stack.Protected` and a single mobile
   auth session source of truth (session provider, loading surface, ordered
   sign-out cleanup stub).~~ **Done in PR #12 (`4902f5c`).**
2. ~~Add failing tests for form validation and callback parsing.~~ **Done for
   signup/confirm slice (issue #7 / PR #14).**
3. ~~Configure the local app scheme and explicit confirmation callback route
   (`lunav://auth/confirm` + unguarded `/auth/confirm-failed`).~~ Hosted
   verified Android App Links remain later.
4. ~~Add signup + confirmation-pending/resend.~~ ~~Sign-in + protected return
   destination (#8 / PR #16).~~ ~~Forgot-password / recovery / gated reset
   (#9 / PR #18).~~
5. ~~Add the account screen and owner-scoped `display_name` update (#10).~~
   **Done on branch (`c808d83` + harden/sign-out follow-ups).**
6. ~~Wire sign-out cache cleanup to real product caches and public navigation
   (#10).~~ **Done on branch.**
7. Run focused checks, Android emulator/device flow, and hosted email/deep-link
   smoke proof (#11). **Static gates green (2026-07-13). Android full-loop
   still partial (sign-up form only on `emulator-5554`); hosted App Links
   parked as `BL-US008-01` / `BL-US008-02`.**

## Stop Conditions

Pause if secure session persistence needs an unapproved dependency, deep-link
handling accepts arbitrary destinations, Android runtime proof is unavailable,
or implementation overlaps US-005/US-006 owned files.
