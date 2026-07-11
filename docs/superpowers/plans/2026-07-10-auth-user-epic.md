# Auth and User Epic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email/password authentication, confirmed-user private access, owner-scoped profiles, and minimal account settings on Next.js web and Expo Android.

**Architecture:** US-005 first defines a small normalized auth interface with separate web and mobile adapters. US-006 adds the one-to-one profile module and proves RLS against Supabase local. US-007 and US-008 then implement platform-specific flows in parallel without owning shared contracts or migrations.

**Tech Stack:** pnpm 10, TypeScript strict, Supabase Auth/Postgres/RLS/CLI, `@supabase/supabase-js`, `@supabase/ssr`, Next.js 16 App Router and `proxy.ts`, React 19, Expo SDK 57, Expo Router, Android emulator/device, Vitest/Jest, and the approved E2E provider selected at execution time.

## Global Constraints

- Use email and password only; do not add OAuth or magic links.
- Require confirmed email before private routes or screens.
- Never expose service-role credentials, raw tokens, passwords, or recovery codes.
- Never authorize from a client-provided user ID.
- Accept return destinations only as validated app-local paths.
- Create profiles through a database trigger, not from web or mobile clients.
- The only editable account field is `display_name`.
- Supabase local is required for automated integration proof.
- Hosted Supabase smoke proof must not record credentials or tokens.
- Android is the runtime mobile gate; do not claim iOS runtime proof.
- Do not start a dependent story until every prerequisite has fresh passing proof.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `packages/contracts/src/auth.ts` | Normalized identity, auth state, and safe return-path contract. |
| `apps/web/src/lib/supabase/` | Browser/server Supabase adapters and cookie refresh helpers. |
| `apps/mobile/src/lib/supabase/` | Native Supabase adapter, secure persistence, and refresh lifecycle. |
| `packages/contracts/src/profile.ts` | Profile row and owner-safe update contract. |
| `supabase/migrations/` | Profile table, trigger, grants, and RLS policies. |
| `apps/web/src/app/(auth)/` | Web signup, login, confirmation, and recovery UI. |
| `apps/web/src/app/(protected)/` | Web account and future private route group. |
| `apps/web/proxy.ts` | US-005-owned Next.js 16 cookie refresh and optimistic route gate. |
| `apps/mobile/src/app/(auth)/` | Mobile signup, login, confirmation, and recovery UI. |
| `apps/mobile/src/app/(protected)/` | Mobile account and future private route group. |
| `apps/mobile/app.json` | Product deep-link scheme and platform callback configuration. |

### Task 1: Deliver US-005 Auth Session and Identity

**Files:** Use only the ownership declared in `docs/stories/US-005-auth-session-identity/overview.md`.

**Interfaces:** Produces `AuthIdentity`, `AuthState`, safe local return-path parsing, web/mobile session adapters, and sign-out cleanup hooks consumed by Tasks 2 through 4.

- [ ] **Step 1: Write failing contract tests**

Cover anonymous, unconfirmed, and authenticated states; reject malformed user IDs, missing email, and external return destinations.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @lunav/contracts test`

Expected: fail because the auth contract does not exist.

- [ ] **Step 3: Implement the auth contract**

Add normalized identity/state schemas and a return-path parser that accepts
`/account` and rejects another origin, `//`, backslashes, encoded separators,
control characters, protocol-looking values, malformed encoding, and
unapproved query keys.

- [ ] **Step 4: Add web adapter tests and implementation**

Use `@supabase/ssr` browser/server clients. Implement Next.js 16 cookie refresh
with `getAll` and `setAll`, own the complete `proxy.ts` private-route gate, then
resolve the verified current user for every private server operation.

- [ ] **Step 5: Add mobile adapter tests and implementation**

Use `@supabase/supabase-js` with secure native persistence, auth-state
subscription, and AppState-controlled auto-refresh. Keep raw sessions private
to the adapter.

- [ ] **Step 6: Prove sign-out cleanup and run US-005 gates**

Enable mandatory local email confirmation. Prove cleanup failure still signs
out, relaunch remains anonymous, and user B cannot observe user A's cache. Run
the focused tests, `pnpm typecheck`, and `pnpm security:client`; record fresh
story evidence before Task 2 starts.

### Task 2: Deliver US-006 Profile Persistence and RLS

**Files:** Use only the ownership declared in `docs/stories/US-006-profile-persistence-rls/overview.md`.

**Interfaces:** Consumes the canonical authenticated user ID. Produces a parsed profile and an update input containing only `displayName` for Tasks 3 and 4.

- [ ] **Step 1: Write failing profile contract tests**

Prove valid rows parse and client attempts to set owner ID or timestamps fail.

- [ ] **Step 2: Write failing Supabase-local authorization tests**

Cover trigger-created profile, owner select/update, cross-user denial, anonymous
denial, rejected insert/delete, and immutable ownership.

- [ ] **Step 3: Run the tests and confirm RED**

Run the focused contract suite and the new database integration command.

Expected: fail because the migration and profile contract do not exist.

