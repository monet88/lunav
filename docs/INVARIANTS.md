# ZIWEI AI Invariants

## Status

Accepted Phase 0 product and architecture invariants. These rules describe what
future implementation must enforce. The current repository has no application
code yet, so a rule is not considered mechanically enforced until its owning
phase adds and passes the stated guard.

Changing an invariant requires an ADR and corresponding documentation updates.

## 1. Source of Truth

- `SPEC.md` is the accepted roadmap input.
- Derived product docs under `docs/` become the living contract for selected
  work.
- The reference repository is evidence only and cannot override accepted
  product docs.
- A phase cannot start until the previous phase gate passes.

Expected proof: documentation consistency checks and Harness story status.

## 2. Contracts First

- Every value crossing an app, server, provider, persistence, or package
  boundary must have a schema in `packages/contracts`.
- Web and mobile must not redefine boundary DTOs.
- External responses, database rows, AI output, and user input are untrusted
  until parsed.
- Internal identifiers and enum values must be ASCII and locale-neutral.

Expected proof: typecheck, schema tests, and duplicate-contract checks.

## 3. Server-Only Privileged Logic

Web and mobile must never:

- import the astrology engine or its transitive engine dependencies
- call an AI provider directly
- contain provider, database, auth, or billing secrets
- decide entitlement, quota, credit, or ownership truth

Astrology calculation, AI providers, billing, credits, and privileged
operations run server-side. Engine output is normalized before persistence or
client delivery.

Expected proof: restricted-import rules, client bundle inspection, and server
integration tests.

## 4. Authentication, Ownership, and Privacy

- MVP private flows require authenticated identity on web and mobile.
- Every private read and write checks ownership on the server.
- A client-provided user id is never authorization evidence.
- Signing out clears user-scoped client caches.
- Secrets never appear in client code, logs, docs, fixtures, or committed env
  files.

Expected proof: authorization integration tests and cross-user negative cases.

## 5. Persisted Workflow State

Important work cannot exist only in UI memory.

- Chart and AI workflows use explicit states such as `queued`, `running`,
  `ready`, and `failed` where asynchronous work exists.
- Failed work preserves valid prior data.
- Reloading or reopening an app restores the latest durable state.
- Errors use stable codes and user-safe messages; internal details remain in
  server logs.

Expected proof: persistence integration tests and reload/retry E2E flows.

## 6. Idempotency and Retry

- Retrying chart creation, explanation generation, assistant replies, and
  credit operations must not create unintended duplicates.
- Every cost-bearing or externally retried operation has an idempotency key or
  an equivalent uniqueness boundary.
- A failed task releases or refunds reserved resources according to its phase
  contract.

Expected proof: duplicate-request and failure-recovery tests.

## 7. Vietnamese-First, Locale-Ready

- MVP enables only the `vi` locale.
- User-facing copy is resolved through translation keys or locale-aware content
  boundaries rather than stable English or Vietnamese identifiers.
- AI requests, AI results, and persisted generated content carry an explicit
  locale from the first implementation, defaulting to `vi`.
- Previously persisted generated content never requires language guessing.
- Adding `en` later must not require changing domain identifiers or chart data.

Expected proof: locale contract tests, translation-key coverage, and persistence
round-trip tests.

## 8. No Raw Engine or CJK Leakage

- Raw engine display labels are never public contract values.
- User-facing chart labels come from normalized keys and locale dictionaries.
- Unknown keys fail explicitly or render a safe localized fallback; they do
  not silently fall back to raw engine text.
- Han, Hiragana, Katakana, Hangul, Bopomofo, CJK punctuation, and fullwidth raw
  engine text are rejected or sanitized before user-facing display when the
  selected locale does not explicitly permit them.
- For the MVP `vi` locale, generated and static user-facing content contains no
  CJK characters.

Expected proof: normalization tests, CJK guard tests, prompt/output tests, and a
static user-facing copy scan.

## 9. Domain Logic Placement

- Pure business rules belong in `packages/domain` when they are shared or need
  framework-independent tests.
- UI components, route handlers, and Convex functions must not become the only
  home of core business rules.
- Convex functions validate, authorize, coordinate, and persist; they delegate
  pure calculations when a domain boundary exists.

Expected proof: dependency checks and unit tests against pure modules.

## 10. Prompt Ownership and Traceability

- Long prompts live in `packages/prompts`.
- Every production prompt has a stable identifier or version.
- AI output is parsed or validated before becoming durable product data.
- Provider metadata needed for diagnosis and cost tracking is retained without
  exposing secrets or hidden reasoning.

Expected proof: prompt registry tests and invalid-provider-output cases.

## 11. Web and Mobile Independence

- Web and mobile share contracts, domain logic, constants, prompt definitions,
  and design tokens when appropriate.
- Navigation, forms, modals, screen layout, file picking, camera behavior, and
  platform interaction remain platform-specific until stable duplication makes
  sharing beneficial.
- Both platforms must preserve the same feature semantics and ownership rules.

Expected proof: platform-specific tests plus shared contract tests.

## 12. Credit Ledger

When credits are introduced:

- the ledger is append-only
- a mutable balance field is not the sole source of truth
- operations include grant, reserve, spend, release, refund, and adjustment
- every operation records user, source, amount, creation time, and idempotency
  key

Expected proof: ledger invariant tests and audit reconciliation.

## 13. Documentation Follows Behavior

- Architecture changes require an ADR.
- Schema changes update `docs/DATA_MODEL.md`.
- Feature behavior updates its feature contract.
- Global rule changes update this file and relevant agent instructions.
- Docs describe current implemented truth once implementation exists; planned
  behavior is labeled as planned.

Expected proof: story acceptance criteria and review.
