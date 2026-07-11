# US-005 Design: Auth Session and Canonical Identity

## Interface

`packages/contracts` owns normalized auth values:

```ts
type AuthIdentity = {
  userId: string
  email: string
  isEmailConfirmed: boolean
}

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'unconfirmed'; identity: AuthIdentity }
  | { status: 'authenticated'; identity: AuthIdentity }
```

Raw access and refresh tokens remain inside platform adapters. Callers learn
only the normalized state and sign-out behavior.

## Web Adapter

Use `@supabase/ssr` browser/server clients. This story exclusively owns Next.js
16 `proxy.ts`, which refreshes auth cookies with `getAll` and `setAll` and gates
the declared private route pattern. The proxy is a UX gate only: every private
Server Component, Server Action, and Route Handler resolves a verified user
server-side rather than trusting the proxy or an unverified cookie payload.
Route UI is deferred to US-007.

## Mobile Adapter

Use `@supabase/supabase-js` with native persistent storage and AppState-driven
auto-refresh. The adapter exposes normalized state and does not export its
storage key or raw session. Route UI is deferred to US-008.

## Redirect Safety

A return destination is parsed against an internal base URL and accepted only
when its canonical pathname is in the internal route allowlist. Reject another
origin, `//`, backslashes, encoded slash or backslash after decoding, control
characters, protocol-looking values, malformed percent encoding, and
unapproved query keys. Return canonical `pathname + approved search` or `/`.

## Sign-Out Order

1. Immediately block private rendering and cancel user-bound requests.
2. Clear memory and persisted cache entries namespaced by the current user and
  unsubscribe user-bound realtime listeners.
3. Call Supabase Auth sign-out in `finally`, even when cleanup fails.
4. Publish anonymous auth state and navigate to the public entry route.

Cleanup failures are redacted in logs and never prevent sign-out. This order
prevents the next identity from observing stale private state.

## Auth Configuration

Supabase local and hosted environments must enable email confirmation. Signup
must not satisfy the confirmed-authenticated guard until confirmation succeeds.
Hosted password, resend cooldown, sign-in/reset rate limits, and CAPTCHA or an
equivalent anti-automation control are reviewed before hosted proof.
