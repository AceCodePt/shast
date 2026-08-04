# The resolved-node format, as built

Implements `shast-resolved-format.md`. This file records what the code actually
does, and — more usefully — every place it departs from the spec and why. A
divergence that is written down is a decision; one that is not is a bug waiting
to be discovered by someone who trusted the document.

## Pipeline

```
collectRules      src/engine/render/collect-rules.ts   every emitted rule, structured
  ├─ printStylesheet                                   -> the CSS renderComponent emits
  └─ resolveCascade resolved-format/cascade.ts            -> per-node style + provenance
measureBoxes      resolved-format/measured.ts             -> boxes, measured by Chromium
occlusionOf       resolved-format/occlusion.ts            -> who hides what
resolveDocument   resolved-format/resolved.ts             -> the JSON document
printResolved     resolved-format/print-resolved.ts       -> the text projection
```

## Precedence: one code path, and it was measured

The spec insists the resolver derive precedence "from the same code path as
`renderComponent` rather than reimplementing it". So `render-component.ts` no
longer walks `css` blocks at all: `collectRules` produces a structured rule per
emitted selector, `printStylesheet` prints the stylesheet from those rules, and
`resolveCascade` resolves the cascade over the same objects. There is one
implementation of "which selector does this `css` key emit".

The ordering was then measured rather than argued, because the spec's two
candidate rules disagree. It is the plain CSS cascade over the emitted
selectors — **specificity, then source order** — which in this emitter means:

| contributor | emitted selector | specificity | wins over |
|---|---|---|---|
| grandparent `> mid > child` | `[cid-root] > [cid-mid] > [cid-child]` | (0,3,0) | everything below |
| parent `> child` | `[cid-mid] > [cid-child]` | (0,2,0) | the node's own block |
| the node itself | `[cid-child]` | (0,1,0) | — |

So **the most distant contributor wins**, which is the opposite of the intuition
that a node's own declaration is the last word. Verified against Chromium by the
`cascade-*` fixtures in `resolved-format/fixtures.ts`; run `pnpm test:conformance`.

**This is the intended design, not a wart to route around.** A child defines how
it looks on its own; an ancestor composing it is better placed to decide how it
looks *here*, and gets the last word precisely so that composition does not
require editing the child. The consequence — that a distant ancestor can silently
outrank a node's own `:hover` — is then the composing parent's responsibility: if
it reaches that far it owns re-declaring the state, or it should not have reached
so far.

That is why `shadows` and `dead-state` exist. They are not warnings that the
cascade is broken; they are the ledger of debt that this power hierarchy makes it
possible to accrue, so a parent's override is visible at the node it lands on
rather than discovered later by hovering. An earlier draft of this document framed
ancestor-wins as a defect in shast. It is not, and the flags read differently once
that is straight: they surface a cost that was deliberately made available, not a
mistake in the language.

This also fixed a real bug. `resolve-style.ts` used to merge `ownCSS` *over* the
parent's `"> name"` block, so the resolver disagreed with the browser whenever
the two declared the same property. No fixture had a collision, so 29/29
conformance had been passing over the top of it.

## Deviations from the spec

