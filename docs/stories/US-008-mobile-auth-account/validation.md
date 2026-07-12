# US-008 Validation: Mobile Authentication and Account Flow

## Required Proof

Partial local unit proof exists for the auth session shell only. Full story
completion still requires forms, deep-link callbacks, Android emulator/device
runtime, and hosted App Link/email smoke.

| Layer | Planned proof | Current status |
| --- | --- | --- |
| Unit | Form validation, enumeration-safe errors, auth-state navigation, callback failure cases, and canonical return-path fallback. | Partial: shell eligibility, session-provider lifecycle, controller cancel/idempotency covered after PR #12. Forms/callbacks not yet built. |
| Integration | Session persistence, foreground refresh, verified user, and owner-scoped profile update. | Not yet for US-008 product screens; US-005 adapter remains the session seam. |
| Platform | Android emulator or device completes signup, confirmation, login, relaunch, recovery, settings update, and logout. | Not proven. Expo static export alone does not satisfy this story. |
| Hosted smoke | Redirect allowlist, confirmation/password/abuse controls, verified Android App Link association, and real confirmation/recovery email are attested. | Not proven. |
| Security | Session storage is not plain AsyncStorage; unverified custom-scheme handlers cannot receive hosted callbacks; callback credentials and raw tokens are absent from logs/history. | Shell reuses US-005 secure storage; callback handlers and hosted App Links remain open. |

## Evidence recorded (2026-07-12)

- Merged PR #12 (`4902f5c`): mobile auth session shell + protected navigation.
- Local mobile unit/typecheck green for the shell slice.
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

- Signup / confirmation-pending / local confirm deep-link exchange
- Sign-in + protected return destination
- Password recovery / reset with recovery proof
- Account `display_name` update + real sign-out navigation
- Android emulator/device end-to-end proof
- Hosted App Link / real email smoke (or explicit backlog residual)
