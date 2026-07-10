# ZIWEI AI Product Scope

## Status

Accepted Phase 0 product contract derived from `SPEC.md` and the clean-room
reference audit of `F:\CodeBase\ziweiai-web`.

## Product Promise

ZIWEI AI helps Vietnamese users create, reopen, and understand a Zi Wei chart
through a calm, trustworthy experience. The primary activity is reading and
reflection, not operating a dense dashboard.

## Primary Audience

The first release is optimized for people who are new to Zi Wei but seriously
interested in understanding their chart. The product should introduce concepts
progressively while preserving enough domain depth for experienced readers.

## MVP Outcome

A new user can complete this persisted cross-platform flow on web and mobile:

```text
Sign up
  -> create a chart from birth data
  -> inspect the chart
  -> generate an AI explanation
  -> ask follow-up questions in assistant chat
  -> reopen the chart and conversation from history
```

## Core Product Scope

The core product covers the roadmap through stabilization:

1. Shared authentication and user identity on web and mobile.
2. Validated birth data and server-side chart calculation.
3. Persisted chart snapshots with pending, ready, and failed states.
4. Chart history and chart detail views.
5. Persisted, retryable AI explanations.
6. Persisted assistant conversations grounded in chart context.
7. Complete loading, empty, failure, navigation, responsive, and mobile states.

## Foundation Platform Decision

Supabase is the unified backend for the MVP: Supabase Auth supplies the
canonical user identity, Postgres persists product state, Row Level Security
enforces private-data ownership, Realtime supports later live updates, and Edge
Functions host privileged workflows. Clerk and Convex are not part of the
implementation stack.

## Phase 0 Audit Depth

Phase 0 audits these areas deeply because they shape the MVP architecture:

- authentication and user identity semantics
- birth data terminology and contracts
- chart creation, snapshot, detail, and history
- AI explanation inputs, outputs, status, retry, and persistence
- assistant conversation context, messages, retry, and persistence
- astrology engine isolation and normalization
- language and locale behavior

The following areas are inventory-only in Phase 0:

- quotas and credits
- vision features
- billing and entitlements
- expanded divination modules
- public growth and SEO surfaces
- production operations and admin tooling

Inventory-only areas may inform boundaries, but they must not expand the MVP or
force speculative implementation in Phase 1.

## Compatibility Position

The rebuild is clean-room at the code and architecture level. The reference
repository is evidence, not a source tree to port.

For the core Zi Wei workflow, equivalent birth input should preserve the same
domain meaning and materially equivalent normalized chart semantics. Exact UI,
module structure, persistence schema, and implementation details may change.

Full migration of legacy accounts, history, snapshots, or extended-module data
is not part of the current commitment. Any future migration requires a separate
initiative and explicit compatibility contract.

## Language Strategy

The product is Vietnamese-first and locale-ready.

- MVP enables only the `vi` locale.
- User-facing strings use translation keys rather than being treated as stable
  identifiers.
- Internal identifiers and slugs remain ASCII and locale-neutral.
- AI requests, AI outputs, and persisted generated content carry an explicit
  locale from the first implementation, defaulting to `vi`.
- Adding `en` or another locale later must not require guessing the language of
  previously persisted generated content.
- Raw engine labels and Han characters must never leak into user-facing output
  in any locale.

## UX Direction

The experience should be calm, clear, and trustworthy: a focused reading
surface with strong typography, progressive disclosure, restrained color, and
no mystical dark-and-gold visual cliches. Web and mobile share product
semantics and tokens, but remain separate user interfaces until stable
duplication justifies extraction.

## Non-Goals

Phase 0 does not:

- scaffold the application monorepo
- port source code from the reference repository
- choose detailed schemas for later roadmap phases
- implement payments, quotas, vision, or expanded modules
- promise full legacy data migration
- start Harness Symphony or any implementation run

## Phase Exit

Phase 0 is complete when:

- `docs/REFERENCE_AUDIT.md` captures evidence, value, and anti-patterns.
- `docs/INVARIANTS.md` states enforceable product and architecture rules.
- representative core compatibility evidence is identified for later fixture
  creation.
- the Phase 0 Harness story verification passes.
- no application code or dependency has been added.