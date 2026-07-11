# Harness Components (Lunav)

This taxonomy maps **this Lunav repository** to the Harness runtime
responsibilities agents should use when attributing failures, choosing context,
or deciding which proof to run.

It is not an inventory of the upstream `repository-harness` source tree. Paths
such as `crates/harness-cli/*`, `Cargo.toml`, `PHASE2.md`–`PHASE5.md`, or
upstream story IDs like `US-001-install-harness` are out of scope here.

Status values:

- **Covered**: Lunav has an explicit file, command, or durable record for this
  responsibility.
- **Partial**: some support exists, but it is incomplete, manual, or not fully
  automated in this repo.
- **Missing**: no meaningful Lunav support yet.

## Responsibility Map

| # | Responsibility | Status | Lunav files / commands | Evidence | Gap |
| --- | --- | --- | --- | --- | --- |
| 1 | Task specification | Covered | `AGENTS.md`, `SPEC.md`, `docs/FEATURE_INTAKE.md`, `docs/PRODUCT_SCOPE.md`, `docs/INVARIANTS.md`, `docs/templates/*`, `docs/stories/US-*` | Requests are classified and story packets define outcome, design, and proof. | Keep story packets synchronized with product docs when behavior changes. |
| 2 | Context selection | Covered | `docs/CONTEXT_RULES.md`, `docs/ARCHITECTURE.md`, `docs/decisions/*`, `docs/DATA_MODEL.md`, `docs/LOCAL_SUPABASE.md` | Intake and planning docs name the cheapest controlling contracts. | Context scoring remains advisory CLI capability, not enforced. |
| 3 | Tool access | Covered | `scripts/bin/harness-cli` / `scripts/bin/harness-cli.exe`, `docs/TOOL_REGISTRY.md`, `scripts/README.md`, `tool` table | Agents discover Harness commands and optional capabilities; absent tools clean-skip. | No permission profiles or usage analytics. |
| 4 | Project memory | Covered | `docs/HARNESS.md`, `docs/GLOSSARY.md`, `docs/decisions/*`, `docs/stories/*`, `harness.db` | Decisions, stories, intakes, and traces preserve durable knowledge. | Local `harness.db` is not shared across clones. |
| 5 | Task state | Covered | `scripts/bin/harness-cli query matrix`, `story` / `intake` / `trace` tables, story `validation.md` files | Story status, proof flags, and verify commands are durable. | Planned stories can remain orphaned until traces are recorded. |
| 6 | Observability | Partial | `docs/TRACE_SPEC.md`, `scripts/bin/harness-cli trace`, `score-trace`, `query traces`, `query friction` | Traces and friction can be recorded and reviewed. | No dashboard or automated benchmark ingestion. |
| 7 | Failure attribution | Partial | `docs/HARNESS_COMPONENTS.md`, `docs/TRACE_SPEC.md`, story validation reports, `backlog` table | Failures can be tied to files, stories, and harness friction manually. | No automated mapping from CI failures to components. |
| 8 | Verification | Covered | Story `validation.md`, `scripts/verify-*.sh` / `*.ps1`, `pnpm` quality gates, `scripts/bin/harness-cli story verify`, `story.verify_command` | Mechanical proof exists for Phase 0, Foundation, auth planning packets, and US-005 session gate. | Later auth stories still need executable E2E/platform proof. |
| 9 | Permissions | Partial | `AGENTS.md`, `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`, `docs/ARCHITECTURE.md`, product invariants | Policy describes when to ask, what is high-risk, and clean-room boundaries. | Instruction-level only; no enforced command allowlist. |
| 10 | Entropy auditing | Covered | `docs/HARNESS_AUDIT.md`, `docs/IMPROVEMENT_PROTOCOL.md`, `scripts/bin/harness-cli audit`, `propose`, `backlog` | Drift and entropy score are queryable; proposals can become backlog. | Failed verifications are not a separate entropy category in the CLI (see `HARNESS_AUDIT.md`). |
| 11 | Intervention recording | Covered | `intervention` table, `scripts/bin/harness-cli intervention add`, `query interventions` | Human/reviewer/CI interventions can be stored separately from traces. | Capture remains manual. |