- [ ] **Step 4: Add the migration and contract**

Create `public.profiles`, the fixed-search-path Auth trigger, timestamp behavior,
revoked table-level update, `UPDATE (display_name)` permission, and owner
policies using both `USING` and `WITH CHECK`.

- [ ] **Step 5: Reset Supabase local and confirm GREEN**

Run: `pnpm dlx supabase db reset`

Then run the focused contract and authorization suites. Expected: every
positive and negative ownership case passes.

- [ ] **Step 6: Update the implemented data-model proof**

Replace planned wording in `docs/DATA_MODEL.md` with exact schema, indexes,
policies, retention behavior, and executed commands. Verify US-006 before
Tasks 3 and 4 start.

### Task 3: Deliver US-007 Web Auth and Account Flow

**Files:** Use only the ownership declared in `docs/stories/US-007-web-auth-account/overview.md`.

**Interfaces:** Consumes US-005 auth state/adapters and US-006 profile read/update contracts. Produces the complete web Phase 2 flow.

- [ ] **Step 1: Write failing web behavior tests**

Cover form validation, enumeration-safe Vietnamese error mapping,
unconfirmed-email gate, callback expiry/replay/wrong-flow cases, canonical
return-path handling, and account update input.

- [ ] **Step 2: Implement public auth forms and callbacks**

Add signup, sign-in, confirmation pending/resend, forgot-password, recovery
callback, and reset-password flows using Supabase SSR cookie handling. Remove
callback credentials from the URL after exchange and never log full callback
URLs.

- [ ] **Step 3: Implement protected routing and account settings**

Consume US-005 `proxy.ts`; add verified-user checks to every private server
entry, the protected route group, read-only email and confirmation status,
editable `display_name`, and ordered sign-out cleanup.

- [ ] **Step 4: Add Supabase-local web E2E**

Before adding a dependency, query the Harness `e2e-test` capability and obtain
approval if installation is required. Test signup through logout, reload,
recovery, settings round-trip, and rejected external return destinations.

- [ ] **Step 5: Run web and security gates**

Run web lint, typecheck, test, build, E2E, and `pnpm security:client`.

- [ ] **Step 6: Perform hosted web smoke proof**

Attest the registered HTTPS origin/callback allowlist, confirmation setting,
password and abuse-control posture, secure cookies, and real confirmation and
recovery callbacks without recording tokens or credentials.

### Task 4: Deliver US-008 Mobile Auth and Account Flow

**Files:** Use only the ownership declared in `docs/stories/US-008-mobile-auth-account/overview.md`.

**Interfaces:** Consumes US-005 auth state/adapters and US-006 profile read/update contracts. Produces the complete Android Phase 2 flow.

- [ ] **Step 1: Write failing mobile behavior tests**

Cover form validation, enumeration-safe errors, auth-state navigation,
protected loading behavior, callback expiry/replay/wrong-flow cases, and
canonical return-path fallback.

- [ ] **Step 2: Configure scheme and auth callbacks**

Use `lunav://` only for local development. Configure verified HTTPS Android App
Links with `assetlinks.json` and signing fingerprint for hosted callbacks,
create explicit confirmation/recovery URLs, and reject paths outside the auth
flow.

- [ ] **Step 3: Implement auth screens and protected navigation**

Add signup, sign-in, confirmation pending/resend, forgot/reset password, and
`Stack.Protected` route groups without briefly rendering private content.

- [ ] **Step 4: Implement account settings and sign-out**

Render editable `display_name`, read-only email, confirmation status, and clear
user-scoped cache before signing out and navigating public.

- [ ] **Step 5: Run mobile static and Android runtime gates**

Run mobile lint, typecheck, tests, build, Expo install check, and the complete
flow on an Android emulator or device. Static export alone is insufficient.

- [ ] **Step 6: Perform hosted Android deep-link smoke proof**

Attest the redirect allowlist, confirmation/password/abuse settings, and
verified App Link association; then prove real confirmation and recovery email
opens the configured Android auth route without recording credentials or
tokens.

### Task 5: Close the US-004 Epic Gate

**Files:** Update only US-004 through US-008 evidence/status docs and Harness records.

**Interfaces:** Consumes fresh proof from all four child stories and unblocks Phase 3 only when the complete gate passes.

- [ ] **Step 1: Run every child verifier**

Run `harness-cli story verify` for US-005 through US-008. Expected: all pass
with current evidence.

- [ ] **Step 2: Run root release gates**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
`pnpm security:client`.

- [ ] **Step 3: Review requirement coverage**

Confirm signup, confirmation, login, recovery, protected return, profile RLS,
settings, session reload, sign-out cleanup, hosted callbacks, and Android
runtime proof each have an evidence anchor.

- [ ] **Step 4: Update epic and roadmap status**

Mark US-004 implemented only after all proof exists. Record iOS runtime as
explicitly unproven rather than silently included.

- [ ] **Step 5: Record the final Harness trace**

Include consumed upstream proof, child verifier outcomes, release commands,
changed files, residual risk, and the Phase 3 handoff state.
