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

`harness.db` is local-only. Initialize it when it is missing:

```powershell
.\scripts\bin\harness-cli.exe init
```

Do not commit or synchronize `harness.db`. Record normal local Harness
operations with the CLI; a new clone or worktree starts with an empty database.

## Story Dependency and Agent Ownership

Before creating, scheduling, or delegating a multi-story epic, write an
explicit dependency graph in the epic README or story index. For every story,
state its story ID, prerequisite story IDs (or `none`), owned files or
architectural boundary, expected outcome, and the proof needed before dependent
stories can start.

- Order stories by dependency, not by convenience. A dependent story is not
	runnable until every prerequisite has fresh passing proof for its declared
	outcome.
- Assign exactly one implementation owner to each story. Subagents may inspect
	adjacent work read-only, but only the owner may edit the story's declared
	files or boundary.
- Run stories in parallel only when their dependency sets are satisfied and
	their owned files and architectural boundaries do not overlap. Shared
	contracts, migrations, generated artifacts, and central configuration are
	exclusive ownership boundaries.
- When a new dependency or overlap is discovered, stop the affected parallel
	work, update the dependency graph and ownership, then reschedule it. Do not
	resolve collisions by letting multiple agents edit the same surface.
- Every story handoff must name the upstream evidence it consumes and the
	downstream stories it unblocks, so agents can distinguish completed evidence
	from merely planned work.

## PowerShell Command Hygiene

This workspace runs on Windows PowerShell. Keep command arguments distinct
from shell control operators so tool wrappers cannot rewrite their meaning.

- Do not pass `&&`, `;`, `|`, `>`, or `<` inside a CLI option value such as
	`--verify`; some command runners interpret or rewrite them. Pass one
	executable verification command (for example `--verify 'pnpm test'`) and
	record the complete gate list in `--evidence` or the story Markdown.
- Use `;` only to sequence independent PowerShell commands. When the first
	command must succeed before the next starts, run them as separate tool calls
	or capture and check `$LASTEXITCODE` before continuing.
- Quote an argument containing spaces or punctuation with single quotes. Do
	not use unquoted paths or free-text evidence values.
- Read `<command> --help` before writing Harness records. In particular,
	`trace --outcome` accepts its documented enum values, such as `completed`,
	not arbitrary status words like `passed`.
- Do not infer a failed `supabase status` means the project config is invalid:
	without a started local Docker stack, it can fail because the expected
	container does not exist. Capture the exact error before changing config.
<!-- HARNESS:END -->