## NexAU Cross-Reference (Lunav)

| Component | Lunav equivalent | Status | Notes |
| --- | --- | --- | --- |
| System prompts | `AGENTS.md` plus Harness and product docs | Covered | Product truth is Vietnamese-first Lunav contracts, not a generic empty harness. |
| Tool descriptions | `docs/TOOL_REGISTRY.md`, `scripts/README.md`, CLI help | Covered | Prefer platform binary: `.exe` on Windows. |
| Tool implementations | Prebuilt `scripts/bin/harness-cli(.exe)`, schema under `scripts/schema/` | Covered | This repo consumes the CLI; it does not vendor the Rust crate sources. |
| Middleware | Feature intake, story verify wrappers, Supabase local runbook | Partial | No runtime policy middleware. |
| Skills | `.claude/skills/harness-intake-griller`, docs templates | Partial | Project-scoped skill plus markdown procedures. |
| Sub-agents | None required by product harness | Missing | Optional agent harness only; not a product feature. |
| Long-term memory | `harness.db`, decisions, stories, product docs | Covered | Product contracts live mainly under `docs/*.md` and `docs/stories/*`. |

## Lunav File Inventory (primary map)

| File / area | Primary responsibility | Secondary |
| --- | --- | --- |
| `AGENTS.md` | Context selection | Task specification, Permissions |
| `SPEC.md` | Task specification | Project memory |
| `README.md` | Task specification | Project memory |
| `docs/PRODUCT_SCOPE.md` | Task specification | Permissions |
| `docs/INVARIANTS.md` | Permissions | Verification |
| `docs/ARCHITECTURE.md` | Permissions | Context selection |
| `docs/DATA_MODEL.md` | Task specification | Verification |
| `docs/LOCAL_SUPABASE.md` | Verification | Tool access |
| `docs/REFERENCE_AUDIT.md` | Verification | Project memory |
| `docs/HARNESS.md` | Task specification | Project memory |
| `docs/FEATURE_INTAKE.md` | Task specification | Permissions |
| `docs/CONTEXT_RULES.md` | Context selection | Task specification |
| `docs/TOOL_REGISTRY.md` | Tool access | Context selection |
| `docs/HARNESS_AUDIT.md` | Entropy auditing | Verification |
| `docs/HARNESS_COMPONENTS.md` | Failure attribution | Observability |
| `docs/HARNESS_MATURITY.md` | Entropy auditing | Observability |
| `docs/TRACE_SPEC.md` | Observability | Failure attribution |
| `docs/GLOSSARY.md` | Project memory | Context selection |
| `docs/stories/US-001-*` … `US-008-*` | Task specification | Verification |
| `docs/decisions/*` | Project memory | Permissions |
| `scripts/bin/harness-cli(.exe)` | Tool access | Task state, Verification |
| `scripts/schema/*.sql` | Task state | Observability |
| `scripts/verify-phase0.*` | Verification | Task specification |
| `scripts/verify-reference-audit.*` | Verification | Project memory |
| `scripts/verify-auth-user-planning.*` | Verification | Task specification |
| `scripts/verify-auth-session.*` | Verification | Permissions |
| `apps/web/**` | Failure attribution | Verification |
| `apps/mobile/**` | Failure attribution | Verification |
| `packages/**` | Failure attribution | Verification |
| `supabase/**` | Failure attribution | Verification |
| `.github/workflows/**` | Verification | Tool access |

## Coverage Summary

- Covered: 8/11 responsibilities
- Partial: 3/11 responsibilities (observability, failure attribution, permissions)
- Missing: 0/11 product-harness responsibilities required for current Lunav phase work

When attributing a failure, name the responsibility first, then the concrete
Lunav path above. Do not cite upstream harness source paths that are not
present in this repository.
