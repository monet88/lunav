# US-004 Design: Auth and User Epic

## Coordination Model

US-004 owns no application implementation. It coordinates four deep modules:

1. US-005 defines the canonical auth/session interface and platform adapters.
2. US-006 defines profile persistence, lifecycle, and authorization.
3. US-007 projects those modules into the Next.js user flow.
4. US-008 projects those modules into the Expo Router Android user flow.

The durable design source is
`docs/superpowers/specs/2026-07-10-auth-user-epic-design.md`.

## Dependency Graph

```text
US-003 -> US-005 -> US-006 -> US-007
                              -> US-008
```

US-007 and US-008 may execute concurrently after both upstream stories have
fresh proof. No two implementation owners may edit the same declared surface.

## Accepted Interface Decisions

- Supabase Auth email/password is the only MVP sign-in method.
- Confirmed email is required for private flows.
- The auth interface exposes normalized identity/state, not raw tokens.
- The profile interface exposes owner data and `display_name` update input, not
  a client-selected owner ID.
- Web and mobile share semantics but own routing, forms, callbacks, storage,
  and platform proof independently.

## Failure Containment

Failure in one child story does not weaken an upstream contract. A blocked web
or Android proof leaves the other platform story reviewable, but the epic and
Phase 2 gate remain incomplete. Missing hosted email delivery or Android
runtime evidence is recorded as a blocker rather than replaced by static proof.
