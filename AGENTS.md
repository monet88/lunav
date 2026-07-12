# Agent Instructions

## Project Skills

Use `.claude/skills/harness-intake-griller/SKILL.md` when a request needs
discussion, feature intake, docs, or story shaping before Symphony execution.
The skill is project-scoped; do not use a global copy as the source of truth.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for monet88/lunav (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, Harness-mapped: product contract + `docs/GLOSSARY.md` + `docs/decisions/` (not `docs/adr/`). See `docs/agents/domain.md`.

### Hybrid work flow

Plan with `harness-intake-griller`, then Matt skills for fog/tickets/build/review. See `docs/agents/hybrid-flow.md`.

## Product Entry Point

Read `SPEC.md`, `docs/PRODUCT_SCOPE.md`, and `docs/INVARIANTS.md` before product
or architecture work. The product is Vietnamese-first and locale-ready; MVP
enables `vi`, while generated content carries explicit locale from the start.

Treat `F:\CodeBase\ziweiai-web` as clean-room reference evidence only. Do not
copy its source or inherit its architecture implicitly.

## Branch Workflow

For substantial feature work or multi-step implementations, create and use a
new Git branch. Small, isolated changes may use the current branch. Do not
create Git worktrees unless the user explicitly asks for one.

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TOOL_REGISTRY.md`
- `.\scripts\bin\harness-cli.exe query matrix` on Windows

Use the Rust Harness CLI at `scripts/bin/harness-cli.exe` on Windows as the main operational tool. Before a
step that could use an external tool, run `scripts/bin/harness-cli query tools
--capability <name> --status present` to see what is equipped; an absent
capability is a clean skip.
<!-- HARNESS:END -->