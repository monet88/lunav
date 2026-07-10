# Harness Operating Model

The app is what users touch. The Harness is what agents use to turn accepted
intent into bounded, validated work.

## Current Repository State

This repository is in Phase 0. It contains the roadmap input, product contracts,
Harness policy, a durable CLI, and schema migrations. It does not yet contain
the application monorepo described in `SPEC.md`.

Do not describe planned architecture as implemented behavior.

## Source Hierarchy

```text
Human confirmation
  -> SPEC.md as roadmap input
  -> docs/PRODUCT_SCOPE.md and docs/INVARIANTS.md
  -> relevant feature or architecture docs
  -> docs/stories/* work packets
  -> executable validation and Harness proof records
  -> docs/decisions/* for durable tradeoffs
```

`F:\CodeBase\ziweiai-web` is a Phase 0 reference source only. It cannot override
accepted product docs or become an implicit source dependency.

## Work Loop

1. Read `AGENTS.md`, `SPEC.md`, and the required Harness docs.
2. Classify the request with `docs/FEATURE_INTAKE.md`.
3. Record the intake with `scripts/bin/harness-cli.exe intake`.
4. Find or create the smallest relevant story packet.
5. Confirm product contract, scope, risks, and proof.
6. Implement only after the relevant design is approved.
7. Run the story verification command and required project gates.
8. Update product docs, story evidence, decisions, and proof flags.
9. Record a trace before the final response.

## Phase Rule

The roadmap phases are sequential gates. Do not start a later phase because it
looks easier or more visible. A phase may be split into planning, contracts,
backend, web, mobile, tests, documentation, and hardening stories, but its gate
must pass before the next phase begins.

## Durable Layer

Operational state lives in local `harness.db`, managed by:

```powershell
.\scripts\bin\harness-cli.exe init
.\scripts\bin\harness-cli.exe intake --help
.\scripts\bin\harness-cli.exe story add --help
.\scripts\bin\harness-cli.exe story verify <story-id>
.\scripts\bin\harness-cli.exe query matrix
.\scripts\bin\harness-cli.exe decision add --help
.\scripts\bin\harness-cli.exe trace --help
```

Use the CLI for normal Harness operations. The database is local and ignored;
versioned truth remains in docs, schema migrations, and application code.

### Bootstrap a Clone or New Workspace

Do not commit or copy `harness.db`. Rebuild local state from committed semantic
changesets:

```powershell
.\scripts\bin\harness-cli.exe db rebuild --from .harness\changesets
.\scripts\bin\harness-cli.exe query matrix
```

Use `init` only when no committed changesets exist yet. Once changesets exist,
`db rebuild` creates the schema and applies them in one operation.

### Record Shareable Durable Changes

Set a unique run id before commands that mutate Harness state:

```powershell
$env:HARNESS_RUN_ID = "<story-or-run-id>"
.\scripts\bin\harness-cli.exe intake ...
.\scripts\bin\harness-cli.exe story update ...
.\scripts\bin\harness-cli.exe trace ...
Remove-Item Env:HARNESS_RUN_ID
```

Commit the generated `.harness/changesets/<run-id>.changeset.jsonl`. Never
commit `harness.db`, `harness.db-wal`, or `harness.db-shm`.

Changesets are applied in lexical filename order. Choose sortable run ids when
one changeset depends on records created by another, for example a baseline,
then a story changeset, then a later follow-up. Do not edit an already shared
changeset; record corrections as a later semantic changeset.

The filename stem must equal the `changeset.header.run_id`. After adding a
changeset, update `.harness/changesets/SHA256SUMS` with the lowercase SHA-256
of every JSONL file in lexical filename order. The verifier rejects missing,
renamed, or modified changesets before rebuilding the database.

Verify the repository can recreate its durable state with:

```powershell
.\scripts\test-verify-harness-sync.ps1
.\scripts\verify-harness-sync.ps1
```

The regression script proves that missing provenance records, proof drift, and
later no-op verification commands are rejected while additional valid
changesets remain supported. The verifier also compares semantic state before
and after reapply, restores any caller-provided `HARNESS_DB_PATH`, and compares
the local database with a fresh rebuild when `harness.db` exists.

## Symphony Boundary

Harness intake and story shaping do not authorize execution. Do not start
Symphony, a long-running implementation agent, or an implementation story until
the user explicitly approves that handoff.

## Done Definition

A task is complete only when:

- the requested outcome or blocker is documented
- affected contracts and story packets are current
- available focused validation has run
- proof records reflect actual results rather than planned proof
- a trace records files read, files changed, outcome, and friction
- the final response states what was not attempted