| spec | built | why |
|---|---|---|
| `opaque` for `img`/`svg`/`canvas`/`video` | `replaced` | `opaque` already means "has a background, so it hides what is behind it" in `types.ts`. Two meanings for the word in one package, in a format whose whole subject is occlusion, is not a naming quibble. `replaced` is the CSS term. |
| `clipped` — "content exceeds the box" | `overflows` | The registry has no supported `overflow` value, so overflow is always `visible`: the content is painted **outside** the box, in full. "Clipped" says the opposite of what happens and sends a reader looking for missing content instead of for a collision. |
| `scrolls` | not emitted | Needs `overflow`, which is unsupported. A flag that can never fire is worse than an absent one: it implies the absence was measured. |
| `wrapped` — "a flex row that broke onto multiple lines" | text that wrapped onto multiple lines | Text wrapping is measured, and is the same fact one layer down. |
| `box` measured by a browser render pass | measured by `measured.ts` | It *is* the browser: every box is read back from a real Chromium page with `getBoundingClientRect`, `getComputedStyle` and the scroll geometry. The format cannot disagree with the renderer about a number the renderer produced, and `flex`, `grid` and `sticky` are laid out by the browser rather than throwing. |
| `states` keyed `"hover"` | keyed `":hover"`, `".active"`, `"::before"`, `":hover.on"` | The bare name cannot distinguish a pseudo-class from a class from a pseudo-element, and compound states need a spelling at all. |
| `from: "own"` in the text output | `declared by <path>, inside its "<key>" block` | See below. |
| package named `text-renderer/` | `resolved-format/` | Nothing here renders. This is a formatter: it serialises resolved state as named text, and the one thing it deliberately does not do is depict the page spatially. The old name is a fossil of a predecessor that drew a glyph grid, which models decoded badly — keeping it invited the assumption that this is that, only in a directory. |
| — | `collides` | Added. |
| — | `dead-state` | Added. |
| — | paint-order explanation on `covered` | Added. |

## Additions the spec did not have, and the evidence for them

Each of these exists because a reader got the page wrong without it. The
transcripts are under `evals/out/`.

**`←` lines name the node and the key separately.** The spec's compact
`root "> body > panel"` reads as one selector: asked which node declared it,
four of six models answered `root>body>panel`. The text output now says
`declared by root, inside its "> body > panel" block`, and includes the block key
even for own declarations — a node that declares `padding` at the top of its
block and again under `&.big` otherwise produces two contributions labelled
identically, one of them dead, with no way to tell which line to delete. The
compact form is still in the JSON, where nothing has to read English.

**`covered` explains the paint order when the numbers look wrong.** Stating a
conclusion is not enough when a reader holds a contradicting prior: told that a
box with `z-index: 999` is covered by one with `z-index: 2`, claude-haiku
overruled the report — "this describes what would happen without z-index
consideration". The finding now names the scoping: the node's `z-index` is
measured inside its own stacking context, and that whole context paints below
the coverer. A verdict the reader can check beats one they must accept.

**Occlusion is measured against glyphs, and only opaque coverers count.**
"Do these boxes overlap in paint order" is not "can I still read this". A
transparent overlay covers 100% of a box and hides nothing; a chip in the corner
covers 9% and hides nothing either. Coverage is computed per text line against
the **union** of opaque coverers, because two coverers hiding half a line each
hide the line.

**`collides`.** Neither occlusion nor overflow catches a zero-height box in
normal flow whose text lands on its next sibling's text: nothing is displaced and
nothing has a background, and both nodes become unreadable. Only the
measurement is reported — that two glyph rectangles intersect, and by how much.
Whether the result is legible is not something geometry can settle.

**`dead-state`.** An ancestor's `"> a > b"` block emits three attribute
selectors, (0,3,0); a node's own `:hover` emits two, (0,2,0). So an ancestor can
outrank a state and hovering does nothing whatsoever. Before this flag existed
such a state simply did not appear in the document — which reads as "this node
has no hover behaviour" when the truth is "its hover behaviour is being
overruled". The first is a design; the second is a bug, and the two must not look
alike. (It takes a *grandparent*: a parent's `"> name"` block ties with the state
at (0,2,0) and loses on source order, because the child's block is printed
second.)

**Text is printed as rendered.** A node under an inherited
`text-transform: uppercase` renders `ANNUAL REVIEW`; printing `Annual review`
would describe a page that does not exist. The source string is kept beside it
when the two differ.

**An inherited `font-size` is stated on the node that renders at it.** `style`
holds declarations, and a heading whose size came from its parent declares
nothing — so its `=` line was empty and two nodes could not be compared for
emphasis without walking the tree, which is exactly the work the format exists to
have already done.

