# US-008 Validation: Mobile Authentication and Account Flow

## Required Proof

Partial local unit proof exists for the auth session shell and the
signup/confirm deep-link slice. Full story completion still requires sign-in,
recovery/reset, account settings, Android emulator/device runtime, and hosted
App Link/email smoke.

| Layer | Planned proof | Current status |
| --- | --- | --- |
| Unit | Form validation, enumeration-safe errors, auth-state navigation, callback failure cases, and canonical return-path fallback. | Partial: shell + signup/resend mapping + confirm callback success/failure/wrong-flow + fail-closed params covered after issue #7 / PR #14. Sign-in/recovery/account still open. |
| Integration | Session persistence, foreground refresh, verified user, and owner-scoped profile update. | Not yet for US-008 product screens; US-005 adapter remains the session seam. |
| Platform | Android emulator or device completes signup, confirmation, login, relaunch, recovery, settings update, and logout. | Not proven. Expo static export alone does not satisfy this story. |
| Hosted smoke | Redirect allowlist, confirmation/password/abuse controls, verified Android App Link association, and real confirmation/recovery email are attested. | Not proven. Local `lunav://auth/confirm` allowlist is configured; hosted App Links remain open. |
| Security | Session storage is not plain AsyncStorage; unverified custom-scheme handlers cannot receive hosted callbacks; callback credentials and raw tokens are absent from logs/history. | Shell reuses US-005 secure storage; local confirm callback strips history and avoids logging URL/code/session. Hosted App Links remain open. |

## Evidence recorded (2026-07-12)

- Merged PR #12 (`4902f5c`): mobile auth session shell + protected navigation.
- Merged PR #14 (`5d435d6`, issue #7): signup → confirmation-pending/resend →
  local `lunav://auth/confirm` PKCE exchange; review harden for provider-error
  mapping, empty-duplicate code cardinality, and unguarded confirm-failed route.
- Local mobile unit/typecheck/lint green for shell + signup/confirm slice
  (`pnpm --filter @lunav/mobile test` → 76 passed after review fixes).
- Harness matrix: `US-008` → `in_progress`, unit=`yes`, integration/e2e/platform=`no`.

## Planned Commands

```bash
pnpm --filter @lunav/mobile lint
pnpm --filter @lunav/mobile typecheck
pnpm --filter @lunav/mobile test
pnpm --filter @lunav/mobile build
pnpm --filter @lunav/mobile exec expo install --check
pnpm security:client
```

The implementation must record the exact Android runtime command and device or
emulator evidence. Expo static export alone does not satisfy this story. iOS
type/config compatibility may be checked, but iOS runtime remains unproven.

## Residual open work before implemented

- ~~Signup / confirmation-pending / local confirm deep-link exchange~~ (issue #7)
- Sign-in + protected return destination
- Password recovery / reset with recovery proof
- Account `display_name` update + real sign-out navigation
- Android emulator/device end-to-end proof
- Hosted App Link / real email smoke (or explicit backlog residual)
