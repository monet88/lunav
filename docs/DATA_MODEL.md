# Data Model and RLS Contract

## Status

US-006 implements the first product table, `public.profiles`, with fresh
Supabase-local migration, lifecycle, authorization, and catalog proof.

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

## Profile Table

Migration `20260711104500_create_profiles.sql` creates the one-to-one private
profile table:

| Column | Type | Contract |
| --- | --- | --- |
| `id` | `uuid` | Primary key and foreign key to `auth.users.id`; cascades on Auth-user deletion. |
| `display_name` | `text` | Nullable; when present it is trimmed and 1 to 100 characters. |
| `created_at` | `timestamptz` | Required and server-created with `now()`. |
| `updated_at` | `timestamptz` | Required and replaced by a server trigger on every update. |

The primary key is the only index required for the one-row owner lookup. Email
remains canonical in Supabase Auth and is not duplicated. Profiles have the
same retention lifecycle as their Auth user because deletion cascades.

An `AFTER INSERT` trigger on `auth.users` creates exactly one profile. Both
profile trigger functions are `SECURITY DEFINER`, owned by the local Postgres
administrative role, and use `search_path = ''`.

RLS is enabled and forced. Authenticated users receive `SELECT` on the table
and `UPDATE (display_name)` only. The select and update policies compare
`auth.uid()` with `profiles.id`; update uses both `USING` and `WITH CHECK`.
Anonymous users receive no profile privileges, and normal clients receive no
insert or delete policy.

The executable proof is `bash scripts/verify-profile-rls.sh` or
`.\scripts\verify-profile-rls.ps1`. It resets the local database, exercises
self-service signup and admin-created users, verifies owner and cross-user
behavior through PostgREST, checks catalog policies/grants/function security,
proves Auth-user cascade cleanup, and generates local Supabase types.

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