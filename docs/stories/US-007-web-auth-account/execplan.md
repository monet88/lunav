# US-007 Exec Plan: Web Authentication and Account Flow

## Goal

Implement the complete Phase 2 web auth and minimal account workflow using the
approved shared identity and profile modules.

## Work Phases

1. Add failing tests for form validation, error mapping, and protected return
   paths.
2. Add signup, sign-in, confirmation-pending, forgot-password, and reset forms.
3. Add confirmation and recovery callback handlers using Supabase SSR cookies.
4. Consume US-005 `proxy.ts` route gating and add verified-user checks in every
   protected server page, action, and route handler.
5. Add the account screen and owner-scoped `display_name` update.
6. Add sign-out cache cleanup and anonymous navigation.
7. Add and run Supabase-local browser E2E flows, then perform hosted email and
   callback smoke proof.

## Stop Conditions

Pause if implementation requires trusting a return URL, exposing a raw token
to shared code, adding an unapproved dependency, or changing US-005/US-006
owned files without a dependency-graph update.
