# US-005 Validation: Auth Session and Canonical Identity

## Required Proof

This executable gate authorizes implementation completion only when the
canonical verification script passes with fresh evidence. The script is the
single source of truth for the command set; do not treat a partial manual
subset as story completion.

| Layer | Required proof |
| --- | --- |
| Unit | Auth user normalization, confirmed-email states, canonical return-path parsing, encoded/backslash/control-character rejection, web cookie refresh, mobile session lifecycle, cleanup failure, relaunch-safe anonymous state, and cross-identity cleanup hooks pass. |
| Integration | `pnpm test:auth-integration` proves local email confirmation rejects private session creation before confirmation, then proves confirmed login/current user, refresh, and logout. The Lunav local Supabase stack must be healthy; a missing stack is a failing gate. |
| Security | Raw tokens are absent from shared contracts and logs; only public client configuration is bundled; direct private server access resolves a verified user with `auth.getUser`; refresh responses preserve Supabase no-cache headers. |
| Platform | Web cookie refresh and mobile SecureStore-backed persistent-session/auto-refresh adapters typecheck; production cookies retain HTTPS `Secure`, `HttpOnly`, and SameSite protections. |

## Canonical Commands

Run exactly one of these wrappers. Either form is complete proof; both are not
required.

```bash
bash scripts/verify-auth-session.sh
```

```powershell
.\scripts\verify-auth-session.ps1
```

The wrappers currently run, in order:

```text
pnpm --filter @lunav/contracts test
pnpm --filter @lunav/web test
pnpm --filter @lunav/mobile test
pnpm test:auth-integration
pnpm lint
pnpm typecheck
pnpm security:client
pnpm --filter @lunav/mobile exec expo install --check
```

If the wrapper scripts change, update this list to match. Do not mark the story
implemented from a shorter ad-hoc command list.

Before the local integration command, start the Lunav stack with `supabase
start`. Do not stop or reuse another project's Supabase containers. The story
cannot be marked implemented when its configured local stack is unavailable or
any command fails.

## Dependency Release Gate

US-006 may start only after the shared contract, both adapters, and the local
integration gate pass, and the story verifier records fresh evidence.
