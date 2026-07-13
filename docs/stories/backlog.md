# Story Backlog

This backlog captures deferred follow-ups that should not block the current
accepted story outcomes. Create a full story packet only when the work is
selected for implementation.

## Residual follow-ups

| ID | Title | Source | Priority | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| BL-US007-01 | Hosted recovery email/callback re-smoke | US-007 | later | open | Free-tier Auth mailer rate limit blocked real recovery mail after confirmation. Re-run on `https://lunav-web.vercel.app` + Supabase ref `dshhnqvfgundzsdjegbt` after rate-limit window or custom SMTP. Must use real recovery email PKCE flow, not `admin.generateLink` hash tokens. |
| BL-US007-02 | Hosted auth cookie attribute deep attestation | US-007 | later | open | Confirm `Secure` / `HttpOnly` / `SameSite` on hosted SSR auth cookies after login. Partial observation already recorded in `US-007-web-auth-account/hosted-smoke.md`. |
| BL-US007-03 | Hosted profile `display_name` persistence smoke | US-007 | later | open | Optional polish: update profile on hosted `/account`, reload, confirm owner-scoped persistence. |
| BL-US008-01 | Hosted verified Android App Link attestation | US-008 | later | open | Configure and serve verified HTTPS Android App Links with `assetlinks.json`, the package signing fingerprint, and hosted redirect allowlists; prove an unverified handler cannot receive confirmation or recovery callbacks. Not tested in the local Android closeout and does not block it. |
| BL-US008-02 | Hosted confirmation and recovery email deep-link smoke | US-008 | later | open | Use a real hosted mailer and disposable mailbox to prove confirmation and recovery emails open verified Android App Links. Do not substitute `admin.generateLink` hash-token links. Not tested in the local Android closeout and does not block it. |
| BL-US008-03 | Android emulator full auth-loop proof | US-008 / #11 | later | open | Deferred by product priority: finish web app product surfaces first. Partial 2026-07-13 evidence on `emulator-5554` / AVD `Medium_Phone_API_36.1` / Expo Go + Metro reached sign-up form only; full signup → confirm → sign-in → relaunch → recovery → account → logout not claimed. Re-run with `http://10.0.2.2:55321`, Mailpit, and recorded runtime commands. Expo static export is not platform proof. |

## Acceptance note for US-007 hosted path

For US-007, hosted **signup + email confirmation + login + protected `/account`
session** is accepted as sufficient for now. Recovery and cookie/profile polish
above are backlog-only and do not block shipping the local E2E + partial hosted
evidence.

## Candidate Epics

| Epic | Description | Status |
| --- | --- | --- |
| TBD | Add candidate epics after later product intake | unsliced |
