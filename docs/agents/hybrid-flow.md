# Hybrid flow: Harness intake + Matt skills

Short operating path for this repo. **Harness owns the work unit; Matt skills sharpen, split, build, and review around it.**

Any AI agent may run a step. Prefer assigning by **role** (plan / build / verify), not by vendor name.

## Source of truth

| Concern | Where |
| --- | --- |
| Plan / ownership / proof | `docs/stories/*` (story packet) |
| Intake lane | `docs/FEATURE_INTAKE.md` + `harness-cli intake` |
| Decisions | `docs/decisions/` (not `docs/adr/`) |
| Vocabulary | `docs/GLOSSARY.md`; product terms in `CONTEXT.md` only if it exists |
| Multi-session slices | GitHub Issues via `/to-tickets` (optional) |

If a GitHub ticket disagrees with the story packet, **fix the ticket or the packet — do not code from vibes.**

## Default pipeline

```text
0. Fog too big for one plan session?
      YES → /wayfinder (decisions only) → then step 1
      NO  → step 1

1. harness-intake-griller          ← always the plan gate
      preflight → grill (1 Q at a time) → shared-understanding confirm
      → intake → story packet + validation → STOP (no Symphony/code)

2. Optional plan add-ons (only if needed)
      term fuzzy     → /domain-modeling
      design unanswerable on paper → /handoff → /prototype → /handoff back
      need lib facts → /research or /read-the-damn-docs

3. Session span
      one session / small slice → go to step 4
      multi-session or multi-agent build → /to-spec (optional) → /to-tickets
           each ticket = one execplan phase; body points at docs/stories/US-XXX/

4. Build
      /implement (drives /tdd), or an equivalent build agent with the same packet+phase brief
      respect overview ownership, non-goals, execplan stop conditions

5. Close
      run validation.md / story verify
      /code-review
      update packet evidence → status implemented → harness trace
      durable tradeoff? → docs/decisions/ + harness-cli decision add
```

## Size cheat sheet

| Situation | Path |
| --- | --- |
| Tiny + clear | `harness-intake-griller` → patch (only if user asked) + cheap check + trace |
| Normal, one session | intake-griller → packet → `/implement` |
| Long / many sessions | intake-griller → packet → `/to-spec`? → `/to-tickets` → implement per ticket |
| Large but clear (e.g. US-008 packet exists) | **no** wayfinder → implement (prereq proofs first) |
| Large and foggy | `/wayfinder` → intake-griller per story → tickets if long → implement |
| Outside raw bug/request | `/triage` → then intake-griller if product work |
| Hard bug | `/diagnosing-bugs` (repro red first) |

## Multi-agent handoff (role-based)

Split by role when useful; pick any agent per role per situation.

```text
Plan role:    steps 0–3 (packet + optional tickets). Do not implement unless asked.
Build role:   one phase/ticket only; TDD; no scope expand; report files/commands/risks.
Verify role:  run proof, /code-review, loop build or close story.
```

Build brief must include: story path, read order (`overview → design → validation → execplan`), phase number, ownership, stop conditions. Hand over the **packet** (and ticket if any), not a raw grill transcript.

## Do not

- `/implement` or Symphony before intake artifacts are ready (unless tiny + user asked after clear intent)
- `/to-tickets` before a real packet/execplan exists
- `/grill-with-docs` as default (use intake-griller; domain-modeling only for fuzzy product terms)
- `/wayfinder` just because work is “big” — only when the path is foggy
- Triage tickets you just created with `/to-tickets`
- Create `docs/adr/` beside `docs/decisions/`

## Ready for build checklist

- [ ] Shared understanding confirmed
- [ ] Intake recorded + lane set
- [ ] Story packet exists (high-risk: design + validation + execplan)
- [ ] Ownership, non-goals, stop conditions written
- [ ] Proof commands concrete
- [ ] Prereq stories re-verified if overview requires them
