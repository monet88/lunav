# ZIWEI AI Roadmap Intake

Date: 2026-07-10

## Source

- User-provided roadmap: `SPEC.md`
- Confirmed discussion: start with Phase 0; primary audience is interested
  newcomers; preserve semantic compatibility for core Zi Wei; audit core deeply
  and later modules as inventory.
- Reference evidence: `F:\CodeBase\ziweiai-web`

## Intent Brief

Build a new cross-platform ZIWEI AI product with a clear server boundary,
shared contracts, persisted AI workflows, and a codebase that agents can extend
safely. Launch in Vietnamese while carrying locale explicitly so English and
other languages can be added after core operation is stable.

## Non-Goals for Phase 0

- no app scaffold
- no code port
- no dependency installation
- no full legacy data migration
- no later-module design
- no Symphony execution

## Accepted Decisions

- Phase 0 precedes Foundation.
- `SPEC.md` is roadmap input; derived docs are the living contract.
- Core Zi Wei aims for semantic compatibility, not source or DTO compatibility.
- MVP targets interested newcomers with progressive disclosure.
- MVP enables `vi`; generated content persists an explicit locale from day one.
- Core auth/chart/explanation/chat/history are deep-audit scope.
- Quota, vision, billing, expanded modules, and growth are inventory-only.

## Product Docs

| File | Purpose |
| --- | --- |
| `docs/PRODUCT_SCOPE.md` | Audience, core loop, scope, compatibility, locale strategy |
| `docs/REFERENCE_AUDIT.md` | Evidence, valuable semantics, anti-patterns, fixture strategy |
| `docs/INVARIANTS.md` | Enforceable global product and architecture rules |
| `docs/ARCHITECTURE.md` | Accepted target boundaries, explicitly marked planned |

## Candidate Epics

| Epic | Description | Status |
| --- | --- | --- |
| E00 | Reference audit and product contract | implemented |
| E01 | Foundation monorepo and quality gates | implemented as US-003 |
| E02 | Shared authentication and user identity | sliced as US-004 through US-008 |
| E03 | Core chart workflow | unsliced |
| E04 | AI explanations | unsliced |
| E05 | Assistant conversations | unsliced |
| E06 | Core product stabilization | unsliced |

Later roadmap phases remain named in `SPEC.md` but are not sliced yet.

## Validation Shape

| Layer | Expected proof |
| --- | --- |
| Contract | schema and locale round-trip tests |
| Unit | domain, normalization, prompt, and idempotency tests |
| Integration | identity, ownership, persistence, provider, and failure recovery |
| E2E | complete web and mobile core loop |
| Platform | production web build and native mobile smoke tests |
| Architecture | forbidden imports, bundle boundaries, secret scan |
| Release | lint, typecheck, test, build, docs, and phase gate |

## Deferred Decisions

- NativeWind versus Tamagui
- canonical locale representation (`vi` versus `vi-VN`)
- exact astrology engine package structure
- monetization model and payment providers
- legacy migration scope
- production hosting topology

## First Story

- `US-001`: complete Phase 0 reference audit and product contract.

## Current Handoff Rule

US-004 is a coordination-only epic. Prepare US-005 through US-008 for Symphony,
but do not start implementation until the product owner explicitly approves
the execution handoff. Phase 3 remains blocked until the US-004 epic gate
passes.
