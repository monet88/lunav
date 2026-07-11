# US-003 Validation: Foundation Monorepo and Supabase Platform

## Proof Strategy

Prove that a fresh dependency installation can execute all root quality gates,
that web and mobile shells typecheck and build, and that the repository records
Supabase as the only authentication and backend platform. This story does not
claim live authentication or database authorization proof because it creates no
user data table or sign-in flow.

## Test Plan

| Layer | Required proof |
| --- | --- |
| Unit | Shared configuration tests pass for permitted public Supabase values and rejected server-only keys. |
| Integration | Root workspace resolves web, mobile, and shared package references without duplicate contract definitions. |
| E2E | Not applicable: Foundation creates no user flow. |
| Platform | Next.js production build and Expo static export pass without Android SDK or emulator dependencies. |
| Security | Secret scan confirms no Supabase service-role key or provider secret is committed; client configuration permits only public values. |
| CI | A pull-request workflow runs lint, typecheck, test, build, and the client-secret scan as executable workflow steps. |

## Acceptance Commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:client
```

The mobile build script runs `expo export --platform android`. Expo static
export only requires Node, pnpm, and project dependencies; an Android SDK,
emulator, device, EAS credentials, and a running Supabase stack are outside this
Foundation gate.

## Completion Evidence

Executed on 2026-07-10:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:client
pnpm --filter @lunav/mobile exec expo install --check
git diff --check
```

All commands passed. The frozen install was also verified under Node 22.22.0,
which matches the CI workflow. The web production build passed and the mobile
static Android export completed successfully.

`pnpm dlx supabase status` also loaded the local CLI configuration successfully
before reporting that `supabase_db_lunav` does not exist. This is expected: the
Foundation story deliberately does not start Docker or the local Supabase stack.

The client-secret regression suite covers app source, shared package source,
committed `.env.example` files, portable finding paths, validator false
positives, and excluded test fixtures. Root and app `.gitignore` files ignore
local `.env*` files while retaining `.env.example` templates.

E2E is not applicable because Foundation has no user flow. The mobile result
is a static bundle proof only; no Android SDK, emulator, device, EAS
credentials, live Supabase stack, authentication flow, product table, or RLS
policy was created or tested.