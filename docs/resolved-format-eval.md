# Is the resolved format better than a screenshot?

**The claim** → **what we're checking** → **setup** → **what we hoped to see** →
**the metric** → **what happened**, then everything the result does not support.

The subject is the resolved-node document produced by
`resolved-format/resolved.ts`: one flat record per rendered node, in which the
style is fully resolved, the geometry is measured, and every contested property
carries the block it came from. Geometry comes from a real Chromium page
(`resolved-format/measured.ts`), so every box is the browser's — including
`flex` and `grid`, which a previous block-only layout engine could not model.
Format reference: `resolved-format/RESOLVED.md`. Harness: `evals/` (see
`evals/README.md` to run it against your own models).

---

## The short answer

**An aggregate win on cost and accuracy; almost nothing below the aggregate is
measurable.** The document is the cheapest context measured *and* the most
accurate, and both of those reproduce. Everything finer than that is inside a noise
floor of 6%.

| | |
|---|---|
| Accuracy | **98%**, against 90% for screenshot + devtools data, 87% devtools alone, 72% screenshot alone |
| Cost | **552 prompt tokens** mean, against 2,323 / 1,878 / 611 |
| Cases where it won | 6 of 47 |
| Cases where something else won | 3 of 47 |
| Cases where every context tied | **37 of 47** |

