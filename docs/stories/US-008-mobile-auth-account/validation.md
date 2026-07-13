## Planning Boundary

This planning verifier authorizes scheduling, not implementation completion.

## Required Proof

Local unit and product-screen coverage now includes the auth session shell,
signup/confirm, sign-in → protected entry, password recovery/reset, and account
`display_name` + sign-out. Android emulator runtime was started and partially
exercised; the full signup → logout loop is **not** claimed complete. Hosted
App Link / real email smoke remains residual backlog.

| Layer | Planned proof | Current status |
| --- | --- | --- |
| Unit | Form validation, enumeration-safe errors, auth-state navigation, callback failure cases, and canonical return-path fallback. | Pass: shell + signup/resend + confirm + sign-in + recovery/reset + SecureStore recovery proof + account/sign-out + boot-refresh anonymous fallback. `pnpm --filter @lunav/mobile test` → **158 passed** (2026-07-13). |
| Integration | Session persistence, foreground refresh, verified user, and owner-scoped profile update. | Adapter coverage via US-005 mobile session tests; product-screen integration still unit-level with mocks. |
| Platform | Android emulator or device completes signup, confirmation, login, relaunch, recovery, settings update, and logout. | **Partial, not complete.** Expo static export is recorded only as a static gate and is **not** platform proof. See Android runtime evidence below. |
| Hosted smoke | Redirect allowlist, confirmation/password/abuse controls, verified Android App Link association, and real confirmation/recovery email are attested. | Not proven. Local `lunav://auth/confirm` and `lunav://auth/recovery` allowlists are configured; hosted App Links → `BL-US008-01` / `BL-US008-02`. |
| Security | Session storage is not plain AsyncStorage; unverified custom-scheme handlers cannot receive hosted callbacks; callback credentials and raw tokens are absent from logs/history. | Shell reuses US-005 secure storage; local confirm/recovery callbacks strip history and avoid logging URL/code/session; reset requires SecureStore recovery proof bound to userId with best-effort clear and expire-on-delete-fail fallback. Hosted App Links remain open. |

## Evidence recorded (2026-07-12)

- Merged PR #12 (`4902f5c`): mobile auth session shell + protected navigation.
- Merged PR #14 (`5d435d6`, issue #7): signup → confirmation-pending/resend →
  local `lunav://auth/confirm` PKCE exchange; review harden for provider-error
  mapping, empty-duplicate code cardinality, and unguarded confirm-failed route.
- Merged PR #16 (`340f2ae`, issue #8): sign-in → protected entry with
  shared-contract `parseSignInInput`, enumeration-safe `mapSignInError`,
  validated return destination via `parseAuthReturnDestination` →
  `/(protected)`, and `SignInForm` on `(auth)/index`.
- Sign-in identity handshake: password success awaits `getUser()` and only
  returns `signed-in` for confirmed `authenticated`; route waits for session
  provider `canAccessPrivateShell` before `router.replace` so a late/failed
  identity refresh cannot clear the form and leave the user stuck public.
- `waitForAuthState` cleanup is TDZ-safe for synchronous `subscribe` emission
  and passes `prefer-const` via a mutable cleanup handle.
- Merged PR #18 (`9cf8ec7`, issue #9 closed): password recovery loop with
  `parseForgotPasswordInput` + enumeration-safe `mapForgotPasswordResult`;
  local `lunav://auth/recovery` accepts only recovery redirectType + single
  code; success writes SecureStore recovery proof and replaces to unguarded
  `/auth/reset-password`; reset requires authenticated session + matching
  proof; proof clear is best-effort after successful `updateUser` and expires
  in place if SecureStore delete fails; StrictMode remounts share one in-flight
  callback exchange via `auth-callback-work` with settlement eviction.
