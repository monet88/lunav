# Design

## Domain Model

Describe entities, value objects, and business rules.

## Application Flow

Describe commands, queries, and handlers.

## Interface Contract

Describe routes, messages, commands, request DTOs, response DTOs, and errors.

## Security / Privacy / Authorization

Document the high-risk controls that implementation and review must preserve:

- **Authorization boundary**: who may invoke each interface, and how identity,
  ownership, or tenant scope is verified server-side.
- **Threat / abuse controls**: enumeration resistance, replay rejection,
  redirect/callback allowlists, rate limits, and other attack surfaces for this
  story.
- **Sensitive data**: classification of secrets, tokens, passwords, PII, and
  what may never be logged, stored client-side, or returned in errors.
- **Privacy / retention**: what is stored, for how long, and which fields are
  mutable by the owner versus system-managed.
- **Transport / storage protections**: cookie flags, secure storage, HTTPS
  requirements, encryption expectations, and cleanup on logout or identity
  change.

## Data Model

Describe tables, indexes, migrations, and retention concerns.

## UI / Platform Impact

Describe browser, mobile, desktop, CLI, deployment, or platform-shell impact.

## Observability

Describe logs, audit records, metrics, or traces.

## Alternatives Considered

1. Option.
