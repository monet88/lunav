# US-001 Overview: Phase 0 Reference Audit

## Status

implemented

## Lane

high-risk

## Current Behavior

The repository has `SPEC.md`, Harness CLI/schema files, and no application code.
Before this story, the product contract, invariants, reference evidence, and
durable Phase 0 work record did not exist. `AGENTS.md` referenced missing
Harness documents and `harness.db` was not initialized.

## Target Behavior

The repository has an evidence-backed, product-owner-approved Phase 0 product
contract. Foundation planning may proceed without copying the reference
architecture. Agents can follow the Harness entrypoint and mechanically verify
the Phase 0 artifact set.

## Affected Users

- Product owner deciding product direction.
- Engineers and agents planning Foundation and Core Chart work.
- Future reviewers verifying why boundaries were selected.

## Affected Product Docs

- `SPEC.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/REFERENCE_AUDIT.md`
- `docs/INVARIANTS.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0001-clean-room-vietnamese-first-foundation.md`

## Non-Goals

- Application scaffold or feature implementation.
- Source-code migration from `F:\CodeBase\ziweiai-web`.
- Symphony execution.
- Full legacy data compatibility.