- Account settings + sign-out landed on branch (`c808d83`, hardened `7b113e2`,
  sign-out serialization `eb922e7`, issue #10).

## Evidence recorded (2026-07-13) — issue #11 closeout attempt

### Static gates (pass)

Exact commands run from repo root / package filter:

```bash
pnpm --filter @lunav/mobile lint
pnpm --filter @lunav/mobile typecheck
pnpm --filter @lunav/mobile test          # 158 passed
pnpm --filter @lunav/mobile build         # expo export --platform android → dist/
pnpm --filter @lunav/mobile exec npx expo install --check
pnpm security:client
bash scripts/verify-auth-user-planning.sh US-008
```

Dependency align: `react-native-get-random-values` pinned to `^1.11.0` so
`expo install --check` matches Expo SDK 57 expect `~1.11.0`.

### Local Supabase + redirect allowlist

- Supabase CLI local stack on API `http://127.0.0.1:55321`, Mailpit
  `http://127.0.0.1:55324` (started with `-x logflare,vector,studio,imgproxy
  --ignore-health-check` after Windows analytics health failures).
- `supabase/config.toml` additional redirects include
  `lunav://auth/confirm` and `lunav://auth/recovery`.
- Local mail rate limit raised to `email_sent = 30` for multi-step proof
  sessions (not a hosted production change).

### Android runtime (partial)

| Field | Value |
| --- | --- |
| Device serial | `emulator-5554` |
| AVD | `Medium_Phone_API_36.1` (`sdk_gphone16k_x86_64`) |
| Runtime host | Expo Go `host.exp.exponent` (SDK 57) |
| Metro | `npx expo start --android --clear --host lan --port 8081` from `apps/mobile` |
| App URL observed | `exp://192.168.31.91:8081` / `exp://127.0.0.1:8081` with `adb reverse tcp:8081 tcp:8081` |
| Supabase from emulator | `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:55321` (gitignored `apps/mobile/.env`); `10.0.2.2:55321` reachable (`toybox nc -z`) |
| Auth API from host | `GET /auth/v1/health` → 200; host `signup` to Mailpit confirmed email delivery for a separate host-check address |

Observed on device UI (uiautomator):

1. Splash / Expo developer menu → Continue.
2. Cold routes can land on unguarded `/auth/confirm-failed` when a prior
   confirm deep-link failed (history / cold-start residual).
3. Explicit open of `exp://127.0.0.1:8081/--/sign-up` shows `sign-up-form`
   with labels `Tao tai khoan`, email/password/confirmation, `Tiep tuc`.
4. **Not completed on device:** confirmation email open via `lunav://`,
   sign-in, relaunch session restore, recovery/reset, account `display_name`
   update, logout. UI automation could not reliably clear controlled
   password fields / obtain a confirmed signup status without corrupting
   form state; no full-loop pass is claimed.

### Boot-loading fix (unit-proven)

`createMobileAuthStateController` previously left `status: 'loading'` when
`getUser()` failed during startup, which keeps `canAccessPublicAuthShell`
false and blocks the public auth stack. Boot refresh failures now publish
`anonymous` so public routes remain reachable; mid-session refresh failures
still keep the last known authenticated state. Covered in
`mobile-session.test.ts`.

### Hosted residual (does not block local code close)

- `BL-US008-01` Hosted verified Android App Link attestation.
- `BL-US008-02` Hosted confirmation/recovery email deep-link smoke.

### Explicit non-claims

- Expo `export --platform android` is **not** Android platform proof.
- iOS runtime remains **unproven**.
- Parent epic US-004 is **not** closed by this ticket.
- Full Android auth loop platform flag stays **no** until the remaining
  steps are observed end-to-end on emulator/device.

## Planned Commands

```bash
pnpm --filter @lunav/mobile lint
pnpm --filter @lunav/mobile typecheck
pnpm --filter @lunav/mobile test
pnpm --filter @lunav/mobile build
pnpm --filter @lunav/mobile exec expo install --check
pnpm security:client
```

Runtime (when re-attempting full platform proof):

```bash
# AVD
"%ANDROID_SDK_ROOT%/emulator/emulator.exe" -avd Medium_Phone_API_36.1 -netdelay none -netspeed full
adb devices -l   # expect emulator-5554 device

# Local Auth + Mailpit
npx supabase start -x logflare,vector,studio,imgproxy --ignore-health-check

# Mobile env (gitignored): EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:55321
# and local publishable key from `npx supabase status`

cd apps/mobile && npx expo start --android --clear --host lan --port 8081
adb reverse tcp:8081 tcp:8081
```

## Residual open work before full `implemented` + platform=yes

- ~~Signup / confirmation-pending / local confirm deep-link exchange~~ (issue #7)
- ~~Sign-in + protected return destination~~ (issue #8)
- ~~Password recovery / reset with recovery proof~~ (issue #9)
- ~~Account `display_name` update + real sign-out navigation~~ (issue #10, branch commits)
- Android emulator/device **full** end-to-end proof → deferred backlog `BL-US008-03`
  (issue #11 parked; product priority is web app surfaces first)
- Hosted App Link / real email smoke → backlog `BL-US008-01` / `BL-US008-02`

## Priority note (2026-07-13)

Product direction: keep web app functional delivery ahead of Android runtime
certification. Mobile auth code and static gates remain green; Android full-loop
proof and hosted App Links do not block web product work.
