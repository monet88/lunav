# Agent Instructions

## Project Skills

Use `.claude/skills/harness-intake-griller/SKILL.md` when a request needs
discussion, feature intake, docs, or story shaping before Symphony execution.
The skill is project-scoped; do not use a global copy as the source of truth.

## Product Entry Point

Read `SPEC.md`, `docs/PRODUCT_SCOPE.md`, and `docs/INVARIANTS.md` before product
or architecture work. The product is Vietnamese-first and locale-ready; MVP
enables `vi`, while generated content carries explicit locale from the start.

Treat `F:\CodeBase\ziweiai-web` as clean-room reference evidence only. Do not
copy its source or inherit its architecture implicitly.

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TOOL_REGISTRY.md`
- `.\scripts\bin\harness-cli.exe query matrix`

Use the Rust Harness CLI at `scripts/bin/harness-cli.exe` on Windows as the main operational tool. Before a
step that could use an external tool, run `scripts/bin/harness-cli query tools
--capability <name> --status present` to see what is equipped; an absent
capability is a clean skip.

If `harness.db` is missing, rebuild it from committed semantic changesets:

```powershell
.\scripts\bin\harness-cli.exe db rebuild --from .harness\changesets
```

Do not commit `harness.db`. Use a unique `HARNESS_RUN_ID` for shareable Harness
mutations and commit the generated `.harness/changesets/*.changeset.jsonl` file.
<!-- HARNESS:END -->
