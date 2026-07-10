# Context Rules

Read enough to identify the controlling contract and cheapest proof, then act.
Do not map the whole roadmap for a story-sized task.

## Intake

Always read:

- `AGENTS.md`
- `SPEC.md` for roadmap phase and gate
- `docs/FEATURE_INTAKE.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/INVARIANTS.md`
- `.\scripts\bin\harness-cli.exe query matrix`

For high-risk work also read `docs/ARCHITECTURE.md`, relevant ADRs, and the
complete story packet.

## Planning

Read the relevant product contract, one or two neighboring patterns once code
exists, and the story validation file. Resolve the smallest boundary that owns
the behavior. Do not select a later phase as a workaround for an earlier gate.

## Implementation

Stay within the selected story. Read adjacent code only when needed to choose
between local hypotheses or preserve an existing pattern. External library work
requires current official documentation after local truth is understood.

## Validation

Run the story verify command first, then the narrowest applicable typecheck,
lint, unit, integration, E2E, platform, and build gates. Never mark proof as
present because a command is merely planned.

## Reference Repository

`F:\CodeBase\ziweiai-web` may be read during Phase 0 and later compatibility
investigations. Do not import, copy, or create build-time dependencies on it.
Claims derived from it must cite exact evidence paths in
`docs/REFERENCE_AUDIT.md` or a later compatibility report.

## Stop Conditions

Pause for human direction when:

- a requirement conflicts with accepted product docs
- architecture direction must change
- data migration or deletion appears
- validation would need to be weakened
- a new dependency, schema migration, payment decision, or default-branch push
  is required without explicit approval
