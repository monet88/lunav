# US-007 Web Auth E2E + Hosted Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close residual US-007 proof with local Playwright browser E2E against Supabase/Mailpit and a durable hosted email/callback smoke checklist.

**Architecture:** Keep app ownership inside `apps/web` and scripts. Playwright runs against a local Next server with env from `supabase status`. Mailpit supplies confirmation/recovery links. Hosted smoke remains a manual attestation template that never stores secrets.

**Tech Stack:** Playwright, Next.js App Router, Supabase local Auth, Mailpit, harness-cli tool registry.

## Global Constraints

- No secrets committed; local keys come from `supabase status`.
- New dependency limited to approved `@playwright/test`.
- Do not change US-005/US-006 identity/profile semantics.
- Hosted smoke evidence records origin/settings only, never tokens/passwords.

---

## Task 1: Local redirect allowlist

- [x] Add exact `/auth/confirm` and `/auth/recovery` redirect URLs in `supabase/config.toml`.
- [ ] Restart or re-apply local Auth config so emails honor the new allowlist.

## Task 2: Playwright scaffold

- [ ] Add `@playwright/test` to `@lunav/web`.
- [ ] Add `apps/web/playwright.config.ts` with Chromium, baseURL `http://127.0.0.1:3000`, and webServer env from local Supabase.
- [ ] Add Mailpit + Supabase admin helpers under `apps/web/e2e/`.
- [ ] Add `test:e2e` script.

## Task 3: Browser E2E flows

- [ ] Signup -> Mailpit confirm -> sign-in with returnTo `/account`.
- [ ] Unconfirmed user cannot reach `/account`.
- [ ] Session survives reload on `/account`.
- [ ] Profile display name update.
- [ ] Forgot/reset password via Mailpit recovery.
- [ ] Logout returns to sign-in and blocks `/account`.

## Task 4: Verification wiring

- [ ] Extend `scripts/verify-web-auth.ps1` / `.sh` to run local E2E when Supabase/Mailpit are healthy.
- [ ] Register harness `e2e-test` provider for the Playwright command.
- [ ] Update US-007 validation/execplan/overview and story evidence after a green run.

## Task 5: Hosted smoke

- [x] Add hosted smoke checklist under the US-007 story packet.
- [x] If hosted credentials/origin are unavailable, record residual risk explicitly without fake-passing.
