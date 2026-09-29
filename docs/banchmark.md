# shast AI benchmark plan

Each test follows the same structure: **the claim** (from the README) →
**what we're checking** → **setup** → **what we're hoping to see** →
**the metric**. The measurement always lives in a script (the harness),
never in the model's self-assessment and never in a human judgment call.

---

## Shared setup (applies to every test)

**Two arms, identical constraints, different enforcement.**
Both arms use the same model, the same prompts, and the *same stated
rules* — the only variable is how the rule is enforced:

- **Arm A (baseline):** JSX/TSX + plain CSS or vanilla-extract. The design
  constraints are given as prose in a `CLAUDE.md` / system prompt ("use
  only these tags, these color tokens; never hardcode values").
- **Arm B (shast):** the same constraints expressed as the registry.

> A rule in the system prompt is a request; a rule in the registry is a
> fact. The benchmark measures the difference.

**Two conditions per test.**

1. **Single-shot:** plain API call, prompt → output → harness checks. No
   agent, no LSP, no repair. Isolates raw hallucination/drift rates.
2. **Agentic:** Claude Code / OpenCode with LSP active, same task as a
   session. Measures the end-to-end product experience, where diagnostics
   are surfaced mid-session and the agent may self-repair.

**Registry integrity.**
The registry files are read-only to the agent (file permissions or a
deny-rule/hook on those paths). The harness fails any session whose diff
touches them — and **logs every attempt** as a data point ("tunnel
attempts"). Session outcomes are scored three ways: repaired within the
registry / attempted registry modification (blocked) / gave up or asked.

**Hygiene.**

- ~20 samples per task per arm per condition; report distributions, not
  anecdotes.
- At least two different models, so results don't read as tuned to one.
- Report **false positives** (valid intents shast rejected) with the same
  prominence as catches. A high false-positive rate means the wall fences
  users, not errors.
- All transcripts saved; every number must be recomputable from them.

---

## Test 1 — Drift (vocabulary, tokens, attributes)

**Claim:** a model cannot emit a tag, attribute, design token, or custom
property outside the registry.

**What we're checking:** not disobedience — *drift*. The everyday failure
mode where the model is trying to comply and approximates: a hardcoded
`#3B82F6` instead of a brand token, `padding: 13px`, a plausible-but-invalid
attribute (`autocomplete="phone"`, `aria-labeledby`), a tag the design
system doesn't use.

**Setup:** ordinary, non-adversarial prompts — "make this card stand out,"
"add a hero section," "make the form accessible." No prompt mentions the
registry or asks for anything forbidden. A small `common`-style registry
with a deliberately narrow token vocabulary (`'var(--brand-500)' | ...`).
Include a minority of *escalation* prompts where the "user" pushes back
("just hardcode the blue, it's fine") to measure rule erosion under
pressure, and multi-turn sessions to measure erosion over context length.

**What we're hoping to see:**

- Single-shot: Arm A ships off-registry values silently (browsers ignore
  invalid attributes; hardcoded colors render fine). Arm B: every one is a
  compile error.
- Agentic: Arm A's compliance with the prose rule starts high and erodes
  across turns and under user pressure. Arm B stays flat at 100%, with
  tunnel attempts logged instead of silent violations.

**Metric:** off-registry values per output (single-shot); final-artifact
violation rate and compliance-over-turns curve (agentic); tunnel-attempt
count. Headline shape: *"same prompt, same agent — baseline shipped 7
hardcoded colors; shast shipped zero."*

---

## Test 2 — Refactor drift (structural coupling)

**Claim:** changing the structure turns every stale style rule into an
error at that exact spot; CSS cannot silently decouple from HTML.

**What we're checking:** the forgotten half of a refactor. Rename, move, or
delete a child and the CSS that targeted it goes quietly dead in ordinary
stacks — the class still exists, the selector just stops matching.

**Setup:** give the agent an existing component (both arms get equivalent
ones) and ask it to "rename `title` to `heading` and update everything
needed," "move the badge out of the header," "delete the subtitle." No
warnings, no hints. Both arms share the same implicit goal — CSS that
matches the structure afterward — so no rule-equalizing is needed here.

**Class-drift scenarios (same test, second axis).** Structure isn't only
the child tree — it's also the class states an element can be in. shast
types `&.class` selectors against the classes the `class` attribute can
actually produce, including template-literal expressions
(`` class: `${active} card` ``). So include tasks that stress that
coupling:

- "Remove the active state from the card" — does the agent delete the
  class from the attribute but leave `&.active` behind? (Baseline: dead
  rule, silent. shast: compile error.)
- "Rename the `active` class to `selected` everywhere."
- Seeded typos in generated selectors (`&.actve`) — valid CSS in Arm A,
  rejected in Arm B.

**What we're hoping to see:**

- Single-shot: some fraction of Arm A outputs contain dead selectors —
  child-based or class-based — that no tool flags. The identical omission
  in Arm B is a `tsc` error.
- Agentic: in Arm B the LSP surfaces the diagnostic mid-session and the
  agent repairs before finishing; in Arm A there is no signal to act on.

**Metric:** silent dead-selector rate in final artifacts, reported
separately for child selectors (`> name`) and class selectors (`&.class`)
(target for Arm B: zero on both); diagnostics-fired count from transcripts
(proving the mistakes were introduced, then caught — not never made).

---

## Test 3 — Self-repair loop (diagnostics as an interface)

**Claim:** diagnostic quality is an interface — error strings carry the
path and the expectation, well enough that an agent closes the loop without
a human.

**What we're checking:** when the wall fires, can the model fix the
component from the error message alone?

**Setup:** two variants.

1. **Scripted:** harvest every rejection from Tests 1–2 (single-shot
   condition). The harness feeds the compiler/runtime message back
   verbatim — no human rephrasing — and lets the model retry, counting
   turns to green.
2. **In situ:** parse the agentic transcripts from Tests 1–2 and measure
   repairs-per-diagnostic as they happened naturally through the LSP.

**What we're hoping to see:** median one attempt to green; no error class
that the model systematically cannot repair. Any message that repeatedly
fails to guide a repair is, per the README's own standard, a bug — file it.

**Metric:** median turns-to-green per error class; unrepairable rate;
list of error strings that needed >2 turns (these are the diagnostics
backlog).

---

## Test 4 — Runtime wall in isolation (optional, honest)

**Claim:** a runtime backstop catches what slips past the types (`as any`,
generated code, no `tsc` in the loop).

**What we're checking:** the pipeline that never type-checks — an agent
emitting shast JSON straight into `renderComponent` on the server.

**Setup:** take Arm B's raw single-shot outputs, skip `tsc` entirely, run
them through `createComponent` (the runtime wall lives there, not in
`renderComponent`), and score what the runtime wall catches.

**What we're hoping to see:** structure, attributes, selectors, CSS property
values, custom properties, `calc()`/`var()`, query keys, keyframe references,
and `grid-area` names all caught. The one remaining gap is pseudo-class/
element *usage*, which only the type wall checks.
**Publish that number un-fudged.** The README already declares the gap; the
benchmark quantifying it is credibility, and it becomes the before/after
baseline for when the gap closes.

**Metric:** runtime catch rate by violation class, with the known-gap class
reported separately.

---

## Reporting

One table per test: arm × condition × metric, with sample sizes. Three
headline numbers for the README:

1. Final-artifact defect rate, baseline vs shast, same agent (Tests 1–2).
2. Compliance-erosion curve for prose rules vs the flat line for the
   registry (Test 1, agentic).
3. Median self-repair turns (Test 3).

And the two honest numbers alongside them: false-positive rate, and the
runtime value-validation gap (Test 4).
