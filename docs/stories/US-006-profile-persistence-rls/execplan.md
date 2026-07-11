# US-006 Exec Plan: Profile Persistence and RLS

## Goal

Create the owner-scoped profile persistence module and prove its lifecycle and
authorization against Supabase local.

## Work Phases

1. Add failing profile contract tests.
2. Add failing database tests for trigger creation, owner access, immutable
   ownership, and cross-user denial.
3. Add the migration with table, trigger function, timestamp handling,
   column-level update permission, and RLS policies.
4. Implement the profile contract and generated-type integration owned by this
   story.
5. Reset the local database and run all positive and negative authorization
   cases.
6. Update `docs/DATA_MODEL.md` with the implemented schema and proof.

## Stop Conditions

Pause before changing deletion semantics, retaining profiles after Auth user
deletion, adding fields beyond `display_name`, or weakening any cross-user
negative test.
