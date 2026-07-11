# US-006 Validation: Profile Persistence and RLS

## Required Proof

This planning verifier authorizes scheduling, not implementation completion.

| Layer | Planned proof |
| --- | --- |
| Contract | Profile rows and update input parse; owner/timestamp mutation input is rejected. |
| Migration | A fresh Supabase-local database applies the migration and creates the trigger. |
| Integration | Signup creates one profile; owner select/update succeeds; duplicate creation is impossible. |
| Authorization | Anonymous and cross-user select/update/insert/delete attempts fail; an owner cannot update `id`, `created_at`, or `updated_at`. |
| Security | Trigger search path is fixed and policies depend on `auth.uid()`, not request data. |

## Planned Commands

```powershell
pnpm --filter @lunav/contracts test
pnpm dlx supabase db reset
pnpm test
pnpm security:client
```

The implementation must add and document the exact database integration test
command. Docker/local-stack absence is a blocker for proof, not a reason to
claim the policy works.

## Dependency Release Gate

US-007 and US-008 remain blocked until migration, trigger, owner behavior, and
cross-user negative tests have fresh passing evidence.
