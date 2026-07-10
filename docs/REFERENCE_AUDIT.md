# ZIWEI AI Reference Audit

## Status

Accepted Phase 0 clean-room audit of `F:\CodeBase\ziweiai-web`.

`SPEC.md` remains the source of truth for the rebuild. The reference repository
provides domain evidence, compatibility examples, and lessons only. Its code,
stack, module layout, and persistence design are not implementation inputs.

## Audit Method

The audit reads product documents, contracts, feature entrypoints, server-only
engine boundaries, tests, and representative fixtures. Core MVP flows are
reviewed deeply; later roadmap modules are inventoried without adopting their
architecture.

## Product Evidence

### Audience and reading model

The reference product serves people interested in Vietnamese Zi Wei and related
systems. Its strongest product insight is that the main activity is calmly
reading one chart over time, not scanning an operational dashboard.

Evidence:

- `F:\CodeBase\ziweiai-web\PRODUCT.md`
- `F:\CodeBase\ziweiai-web\README.md`
- `F:\CodeBase\ziweiai-web\docs\product\overview.md`

The rebuild keeps the calm reading model but narrows the first audience to
people who are new to Zi Wei and seriously interested in understanding it.

### Core user flows

The reference implementation demonstrates these valuable flows:

1. Authenticate a user and resolve a server identity.
2. Validate birth data and create a chart on the server.
3. Persist a normalized chart snapshot.
4. Reopen chart detail and history by id.
5. Generate an explanation for a chart or palace.
6. Create chart-scoped conversations and persist messages.
7. Stream an assistant response while preserving typed error behavior.

Evidence:

- `F:\CodeBase\ziweiai-web\apps\api\src\modules\charts\charts.controller.ts`
- `F:\CodeBase\ziweiai-web\apps\api\src\modules\explanations\explanations.controller.ts`
- `F:\CodeBase\ziweiai-web\apps\api\src\modules\conversations\conversations.controller.ts`
- `F:\CodeBase\ziweiai-web\apps\web\src\lib\features\chart\ChartDetailScreen.svelte`
- `F:\CodeBase\ziweiai-web\apps\web\src\lib\features\history\HistoryList.svelte`

## Domain and Contract Findings

### Birth input

The reference `BirthInput` shape usefully separates:

- Gregorian or lunar calendar
- date and leap-month metadata
- known or unknown birth time
- chart sex/gender input
- place label or manual coordinates and timezone
- locale
- input source

Evidence:

- `F:\CodeBase\ziweiai-web\packages\contracts\src\chart\birth-input.ts`

The exact DTO is not adopted yet. Phase 3 must preserve the semantic cases,
especially unknown time, lunar leap month, timezone, and explicit locale.

### Chart snapshot

The reference normalizes engine output before crossing the server boundary and
uses ASCII identifiers for chart systems, palaces, stars, stems, branches, and
other domain labels. This is worth preserving because it separates domain data
from presentation language and prevents raw engine labels from becoming a
public contract.

Evidence:

- `F:\CodeBase\ziweiai-web\packages\contracts\src\chart\chart-snapshot.ts`
- `F:\CodeBase\ziweiai-web\packages\astro-engine\src\normalization`
- `F:\CodeBase\ziweiai-web\docs\ARCHITECTURE.md`

### Explanations and conversations

The reference parses explanation and conversation inputs at the API boundary,
scopes conversations to a chart, and exposes typed stream events. Useful
semantics to carry forward are explicit ownership, persisted user and assistant
messages, retry safety, and no partial record that falsely appears complete.

Evidence:

- `F:\CodeBase\ziweiai-web\packages\contracts\src\explanations\explanation-context.ts`
- `F:\CodeBase\ziweiai-web\packages\contracts\src\persistence\persistence-records.ts`
- `F:\CodeBase\ziweiai-web\apps\api\src\modules\conversations\conversations.controller.ts`
- `F:\CodeBase\ziweiai-web\apps\api\src\providers\ai\build-palace-explanation-prompt.ts`

## Engine Boundary

The strongest architecture rule in the reference product is one-way data flow:

```text
validated input
  -> server-only astrology engine
  -> normalized snapshot contract
  -> persistence and API
  -> web or mobile rendering
```