**Ignore the two middle rows as a scoreboard.** A second full matrix, with
byte-identical prompts on three of the four arms, flipped **51 of 846 attempts —
6.0%** — and turned 6 wins / 3 losses into 5 wins / 2 losses on the same evidence.
Aggregate accuracy and the arm ordering survived that intact (every arm within 1.4
points); the tally, and every case decided by one or two attempts, did not. See
[the tally is noise](#the-tally-is-noise) and
[the trust cue](#the-trust-cue).

The row that carries the real limitation is the third: for **37 of 47 questions a
screenshot would have done.**

Two findings have margins wide enough to survive the noise floor, because the
alternatives were not carrying the fact at all:

- **provenance** — "which block declared this?" — 6/6 against 0/6 everywhere else,
  on every model
- **repair** — "which block do I edit" — 6/6 against 0/6

**Both rest on a baseline weaker than a real agent's, and together they supply
40–50% of the aggregate margin.** Only `resolved` is shown the source cascade;
`dom` gets `getComputedStyle`, which flattens it. The rules were in a stylesheet in
the page the whole time, and Chrome hands them out via
`CSS.getMatchedStylesForNode`. Excluding `authoring`, the gap over `dom` falls
11.0 → 6.2 points and over `shot+dom` 7.8 → 4.3. See
[provenance and repair](#provenance-and-repair-widest-margins-weakest-baseline).

A third, **absence** (a transparent overlay, a 0×0 box still carrying text), is
directional: consistent across cases and structurally explicable, but every
individual margin is two or three attempts.

And there is one negative result, which the noise floor makes *stronger* rather
than weaker: **pre-computing the arithmetic bought nothing detectable.** On
`measurement` the document scores 96% against `dom`'s 97% and `shot+dom`'s 99% —
three scores within noise of each other, on the category the format exists to make
easy. Handing a model the answer did not beat handing it the inputs.

> **An earlier version of this document reported 98% over 33 cases** on a suite
> that was 59% occlusion — the one faculty this format precomputes. Eleven cases
> were added to cover sizing, placement and counterfactuals, and accuracy fell.
> Composition decided that result far more than the format did, which is the one
> thing worth carrying forward from it.

---

## Why the first version of this eval proved nothing

The original harness had **one arm**. It showed the document to eight models,
asked 28 questions, and scored 224/224.

That is worthless as evidence of usefulness, for a reason worth stating plainly:
with a single arm there is no way to distinguish *"the document communicated the
answer"* from *"the answer was obtainable anyway"*. Most of these questions are
about what a page looks like, and the ordinary way to answer those is to open a
screenshot. A format that scores 100% on questions a screenshot also answers has
demonstrated that it is **legible**, not that it is **worth its tokens**.

Worse, in most cases the answer was stated almost verbatim by a `!` line, so the
test was largely checking whether models can read a line of text.

Legibility is necessary. It is nowhere near sufficient. The rest of this document
is the sufficiency test.

---

## Setup

### Four arms, one skeleton

Every case is asked as the same question in four contexts:

| arm | what the model is given |
|---|---|
| `resolved` | the resolved-node document |
| `dom` | node skeleton + `getBoundingClientRect()` + `getComputedStyle()`, raw from Chromium |
| `shot` | node skeleton + a 1× viewport PNG (a rest/hover **pair** for state cases) |
| `shot+dom` | node skeleton + PNG + the raw browser data |

`shot+dom` is the arm that matters. Beating `shot` alone would only show that
images lack numbers, which nobody disputes.

> **Correction.** This section previously claimed `shot+dom` "holds every fact the
> resolved document holds — it simply has not had the arithmetic, the paint order or
> the cascade worked out". The last clause is wrong, and it was load-bearing.
> `getComputedStyle` does not leave the cascade un-worked-out; it *erases* it. No arm
> but `resolved` is shown which declaration produced a value, so the `authoring`
> cases are definitional rather than comparative — and they supply
> [40–50% of the aggregate
> margin](#accuracy-six-vision-models-47-comparable-cases). The claim as written
> made `provenance` 6/6 vs 0/6 read as an empirical result. It is not one yet; see
> [provenance and repair](#provenance-and-repair-widest-margins-weakest-baseline).

What `shot+dom` does hold is the same **geometry**, with the arithmetic and the
paint order left un-worked-out. That is the comparison this eval can actually make.

**The skeleton is the resolved document with its computed lines stripped out.**
Not a second implementation — literally `printResolved(doc, { skeleton: true })`,
emitting only the `path tag "text"` header lines and dropping `@`, `=`, `!`, `←`
and the state lines. Two reasons this matters:

1. A screenshot contains no node names, so without it the image arms cannot
   express an answer like `root>beta` at all. Withholding it would have measured
   vocabulary, not comprehension.
2. Deriving it from the same printer guarantees every arm spells paths, tags and
   text identically, so any accuracy difference is attributable to the stripped
   lines and to nothing else.

### Fairness decisions that changed the outcome

These are recorded because each one, left wrong, would have flattered the
document:

- **The skeleton shows *authored* text, not rendered text.** It first showed
  rendered text, which handed the `text-transform` case its answer (`ANNUAL
  REVIEW`) to every arm for free. Rendered text is a computed result; it has to
  be earned from the arm's own evidence.
- **The skeleton's label had to stop lying.** It said "the text it renders" after
  the switch above, and models believed the label over the attached image,
  answering from the caption without looking. A prompt that misdescribes its own
  evidence measures the prompt.
- **State cases get two screenshots**, at rest and during a real `page.hover()`.
  A single resting frame would have lost every hover question by construction. In
  the event this was decisive: `dead-hover` is 6/6 for the image arms, because a
  dead hover *is* two identical pictures.
- **The `dom` arm had no state evidence until it was pointed out.** A CDP or
  devtools workflow can dump computed style under a hover exactly as the harness
  already hovers for the screenshot pair, so the first version of this eval
  scoring `dom` 2/6 on `dead-hover` was scoring it against a capability it had
  been withheld from. The capture now produces a second computed-style dump
  while hovering, and `dom` went 2/6 → 6/6 on `dead-hover` and 0/6 → 6/6 on
  `hover-state`. That cost the document two of its former wins — they became
  ties — which is the direction a fairness fix is supposed to move things.
- **Only the `resolved` arm is told its arithmetic is done.** Its preamble says
  "every style is already resolved and every box is already measured"; the other
  arms say the data was "actually rendered in Chromium". The doc's own most
  interesting finding is that models re-derive numbers they do not trust, so a
  trust cue given to one arm only is a live variable sitting on that mechanism.
  It is disclosed here and measured as a control below (see
  [the trust cue](#the-trust-cue)): a full re-run of all four arms with the
  neutral preamble.
- **Colours are compared as colours.** The `hover-state` grader demanded the
  literal string `#3355ff`. Chromium reports `rgb(51, 85, 255)`, so `dom` and
  `shot+dom` answered **correctly** and were scored 0/6 on every model. Grading
  notation instead of comprehension cost those arms ~4 points before it was
  caught.
- **One case is excluded from cross-arm scoring.** `not-stated` asks what colour
  a node renders with and accepts "not stated" — true of the document, false of a
  devtools dump, where `getComputedStyle` reports the inherited `rgb(0, 0, 0)`.
  The `dom` arm answered it correctly about the page and scored 0/6. It is a probe
  of the *document's* honesty about its own gaps and cannot be used to compare
  arms; leaving it in handed the document a fifth "win" it had not earned.

### Models

Eight, via `opencode run --pure --model <id>`, deliberately spanning strong to
weak — a format only strong models can read is one whose meaning is being
reconstructed rather than stated, and failure modes surface far more clearly at
the low end.

Vision support is per model, read from `~/.cache/opencode/models.json`
(`modalities.input` including `image`):

| vision-capable | text-only |
|---|---|
| `claude-haiku-4-5`, `gemini-3-flash`, `gemini-3.5-flash-lite`, `gpt-5.4-mini`, `gpt-5.4-nano`, `qwen3.5-plus` | **`glm-5`, `minimax-m2.5`** |

**All cross-arm tables score the six vision models only.** Including the other
two would credit the text arms with readers the image arms never had. That two of
eight models cannot be shown a screenshot at all is a constraint on screenshots
as a strategy — reported separately, never folded into accuracy.

### Cases

48 total: 28 inherited, 6 dense, 11 added after a coverage audit, then 3
flex/grid cases.

The inherited 28 are 3–8 nodes at ~400×300, which is the **easiest possible input
for a vision model** and understates the document. So six `dense-*` cases were
added: ~45 nodes at 1280×800, shaped like a real page (masthead, fixed sidebar,
40 content rows, footer), with roughly half the content below the fold. Answers
were derived from measured geometry, not from arithmetic done by hand.

#### The coverage audit, and why it mattered

Classifying the first 34 cases by the question a developer would actually be
asking showed the suite was lopsided:

| what the case really tested | cases | share |
|---|---|---|
| "is this visible / what covers it" | 20 | **59%** |
| cascade and state | 7 | 21% |
| geometry ordering | 5 | 15% |
| inheritance, text rendering | 2 | 6% |
| **sizing, box model, containing block** | **0** | **0%** |

Fifty-nine percent of the benchmark was testing the one faculty the format
precomputes, and two of its four wins came from that group. Measured against what
the engine supports, the cases used `position: absolute` 37 times but contained
**zero** uses of `display`, `position: fixed`, percentages, `em`/`rem`, or an
unbreakable token — while the largest category of real CSS confusion, "why is this
the wrong size or in the wrong place", had no cases at all.

Eleven were added: eight on sizing and placement, three counterfactual. The
prediction was that they would mostly tie and would narrow the measured gap. They
did neither cleanly — they produced three of the format's seven losses, and
prediction turned out to be its strongest category.

#### Counterfactuals

Every one of the original 34 cases asked what *is* true. Building a page is not
that; the working question is "this isn't doing what I meant, what do I change" —
and it is the one question neither a screenshot nor a rect dump can answer, since
both describe only the frame in front of them.

Two shapes, and including both is what stops the first from being a category
boundary restated:

- **repair** — "which block must I edit", where provenance should dominate
- **prediction** — "after this edit, where does it land", which turns on knowing
  CSS rather than on reading evidence, and should be close to a tie

All four arms are given the page as it stands plus the edit in words. None is
shown the outcome. For predictions the edited tree is measured in Chromium, so
the answer key is browser-verified like every other —
`tests/resolved-format/counterfactual.test.ts` additionally asserts the edit
actually changes the answer, since otherwise the question is answerable off the
current geometry and is not a prediction at all.

#### Classification

| type | n | what it asks | expected competitor |
|---|---|---|---|
| `appearance` | 27 | what a viewer sees | screenshot is strong here |
| `measurement` | 13 | an exact value or an ordering of values | `dom` has the raw rects |
| `authoring` | 5 (4 comparable) | which declaration produced a value | nothing else carries it |
| `prediction` | 3 | what would become true after an edit | nothing has it in front of it |

`hover-state` sits in `measurement` rather than `appearance` despite being about a
colour: it demands the actual value, and no viewer reads a hex code off a screen.
Classifying it as appearance credited the image arms with a question their
evidence cannot answer in the form asked.

`evals/categories.ts` asserts every case is classified exactly once, so adding a
case without classifying it fails loudly rather than dropping out of the report.

### Grading

One mechanical `ANSWER:` line per reply, checked by a per-case `accept` function.
Two refinements that keep the numbers honest:

- **Answer-line slips are separated from misreadings.** A reply whose prose
  reaches the right conclusion and then emits the wrong `ANSWER:` line says
  nothing about the context. Only failures where the prose is *also* wrong are
  counted as misreadings.
- **Grading is re-derived, never trusted.** `attempts.json` stores raw evidence —
  the answer and the full reply — and `report.ts` re-grades every attempt against
  the current `accept` functions on load. This is what made the colour-grader fix
  cost nothing instead of 1,344 model calls.

### Cost measurement

Prompt tokens **as the provider counted them**, via `opencode run --format json`
→ `step_finish.tokens`, summing `input + cache.write + cache.read`. Images are
counted by the provider, not estimated from pixel-count formulas.

`opencode`'s own agent system prompt is 6,501 tokens and would swamp payloads of a
few hundred, so a baseline call is measured and subtracted. 192 metering calls on
the cheapest vision model.

The cache is keyed by case *and* arm so metering can be topped up when cases are
added. It previously short-circuited on the file existing, which meant adding
eleven cases would have printed the old 34-case token means beside the new
45-case accuracy — the same stale-denominator error the report itself had to be
corrected for.
---

## What we hoped to see, stated before running

Committed in advance so the conclusion could not be retrofitted:

| prediction | outcome |
|---|---|
| `source` (HTML+CSS) fails everything needing measurement | **not run, and the reason given was wrong** — see below |
| `dom` passes box arithmetic, fails paint-order occlusion | **half wrong** — `dom` got `topmost-of-three` 6/6 |
| `dom` fails provenance and dead-state | **correct** — 0/6 provenance |
| `shot` passes occlusion, fails provenance and dead-state | **half wrong** — `shot` got `dead-hover` 6/6 via the frame pair |
| `resolved` wins the dense visual cases | **wrong** — it ties or loses on them |
| an arm tying `resolved` is evidence against those findings | **held, and it happened 38 times** (37 at ceiling, 1 below) |

Being wrong on three of five is the reason the arms were worth building.

> **The `source` arm should have been run, and its dismissal is the biggest hole
> here.** It was recorded as "superseded by `dom`, a strictly stronger baseline".
> `dom` is not strictly stronger: source **contains** the provenance and the
> dead-state cascade, which is exactly what the two widest findings measure and
> exactly what `getComputedStyle` erases. Source is also ~3× *smaller* than the
> document by this repo's own `eval:scale`, so it is a cheaper baseline as well as
> a better-informed one.
>
> The same hole exists for rendered-page agents that never see source: Chrome
> returns the matched rules from `CSS.getMatchedStylesForNode`, so a
> `dom+matched-styles` arm would also carry provenance. **Two missing baselines,
> both of which attack the same two findings, neither run.** Until one is, the
> claim has to be narrowed to "against evidence derived from the rendered page by
> `getComputedStyle`" — which is a much smaller claim than the write-up made.

The eleven cases added later carried their own predictions, also written first:

| prediction | outcome |
|---|---|
| the sizing cases mostly tie | **correct** — 6 of 8 tie at 100% |
| adding them narrows the overall gap | **correct** — and by more than the noise floor |
| `resolved` wins measurement by having the sums done | **wrong, and instructive** — no detectable gain, 96% against 97% and 99%; see [pre-computed arithmetic](#pre-computed-arithmetic-bought-nothing) |
| repair questions are the format's own | **correct** — `repair-dead-hover` 6/6 against 0/6, the one margin here wide enough to trust |
| prediction questions tie, since they turn on knowing CSS | **not established** — the gap looks wide (89% against 56%) but it is an 18-attempt cell that the control run moved by 17 points |

The measurement prediction is the one worth having: expecting a win and measuring
no gain is what produced the format change and the whole re-derivation finding. The
prediction-category result, which an earlier version of this document called the
format's strongest claim, does not survive its own sample size.

---

## Results

1,344 scored calls (48 × 4 arms × 6–8 models), plus metering calls.

### Accuracy, six vision models, 47 comparable cases

| arm | appearance | measurement | authoring | prediction | all |
|---|---|---|---|---|---|
| `resolved` | **99%** | 96% | **100%** | **89%** | **98%** |
| `dom` | 92% | 97% | 38% | 56% | 87% |
| `shot` | 87% | 68% | 21% | 22% | 72% |
| `shot+dom` | 94% | **99%** | 54% | 56% | 90% |

**Read the `all` column with the `authoring` column subtracted from it.** Only
`resolved` is shown the source cascade: the shared skeleton carries paths, tags and
authored text, and `dom` carries `getComputedStyle`, which is the serialization
whose entire job is to flatten the cascade away. `authoring` therefore asks three
arms for evidence they were never handed — 100% against 38% is an accounting of who
holds the stylesheet, not of who reasons better. It is 24 of 282 attempts, and
removing it halves the headline:

| comparison | all 47 cases | excluding `authoring` | control, excl. `authoring` |
|---|---|---|---|
| `resolved` − `dom` | 11.0 pt | **6.2 pt** | 9.3 pt |
| `resolved` − `shot+dom` | 7.8 pt | **4.3 pt** | 5.8 pt |

So **40–50% of the accuracy margin comes from 8.5% of the eval, in the category the
alternatives are excluded from by construction.** A 4–6 point gap over `shot+dom`
survives, against ±1.4 points of aggregate reproducibility — a real result at
roughly half the advertised size. Excluding the four fold-dependent cases as well,
which the viewport-only screenshot cannot show, moves it under a further point
(6.2 → 6.8, 4.3 → 4.7).

The document does **not** lead on `measurement`, the category it was most expected
to win — the three scores there are separated by one and three attempts out of 78,
so the reading is "no detectable gain", not "worse". `prediction` is an 18-attempt
cell that moved 17 points in the control; read it as directional. Discussed under
[pre-computed arithmetic](#pre-computed-arithmetic-bought-nothing).

### Cost

| arm | mean prompt tokens | accuracy | tokens per correct answer |
|---|---|---|---|
| `resolved` | **552** | 98% | **566** |
| `dom` | 1,878 | 87% | 2,171 |
| `shot` | 611 | 72% | 849 |
| `shot+dom` | 2,323 | 90% | 2,589 |

The document costs **1.1× less than a bare screenshot** and is 26 points more
accurate; it costs **3.4× less than a devtools dump** and is 11 points ahead. This
is the cost comparison that means something, and it is the opposite of what the
old `Cost, measured` section claimed — see
[the retraction](#retraction-the-6-claim).

The screenshot margin is thin enough to be an artifact of provider image
accounting rather than a real saving; the devtools margin is not.

### Per model

| model | `resolved` | `dom` | `shot` | `shot+dom` |
|---|---|---|---|---|
| claude-haiku-4-5 | **98%** | 77% | 70% | 81% |
| gemini-3-flash | **100%** | 91% | 72% | 96% |
| gemini-3.5-flash-lite | **98%** | 89% | 77% | 94% |
| gpt-5.4-mini | **96%** | 89% | 77% | 91% |
| gpt-5.4-nano | **94%** | 85% | 66% | 83% |
| qwen3.5-plus | **100%** | 87% | 70% | 94% |
| glm-5 *(text-only)* | **100%** | 96% | n/a | n/a |
| minimax-m2.5 *(text-only)* | **100%** | 89% | n/a | n/a |

**Every model now reads the document at least as well as it reads raw devtools
data.** `gpt-5.4-nano` was the previous exception — it read the document *worse*
than a dump, because its coordinate-space guesses collided with the compact
`@ [x, y, w, h]` line — and the `axes` rendering of the geometry fixed exactly
that. It is still the weakest reader on the bench and its margin is the narrowest,
but the format is no longer a net loss for any model.

The consistency matters more than the margin: the result does not depend on one
model's quirks.

---

## Where the win actually is

**6 of 47 cases favour the document, 3 favour an alternative, 37 tie at 100%, and
1 ties below it.** A dozen cases carry the whole aggregate. Read the direction of
each, not the count — the count is [noise](#the-tally-is-noise). Breaking it down:

### The tally is noise

This was measured rather than assumed, and it is the most important thing on this
page — it decides which of the findings below are allowed to be read as numbers.

A second full matrix was run with the neutral preamble (see
[the trust cue](#the-trust-cue)). Three of the four arms already had that preamble,
so for those three the two runs are a **byte-identical replication** — same
prompts, same models, same grader, sampled again. **51 of 846 attempts flipped:
6.0%.**

With six models per case, one flip is the whole distance between "tied at ceiling"
and "lost by a sixth". At 6% that is not a rare event, and this eval samples each
cell exactly once. So:

| claim | margin it rests on | survives 6%? |
|---|---|---|
| aggregate accuracy per arm | 20–70 attempts | **yes** — reproduced within 1.4 points |
| the arm ordering | — | **yes** — identical in both runs |
| `provenance` and `repair-dead-hover`, 6/6 against 0/6 | 6 attempts | **yes** |
| `measurement` 96% vs 97% vs 99% | 1–3 attempts | **no** |
| category cells of 18–24 attempts | 3–4 attempts | **no** — `shot+dom`'s `prediction` moved 17 points on identical prompts |
| the win/loss tally | 1–2 attempts | **no** — 6W/3L became 5W/2L on identical evidence |
| any single case decided by one or two attempts | 1–2 attempts | **no** |

Two things follow, and the rest of this document is written to respect them. The
aggregate comparison is real. **Every per-case number below is directional only** —
kept because *which* cases separate the contexts is informative, never as a
scoreboard. Anyone rebuilding this should run each cell several times.

### Provenance and repair: widest margins, weakest baseline

These are the only two findings on this page with a margin wide enough to outlive
the [noise floor](#the-tally-is-noise) — and the baseline they beat is the wrong
one, so read the whole section before quoting the numbers.

`provenance` — "which node declared this padding?" — is **6/6 for `resolved` and
0/6 for every other arm on every model**. No pixel and no `getComputedStyle` output
contains the name of the block a declaration came from, so this is a margin of
information rather than of score: re-running does not move an arm that has no access
to the fact. `own-wins-on-source-order` points the same way at 6/6 against 4/6,
but that is a two-attempt margin and is directional only.

> **The alternatives were denied evidence the browser had.** These pages are
> rendered from a real stylesheet with one rule per contributor —
> `[cid-ywfdph] { & > [cid-panel] { padding: 16px } }` — which *is* the provenance
> answer, present in the page every capture was taken from. Chrome's Styles pane
> shows those matched rules with their origin and strikes through the losers, and
> CDP returns them from `CSS.getMatchedStylesForNode`. An agent inspecting a real
> page can have this; our `dom` arm lacks it only because it was built on
> `getComputedStyle`.
>
> So 6/6 against 0/6 does not show that provenance is non-substitutable. It shows
> the flattest available devtools output does not substitute for it, which is nearer
> a tautology than a finding. **A `dom+matched-styles` arm would settle it: 7 cases
> against 6 models, under 100 calls. It has not been run.** Until it is, this is the
> format's most plausible unique advantage and its least tested claim — and since
> `authoring` supplies [40–50% of the aggregate
> margin](#accuracy-six-vision-models-47-comparable-cases), the headline depends on
> an experiment that is missing.

`repair-dead-hover` is the widest margin in the whole run: **6/6 against 0/6**.
The question is "you added `:hover { padding: 40px }`, hovering does nothing,
which block do you edit?" The document carries a dead-state ledger naming the
ancestor selector that outranks the hover. A devtools dump can report the padding
the node ended up with and has no way to name what produced it, so the arms
holding it mostly proposed editing the block that was already there and already
losing.

This is the format's own territory and the clearest justification for it
existing. It is also, notably, the *actionable* question — the others are trivia
by comparison.

### Its appearance wins are all about absence

Directional, not measured — every margin here is two or three attempts, inside the
[noise floor](#the-tally-is-noise). What makes it worth keeping is that the
*direction* is the same on every such case and the reason is structural: where the
document beats the image arms on appearance, it is always because something is
**not** there.

- `transparent-overlay` — an overlay that covers the text but paints no
  background, so nothing is hidden. `resolved` 6/6, best alternative 4/6.
- `zero-size` — a node collapsed to 0×0 that still carries text. `resolved` 6/6,
  best alternative 3/6.

A screenshot shows what is painted. It cannot show that a box is present but
invisible, and models shown one guess "covered" from the geometry. That is an
argument about what the evidence contains, which is why it is stated here despite
the margins being too narrow to prove it.

### Pre-computed arithmetic bought nothing

`measurement` is **96% for `resolved`, 97% for `dom`, 99% for `shot+dom`** — three
scores separated by one and three attempts out of 78. **That ordering is inside the
noise floor and must not be read as "the document is worse at measurement".** An
earlier version of this document did read it that way, called the category "lost",
and built a section on the inversion; the control run says a re-run could put the
three in any order.

What the numbers do support is the weaker, more useful claim: **pre-computing the
arithmetic produced no detectable gain.** The format's whole premise for this
category is that stating the box saves the reader from deriving it, and against
arms holding only raw rects that premise buys nothing measurable. A null result on
the category the format exists to make easy is worth more than the direction of a
one-attempt gap.

The mechanism behind the null result is visible in the transcripts, and it is the
most interesting thing in this eval. Asked where an absolutely positioned box
lands, the document states the answer outright:

```
root>plain>pin  div  "pinned"
  @ x=10 y=10 width=80 height=20
```

That line did not always say this. The original rendering was `@ [10, 10, 80, 20]`,
and four of eight models ignored it and re-derived the position from `position`,
`top` and `left` — landing on the containing block's *content* edge instead of its
padding edge, and answering `30,30`. The `dom` arm, whose numbers are identical,
got it right five times out of six.

The difference was labelling. `getBoundingClientRect: x=10 y=10` names its own
coordinate space; `@ [10, 10, 80, 20]` did not, so a reader unsure whether the
box was absolute or parent-relative fell back on rederiving it. **Handing a model
a computed answer is not the same as handing it a trusted one**, and the cost of a
number the reader does not trust is that they redo the work and can get it wrong.

That produced two attempted fixes, and the evidence for each is of a different
kind — which matters, because at a 6% noise floor neither could have been settled
by score alone:

- **A provenance word** (`@ measured [10, 10, 80, 20]`) did nothing. Re-run over
  the loss cases it moved 3 attempts one way and 3 the other, and no failing model
  ever cited the marker. Naming the source is not what made `getBoundingClientRect`
  trusted.
- **Naming every quantity on the line itself** (`@ x=10 y=10 width=80 height=20`)
  is supported by the transcripts rather than by the aggregate. Models that
  previously re-derived the position began **quoting the line verbatim**, and the
  models that had misread the coordinate space stopped. The controlled contrast is
  the strongest part: on the *same page with the same numbers*, arms shown
  `getBoundingClientRect: x=10 y=10` cited it as authoritative while arms shown
  `@ [10, 10, …]` re-derived and got 30,30. `x=` is legible with no legend;
  `[10, 10, …]` needed a legend the reader had to carry to every node, and most
  did not.

**The aggregate movement from that change — `measurement` 94% → 96% — is three
attempts and is inside the noise floor.** It is reported in
[the fix this eval forced](#the-fix-this-eval-forced) as what was observed, not as
proof. The case for the `axes` rendering rests on the mechanism and the labelled/
unlabelled contrast; anyone who wants a number for it needs repeated sampling this
eval does not have.

What no rendering reaches is the reader who re-derives and never consults any line
at all — including `getBoundingClientRect` in the `dom` arm. That failure mode is
a prompt-behaviour problem, not a format one.

### Three cases were answered better without the document

Recorded, not explained away — and with the noise floor stated up front, because
only the first of the three has a margin worth discussing at all.

- **`containing-block-skips-static-parent`** — `resolved` 3/6, `dom` and
  `shot+dom` 5/6. A three-attempt margin, and the only loss whose *mechanism* is
  understood rather than merely observed: the three failures re-derive the position
  from `top`/`left` and the containing block's padding, never consulting the `@`
  line that states the answer, and land on `30,30` or `60,60` because they place
  the padding box's origin *after* the padding. That is a genuine CSS
  misconception, so when a model chooses to derive, it reliably derives wrong. Half
  the models choose to derive, which is why the case sits at 3/6 rather than
  anywhere stable.
- **`predict-containing-block-change`** — `resolved` 5/6, `dom` 6/6. One attempt.
  Directional at best; listed because it is the same page asked as a prediction.
- **`dense-invisible-text`** — `resolved` 4/6 against 6/6. Two attempts, and the
  one case where a stronger oracle confirms a real gap the eval cannot measure —
  see [below](#a-real-gap-the-document-has-which-this-eval-does-not-catch).

A fourth former loss, `dense-topmost-of-three`, was a grading artifact rather than
a reading failure: `gpt-5.4-nano` answered `root>beta div` — the right node plus
a trailing word — and the exact-string path grader marked it wrong. `path()`
accepts the leading token now, which is the same rule for every arm and flips no
other case.

### A real gap the document has, which this eval does not catch

`dense-invisible-text` — `#ffffff` text on a `#ffffff` background — ties in this
run, and tied at 5/6 against 6/6 in the blind one. Either way it is inside the
noise floor, so **the eval does not establish anything about it.**

It is listed here anyway because a stronger oracle does. Both colour values are on
`=` lines, so the document is not missing the facts, but nothing joins them into a
`!` finding the way occlusion and overflow are joined. **The independent
screenshot-differencing oracle in
`tests/resolved-format/occlusion-conformance.test.ts` catches it deterministically**,
and it is an asserted known divergence that will fail if the gap is ever closed.
A browser oracle over 38 fixtures is far better evidence than six models answering
one question once — which is a fair summary of the limits of this whole document.

### 37 cases discriminate nothing

Occlusion, overflow, alignment, reading order, paint order, below-the-fold, text
collision, `display: none`, unbreakable tokens, both dense occlusion twins, and
the three flex/grid cases — all answered correctly by every arm including
screenshot-only. **A question every context answers is not measuring the
context.** This remains the largest single weakness of this eval: 37/47 ties,
against 34/47 before.

---

## The trust cue

The `resolved` arm's preamble told it "every style is already resolved and every
box is already measured". The other three were told only that the data came from
Chromium. That asymmetry sits directly on the mechanism this eval is most
interested in — models re-deriving numbers they do not trust — so it was measured
rather than argued: **a second full matrix, 1,344 calls, with the neutral preamble
given to all four arms.**

For `dom`, `shot` and `shot+dom` the neutral preamble is the one they already had,
so for those three the control is a **byte-identical replication** and its only
product is a noise measurement. For `resolved` it removes the trust cue.

| arm | baseline | neutral | change | attempts flipped |
|---|---|---|---|---|
| `resolved` | 275/282 (98%) | 276/282 (98%) | +0.4 | 7/282 (2.5%) |
| `dom` | 244/282 (87%) | 241/282 (85%) | −1.1 | 17/282 (6.0%) |
| `shot` | 203/282 (72%) | 199/282 (71%) | −1.4 | 16/282 (5.7%) |
| `shot+dom` | 253/282 (90%) | 249/282 (88%) | −1.4 | 18/282 (6.4%) |

**The trust cue does nothing measurable.** Removing it moved `resolved` by less
than half a point, and the category it should have mattered most for —
`measurement`, where the whole re-derivation finding lives — went *up*, 96% to
97%. Whatever makes a model re-derive a stated box, being told the box is already
measured is not what stops it. That is consistent with the earlier finding that a
`measured` provenance marker changed nothing while naming the axes changed
everything: these readers respond to the shape of the line, not to assurances
about it.

**The more important result is the noise floor, and it is far worse than this
document previously claimed.** Over the three arms whose prompts were identical,
**51 of 846 attempts flipped — 6.0%.**

What survives that:

- **The aggregate, and the ordering.** Every arm moved by ≤1.4 points and the
  ranking is identical in both runs. The 8-point gap between `resolved` and
  `shot+dom` is not in question.
- **Margins of 6/6 against 0/6.** `provenance` and `repair-dead-hover` are not
  going to flip.

What does not survive:

- **The tally.** 6 wins / 3 losses became 5 wins / 2 losses on identical evidence.
- **Small-n category cells.** On identical prompts `dom`'s `authoring` went 38% →
  54% and `shot+dom`'s `prediction` went 56% → 39%. Those are 24- and 18-attempt
  cells; read them as "wide" or "narrow", never as a number.

One caveat on the noise figure itself: all three identical-prompt arms drifted
slightly *down* (losses outnumbered gains roughly 10 to 7) and the two runs are
hours apart against hosted models. Some of the 6% may be provider-side drift
rather than sampling, which would make it a bound on reproducibility rather than a
pure sampling estimate. Either way it is the number to plan around.

---

## The fix this eval forced

The coordinate-space finding above produced two format changes, the second of
which is the real one.

**First, a legend.** `printResolved` emitted one line per document:

```
@ = border box [x, y, width, height] in CSS px, absolute from the top-left of the
page — already resolved, not relative to the parent
```

Re-running the `resolved` arm moved three cases by one to two attempts each, at a
cost of ~35 tokens paid once per document rather than per node. Those movements are
inside the noise floor; the legend's value was diagnostic, not measured.

**The legend was not the fix — it was the diagnosis.** It had to be carried into
every node by a reader who was already ignoring the `@` line, and the transcripts
showed that most did not carry it. So the geometry line now spells its own space:

```
root>plain>pin  div  "pinned"
  @ x=10 y=10 width=80 height=20
```

This is why `dom` never had the problem: `getBoundingClientRect: x=10 y=10` is
self-naming, and the resolved document now is too. It costs +12 tokens a document.

**What the evidence for this change is, and is not.** On the full matrix
`measurement` moved 94% → 96% and `resolved` overall 96% → 98%. Both are two- and
three-attempt movements, i.e. **inside the 6% noise floor, and neither is offered
as proof.** (The overall step also folds in a grading correction, since
`dense-topmost-of-three` had been failed by an exact-match `path()`.) The change is
justified instead by two things a re-run cannot wash out:

1. **The transcripts changed in kind.** Models that had been re-deriving the
   position began quoting the geometry line verbatim. That is a different behaviour,
   not a different score.
2. **The labelled/unlabelled contrast.** Given the same page and the same numbers,
   readers shown `getBoundingClientRect: x=10 y=10` called it authoritative;
   readers shown `@ [10, 10, …]` re-derived. The only variable was the labelling.

These fixes were written after seeing which questions the format failed, and that
has to be stated rather than buried. What bounds the flattery: the changes are
generic — they label an axis, they do not encode any case's answer — and the
containing-block case is still counted as a loss. What does *not* bound it: no
amount of care makes a post-hoc change measurable at one sample per cell.

---

## Retraction: the 6× claim

`RESOLVED.md` previously reported that the document is "about **6x** the source
it describes, and the ratio worsens with size", from a table of four synthetic
trees. **Withdrawn.**

It was measured on one fixture — twenty sections of fifteen rows all sharing one
CSS block — which is pathological in both directions simultaneously: rows sharing
a rule are the best possible case for shast's deduplication (one emitted selector
serves 300 nodes) and the worst possible case for a flat per-node document (900
nodes each restating what it inherited). Re-measured across the 38 diverse
fixtures in `resolved-format/fixtures.ts` (`pnpm eval:scale`):

| | ratio |
|---|---|
| 38 real fixtures, size-weighted | **2.97×** |
| 38 real fixtures, median | 3.03× |
| `invoice`, the most page-like | 1.84× |
| repetitive page, 922 nodes | 6.19× |

The `←` provenance share was likewise inflated: 6% of characters on real
fixtures, not 22%.

The deeper error was the *choice of denominator*. Nobody chooses between a
resolved document and the markup that generated it, because that markup answers
none of these questions. Measured against what would actually occupy the context
instead, the document is the **small** option.

---

## Threats to validity

- **One sample per cell, and the measured noise is 6%.** 1,344 calls per matrix,
  each cell run once. A full second matrix with byte-identical prompts on three of
  four arms flipped **51 of 846 attempts (6.0%)** — see
  [the trust cue](#the-trust-cue). Aggregates survived that (≤1.4 points); the
  per-case tally and any small-n category cell did not. Every margin of one
  attempt in this document should be read as "no difference detected", and so
  should several margins larger than one.
- **Most cases don't discriminate.** The informative subset is a dozen or so
  questions. This and the point above are the two weaknesses that matter most.
- **The `resolved` preamble was a trust cue only it got.** Disclosed in the
  fairness list and measured in [the trust cue](#the-trust-cue): removing it
  changed nothing detectable (+0.4 points).
- **Geometry is Chromium's, and the eval is only as good as the capture.**
  Boxes come from `resolved-format/measured.ts`, which renders each case into a
  real page and reads every box back. A bug there is shared by every arm that
  reads the numbers, and is caught by `pnpm test:conformance` before the eval is
  trusted.
- **The dense cases are synthetic.** ~45 nodes at 1280×800 is closer to real than
  3–8 nodes at 400×300, but it is still a page written to be a test.
- **Three cases are no longer blind, and the format was tuned on the test set.**
  The `@` legend — "already resolved, not relative to the parent" — and the `axes`
  rendering were both added after watching those cases fail. Bounded as described
  [above](#the-fix-this-eval-forced), but the honest name for it is overfitting, not
  a disclosure: the legend is arm-exclusive, it is *inside* the document rather than
  in the preamble, and so `--preamble=neutral` does not control for it. The
  [trust-cue control](#the-trust-cue) covers the preamble only. Every case whose
  failure motivated a format change should be treated as a held-back example that
  was then trained on.
- **Only three counterfactual cases**, and they are the most decision-relevant
  group in the eval — the category where the document leads by the widest margin
  (89% against 56%) is also its smallest sample — and the control run moved that
  same 18-attempt cell by 17 points on identical prompts. That gap is a hypothesis
  worth testing properly, not a result.
- **Screenshots are viewport-only at 1×.** A full-page screenshot would answer
  the below-fold cases; it would also cost proportionally more tokens. Untested.
- **Cost is metered on one tokenizer** (`gpt-5.4-nano`) and assumed
  representative. Image token accounting varies by provider.
- **The cases were written by the same author as the format**, and the coverage
  audit that produced the last eleven is evidence of how much that biases things:
  the first 34 were 59% weighted toward the one faculty the format precomputes.
  There is no reason to think the current 48 are free of the same pull.
- **`opencode run` overhead is 6,501 tokens**, an order of magnitude more than
  any payload measured. Subtracting a baseline is not the same as isolating a
  clean measurement.

---

## Reproducing

See `evals/README.md`. Screenshots, DOM dumps, every prompt and every model reply
are cached under `evals/out/`, so the numbers above can be audited without
re-spending a single call. **`evals/` is not yet committed** — the cache is the
only copy of the run, and one partial re-run already destroyed a comparison file
(`attempts.blind.json`); commit it before iterating.

```sh
pnpm eval:capture   # Chromium: screenshots + hover pairs + DOM dumps
pnpm eval           # the matrix (resumable; skips what is already on disk)
pnpm eval:cost      # provider-counted tokens per arm
pnpm eval:report    # regenerate evals/out/REPORT.md
```
