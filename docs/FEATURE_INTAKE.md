# Feature Intake

Every request enters intake before implementation.

## Input Types

| Type | Use when | Typical artifact |
| --- | --- | --- |
| `new_spec` | Turning a supplied product roadmap into living contracts | Product docs, initiative map, candidate stories |
| `spec_slice` | Selecting one accepted behavior or phase | Story packet |
| `change_request` | Refining accepted behavior | Story packet or bounded patch |
| `new_initiative` | Adding a multi-story product area | Initiative note and stories |
| `maintenance` | Technical, operational, dependency, or security work | Story, ADR, or validation report |
| `harness_improvement` | Improving human-agent collaboration | Harness docs or backlog item |

## Risk Flags

- authentication or sessions
- authorization or ownership
- data model, migration, deletion, or retention
- privacy, audit, or security
- external providers or payments
- public contracts or persisted data shapes
- cross-platform behavior
- changes to existing behavior
- weak or unavailable proof
- multiple product domains
- source-of-truth or Harness policy changes

## Lanes

### Tiny

Use for narrow copy, naming, docs, or low-risk setup with at most one risk flag.
Record intake, patch directly, and run the cheapest relevant check.

### Normal

Use for bounded story-sized work with two or three risk flags. Create or update
one story packet, define proof, and keep product docs current.

### High-Risk

Use for four or more risk flags, or any hard gate:

- auth or authorization
- data loss or migration
- audit, privacy, or security
- external provider or payment behavior
- weakening validation
- architecture or source-of-truth changes

High-risk work requires an approved design, a story folder containing overview,
design, validation, and exec plan, plus an ADR when a durable boundary changes.

## Current Intake

The initial ZIWEI AI roadmap intake is high-risk because it defines a new
cross-platform product, auth and ownership boundaries, public contracts,
persisted AI content, external providers, and architecture direction. Phase 0
is documentation and evidence only; implementation remains gated.
