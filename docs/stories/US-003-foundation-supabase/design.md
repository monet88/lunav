# US-003 Design: Foundation Monorepo and Supabase Platform

## System Shape

```text
apps/web                 Next.js App Router shell
apps/mobile              Expo Router shell
packages/contracts       Zod boundary schemas when a feature owns them
packages/domain          Framework-independent business rules
packages/constants       Locale-neutral identifiers and constants
packages/config          Shared environment parsing and configuration rules
packages/ui-tokens       Platform-neutral token values, not UI components
supabase/migrations      Future SQL migrations and RLS policies
supabase/functions       Future privileged Edge Functions
```

The root workspace owns package scripts and Turborepo task ordering. Apps may
depend on shared packages, but shared packages may not import app code. Neither
app imports server-only engine or provider dependencies.

## Authentication and Data Seam

Supabase Auth is the only identity module. Its interface for future private
features is a verified session whose subject maps to `auth.users.id`. Product
tables will use that value as `user_id`; their migrations must enable RLS and
define ownership policies using `auth.uid()`.

Client apps use only public Supabase configuration. Any service-role key,
provider key, or privileged database operation belongs in Edge Functions or
server-only web code. Foundation creates configuration examples and validation,
not live credentials or an authentication screen.

## Web and Mobile Scope

The web shell establishes Next.js App Router and the root page only. The mobile
shell establishes Expo Router and a root route that can build. Each platform
owns its routing and future UI. NativeWind is deliberately deferred until a
mobile feature needs styling primitives.

## Quality Design

Root commands delegate through Turborepo:

```text
pnpm lint       validates configured source files
pnpm typecheck  runs strict TypeScript checks
pnpm test       runs deterministic unit tests
pnpm build      builds web and exports the mobile shell bundle
```

CI invokes these four commands plus `pnpm security:client`, without secrets.
Supabase local services are not required for Foundation gates because this
story creates no schema or runtime data feature.

## Failure Handling

Missing public Supabase configuration must fail startup validation with a
developer-oriented message. Missing server-only credentials must not be treated
as client configuration. Runtime provider failures are deferred to the story
that introduces the provider.

## Alternatives Rejected

1. Scaffold Clerk and Convex then migrate later: rejected by ADR 0002.
2. Build web first and postpone Expo: rejected because the mobile shell is a
   cheap early proof of the cross-platform structure.
3. Add NativeWind now: rejected because no mobile UI uses it yet.