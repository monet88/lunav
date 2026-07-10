# Lunav Web

The web application is a Next.js App Router workspace within the Lunav pnpm
monorepo. Run commands from the repository root so package resolution, Turbo
tasks, and shared workspace packages remain consistent.

## Development

```bash
pnpm --filter @lunav/web dev
```

Open `http://127.0.0.1:3000` in a browser.

## Validation

```bash
pnpm --filter @lunav/web lint
pnpm --filter @lunav/web test
pnpm --filter @lunav/web typecheck
pnpm --filter @lunav/web build
```

For the complete foundation gates, run the root commands:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```