## Node identity

Paths are `>`-joined `innerHTML` keys — the same alphabet a `"> name"` selector
key uses, so a path and a provenance label read alike. Array entries are
suffixed `name[i]`; without it two siblings share a path and the format's promise
that a path identifies one node is false. `Box.path` uses the same scheme, so
geometry and style join by exact key rather than by position.

## What is checked, and how

| check | what it establishes | command |
|---|---|---|
| `tests/resolved-format/cascade.test.ts` | precedence, provenance, shadows, states | `pnpm test` |
| `tests/resolved-format/resolved.test.ts` | flags, occlusion, the text projection's invariants, against the browser | `pnpm test:conformance` |
| `tests/resolved-format/counterfactual.test.ts` | the answer keys for the prediction cases, against the browser | `pnpm test:conformance` |
| `tests/resolved-format/occlusion-conformance.test.ts` | the readability claim, against pixels | `pnpm test:conformance` |
| `tests/resolved-format/hover-conformance.test.ts` | state deltas and dead states, against a real hover | `pnpm test:conformance` |
| `evals/run.ts` | that a reader extracts the right fact | `pnpm eval` |

Three of these deserve a note.

**The occlusion oracle compares pixels, not numbers.** The page is painted twice
— once normally, once with one node's glyphs turned transparent — and the images
must be byte-identical exactly when the format says that node's text is fully
hidden. `elementFromPoint` would not do: it hit-tests geometry and names a
transparent overlay as the topmost element, which is the precise false positive
the format has to avoid. Rendering is deterministic for identical input, so byte
equality is a sound test rather than a tolerance to tune.

**Dead states are hovered, not argued about.** Reasoning about specificity is
exactly the kind of confident argument that turns out to be backwards, so the
element is hovered and the computed value read. This immediately caught a bug in
the harness itself: Playwright's pointer starts at 0,0, which is inside any box
anchored at the origin, so the "resting" reading was already the hover state and
every dead-state check silently inverted. The resting point is now derived from
the element's own rect.

**The eval cases are conformance subjects.** Their expected answers are read off
geometry, so an unchecked case is an unchecked answer key, and a comprehension
benchmark with a wrong key measures nothing. This caught three of my own wrong
answers: a 0x0 box does not clip, so its text is still painted; in the
transparent-overlay case the banner's own label was colliding with the text
underneath, giving that case two reasons to be unreadable and making its expected
answer of "yes" simply wrong; and `state-over-ancestor` was keyed to `40px` on the
assumption that a `:hover` beats an ancestor, which is backwards.

## How geometry is measured

The box tree is produced by rendering the component into a real Chromium page and
reading it back — there is no layout engine to diverge from the browser, because
the browser does the layout. Per element, in tree order (the DOM walk and the AST
walk produce the same sequence, because the HTML renderer emits children in
insertion order and the measurement asserts this per tag):

- the border box, from `getBoundingClientRect` — absolute page coordinates, which
  is what the `@` line reports;
- the computed style subset the predicates reason about: `display`, `position`,
  offsets, `z-index`, `width`/`height`, padding, border, `font-size`,
  `line-height`, `text-transform`, `background-color`;
- the text line boxes, from a `Range` over each direct text node — how many lines
  the text actually wrapped into;
- content extent, derived from the format's own geometry (snapped text lines plus
  children) rather than the raw scroll area, because Chromium counts the font's
  half-leading as overflow and would otherwise flag every text-carrying box.

Two measured facts are snapped to the box. Line boxes hang half-leading above and
below the glyphs, so their `y`/`height` are re-derived from the content top and
the LayoutUnit-floored line height — where Chromium actually places them — while
`x`/`width` stay measured. And a `display: none` subtree is reported as one box
and then skipped: its children do not render at all, so reporting them as
zero-size boxes would be a lie the format's own `zero` flag would repeat.

