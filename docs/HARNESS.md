# Harness Operating Model

The app is what users touch. The Harness is what agents use to turn accepted
intent into bounded, validated work.

## Current Repository State

Phase 0 is approved. This repository contains the roadmap input, product
contracts, Harness policy, a local CLI database, and schema migrations. It does
not yet contain the application monorepo described in `SPEC.md`.

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

Use the CLI for normal Harness operations. `harness.db` is local-only and
ignored; versioned truth remains in docs, schema migrations, and application
code.

### Local Workspace State

Do not commit, copy, or synchronize `harness.db`, `harness.db-wal`, or
`harness.db-shm`. When a local database is absent, initialize a new empty one:

```powershell
.\scripts\bin\harness-cli.exe init
.\scripts\bin\harness-cli.exe query matrix
```

Local intake, story, decision, intervention, and trace records are useful only
within the current workspace. A clone or worktree does not inherit those
records; use the Markdown contracts and story packets as its starting point.

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
