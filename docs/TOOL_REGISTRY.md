# Tool Registry

Optional tools are providers of capabilities, not hidden prerequisites. A tool
that is absent produces a clean skip unless the selected story explicitly
requires that capability for proof.

## Main Interface

Use the installed platform CLI at `scripts/bin/harness-cli` on macOS/Linux or
`scripts/bin/harness-cli.exe` on Windows:

```bash
# macOS / Linux
scripts/bin/harness-cli query tools --summary
scripts/bin/harness-cli query tools --capability <name> --status present
scripts/bin/harness-cli tool check
```

```powershell
# Windows PowerShell
.\scripts\bin\harness-cli.exe query tools --summary
.\scripts\bin\harness-cli.exe query tools --capability <name> --status present
.\scripts\bin\harness-cli.exe tool check
```

Before a step that could use an external tool, query the relevant capability.
If no present provider exists, record the gap when it blocks proof; otherwise
skip it cleanly.

## Capability Examples

- `code-graph`
- `library-docs`
- `lint`
- `typecheck`
- `unit-test`
- `integration-test`
- `e2e-test`
- `mobile-smoke`
- `deploy-verification`
- `security-scan`

## Phase 0 Position

Phase 0 requires only repository reads, Harness CLI operations, and the local
documentation verification script. No optional external provider is required
for completion. CodeGraph evidence from the reference repository may strengthen
the audit, but its absence would not change the accepted product contract.

## Registration Rule

Register a new provider only when a real workflow step consumes its capability.
Do not add tools merely to anticipate future scale. Record command, kind,
capability, responsibility, description, and a reliable presence scan.
