# Documentation Map

This directory holds the Lunav product contracts and the Harness operating
model that agents use to turn accepted intent into bounded work.

## Product Entry Points

Read these before product or architecture work:

- `../SPEC.md`: roadmap phases and gates
- `PRODUCT_SCOPE.md`: confirmed product intent and MVP boundaries
- `INVARIANTS.md`: non-negotiable product and engineering rules
- `ARCHITECTURE.md`: target system boundaries and stack choices
- `DATA_MODEL.md`: durable data shapes and ownership
- `LOCAL_SUPABASE.md`: local Supabase port map and auth integration proof
- `REFERENCE_AUDIT.md`: Phase 0 clean-room evidence from the reference repo

## Harness Operating Files

- `HARNESS.md`: how humans and agents collaborate
- `FEATURE_INTAKE.md`: how prompts become tiny, normal, or high-risk work
- `CONTEXT_RULES.md`: how much context to read for each phase of work
- `TOOL_REGISTRY.md`: optional tool capabilities and clean-skip rules
- `TEST_MATRIX.md`: legacy proof map; current proof status is
  `scripts/bin/harness-cli query matrix` (Windows: `scripts/bin/harness-cli.exe`)
- `HARNESS_BACKLOG.md`: legacy improvement list; current records live in
  `scripts/bin/harness-cli backlog`
- `HARNESS_COMPONENTS.md`: Lunav-local map of harness responsibilities to files
- `HARNESS_AUDIT.md`: entropy audit categories and known limitations
- `HARNESS_MATURITY.md`: harness maturity levels and criteria
- `TRACE_SPEC.md`: trace quality tiers and required fields
- `IMPROVEMENT_PROTOCOL.md`: how harness friction becomes backlog work
- `GLOSSARY.md`: shared terms

## Folders

- `product/`: optional derived product-domain notes; primary Lunav product
  contracts live at the `docs/` root (`PRODUCT_SCOPE.md`, `INVARIANTS.md`,
  `DATA_MODEL.md`) and in story packets
- `stories/`: Lunav feature packets (`US-001` through `US-008` and later)
- `decisions/`: durable architecture and product decisions
- `spec-intake/`: accepted roadmap and intake records
- `superpowers/`: detailed design specs and implementation plans
- `templates/`: reusable story, plan, decision, and validation formats
- `demo/`: optional harness walkthroughs when present

## Current State

Lunav is past Phase 0 documentation and past the Foundation monorepo gate:

- Application shells exist under `apps/web` (Next.js) and `apps/mobile` (Expo)
- Shared packages live under `packages/` (`config`, `constants`, `contracts`,
  `domain`, `ui-tokens`)
- Root quality gates exist: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm build`, `pnpm security:client`
- Auth session/identity work (US-005) has executable unit and local Supabase
  integration proof; later auth stories remain planned
- Local Harness durable state lives in ignored `harness.db` and is operated
  through `scripts/bin/harness-cli` / `scripts/bin/harness-cli.exe`

These docs describe both product truth and harness procedure. Do not treat the
repository as pre-implementation or empty of app code.
