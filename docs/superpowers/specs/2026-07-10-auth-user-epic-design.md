# Auth and User Epic Design

## Intent

Phase 2 gives one person the same verified Supabase identity on web and mobile.
US-004 is a coordination-only epic: it defines the dependency graph, exclusive
ownership, and proof required for child stories, but it does not implement auth
or database behavior itself.

## Accepted Product Decisions

- MVP authentication uses email and password.
- Email confirmation is required before private flows are available.
- Password recovery is included on web and mobile.
- A private `profiles` table has a one-to-one relationship with
  `auth.users.id` and Row Level Security based on `auth.uid()`.
- A database trigger creates the profile when the Auth user is created.
- Basic account settings include editable `display_name`, read-only email,
  email-confirmation status, and sign-out.
- A protected-route login returns to a validated original destination; a
  direct login continues to the platform home screen.
- Supabase local is the repeatable automated integration gate. Hosted Supabase
  is a manual smoke gate for real email delivery, callback URLs, and mobile
  deep links.
- Android emulator or device runtime is the mobile platform gate on Windows.
  iOS runtime proof is deferred until a suitable Apple environment exists.

## Module Shape

The auth session module presents a small interface to both apps: observe a
verified session, resolve the canonical user, and sign out while clearing
user-scoped cache. Web and mobile own separate adapters at that seam because
their routing, persistence, and callback behavior differ.

The profile module is a separate persistence seam. Its migration, trigger,
policies, contract, and cross-user tests are owned together so neither app can
invent profile lifecycle or authorization behavior.

## Story Graph

```text
US-003 Foundation
  -> US-005 Auth session and canonical identity
       -> US-006 Profile persistence and RLS
            -> US-007 Web authentication and account flow
            -> US-008 Mobile authentication and account flow

US-004 Auth and User epic
  contains US-005, US-006, US-007, and US-008
```

US-007 and US-008 may run in parallel only after US-005 and US-006 have fresh
passing proof. US-004 completes only after both platform stories satisfy their
declared gates.

## Security Contract

- Supabase Auth is the only identity provider.
- A client-provided user identifier is never authorization evidence.
- Every profile read or update is authorized by `auth.uid()` through RLS.
- Public clients receive no service-role key or provider secret.
- Redirect destinations are local, allowlisted app paths; external redirect
  values are rejected.
- Hosted Android confirmation and recovery use verified HTTPS App Links;
  custom schemes are development-only.
- Auth-facing responses do not reveal whether an email exists or is confirmed.
- Passwords, sessions, tokens, and recovery codes are never logged.
- Sign-out clears user-scoped caches before another identity can use the app.

## Error and Recovery Behavior

Invalid credentials, unconfirmed email, expired recovery links, unavailable
network, and expired sessions produce distinct user-safe states. Internal
provider details stay out of UI messages. Session expiry returns the user to
authentication while preserving only a validated local destination.

## Validation Strategy

- Contract tests prove normalized auth/profile data and reject untrusted IDs.
- Supabase-local integration tests prove signup, profile trigger behavior, RLS,
  cross-user denial, session refresh, and sign-out cleanup.
- Web E2E proves signup, confirmation gate, login, protected redirects,
  recovery, settings round-trip, reload, and logout.
- Android runtime proof covers the equivalent mobile flow and callback/deep
  link behavior.
- Hosted smoke proof covers real confirmation/recovery email and configured
  callback URLs without storing hosted secrets in the repository.

## Non-Goals

OAuth, magic links, avatars, account email changes, password changes from
settings, locale preferences, account deletion, multi-session management,
chart or AI features, and iOS runtime certification are outside this epic.
