# US-007 Validation: Web Authentication and Account Flow

## Required Proof

Local unit, typecheck, lint, production build, client-secret, and browser E2E
proof have been established. Hosted signup/login is accepted on
`https://lunav-web.vercel.app` with Supabase project ref `dshhnqvfgundzsdjegbt`:
confirmation, protected return, reload, and logout passed. Hosted recovery
email and deeper cookie/profile polish are backlog-only
(`docs/stories/backlog.md`, `BL-US007-01` .. `BL-US007-03`) and do not block
US-007.

| Layer | Planned proof |
| --- | --- |
| Unit | Form validation, enumeration-safe provider-error mapping, callback failure cases, and canonical return-path behavior. |
| Integration | Direct requests to private actions/routes verify the Supabase user and use the owner-scoped profile. |
| E2E | Signup has no private access before confirmation; confirmation, login, protected redirect/return, reload, recovery, settings update, and logout work against Supabase local. |
| Hosted smoke | Registered HTTPS origin/callback allowlist, confirmation setting, password/abuse controls, secure cookie attributes, and real confirmation/recovery callbacks are attested. |
| Security | External/encoded return URLs and replayed/wrong-flow callbacks are rejected; callback credentials are removed from history; no token/password/full callback URL is logged or bundled. |

## Available Local Verification

Run one of the following from the repository root with the Lunav Supabase stack
running:

```bash
bash scripts/verify-web-auth.sh
```

```powershell
.\scripts\verify-web-auth.ps1
```

These wrappers run contracts and web unit tests, web typecheck/lint/build, the
client-secret scan, and Playwright browser E2E against local Supabase/Mailpit.
They fail closed when the local stack is unavailable.

Browser E2E only:

```bash
pnpm --filter @lunav/web test:e2e
```

Hosted smoke is manual plus disposable-inbox attestation. Use
docs/stories/US-007-web-auth-account/hosted-smoke.md and record only non-secret
origin/settings outcomes. Latest partial evidence is recorded there.

## Security Hardening Applied (US-007 ownership)

Local hardening covered by unit tests and verify-web-auth:

1. Recovery marker cookie is bound to the verified userId and checked on reset.
2. Recovery marker is cleared on successful reset and on sign-out.
3. WEB_ORIGIN fails closed in production (required, HTTPS only); non-production HTTP is limited to localhost/127.0.0.1.
4. Confirmation/recovery redirects use the configured WEB_ORIGIN, not the request Host header.
5. Confirmation accepts only redirectType === null; recovery requires redirectType === recovery.
6. Auth form parsers pick only declared fields so Next.js $ACTION_* FormData keys cannot fail strict contracts.
7. Local Auth redirect allowlist includes exact /auth/confirm and /auth/recovery callback URLs.

## Residual Risks / Deferred Proof

- Hosted recovery email/callback deferred to backlog `BL-US007-01` (free-tier Auth mailer rate limit after confirmation mail).
- Hosted secure cookie deep attestation deferred to backlog `BL-US007-02`.
- Hosted profile `display_name` persistence polish deferred to backlog `BL-US007-03`.
- Supabase SSR auth session cookie defaults (httpOnly residual) remain under US-005 adapter ownership and were not changed in this story.
