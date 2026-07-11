# US-004 Validation: Auth and User Epic

## Planning Proof

This planning verifier authorizes scheduling, not implementation completion.

- Shared understanding was confirmed by the product owner on 2026-07-10.
- Every child story declares prerequisites, exclusive ownership, outcome, and
  release proof.
- The dependency graph permits parallel work only for non-overlapping web and
  mobile stories after shared prerequisites pass.
- Product, invariant, and data-model docs distinguish planned behavior from
  implemented behavior.

## Epic Completion Proof

| Layer | Required proof |
| --- | --- |
| Contract | US-005 auth identity/state and US-006 profile contracts pass. |
| Integration | Supabase-local auth, trigger, RLS, session, recovery, and cross-user negative tests pass. |
| Web E2E | US-007 completes signup through logout, including confirmation, recovery, settings, reload, and protected return. |
| Mobile platform | US-008 completes the equivalent flow on an Android emulator or device. |
| Hosted smoke | Registered origins/callbacks, confirmation, password/abuse controls, secure cookies, verified Android App Links, and real email callbacks are attested. |
| Security | Client-secret scan, redirect rejection, no sensitive logging, and sign-out cache cleanup pass. |
| Release | Root lint, typecheck, test, build, and all child story verifiers pass. |

## Planned Epic Verify Command

The current Harness verifier checks planning-packet completeness and required
scope/security markers only. It authorizes scheduling, not implementation
completion. Before a child story can be marked implemented, its owner replaces
the planning verifier with the executable unit, integration, E2E, or platform
gate declared in that story. At epic completion, use:

```bash
# macOS / Linux
scripts/bin/harness-cli story verify US-005
scripts/bin/harness-cli story verify US-006
scripts/bin/harness-cli story verify US-007
scripts/bin/harness-cli story verify US-008
```

```powershell
# Windows PowerShell
.\scripts\bin\harness-cli.exe story verify US-005
.\scripts\bin\harness-cli.exe story verify US-006
.\scripts\bin\harness-cli.exe story verify US-007
.\scripts\bin\harness-cli.exe story verify US-008
```

Do not mark US-004 implemented merely because planning docs pass.
