# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

This repo uses the **Harness** documentation layout, not the default Matt Pocock paths. Prefer local truth in this order:

1. **Product contract**
   - `SPEC.md`
   - `docs/PRODUCT_SCOPE.md`
   - `docs/INVARIANTS.md`
2. **Vocabulary**
   - `docs/GLOSSARY.md` — current Harness + operating vocabulary
   - `CONTEXT.md` at the repo root **if it exists** — product domain glossary only (created lazily by `/domain-modeling`; do not invent it empty)
3. **Architecture & decisions**
   - `docs/ARCHITECTURE.md`
   - `docs/decisions/` — this repo's ADR store (not `docs/adr/`)
4. **Context rules**
   - `docs/CONTEXT_RULES.md` — what to read for intake / planning / implementation

### Path mapping (Matt Pocock skills → Lunav)

| Skill expects | Use in this repo |
| ------------- | ---------------- |
| `CONTEXT.md` | Prefer `CONTEXT.md` if present; otherwise use `docs/GLOSSARY.md` + product contract docs above. Do **not** create an empty `CONTEXT.md`. |
| `docs/adr/` | `docs/decisions/` |
| New ADR file | Write under `docs/decisions/` using `docs/templates/decision.md`, then register with `scripts/bin/harness-cli decision add` (see `docs/decisions/README.md`). |

If a listed file does not exist, **proceed silently**. Don't flag its absence; don't suggest creating it upfront. The `/domain-modeling` skill creates `CONTEXT.md` lazily when a **product** term is actually resolved. Decision records still go to `docs/decisions/`, never a parallel `docs/adr/`.

## File structure (this repo)

```
/
├── SPEC.md
├── CONTEXT.md                 ← optional; product glossary only, create lazily
├── docs/
│   ├── GLOSSARY.md            ← Harness / operating vocabulary
│   ├── PRODUCT_SCOPE.md
│   ├── INVARIANTS.md
│   ├── ARCHITECTURE.md
│   ├── CONTEXT_RULES.md
│   └── decisions/             ← ADR store (Harness)
│       ├── 0001-....md
│       └── 0002-....md
├── apps/
└── packages/
```

Do **not** introduce `docs/adr/` alongside `docs/decisions/` — that splits the decision log.

## Use the glossary's vocabulary

When your output names a domain or harness concept (issue title, refactor proposal, hypothesis, test name), use the term as defined in:

1. `CONTEXT.md` (if present) for **product** domain terms
2. otherwise `docs/GLOSSARY.md` and the product contract docs

Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't defined yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real product-domain gap (note it for `/domain-modeling`, which may create `CONTEXT.md`).

## Flag decision conflicts

If your output contradicts an existing decision in `docs/decisions/`, surface it explicitly rather than silently overriding:

> _Contradicts docs/decisions/0002-supabase-unified-backend.md — but worth reopening because…_

When a decision is accepted or superseded, update the markdown under `docs/decisions/` and keep the harness durable row in sync (`harness-cli decision add` / refresh per `docs/decisions/README.md`).