The result is a flat, JSON-serialisable list in walk order (`measured.json` under
`evals/out/capture/<case>/`), so `resolveDocument` stays synchronous and a matrix
run rebuilds every document from disk without re-opening a browser.

## Results

Two different questions, and only the second one is worth much.

### Is the format legible?

`pnpm eval --arms=resolved` — 48 cases against 8 models, from `claude-haiku-4-5`
down to `gpt-5.4-nano` and `gemini-3.5-flash-lite`, with no explanation of the
notation beyond one legend line: **275/282 on the vision models, 377/384
overall, per-model 94–100%.**

Weak models are in the set deliberately. A format only strong models can read is
one whose meaning is being reconstructed rather than stated, and the failure modes
show up far more clearly at the low end — every format change here was found by a
small model, not by inspection. The spread is also the finding: `gpt-5.4-nano`
reads this document at 94%, and it is the model that forced the geometry line to
spell its own coordinates — before that change it was the one model on the bench
that read the document *worse* than it read a raw devtools dump.

### Does it beat just looking at the page?

Legibility is necessary and nowhere near sufficient. With one arm there is no way
to separate "the document communicated it" from "the answer was obtainable
anyway", and for most of these questions a screenshot is what a person would
actually open. So every case is now asked in four contexts, all given the same
node skeleton (paths, tags, authored text) so no arm can win on vocabulary:

| arm | appearance | measurement | authoring | prediction | all | mean tokens |
|---|---|---|---|---|---|---|
| `resolved` | **99%** | 96% | **100%** | **89%** | **98%** | **552** |
| `dom` — rects + computed styles | 92% | 97% | 38% | 56% | 87% | 1,878 |
| `shot` — screenshot | 87% | 68% | 21% | 22% | 72% | 611 |
| `shot+dom` — both | 94% | **99%** | 54% | 56% | 90% | 2,323 |

**The `authoring` column is not a comparison, and it inflates the `all` column by
about half.** No arm but `resolved` is shown the source cascade at all: the shared
skeleton is paths, tags and authored text (`evals/arms.ts`), and `dom` gets
`getBoundingClientRect` plus `getComputedStyle`, which is precisely the
serialization that flattens the cascade away. Asking those arms which block
declared a value asks for evidence they were never given. It is 24 of 282
attempts — 8.5% of the eval — and dropping it cuts the margin:

| comparison | all 47 cases | excluding `authoring` |
|---|---|---|
| `resolved` − `dom` | 11.0 pt | **6.2 pt** |
| `resolved` − `shot+dom` | 7.8 pt | **4.3 pt** |

The neutral-preamble matrix reproduces the direction (12.4 → 9.3 and 9.6 → 5.8).
So **roughly 40–50% of the headline accuracy margin comes from 8.5% of the eval,
in the one category the alternatives were structurally excluded from.** What
survives is a 4–6 point gap over the strongest baseline — real, since aggregate
reproducibility is ±1.4 points, but half the advertised size.

`shot` is also a **viewport-only 1× screenshot**, so below-fold cases are lost to
it by construction. That one turns out not to matter much: excluding the four
fold-dependent cases as well moves the gaps by under a point (6.2 → 6.8,
4.3 → 4.7). The comparable unfairness to `dom` — no hover evidence — was found and
fixed, and cost the document two case wins.

**The document is the most accurate context, and the cheapest by the one margin
worth claiming** — 3.4x cheaper than a devtools dump, and 6 points ahead of it on
the questions both were equipped to answer. It also counts 1.1x cheaper than a
bare screenshot, but 611 against 552 tokens is metered on one tokenizer and is thin
enough to be an artifact of how a provider bills images, so that half should not be
claimed. The devtools ratio, and not the ratio against its own markup, is the cost
claim this format can make.

