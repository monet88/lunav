# US-001 Validation: Phase 0 Reference Audit

## Proof Strategy

Prove that all required Phase 0 artifacts exist, contain the confirmed intent,
have no unresolved placeholders, and agree on clean-room, server-only, and
locale-ready boundaries. Use a separate reference-audit verifier to confirm the
cited high-value paths at audit time without making future application builds
depend on a sibling repository.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Documentation verifier checks files, headings, decisions, and placeholders. |
| Integration | Harness story verify runs the documentation verifier from repo root. |
| E2E | n/a: no user-facing application exists in Phase 0. |
| Platform | n/a: no web or mobile runtime exists in Phase 0. |
| Performance | n/a: documentation-only work. |
| Logs/Audit | Intake, ADR, story, verification result, and trace are recorded. |

## Fixtures

No chart snapshot is copied in Phase 0. The audit identifies future fixture
categories from:

- `F:\CodeBase\ziweiai-web\packages\astro-engine\src\fixtures\phase-3-fixture-catalog.ts`

Core Chart work will create independent fixtures.

## Commands

```bash
# macOS / Linux / Git Bash
bash scripts/verify-phase0.sh
bash scripts/verify-reference-audit.sh <ref-root>
# or: REFERENCE_REPO_ROOT=<ref-root> bash scripts/verify-reference-audit.sh
scripts/bin/harness-cli story verify US-001
# Windows Git Bash may need: scripts/bin/harness-cli.exe story verify US-001
```

```powershell
# Windows PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-phase0.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-reference-audit.ps1 -ReferenceRoot <ref-root>
# or: $env:REFERENCE_REPO_ROOT = '<ref-root>'; .\scripts\verify-reference-audit.ps1
.\scripts\bin\harness-cli.exe story verify US-001
```

## Acceptance Evidence

- `scripts/verify-phase0.ps1` / `scripts/verify-phase0.sh` passed on 2026-07-10.
- `harness-cli story verify US-001` passed on 2026-07-10.
- `scripts/verify-reference-audit.ps1` / `scripts/verify-reference-audit.sh`
	confirmed eight high-value reference evidence paths on 2026-07-10. This is
	audit-time proof and is intentionally separate from the durable story verify
	command.
- E2E and platform proof are `n/a` because Phase 0 contains no application or
	runtime surface.
