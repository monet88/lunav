# ADR 0001: Clean-Room, Vietnamese-First Foundation

## Status

Accepted on 2026-07-10.

## Context

`SPEC.md` defines a new ZIWEI AI product using a pnpm/Turborepo monorepo,
Next.js, Expo, Convex, Clerk, Zod, and TypeScript. A separate working product at
`F:\CodeBase\ziweiai-web` contains valuable domain behavior but uses a different
architecture and includes later-stage features that should not determine the
new foundation.

The product launches in Vietnamese, but future operation may add English and
other locales. A permanent Vietnamese-only data model would create avoidable
migration and regeneration work.

## Decision

1. Rebuild the product clean-room. The reference repository is evidence for
   terminology, flow, compatibility, and failure lessons; its code and
   architecture are not ported.
2. Require semantic compatibility for the core Zi Wei chart workflow, with new
   normalized contracts and independently selected fixtures.
3. Make the product Vietnamese-first and locale-ready. MVP enables only `vi`,
   while AI requests, AI outputs, and persisted generated content include an
   explicit locale from the start.
4. Keep domain identifiers ASCII and locale-neutral. Presentation labels come
   from locale dictionaries.
5. Forbid raw engine labels and unintended CJK text from user-facing output in
   every locale.
6. Audit core MVP flows deeply and treat later roadmap features as inventory
   until their phase begins.

## Consequences

- Phase 0 produces product contracts and evidence, not application code.
- Phase 1 can scaffold against stable boundaries without inheriting the old
  stack.
- Core Chart work must create compatibility fixtures rather than copy legacy
  snapshots.
- Persisted generated content needs a locale field from its first schema.
- Static CJK scans alone are insufficient; localization coverage also needs
  translation-key and locale contract tests.
- Legacy data migration remains a separate future initiative.

## Alternatives Considered

### Port the existing product

Rejected because it would conflict with the selected stack, preserve current
coupling, and pull later modules into the foundation.

### Scaffold before the audit

Rejected because engine, contract, locale, and ownership boundaries would be
chosen before the domain evidence was recorded.

### Hardcode Vietnamese and refactor later

Rejected because generated content would lack reliable language provenance and
future locale work would require ambiguous migrations or regeneration.

## Validation

- `docs/PRODUCT_SCOPE.md`, `docs/REFERENCE_AUDIT.md`, and
  `docs/INVARIANTS.md` agree with this decision.
- The Phase 0 story verification passes.
- No application scaffold or dependency is added during Phase 0.