# US-002 Synchronize Harness Durable State

## Status

implemented

## Lane

normal

## Product Contract

A clone, worktree, or new agent workspace can recreate the shared Harness
operational state from committed semantic changesets without copying or
committing `harness.db`.

## Relevant Product Docs

- `docs/HARNESS.md`
- `scripts/README.md`
- `AGENTS.md`

## Acceptance Criteria

- The Phase 0 durable baseline is committed as a semantic changeset.
- A fresh temporary database rebuild restores intakes, stories, decisions,
  proof state, and traces.
- Applying the same changeset again is idempotent.
- Shared changeset identity is protected by filename/run-id matching and a
  committed SHA-256 manifest.
- Missing required intake/trace provenance, proof drift, and no-op verifier
  overrides fail regression verification.
- `harness.db`, WAL, and SHM files remain ignored.
- Future shareable mutations use a unique `HARNESS_RUN_ID` and commit their
  generated JSONL changeset.

## Design Notes

- Local runtime database: `harness.db`.
- Shared durable operations: `.harness/changesets/*.changeset.jsonl`.
- Bootstrap command:
  `.\scripts\bin\harness-cli.exe db rebuild --from .harness\changesets`.
- Story verification command: `.\scripts\verify-harness-sync.ps1 -SkipLocalParity`.
- Independent repository gate: `.\scripts\verify-harness-sync.ps1`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Every committed JSONL file parses and starts with a changeset header. |
| Integration | Fresh database rebuild preserves required intake, story, decision, proof, and trace invariants while allowing additional valid changesets. |
| E2E | n/a: no product runtime exists. |
| Platform | PowerShell verification passes on Windows. |
| Release | Phase 0 verifier includes Harness synchronization verification. |

## Harness Delta

- Added the Phase 0 baseline changeset.
- Added a shareable changeset for this synchronization improvement.
- Documented clone bootstrap and future mutation recording.
- Added an executable fresh-database and idempotency check.

## Evidence

- `.harness/changesets/phase0-baseline.changeset.jsonl` contains the original
  Phase 0 intake, story, decision, proof, and trace operations.
- `.harness/changesets/phase0-harness-sync.changeset.jsonl` contains the US-002
  intake, story, proof, trace, and verification operations.
- Later append-only follow-up changesets record verifier hardening and final
  regression validation without replacing the real-verifier pass recorded by
  the original US-002 changeset.
- `.harness/changesets/SHA256SUMS` binds every changeset filename to its content.
- `scripts/test-verify-harness-sync.ps1` fault-injects removed intake/trace
  operations, proof drift, and a later no-op verifier command and requires each
  invalid fixture to fail.
- `scripts/verify-harness-sync.ps1` rebuilt a fresh database, preserved the
  required US-001, US-002, ADR 0001, intake, and trace invariants, matched the
  applied-file count dynamically, and compared fresh/local semantic state.
- Reapplying every committed changeset was skipped idempotently without changing
  the semantic snapshot.
- `harness-cli.exe story verify US-002` passed on 2026-07-10.