# US-007 Hosted Email and Callback Smoke Checklist

Manual attestation only. Record the tested HTTPS origin and configuration
outcomes. Never write passwords, tokens, full callback URLs, or mailbox
contents into docs, commits, logs, or chat history.

## Preconditions

- Hosted Supabase project is available.
- Hosted Auth has email confirmation enabled.
- Canonical web origin is HTTPS and matches `WEB_ORIGIN`.
- Auth redirect allowlist includes:
  - `{WEB_ORIGIN}`
  - `{WEB_ORIGIN}/auth/confirm`
  - `{WEB_ORIGIN}/auth/recovery`
- Password policy and abuse/rate controls are configured for the project.

## Smoke Steps

1. Register a unique disposable email on the hosted web origin.
2. Confirm no private access to `/account` before confirmation.
3. Open the real confirmation email and complete the callback.
4. Sign in and land on `/account` when `returnTo=/account`.
5. Reload `/account` and confirm the session remains.
6. Request password recovery, open the real recovery email, set a new password.
7. Sign in with the new password, update `display_name`, and sign out.
8. Confirm post-logout `/account` redirects to sign-in.
9. Confirm secure cookie attributes on the hosted origin for auth cookies.
10. Confirm external/encoded return destinations do not leave the origin.

## Evidence Record Template

```text
Date:
Operator:
Hosted origin:
Auth project ref (non-secret):
Confirmation enabled: yes/no
Redirect allowlist includes /auth/confirm and /auth/recovery: yes/no
Password/abuse controls configured: yes/no
Secure cookie attributes observed: yes/no
Confirmation email callback: pass/fail
Recovery email callback: pass/fail
Protected return path /account: pass/fail
Reload session: pass/fail
Logout blocks /account: pass/fail
Residual notes:
```

## Current Status

Hosted signup/login path accepted on 2026-07-12 against a free Vercel origin and
a dedicated Supabase Cloud project. Product decision: **registration +
confirmation + sign-in are sufficient for now**. Recovery email, deep cookie
attribute attestation, and hosted profile polish are deferred to
`docs/stories/backlog.md` (`BL-US007-01` .. `BL-US007-03`) and do not block US-007.

```text
Date: 2026-07-12
Operator: agent
Hosted origin: https://lunav-web.vercel.app
Auth project ref (non-secret): dshhnqvfgundzsdjegbt
Confirmation enabled: yes
Redirect allowlist includes /auth/confirm and /auth/recovery: yes
Password/abuse controls configured: yes (project defaults; free-tier email rate limit observed)
Secure cookie attributes observed: partial (auth cookie present on HTTPS origin; deeper httpOnly/sameSite attestation deferred to BL-US007-02)
Confirmation email callback: pass
Recovery email callback: deferred (BL-US007-01)
Protected return path /account: pass
Reload session: pass
Logout blocks /account: pass
Residual notes:
- Hosted stack: Supabase project lunav + Vercel project lunav-web.
- Profiles migration applied on hosted project.
- Confirmation mail arrived via Supabase built-in mailer to a disposable inbox and completed /auth/confirm.
- Signup + login + protected session accepted as the hosted gate.
- Recovery re-run hit free-tier "email rate limit exceeded" / UI "Ban da thu qua nhieu lan..."; tracked as BL-US007-01.
- admin.generateLink recovery produces hash-token redirects, which the app intentionally rejects in favor of PKCE code exchange; do not use it to fake-pass recovery.
```
