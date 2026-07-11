# US-006 Design: Profile Persistence and RLS

## Table Contract

`public.profiles` has `id uuid primary key references auth.users(id) on delete
cascade`, a nullable or empty `display_name` constrained to the accepted length,
and server-managed `created_at` and `updated_at` timestamps. Email remains in
Supabase Auth and is not duplicated.

## Creation Lifecycle

An `AFTER INSERT ON auth.users` security-definer function inserts the matching
profile. The function sets a safe `search_path`, accepts no client owner ID, and
is covered by an integration test.

## Authorization

RLS is enabled and forced where supported by the local contract. Authenticated
owners may select their row and update `display_name`. Inserts and deletes are
not granted to normal clients. Table-level update is revoked and only
`UPDATE (display_name)` is granted to `authenticated`. Update policies use both
`USING` and `WITH CHECK` against `auth.uid() = id`; a server-side timestamp
trigger owns `updated_at`.

## Contract

The profile contract exposes `userId`, `displayName`, `createdAt`, and
`updatedAt`. Update input exposes only `displayName`; ownership and timestamps
are never accepted from client input.
