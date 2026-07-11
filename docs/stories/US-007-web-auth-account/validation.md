# US-007 Validation: Web Authentication and Account Flow

## Required Proof

This planning verifier authorizes scheduling, not implementation completion.

| Layer | Planned proof |
| --- | --- |
| Unit | Form validation, enumeration-safe provider-error mapping, callback failure cases, and canonical return-path behavior. |
| Integration | Direct requests to private actions/routes verify the Supabase user and use the owner-scoped profile. |
| E2E | Signup has no private access before confirmation; confirmation, login, protected redirect/return, reload, recovery, settings update, and logout work against Supabase local. |
| Hosted smoke | Registered HTTPS origin/callback allowlist, confirmation setting, password/abuse controls, secure cookie attributes, and real confirmation/recovery callbacks are attested. |
| Security | External/encoded return URLs and replayed/wrong-flow callbacks are rejected; callback credentials are removed from history; no token/password/full callback URL is logged or bundled. |

## Planned Commands

```powershell
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
