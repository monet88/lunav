# US-001 Exec Plan: Phase 0 Reference Audit

## Goal

Produce a review-ready, evidence-backed product contract draft and a runnable
Phase 0 proof path without implementing the application.

## Scope

In scope:

- clean-room reference audit
- product scope and invariants
- locale-ready architecture decision
- Harness operating docs and durable records
- documentation verification

Out of scope:

- application scaffold
- dependencies
- feature implementation
- Symphony execution

## Risk Classification

Risk flags:

- auth and ownership boundaries
- public contracts and persisted data
- external AI providers
- cross-platform behavior
- multi-domain roadmap
- architecture and source hierarchy
- initially weak proof

Hard gates:

- auth
- security and privacy boundaries
- external provider behavior
- architecture direction

## Work Phases

1. Explore the empty target repository and reference evidence.
2. Confirm audience, compatibility, audit depth, and locale strategy.
3. Write product contracts, audit, invariants, and ADR.
4. Restore the minimum Harness operating surface.
5. Record intake, story, decision, and trace data.
6. Run documentation and story verification.
7. Stop for user review before Phase 1 planning.

## Progress

- [x] (2026-07-10) Explored target repo, roadmap, Harness CLI, and reference repo.
- [x] (2026-07-10) Confirmed Phase 0 first, interested-newcomer audience, semantic
  core compatibility, and deep-core/wide-inventory audit scope.
- [x] (2026-07-10) Confirmed Vietnamese-first, locale-ready persistence strategy.
- [x] (2026-07-10) Wrote product scope, reference audit, invariants, and ADR.
- [x] (2026-07-10) Recorded intake #1, story US-001, and decision 0001 in the
  durable Harness layer.
- [x] (2026-07-10) Passed the Phase 0 verifier, reference evidence verifier,
  and Harness story verification.
- [x] (2026-07-10) Product owner approved the written Phase 0 contract and
  authorized Foundation planning.

## Surprises and Discoveries

- Observation: `AGENTS.md` required five Harness docs that were absent.
  Evidence: initial reads failed and `docs/` was empty.
- Observation: Harness CLI was installed but `harness.db` was not initialized.
  Evidence: `query matrix` returned `database not found`.
- Observation: the reference birth contract already carried locale and covered
  unknown time, leap month, coordinates, and timezone.
  Evidence: `packages/contracts/src/chart/birth-input.ts` in the reference repo.

## Decision Log

- Decision: Use Phase 0 as a clean-room evidence and contract phase.
  Rationale: preserves the selected architecture and phase gate.
  Date/Author: 2026-07-10 / product owner and GitHub Copilot.
- Decision: Make MVP Vietnamese-first and persist explicit locale from day one.
  Rationale: enables future English without ambiguous content migration.
  Date/Author: 2026-07-10 / product owner and GitHub Copilot.
- Durable decision: `0001-clean-room-vietnamese-first-foundation`.

## Outcomes and Retrospective

The target repository now has an evidence-backed accepted product contract based
on confirmed intent, explicit clean-room and locale decisions, restored Harness
entrypoint docs, and runnable Phase 0 proof commands. Foundation planning may
begin; application implementation remains intentionally unstarted.

## Stop Conditions

Pause if product behavior changes, application implementation is requested
before review, or Phase 0 proof needs to be weakened.
