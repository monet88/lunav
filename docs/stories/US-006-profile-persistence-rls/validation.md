# US-006 Validation: Profile Persistence and RLS

## Required Proof

This executable gate authorizes implementation completion only when the
canonical verification script passes with fresh evidence.

| Layer | Required proof |
| --- | --- |
| Contract | Profile rows and update input parse; owner/timestamp mutation input is rejected. |
| Migration | A fresh Supabase-local database applies the migration and creates the trigger. |
| Integration | Signup creates one profile; owner select/update succeeds; duplicate creation is impossible. |
| Authorization | Anonymous and cross-user select/update/insert/delete attempts fail; an owner cannot update `id`, `created_at`, or `updated_at`. |
| Security | Live catalog proof confirms forced RLS, owner policies using `auth.uid()`, `SECURITY DEFINER` trigger functions with an empty search path, and authenticated grants limited to `SELECT` plus `UPDATE (display_name)`. |

## Canonical Commands

Run exactly one wrapper. Either form is complete proof; both are not required.

```bash
bash scripts/verify-profile-rls.sh
```

```powershell
.\scripts\verify-profile-rls.ps1
```

The wrappers reset the local database with Supabase CLI `2.109.1`, run
`pnpm test:profile-integration`, prove local type generation, and run the
repository lint, typecheck, test, and client-secret gates. Docker/local-stack
absence is a blocker for proof, not a reason to claim the policy works.

## Fresh Evidence

On 2026-07-11, the PowerShell wrapper passed on Windows with the Lunav local
Supabase stack after the final review and reset-lifecycle fixes:

- profile and auth contracts: 44 tests passed
- local migration reset: `20260711104500_create_profiles.sql` applied cleanly
- profile integration: signup lifecycle, owner behavior, denial matrix,
	immutable fields, duplicate prevention, live catalog security, and cascade
	cleanup passed
- repository lint: 8 of 8 tasks passed
- repository typecheck: 8 of 8 tasks passed
- repository tests: web 20, mobile 19, contracts 44, config 2, and root 16
	tests passed
- local Supabase type generation and client-secret scan passed
- project-scoped Realtime quiescing prevented concurrent Ecto migration writes,
  and project-scoped Kong refresh prevented stale Auth upstream HTTP 502 errors

## Dependency Release Gate

US-007 and US-008 remain blocked until migration, trigger, owner behavior, and
cross-user negative tests have fresh passing evidence.
