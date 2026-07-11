# US-004 Overview: Auth and User Epic

## Status

planned

## Lane

high-risk

## Current Behavior

US-003 provides build-verified web and mobile shells, shared packages, public
Supabase configuration, and repository quality gates. There is no sign-up,
sign-in, session integration, profile table, protected route, or account flow.

## Target Behavior

US-004 coordinates Phase 2 through child stories so one verified email/password
account works across web and mobile. The epic owns the dependency graph and
acceptance contract, not implementation files.

## Child Stories

| Story | Prerequisites | Exclusive ownership | Outcome | Proof that unblocks dependents |
| --- | --- | --- | --- | --- |
| US-005 Auth session and canonical identity | US-003 | Shared auth contracts, public Supabase client factories, session lifecycle test fixtures | Both apps consume one verified Supabase identity/session contract and clear user-scoped cache on sign-out. | Contract and integration tests for current user, refresh/expiry, unconfirmed-email gating, safe redirect parsing, and sign-out cleanup pass. |
| US-006 Profile persistence and RLS | US-005 | Profile migration, trigger, RLS policies, profile contract, data-model docs, database integration tests | Every Auth user receives one owner-scoped profile; only `display_name` is editable in MVP. | Migration applies locally; trigger, owner read/update, immutable ownership, and cross-user denial tests pass. |
| US-007 Web authentication and account flow | US-005, US-006 | `apps/web` auth/protected route groups, web actions/handlers, web auth UI and E2E; narrow handoff for the account proxy return path, web auth form contracts, and non-secret web origin env contract | Web supports signup, confirmation, login, recovery, protected return path, settings, reload, and logout. | Web E2E and hosted callback/email smoke proof pass with no client secret findings. |
| US-008 Mobile authentication and account flow | US-005, US-006 | `apps/mobile` auth/protected route groups, linking configuration, mobile auth UI and runtime tests | Android supports the same auth semantics with native persistence and deep links. | Android emulator/device flow and hosted deep-link/email smoke proof pass with no client secret findings. |

## Dependency Rules

- US-005 starts only after fresh US-003 Foundation proof is available.
- US-006 starts only after US-005 publishes and proves the shared identity seam.
- US-007 and US-008 start only after US-005 and US-006 have fresh passing proof.
- US-007 and US-008 may run in parallel because their app ownership does not
  overlap.
- Shared contracts, migrations, generated Supabase types, root configuration,
  and central test fixtures are exclusive ownership surfaces. A newly
  discovered overlap pauses parallel work until this graph is updated.
- US-007 may add `packages/contracts/src/web-auth.ts`, update its barrel export,
  preserve `/account` through `apps/web/proxy.ts`, and declare the canonical
  web origin in `apps/web/.env.example`. These handoffs do not authorize changes
  to existing US-005 identity/session behavior or US-006 profile/RLS behavior.

## Epic Completion Gate

- Email/password signup, confirmation, login, recovery, and logout work on web
  and Android.
- The same Supabase user identity is resolved on both platforms.
- Protected flows require a confirmed email and return only to a validated
  local destination.
- Profile creation, owner update, and cross-user denial are proven against
  Supabase local.
- Sign-out clears user-scoped cache.
- Hosted smoke proof covers confirmation/recovery email, web callbacks, and
  Android deep links.
- Root lint, typecheck, test, build, client-secret scan, and applicable auth
  integration/E2E/platform gates pass.

## Non-Goals

- OAuth, magic links, avatars, account deletion, or multi-session management.
- Changing email or password from account settings.
- Locale preference persistence.
- Chart, AI, conversation, billing, or entitlement behavior.
- iOS runtime certification in the current Windows environment.
