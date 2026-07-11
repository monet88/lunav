# US-008 Validation: Mobile Authentication and Account Flow

## Required Proof

This planning verifier authorizes scheduling, not implementation completion.

| Layer | Planned proof |
| --- | --- |
| Unit | Form validation, enumeration-safe errors, auth-state navigation, callback failure cases, and canonical return-path fallback. |
| Integration | Session persistence, foreground refresh, verified user, and owner-scoped profile update. |
| Platform | Android emulator or device completes signup, confirmation, login, relaunch, recovery, settings update, and logout. |
| Hosted smoke | Redirect allowlist, confirmation/password/abuse controls, verified Android App Link association, and real confirmation/recovery email are attested. |
| Security | Session storage is not plain AsyncStorage; unverified custom-scheme handlers cannot receive hosted callbacks; callback credentials and raw tokens are absent from logs/history. |

## Planned Commands

```powershell
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
