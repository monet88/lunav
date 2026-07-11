# US-008 Exec Plan: Mobile Authentication and Account Flow

## Goal

Implement the complete Phase 2 Android auth and minimal account workflow using
the approved shared identity and profile modules.

## Work Phases

1. Add failing tests for form validation, auth-state navigation, and callback
   parsing.
2. Configure the local app scheme, hosted verified Android App Links, and
   explicit confirmation/recovery callback routes.
3. Add signup, sign-in, confirmation-pending, forgot-password, and reset forms.
4. Protect the private route group with `Stack.Protected` and confirmed auth
   state.
5. Add the account screen and owner-scoped `display_name` update.
6. Add sign-out cache cleanup and public navigation.
7. Run focused checks, Android emulator/device flow, and hosted email/deep-link
   smoke proof.

## Stop Conditions

Pause if secure session persistence needs an unapproved dependency, deep-link
handling accepts arbitrary destinations, Android runtime proof is unavailable,
or implementation overlaps US-005/US-006 owned files.
