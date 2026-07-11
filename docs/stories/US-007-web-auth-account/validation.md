# US-007 Validation: Web Authentication and Account Flow

## Required Proof

Local unit, typecheck, lint, production build, and client-secret proof have
been run on 2026-07-11. Browser E2E and hosted smoke remain incomplete because
no approved E2E runner or hosted credentials/origin are available.

| Layer | Planned proof |
| --- | --- |
| Unit | Form validation, enumeration-safe provider-error mapping, callback failure cases, and canonical return-path behavior. |
| Integration | Direct requests to private actions/routes verify the Supabase user and use the owner-scoped profile. |
| E2E | Signup has no private access before confirmation; confirmation, login, protected redirect/return, reload, recovery, settings update, and logout work against Supabase local. |
| Hosted smoke | Registered HTTPS origin/callback allowlist, confirmation setting, password/abuse controls, secure cookie attributes, and real confirmation/recovery callbacks are attested. |
| Security | External/encoded return URLs and replayed/wrong-flow callbacks are rejected; callback credentials are removed from history; no token/password/full callback URL is logged or bundled. |

## Available Local Verification

Run the following PowerShell command from the repository root on Windows:

```powershell
.\scripts\verify-web-auth.ps1
```

It runs contracts and web unit tests, web typecheck/lint/build, and the
client-secret scan. It does not establish local Supabase browser E2E or hosted
email/callback proof.

## Planned Commands

```bash
pnpm --filter @lunav/web lint
pnpm --filter @lunav/web typecheck
pnpm --filter @lunav/web test
pnpm --filter @lunav/web build
pnpm security:client
```

The implementation must add the selected browser E2E runner and exact command
only after checking the Harness `e2e-test` capability and obtaining approval
for any new dependency. Hosted smoke evidence is manual and must identify the
tested origin without recording credentials or tokens.

## Security Hardening Applied (US-007 ownership)

Local hardening covered by unit tests and verify-web-auth.ps1:

1. Recovery marker cookie is bound to the verified userId and checked on reset.
2. Recovery marker is cleared on successful reset and on sign-out.
3. WEB_ORIGIN fails closed in production (required, HTTPS only); non-production HTTP is limited to localhost/127.0.0.1.
4. Confirmation/recovery redirects use the configured WEB_ORIGIN, not the request Host header.
5. Confirmation accepts only redirectType === null; recovery requires redirectType === recovery.

## Residual Risks / Deferred Proof

- Browser E2E against Supabase local remains incomplete (no approved E2E runner dependency yet).
- Hosted email/callback smoke remains incomplete (no hosted credentials/origin attestation yet).
- Supabase SSR auth session cookie defaults (httpOnly residual) remain under US-005 adapter ownership and were not changed in this story.
