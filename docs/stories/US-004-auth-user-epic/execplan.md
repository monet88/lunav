# US-004 Exec Plan: Auth and User Epic

## Goal

Move Phase 2 through four independently reviewable implementation stories while
preserving exclusive ownership and proof-based dependency release.

## Execution Order

1. Run the fresh US-003 verifier and start US-005.
2. Review and verify US-005 before scheduling US-006.
3. Review and verify US-006, including cross-user RLS negatives.
4. Start US-007 and US-008 in parallel with separate implementation owners.
5. Review and verify each platform story independently.
6. Run all child verifiers and root release gates before closing US-004.

## Handoff Rules

Each story handoff names the upstream proof it consumed and the downstream
stories it unblocks. Discovery of an overlapping file, shared generated
artifact, new migration, or central configuration edit pauses parallel work
until the dependency graph and ownership table are updated.

## Stop Conditions

Pause for the product owner if implementation would add an auth method, profile
field, account action, data-retention rule, iOS runtime requirement, dependency,
or security exception outside the approved design.