The case-level result is more sober, and matters more: **of 47 comparable cases, 6
were answered better with the document, 3 were answered better without it, 37
were answered correctly by every arm, and 1 was answered equally badly by all.**
Do not read that as a ranking. A full second matrix, with byte-identical prompts
on three of the four arms, flipped **51 of 846 attempts — 6%** — and moved the
tally from 6 wins / 3 losses to 5 wins / 2 losses. Aggregate accuracy and the arm
ordering reproduced to within 1.4 points; nothing finer than that did.

The two widest case-level margins are **provenance** and **repair** — 6/6 against
0/6, on every model. `provenance` asks which block declared a value;
`repair-dead-hover` asks "hovering does nothing, which block do I edit". Being
margins of information rather than of score, they are not moved by re-running.

**They are also the weakest-founded results in the eval, because the baseline is
the wrong one.** The pages are rendered from a real stylesheet with one rule per
contributor:

```css
[cid-ywfdph] { & > [cid-panel] { padding: 16px; } }
```

That is the provenance answer, sitting in the page the captures came from. Chrome's
Styles pane displays exactly those matched rules with their origin and shows the
losing declarations struck through, and CDP exposes them programmatically via
`CSS.getMatchedStylesForNode`. A real agent inspecting a real page can have this.
Our `dom` arm cannot only because it was built on `getComputedStyle`.

So 6/6 against 0/6 does not show that alternatives *cannot* carry provenance. It
shows that the flattest devtools output does not, which is closer to a tautology
than to a finding. **The comparison that would settle it — a `dom+matched-styles`
arm — has not been run, and is 7 cases against 6 models, under 100 calls.** Until
it is, treat this as the format's most plausible unique advantage and its least
tested one.

Its appearance wins are all about the *absence* of something — a transparent
overlay, a zero-size box — which is what a picture cannot show. The direction is
consistent across those cases; the individual margins are two or three attempts and
are not measurements.

Two negative results, both worth more than the wins:

- **Pre-computing the arithmetic bought nothing detectable.** `measurement` is 96%
  against `dom`'s 97% and `shot+dom`'s 99% — one and three attempts out of 78, so
  the ordering is inside the noise floor and the honest claim is "no gain", not
  "worse". Given raw rects, models do the sums themselves. Worse, they did the sums
  *instead* of reading: models ignored a stated `@ [10, 10, …]`, re-derived the
  position from `top`/`left` and got it wrong, because the line never said which
  origin it was measured from. The geometry line is now
  `@ x=10 y=10 width=80 height=20`, spelling its own space like
  `getBoundingClientRect` does — a change justified by the transcripts (readers
  began quoting the line verbatim) rather than by its effect on the score, which
  is inside the noise. The residual is the reader who re-derives and consults no
  line at all. The lesson stands: **a number the reader does not trust is a number
  the reader recomputes.**
- **37 of 47 cases are answered correctly by every arm.** For most questions about
  a page, a screenshot is genuinely enough.

Full matrix, cost table and every transcript: `evals/out/REPORT.md`. Method,
fairness decisions and threats to validity: `docs/resolved-format-eval.md`. To run
it against other models: `evals/README.md`.

## Cost, measured

### Retraction

An earlier version of this section reported that the document is "**about 6x the
source it describes, and the ratio worsens with size**", from a table of four
synthetic trees. That claim is withdrawn. It was measured on a single fixture —
twenty sections of fifteen rows that all share one CSS block — which is
pathological in both directions simultaneously: rows sharing a rule are the best
possible case for shast's deduplication (one emitted selector serves 300 nodes)
and the worst possible case for a flat per-node document (900 nodes, each
restating what it inherited). The 6x was a property of that tree. Generalising it
to the format was an error, and the same fixture also inflated the reported `←`
share by roughly 2.5x.

### Measured again, on the real fixtures

`pnpm eval:scale`, now over the 38 fixtures in `resolved-format/fixtures.ts`, which
differ from one another, against the HTML and CSS `renderComponent` emits for the
same tree (excluding the reset, which is a fixed ~370 characters emitted once per
page rather than per component):

