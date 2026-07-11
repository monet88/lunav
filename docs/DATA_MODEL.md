# Data Model and RLS Contract

## Status

Foundation defines the migration and authorization contract only and creates
no product table. US-006 plans the first product table, `public.profiles`; that
schema remains planned until its migration and authorization proof pass.

## Supabase Project Boundary

- `supabase/config.toml` is the local Supabase CLI configuration.
- `supabase/migrations/` is the sole home for versioned product schema and RLS
  changes.
- `supabase/functions/` is the sole home for privileged Edge Functions.
- `.supabase/` is local CLI state and must not be committed.
- Foundation does not run `supabase start`; Docker, local services, and a
  linked hosted project are outside this story.

## Identity and Ownership

- Supabase Auth is the only identity provider.
- `auth.users.id` is the canonical identifier for private product data.
- A client-provided user identifier is never authorization evidence.
- Future private product tables store an owner reference named `user_id` that
  references the authenticated user identity when appropriate.

## Planned Profile Table

US-006 owns the planned one-to-one application profile:

- `profiles.id` references `auth.users.id` with cascading deletion.
- A database trigger creates the row after an Auth user is created.
- `display_name` is the only user-editable MVP profile field.
- Email remains canonical in Supabase Auth and is not duplicated.
- Normal clients may select their own row and update only `display_name`.
- Table-level update is revoked; `authenticated` receives column-level update
  permission for `display_name` only.
- A server-side trigger owns `updated_at`; clients cannot set identity or
  timestamps.
- Normal clients may not insert or delete profiles.
- Cross-user select and update attempts must fail under RLS.

These statements are an approved design contract, not implemented behavior.
US-006 must replace this planned description with the exact fields, indexes,
policies, retention, and executed proof after its migration lands.

## Migration Requirements

Each migration that adds a private product table must:

1. Enable Row Level Security on the table.
2. Define explicit policies scoped with `auth.uid()` for every required client
   action.
3. Avoid blanket access for `anon` and `authenticated` roles.
4. Include an ownership-negative integration test in the feature that owns the
   table, proving one user cannot read or mutate another user's data.
5. Update this document with the table's fields, state model, indexes, and
   retention rules once the schema exists.

## Privileged Operations

Service-role credentials, provider secrets, AI orchestration, and any action
that intentionally bypasses RLS run only in a server-only web boundary or an
Edge Function. They must verify the caller identity before performing a
user-scoped operation and must not be imported by client bundles.

## Client Configuration

Web clients may use `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Mobile clients may use
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Service-role and provider credentials are prohibited in app source and
committed environment templates. `pnpm security:client` scans app and shared
package source plus committed `.env.example` files for prohibited
server-only credential identifiers. It complements, but does not replace,
code review and the server-only import boundary.