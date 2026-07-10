# Foundation Monorepo and Supabase Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a strict-TypeScript pnpm and Turborepo monorepo with a Next.js web shell, Expo Router mobile shell, shared non-UI packages, Supabase project conventions, and repeatable quality gates.

**Architecture:** Supabase Auth, Postgres, RLS, Realtime, and Edge Functions are the only backend platform. `auth.users.id` is the canonical private-data identity, but this story does not create product tables or user flows. Apps own their screens and routing; shared packages contain only framework-independent logic, validation, constants, config, and tokens.

**Tech Stack:** pnpm 10, Turborepo, TypeScript strict, Next.js App Router, Expo Router, Supabase CLI, Zod, Vitest, ESLint, Prettier, GitHub Actions.

## Global Constraints

- Use Supabase only; do not install Clerk or Convex packages.
- Do not commit Supabase URL values, publishable keys, service-role keys, or provider credentials.
- Client code may use only public Supabase configuration; service-role credentials stay in Edge Functions or server-only web code.
- Keep mobile as an Expo Router shell. Do not install NativeWind or create business screens.
- Do not create product tables, RLS policies, authentication pages, or profile synchronization in this story.
- Root acceptance commands are `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `package.json` | Root scripts, package manager pin, development tools. |
| `pnpm-workspace.yaml` | Workspace membership for apps and packages. |
| `turbo.json` | Task graph and build output declarations. |
| `tsconfig.base.json` | Strict TypeScript defaults for every workspace package. |
| `apps/web` | Next.js App Router shell and public environment validation. |
| `apps/mobile` | Expo Router root shell and Android bundle export task. |
| `packages/config` | Parsed public Supabase configuration module and unit tests. |
| `packages/contracts` | Reserved Zod contract package with no product DTO yet. |
| `packages/domain` | Reserved framework-independent rules package with no product rule yet. |
| `packages/constants` | Reserved locale-neutral constants package with no product constant yet. |
| `packages/ui-tokens` | Reserved platform-neutral token package with no UI component. |
| `supabase/config.toml` | Supabase CLI local project configuration. |
| `docs/DATA_MODEL.md` | Future table migration and RLS documentation convention. |
| `.github/workflows/ci.yml` | Pull-request quality gate. |

### Task 1: Establish the Root Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

**Interfaces:**
- Produces root commands `lint`, `typecheck`, `test`, and `build` that delegate to package scripts through Turbo.
- Produces strict compiler defaults inherited by every TypeScript package.

- [ ] **Step 1: Write a failing workspace configuration test**

Create `scripts/tests/workspace-config.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

test('declares apps and packages as pnpm workspaces', () => {
  const workspace = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8')

  expect(workspace).toContain("- 'apps/*'")
  expect(workspace).toContain("- 'packages/*'")
})

