# Local Supabase Runbook

## Purpose

This repository runs its local Supabase stack with a Lunav-specific host port
range. The range avoids collisions with other local Supabase projects and is
part of the checked-in configuration in `supabase/config.toml`.

## Host Ports

| Service | Host port |
| --- | ---: |
| Shadow database | 55320 |
| API / project URL | 55321 |
| Postgres | 55322 |
| Studio | 55323 |
| Mailpit | 55324 |
| Optional SMTP | 55325 |
| Optional POP3 | 55326 |
| Analytics | 55327 |
| Connection pooler | 55329 |

The connection pooler is currently disabled. Optional SMTP and POP3 ports are
not exposed unless enabled in `supabase/config.toml`.

## Start And Check

From the repository root, run:

```powershell
supabase start
supabase status
```

Expected local entry points:

```text
API:     http://127.0.0.1:55321
Studio:  http://127.0.0.1:55323
Mailpit: http://127.0.0.1:55324
Postgres: postgresql://postgres:postgres@127.0.0.1:55322/postgres
```

Do not stop, rename, or reuse containers belonging to another local Supabase
project to free ports. Keep this stack isolated by updating the Lunav port map
only when the configured ports are unavailable.

On Windows, Supabase may warn that Analytics needs Docker exposed on
`tcp://localhost:2375`. The Lunav stack can still become healthy; use
`supabase status` to verify its actual state.

## Auth Session Integration Proof

US-005 Auth integration requires the local stack to be running. Run:

```powershell
pnpm test:auth-integration
```

The gate proves local email confirmation behavior, confirmed-user login and
identity lookup, session refresh, logout, and post-logout invalidation. It
fails closed when local Supabase is unavailable.

Run the complete US-005 executable validation contract with:

```powershell
.\scripts\verify-auth-session.ps1
.\scripts\bin\harness-cli.exe story verify US-005
```

`supabase status -o env` prints local development credentials. Treat its output
as terminal-only diagnostic material: do not commit it, paste it into docs, or
copy it into client environment files.

## Configuration Notes

- Local email capture is configured under `[inbucket]`; `[local_smtp]` is not a
  valid section for the installed Supabase CLI.
- Local email confirmation remains enabled in `supabase/config.toml`.
- The port map in `supabase/config.toml` is the source of truth. Update this
  runbook whenever it changes.
