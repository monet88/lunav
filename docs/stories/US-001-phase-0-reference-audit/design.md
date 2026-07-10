# US-001 Design: Phase 0 Reference Audit

## Domain Model

Phase 0 defines four durable concepts:

- roadmap input: `SPEC.md`
- living product contract: scope and invariants
- reference evidence: claims tied to exact sibling-repository paths
- work proof: story verification and durable Harness records

## Application Flow

No application flow is implemented. The planning flow is:

```text
confirmed intent
  -> clean-room reference evidence
  -> product scope
  -> invariants and ADR
  -> Phase 0 verification
  -> user review
  -> Phase 1 implementation plan
```

## Interface Contract

No API is introduced. The public planning contract is the documented MVP flow,
compatibility position, locale strategy, and architecture invariants.

## Data Model

No product schema or migration is introduced. `harness.db` stores local intake,
story, decision, and trace records through the existing Harness schema.

## UI and Platform Impact

No UI is created. The product contract states that web and mobile share feature
semantics while keeping platform-specific UI.

## Observability

Harness intake, story verification, decision, and trace records make the Phase
0 work queryable. Reference evidence remains reviewable in Markdown.

## Alternatives Considered

1. Scaffold while auditing: rejected because it bypasses the Phase 0 gate.
2. Port the reference repository: rejected because it conflicts with the new
   stack and clean-room objective.
3. Audit every existing module deeply: rejected because it would prematurely
   bind later roadmap phases.