The engine depends on `iztro`, `lunar-javascript`, Temporal utilities, and a
vendored runtime for expanded systems. These dependencies and their raw labels
must not enter a client bundle.

Evidence:

- `F:\CodeBase\ziweiai-web\packages\astro-engine\src\server-only.ts`
- `F:\CodeBase\ziweiai-web\packages\astro-engine\src\index.ts`
- `F:\CodeBase\ziweiai-web\docs\decisions\0007-web-server-boundary.md`
- `F:\CodeBase\ziweiai-web\docs\decisions\0011-horoscope-engine-boundary.md`

The rebuild keeps the boundary, not the package layout or current engine
adapter implementation.

## Language and Locale Findings

The reference product proves that engine terms and AI output need active
guarding. It translates normalized keys into Vietnamese, rejects or replaces
CJK output, and includes a UI-level no-Han test.

Evidence:

- `F:\CodeBase\ziweiai-web\packages\core\src\text\cjk-guard.ts`
- `F:\CodeBase\ziweiai-web\apps\web\src\lib\text\cjk.ts`
- `F:\CodeBase\ziweiai-web\apps\web\src\lib\features\chart\no-han-characters.test.ts`
- `F:\CodeBase\ziweiai-web\apps\api\src\providers\ai\build-palace-explanation-prompt.ts`

The rebuild changes the permanent rule from Vietnamese-only to
Vietnamese-first and locale-ready:

- MVP enables `vi` only.
- persisted generated content has an explicit locale from the start.
- raw engine labels and Han characters remain forbidden in user-facing output
  for every locale.

Reference UI labels such as `MBTI Test` and brand-only English strings show
that a Han-character scan is not sufficient to prove complete localization.
Translation-key coverage and locale-specific copy review are separate proof.

## Compatibility Fixture Strategy

The reference repository contains a Phase 3 fixture catalog with categories for
common valid input, calendar boundaries, timezone ambiguity, unknown birth time,
upstream parity, and provenance warnings:

- `F:\CodeBase\ziweiai-web\packages\astro-engine\src\fixtures\phase-3-fixture-catalog.ts`

The rebuild should create its own fixtures during Core Chart work. Phase 0 does
not copy snapshots. At minimum, future fixture selection should cover:

1. two common valid Zi Wei charts
2. Gregorian and lunar calendar boundaries
3. an unknown-time case
4. a timezone or DST ambiguity case
5. upstream-engine parity cases
6. a normalization case that proves no raw Han label crosses the contract

Expected compatibility is semantic equivalence of normalized core Zi Wei data,
not byte-for-byte equality with the reference DTO.

## Valuable Capabilities to Preserve

- contracts shared by every boundary consumer
- server-only chart calculation
- normalized, persisted chart snapshots
- chart history and reopen behavior
- on-demand AI explanations
- chart-grounded, persisted assistant conversations
- explicit workflow states and typed errors
- ownership checks on every private record
- deterministic default tests that do not spend AI tokens
- locale carried by birth input and generated content

## Architecture Mistakes Not to Repeat

1. Do not put an astrology engine or provider SDK in web or mobile bundles.
2. Do not redefine DTOs separately in web, mobile, and backend.
3. Do not expose raw engine labels or silently fall back to Han text.
4. Do not hardcode long prompts inside handlers or UI components.
5. Do not keep important workflow state only in client memory.
6. Do not make retries create duplicate charts, explanations, replies, or
   credit operations.
7. Do not design later modules before the core chart loop is stable.
8. Do not inherit the reference stack merely because it already works.
9. Do not treat one balance field as an auditable credit ledger.
10. Do not let anonymous access from the reference product expand the signed-in
    MVP without a separate product decision.

## Later-Phase Inventory

The reference product includes quotas, credits, vision, billing, expanded
divination systems, and public/growth surfaces. They demonstrate demand and
integration risks, but Phase 0 does not adopt their contracts or sequence.
Each remains governed by the corresponding roadmap phase in `SPEC.md`.

## Open Items for Later Phases

- Select and record exact Core Chart fixtures when the engine is chosen.
- Decide the canonical locale format, such as `vi` versus `vi-VN`, before
  contracts are implemented.
- Define legacy import only if migration becomes an explicit initiative.
- Define assistant disconnect and partial-stream persistence semantics during
  the Assistant Chat feature design.