test('defines the Foundation quality tasks', () => {
  const turbo = JSON.parse(readFileSync(resolve(root, 'turbo.json'), 'utf8'))

  expect(Object.keys(turbo.tasks)).toEqual(
    expect.arrayContaining(['lint', 'typecheck', 'test', 'build'])
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run scripts/tests/workspace-config.test.ts`

Expected: fail because `pnpm-workspace.yaml` and `turbo.json` do not exist.

- [ ] **Step 3: Add the root workspace configuration**

Create the workspace declaration:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Create the Turbo task graph:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": { "dependsOn": ["^test"] },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    }
  }
}
```

Set root scripts to invoke `turbo run lint`, `turbo run typecheck`,
`turbo run test`, and `turbo run build`. Set `packageManager` to the installed
pnpm major and enable TypeScript `strict`, `noUncheckedIndexedAccess`, and
`verbatimModuleSyntax` in `tsconfig.base.json`.

- [ ] **Step 4: Run the workspace test to verify it passes**

Run: `pnpm exec vitest run scripts/tests/workspace-config.test.ts`

Expected: pass.

- [ ] **Step 5: Commit the root workspace**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json eslint.config.mjs .prettierrc.json .prettierignore scripts/tests/workspace-config.test.ts
git commit -m "feat: add pnpm turbo workspace foundation"
```

### Task 2: Add Shared Packages and Public Supabase Configuration

**Files:**
- Create: `packages/config/src/public-supabase.ts`
- Create: `packages/config/src/public-supabase.test.ts`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/contracts/package.json`
- Create: `packages/domain/package.json`
- Create: `packages/constants/package.json`
- Create: `packages/ui-tokens/package.json`
- Create: `apps/web/.env.example`
- Create: `apps/mobile/.env.example`

**Interfaces:**
- Produces `parsePublicSupabaseConfig(input: unknown): PublicSupabaseConfig`.
- Consumers supply only a URL and publishable key; server-only keys are rejected.

- [ ] **Step 1: Write failing configuration tests**

```ts
import { describe, expect, test } from 'vitest'
import { parsePublicSupabaseConfig } from './public-supabase'

describe('parsePublicSupabaseConfig', () => {
  test('accepts a local Supabase URL and publishable key', () => {
    expect(
      parsePublicSupabaseConfig({
        url: 'http://127.0.0.1:54321',
        publishableKey: 'sb_publishable_example',
      })
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      publishableKey: 'sb_publishable_example',
    })
  })

  test('rejects service-role configuration in a client payload', () => {
    expect(() =>
      parsePublicSupabaseConfig({
        url: 'https://project.supabase.co',
        serviceRoleKey: 'service-role-secret',
      })
    ).toThrow('serviceRoleKey is server-only')
  })
})
```

- [ ] **Step 2: Run the configuration test to verify it fails**

Run: `pnpm --filter @lunav/config test -- public-supabase.test.ts`

Expected: fail because the package and parser do not exist.

- [ ] **Step 3: Implement the configuration module and package boundaries**

```ts
import { z } from 'zod'

const publicSupabaseConfigSchema = z
  .object({
    url: z.string().url(),
    publishableKey: z.string().min(1),
    serviceRoleKey: z.never().optional(),
  })
  .strict()

export type PublicSupabaseConfig = z.infer<typeof publicSupabaseConfigSchema>

export function parsePublicSupabaseConfig(input: unknown): PublicSupabaseConfig {
  if (
    typeof input === 'object' &&
    input !== null &&
    'serviceRoleKey' in input
  ) {
    throw new Error('serviceRoleKey is server-only')
  }

  return publicSupabaseConfigSchema.parse(input)
}
```

Make each reserved package private and publish its source entry only. Keep
`contracts`, `domain`, `constants`, and `ui-tokens` free of product DTOs and UI
components. Add only placeholder-free package READMEs explaining their permitted
dependency direction.

Create `.env.example` files with variable names only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

- [ ] **Step 4: Run typecheck and unit tests**

Run: `pnpm --filter @lunav/config typecheck && pnpm --filter @lunav/config test`

Expected: pass.

- [ ] **Step 5: Commit the shared configuration seam**

```bash
git add packages apps/web/.env.example apps/mobile/.env.example
git commit -m "feat: add shared public supabase configuration"
```

### Task 3: Scaffold the Next.js Web Shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/tsconfig.json`

**Interfaces:**
- Consumes `@lunav/config` without any service-role key.
- Produces `lint`, `typecheck`, `test`, and `build` scripts used by root Turbo.

- [ ] **Step 1: Scaffold a Next.js App Router project with pnpm**

Run:

```bash
pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*" --yes
```

Expected: `apps/web` contains an App Router project with TypeScript, ESLint,
Tailwind, and a pnpm-compatible package manifest.

- [ ] **Step 2: Write a failing web shell test**

Create `apps/web/src/app/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import HomePage from './page'

test('renders the Foundation web shell', () => {
  render(<HomePage />)

  expect(screen.getByRole('main')).toHaveTextContent('ZIWEI AI')
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @lunav/web test -- page.test.tsx`

Expected: fail until the web test environment and shell markup are configured.

- [ ] **Step 4: Implement the smallest web shell and test setup**

Render a semantic `main` element containing only the product name, use the
existing generated Tailwind baseline, and configure Vitest with jsdom and
Testing Library. Do not add authentication components, provider clients, or
dashboard UI.

- [ ] **Step 5: Run web checks**

Run: `pnpm --filter @lunav/web lint && pnpm --filter @lunav/web typecheck && pnpm --filter @lunav/web test && pnpm --filter @lunav/web build`

Expected: pass.

- [ ] **Step 6: Commit the web shell**

```bash
git add apps/web
git commit -m "feat: add next web shell"
```

### Task 4: Scaffold the Expo Router Mobile Shell

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`

**Interfaces:**
- Produces `lint`, `typecheck`, `test`, and `build` scripts used by root Turbo.
- Does not consume shared UI packages or NativeWind.

- [ ] **Step 1: Scaffold the Expo Router project without nested agent instructions**

Run:

```bash
pnpm create expo-app apps/mobile --template default@sdk-57 --yes --no-agents-md
```

Expected: `apps/mobile` has Expo Router and TypeScript configured by the default
template, with no nested agent configuration.

- [ ] **Step 2: Write a failing mobile shell test**

Create `apps/mobile/app/index.test.tsx`:

```tsx
import { render } from '@testing-library/react-native'
import { expect, test } from 'vitest'
import IndexRoute from './index'

test('renders the Foundation mobile shell', () => {
  const { getByText } = render(<IndexRoute />)

  expect(getByText('ZIWEI AI')).toBeTruthy()
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @lunav/mobile test -- index.test.tsx`

Expected: fail until the mobile test environment and root route are configured.

- [ ] **Step 4: Implement the minimal root route and test setup**

Create a single Expo Router index route that renders `ZIWEI AI`, configure a
minimal stack layout, and add a React Native Vitest test environment. Do not
add navigation tabs, authentication screens, NativeWind, or any business UI.

- [ ] **Step 5: Run mobile checks**

Run: `pnpm --filter @lunav/mobile lint && pnpm --filter @lunav/mobile typecheck && pnpm --filter @lunav/mobile test && pnpm --filter @lunav/mobile build`

Expected: pass. The mobile `build` script runs `expo export --platform android`
and writes its bundle beneath an ignored `dist` directory. This static export
requires Node, pnpm, and installed dependencies only; Android SDK, emulator,
device, and EAS credentials are not required.

- [ ] **Step 6: Commit the mobile shell**

```bash
git add apps/mobile
git commit -m "feat: add expo router mobile shell"
```

### Task 5: Initialize the Supabase Project Contract

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/.gitkeep`
- Create: `supabase/functions/.gitkeep`
- Create: `docs/DATA_MODEL.md`
- Create: `scripts/check-client-secrets.mjs`
- Create: `scripts/check-client-secrets.test.ts`

**Interfaces:**
- Produces a repository-scoped Supabase CLI configuration without credentials.
- Produces `pnpm security:client` to reject forbidden server-only key names in
  application source and committed example environment files.

- [ ] **Step 1: Initialize Supabase configuration**

Run:

```bash
pnpm dlx supabase init
```

Expected: `supabase/config.toml` exists. Do not run `supabase start`, because
Docker-backed local services are not part of Foundation acceptance proof.

- [ ] **Step 2: Write the failing secret-scan test**

```ts
import { expect, test } from 'vitest'
import { findForbiddenClientSecrets } from './check-client-secrets'

test('reports a service-role key in client source', () => {
  expect(
    findForbiddenClientSecrets('const serviceRoleKey = "secret"')
  ).toEqual(['serviceRoleKey'])
})

test('permits public Supabase configuration names', () => {
  expect(
    findForbiddenClientSecrets('const url = process.env.NEXT_PUBLIC_SUPABASE_URL')
  ).toEqual([])
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run scripts/check-client-secrets.test.ts`

Expected: fail because the scanner is absent.

- [ ] **Step 4: Implement the client secret scanner and data-model convention**

Export `findForbiddenClientSecrets(source: string): string[]` and have the CLI
scan `apps/**` plus committed `.env.example` files for `SERVICE_ROLE`,
`serviceRoleKey`, and known provider secret prefixes. Fail with file paths when
matches exist. Document that a future private table migration must include a
`user_id` reference to `auth.users(id)`, `ENABLE ROW LEVEL SECURITY`, and an
ownership policy using `auth.uid()`.

- [ ] **Step 5: Run the scanner and Supabase configuration checks**

Run the required checks:

```bash
pnpm exec vitest run scripts/check-client-secrets.test.ts
pnpm security:client
```

Then run the informational Supabase status probe separately:

```bash
pnpm dlx supabase --workdir . status
```

Expected: unit test and security scan pass. Run the Supabase status command as
an informational configuration check only: it is expected to report no running
local stack until a later data-feature story explicitly requires Docker-backed
services.

- [ ] **Step 6: Commit the Supabase contract**

```bash
git add supabase docs/DATA_MODEL.md scripts/check-client-secrets.mjs scripts/check-client-secrets.test.ts
git commit -m "feat: add supabase project contract"
```

### Task 6: Add CI and Prove the Foundation Gate

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `turbo.json`

**Interfaces:**
- CI installs frozen dependencies and runs all four root quality gates without
  exposing secrets.

- [ ] **Step 1: Write a failing CI workflow test**

Create `scripts/tests/ci-workflow.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('runs every Foundation quality gate in CI', () => {
  const workflow = readFileSync(
    resolve(import.meta.dirname, '../../.github/workflows/ci.yml'),
    'utf8'
  )

  expect(workflow).toContain('pnpm lint')
  expect(workflow).toContain('pnpm typecheck')
  expect(workflow).toContain('pnpm test')
  expect(workflow).toContain('pnpm build')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run scripts/tests/ci-workflow.test.ts`

Expected: fail because the workflow file is absent.

- [ ] **Step 3: Create a secret-free pull-request workflow**

Use `actions/checkout`, `actions/setup-node`, and `pnpm/action-setup`; enable
the pnpm cache and run `pnpm install --frozen-lockfile`, followed by the four
root gates. Do not add Supabase credentials, deployment steps, or release
credentials.

- [ ] **Step 4: Run the full Foundation proof**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:client
```

Expected: every command exits with code `0`.

- [ ] **Step 5: Update US-003 evidence and run Harness verification**

Run:

```powershell
.\scripts\bin\harness-cli.exe story update --id US-003 --status implemented --unit 1 --integration 1 --e2e 0 --platform 1 --evidence "Record the exact successful command outputs and date."
.\scripts\bin\harness-cli.exe story verify US-003
```

Expected: the local matrix marks US-003 implemented with unit, integration, and
platform proof; E2E remains not applicable.

- [ ] **Step 6: Commit the verified Foundation gate**

```bash
git add .github package.json turbo.json docs/stories/US-003-foundation-supabase
git commit -m "ci: verify foundation quality gates"
```

## Plan Self-Review

- Scope coverage: Tasks 1 through 6 cover pnpm/Turbo, strict TypeScript, shared
  packages, Next.js, Expo Router, Supabase conventions, tests, linting,
  formatting, CI, and the four required gates.
- Deferred scope: authentication flows, product tables, RLS policies, Edge
  Function business logic, NativeWind, shared UI, and all later product phases
  remain excluded.
- Interface consistency: `@lunav/config` is the only shared module with
  implementation in Foundation; it exports `parsePublicSupabaseConfig` for
  future app setup without creating a Supabase client or identity flow.
- Security: all public configuration examples are empty; service-role and
  provider secrets are rejected by a tested scanner and absent from CI.