| | ratio |
|---|---|
| **38 real fixtures, size-weighted** | **2.97x** |
| 38 real fixtures, median | 3.03x |
| `invoice`, the most page-like | 1.84x |
| repetitive page, 922 nodes | 6.19x |

Per-fixture extremes (1.33x to 20.82x) are not worth quoting: both ends are
near-empty fixtures where the denominator is a few dozen characters.

So the document is **about three times** the markup it describes on realistic
content, not six times, and the ratio only approaches 6x on pages built from many
identical rows. Flatness does cost redundancy — that part of the old claim
stands — but the size of the cost depends entirely on how repetitive the page is,
and on real fixtures `←` is 6% of the characters rather than 22%.

### The comparison that actually matters

Neither figure above is a decision anyone makes. Nobody chooses between a
resolved document and the markup that generated it; the markup cannot answer any
of the questions the document exists for. The real choice is against whatever else
would go in the context — a screenshot, or a devtools dump — and that is measured
in `evals/` against both, in tokens the provider counted. See `evals/out/REPORT.md`.

### What measuring at scale found

`offscreen` was near-useless on a page. Written for a component that should fit,
it fired on **863 of 922 nodes** on a 14,115px page in a 900px viewport, and its
detail lines were **31% of the whole document** — a third of the report spent
saying that a scrollable page scrolls, with the eleven real problems buried in it.

Split in two: `below-fold` (the box starts at or past the bottom edge — normal,
carries a flag and no `!` line, since `@` already gives `y`) and `offscreen`
(above the top edge, left of the left edge, or past the right edge — scrolling
cannot reach it, because pages do not scroll horizontally). The document shrank
30% and the findings channel went from 874 lines to 11.

None of the unit tests could have caught this. Every fixture fits its viewport.

## Known limits

- **No `var()` resolution.** A `color: var(--fg)` is reported verbatim. The
  registry declares custom properties with `@property`, so the value is knowable,
  but resolving it is not implemented; the report says what was declared.
- **One viewport per document.** The spec's obligation is honoured by refusing
  to hedge: emit one document per breakpoint.
- **`collides` reports overlap, not illegibility.** Two overlapping runs of the
  same colour are unreadable; of sufficiently different colours, sometimes not.
  The format states the measurement and stops.
- **`=` is complete only for what the cascade models.** `style` holds
  *declared* values resolved through the cascade. Inherited `font-size` is
  patched in because emphasis comparisons need it, but `color`, `font-weight` and
  `background` are neither inherited nor defaulted — a node that inherits its
  colour reports no colour. The line is complete about geometry and about what
  was written; it is not a computed-style dump, and `not-stated` in the eval set
  exists to keep a reader from assuming otherwise.
- **Most eval cases do not discriminate.** 37 of 47 are answered correctly from a
  screenshot or a devtools dump as well as from the document, so the single-arm
  score mostly measured whether the notation parses. The comparison in
  `evals/out/REPORT.md` is the part that carries information, and it rests on a
  dozen cases — of which the narrowest are inside the measured 6% attempt-level
  noise floor, leaving about seven that mean anything.
- **The eval samples each cell once.** Enough for the aggregate, not enough for
  per-case claims. Any margin of one attempt in `evals/out/REPORT.md` should be
  read as "no difference detected".
- **No contrast finding.** `dense-invisible-text` is `#ffffff` text on a
  `#ffffff` background. Both values appear on `=` lines, so the facts are in the
  document, but nothing joins them into a `!` line the way occlusion and overflow
  are joined. "Can a viewer read this" currently means "not occluded and not
  clipped", which is not the same as visible.
- **The grid is gone.** The character-grid renderer (`renderGrid`, `paint`,
  `project`) was deleted along with the layout engine it projected; the format is
  text-only, and the eval measures the text.
