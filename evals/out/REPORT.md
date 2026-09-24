# Does the resolved format earn its tokens?

Every case is asked as the same question in four contexts. `resolved` is the
resolved-node document; the others are what you get without it. All four are
given an identical node skeleton — paths, tags, and the text *as authored* —
derived by stripping the computed lines out of the document itself, so no arm
can win by naming nodes better than another.

| arm | what the model is given |
|---|---|
| `resolved` | the resolved-node document |
| `dom` | skeleton + `getBoundingClientRect()` + `getComputedStyle()`, raw from Chromium |
| `shot` | skeleton + a 1x viewport screenshot (a rest/hover pair for state cases) |
| `shot+dom` | skeleton + screenshot + the raw browser data |

`shot+dom` is the arm that matters: beating `shot` alone would only show that
images lack numbers, which nobody disputes.

**It does not hold every fact the resolved document holds.** It has the same
geometry with the arithmetic un-worked, but `getComputedStyle` flattens the
cascade, so no non-`resolved` arm is shown which declaration produced a value.
The `authoring` column below therefore asks three arms for evidence they were
never given, and is an accounting of who holds the stylesheet rather than a
comparison. Subtract it before quoting the `all` column.

Scored over the 6 vision-capable models, so every arm has the same readers.

## Cost

Prompt tokens as the provider counted them (`opencode run --format json`),
with the 6501-token agent system prompt subtracted so only the payload is
measured. Images are counted by the provider, not estimated from pixels.

| arm | mean prompt tokens | accuracy | tokens per correct answer |
|---|---|---|---|
| `resolved` | 552 | 98% | 566 |
| `dom` | 1,878 | 87% | 2,171 |
| `shot` | 611 | 72% | 849 |
| `shot+dom` | 2,323 | 90% | 2,589 |

**The resolved document is the cheapest arm and the most accurate one.** It costs 1.1x less than a bare screenshot and 3.4x less than the devtools dump, at 98% against 72% and 87%.

This is the comparison the old `Cost, measured` section in `RESOLVED.md` should
have made. Measuring the document against the markup that generated it made it
look like pure overhead, because that markup answers none of these questions.
Measured against the things you would actually put in a context instead, the
document is the small option.

## Accuracy by arm and question type

| arm | appearance | measurement | authoring | prediction | all |
|---|---|---|---|---|---|
| `resolved` | 160/162 (99%) | 75/78 (96%) | 24/24 (100%) | 16/18 (89%) | 275/282 (98%) |
| `dom` | 149/162 (92%) | 76/78 (97%) | 9/24 (38%) | 10/18 (56%) | 244/282 (87%) |
| `shot` | 141/162 (87%) | 53/78 (68%) | 5/24 (21%) | 4/18 (22%) | 203/282 (72%) |
| `shot+dom` | 153/162 (94%) | 77/78 (99%) | 13/24 (54%) | 10/18 (56%) | 253/282 (90%) |

- **appearance** — what a viewer sees. A screenshot is a strong competitor and
  this is where the document has to earn its place rather than win by default.
- **measurement** — a number or an ordering of numbers. `dom` has the raw rects,
  so this asks whether doing the arithmetic in advance is worth anything.
- **authoring** — which declaration produced a value. Only `resolved` carries
  this at all; the other arms are structurally excluded, so their score here is
  a restatement of that fact and not a measure of the readers.

## Verdict

Of 47 comparable cases, **6 were answered better with the
resolved document, 3 were answered better without it, 37 were
answered correctly by every arm, and 1 was answered equally badly by
all of them.**

The aggregate gap in the table above is therefore carried by a handful of
questions, not spread across the set: 37 of 47 cases are at ceiling in
all four contexts and contribute nothing to it. Read the aggregate as a
summary of those few, and the case list below as the actual result.

**Do not read the win and loss counts as a ranking.** Most cases sit at 6/6
or 5/6, so one model changing its mind moves a case across the boundary.
A second full matrix with byte-identical prompts on 3 of the four arms
disagreed on **51 of 846 attempts — 6.0%** — which is
enough to move several cases across the win/loss boundary while leaving
aggregate accuracy and the arm ordering intact. Six models is too small a
sample for the tally to carry weight.
It is reported here as a map of *where* the contexts differ, not as a
scoreboard.

Concretely, against a screenshot:

- **Provenance is the format's own.** `provenance` is 6/6 (100%) against 0/6 (0%) for `dom`. No pixel and no computed style contains the name of the block a declaration came from.
- **1 case is excluded** (`not-stated`) because its correct
  answer depends on the arm: "not stated" is right for the document and wrong
  for a devtools dump, where `getComputedStyle` reports the inherited colour.
  The `dom` arm answered it correctly about the page and was scored 0/6 before
  this exclusion, which would have handed the document a win it had not earned.
- **Appearance is close.** `resolved` 160/162 (99%) against `shot+dom` 153/162 (94%) and `shot` 141/162 (87%). Where the document wins on appearance it wins on the *absence* of something — a transparent overlay, a zero-size box — which is exactly what a picture cannot show.
- **Pre-computed arithmetic does not pay for itself.** `measurement` is 75/78 (96%) for `resolved` against 76/78 (97%) for `dom` and 77/78 (99%) for `shot+dom`. Given raw rects these models do the sums, and having the sums done in advance is worth nothing here — or worse than nothing, since a stated box invites being taken on trust and a re-derivation that goes wrong is a re-derivation that goes wrong either way.
- **Prediction is where the gap is real.** `resolved` 16/18 (89%) against `dom` 10/18 (56%) and `shot+dom` 10/18 (56%). Asked what to change rather than what is, an arm holding only the current frame has nothing to reason from.
- **A screenshot alone is the weakest option** (203/282 (72%)), and needs the numbers beside it to compete (253/282 (90%)). Two of the eight models cannot be shown one at all.

## Per case

| case | type | `resolved` | `dom` | `shot` | `shot+dom` |
|---|---|---|---|---|---|
| `occluded-text` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `transparent-overlay` | appearance | 6/6 (100%) | 2/6 (33%) | 4/6 (67%) | 4/6 (67%) |
| `z-index-scoped` | appearance | 6/6 (100%) | 4/6 (67%) | 6/6 (100%) | 4/6 (67%) |
| `overflowing-text` | appearance | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) | 6/6 (100%) |
| `overflow-is-not-truncation` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `dead-declaration` | authoring | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| `provenance` | authoring | 6/6 (100%) | 0/6 (0%) | 0/6 (0%) | 0/6 (0%) |
| `proximity-pair` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `zero-size` | appearance | 6/6 (100%) | 2/6 (33%) | 3/6 (50%) | 3/6 (50%) |
| `text-collision` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `widest-sibling` | measurement | 6/6 (100%) | 6/6 (100%) | 1/6 (17%) | 6/6 (100%) |
| `hover-state` | measurement | 6/6 (100%) | 6/6 (100%) | 0/6 (0%) | 6/6 (100%) |
| `partial-cover` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `misaligned-sibling` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `neighbour-to-the-right` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `topmost-of-three` | appearance | 6/6 (100%) | 6/6 (100%) | 0/6 (0%) | 6/6 (100%) |
| `own-wins-on-source-order` | authoring | 6/6 (100%) | 2/6 (33%) | 0/6 (0%) | 4/6 (67%) |
| `largest-by-area` | measurement | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| `inherited-font-size` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `text-transform` | appearance | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| `union-coverage` | appearance | 6/6 (100%) | 4/6 (67%) | 6/6 (100%) | 5/6 (83%) |
| `stacked-overlays-still-readable` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `distractor-node` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `below-the-fold` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `unreachable-vs-scrollable` | appearance | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| `state-over-ancestor` | authoring | 6/6 (100%) | 1/6 (17%) | 0/6 (0%) | 3/6 (50%) |
| `dead-hover` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `containing-block-skips-static-parent` | measurement | 3/6 (50%) | **5/6 (83%)** | 0/6 (0%) | **5/6 (83%)** |
| `percent-height-indefinite` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `padding-shrinks-content-box` | measurement | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) | 6/6 (100%) |
| `display-none-closes-gap` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `static-position-absolute` | measurement | 6/6 (100%) | 6/6 (100%) | 0/6 (0%) | 6/6 (100%) |
| `fixed-ignores-positioned-parent` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `line-height-ratio-inherits` | measurement | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| `long-word-overflows` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `repair-shadowed-padding` | prediction | 5/6 (83%) | 4/6 (67%) | 4/6 (67%) | 5/6 (83%) |
| `repair-dead-hover` | prediction | 6/6 (100%) | 0/6 (0%) | 0/6 (0%) | 0/6 (0%) |
| `predict-containing-block-change` | prediction | 5/6 (83%) | **6/6 (100%)** | 0/6 (0%) | 5/6 (83%) |
| `flex-row-arranges-children` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `flex-grow-shares-remaining` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `grid-two-columns` | measurement | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `dense-occluded-row` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) |
| `dense-transparent-band` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `dense-below-fold` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `dense-above-fold` | appearance | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) | 6/6 (100%) |
| `dense-invisible-text` | appearance | 4/6 (67%) | **6/6 (100%)** | 4/6 (67%) | **6/6 (100%)** |
| `dense-topmost-of-three` | appearance | 6/6 (100%) | 6/6 (100%) | 0/6 (0%) | 6/6 (100%) |

Bold marks an arm that **beat** `resolved` on that case.

## Where the document earns its place

6 of 47 comparable cases were answered better with the resolved
document than with the best available alternative.

- `transparent-overlay` (appearance) — `resolved` 6/6 (100%), best alternative 67% (`shot`, `shot+dom`)
- `provenance` (authoring) — `resolved` 6/6 (100%), best alternative 0% (`dom`, `shot`, `shot+dom`)
- `zero-size` (appearance) — `resolved` 6/6 (100%), best alternative 50% (`shot`, `shot+dom`)
- `own-wins-on-source-order` (authoring) — `resolved` 6/6 (100%), best alternative 67% (`shot+dom`)
- `state-over-ancestor` (authoring) — `resolved` 6/6 (100%), best alternative 50% (`shot+dom`)
- `repair-dead-hover` (prediction) — `resolved` 6/6 (100%), best alternative 0% (`dom`, `shot`, `shot+dom`)

## Where an alternative did better

Counter-evidence. Every one of these is worth taking literally: the
resolved document had the facts and something else got more answers right.

- `containing-block-skips-static-parent` (measurement) — `resolved` 3/6 (50%), best alternative 83% (`dom`, `shot+dom`)
- `predict-containing-block-change` (prediction) — `resolved` 5/6 (83%), best alternative 100% (`dom`)
- `dense-invisible-text` (appearance) — `resolved` 4/6 (67%), best alternative 100% (`dom`, `shot+dom`)

## Cases every arm found equally hard

Tied, but below ceiling: no context helped, and none was blamed. These say
the *question* is hard rather than that the evidence differs.

- `repair-shadowed-padding` (prediction) — `resolved` 5/6 (83%), best alternative 83% (`shot+dom`)

## Cases that discriminate nothing

37 of 47 comparable cases were answered correctly by every arm,
including the ones with no resolved document at all. These say nothing either
way — they are a limitation of the case set, not a result. A question every
context answers is not measuring the context.

- `occluded-text` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `z-index-scoped` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`shot`)
- `overflowing-text` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`shot`, `shot+dom`)
- `overflow-is-not-truncation` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `dead-declaration` (authoring) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `proximity-pair` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `text-collision` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `widest-sibling` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `hover-state` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `partial-cover` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `misaligned-sibling` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `neighbour-to-the-right` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `topmost-of-three` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `largest-by-area` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `inherited-font-size` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `text-transform` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `union-coverage` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`shot`)
- `stacked-overlays-still-readable` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `distractor-node` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `below-the-fold` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `unreachable-vs-scrollable` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `dead-hover` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `percent-height-indefinite` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `padding-shrinks-content-box` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`shot`, `shot+dom`)
- `display-none-closes-gap` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `static-position-absolute` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `fixed-ignores-positioned-parent` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `line-height-ratio-inherits` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)
- `long-word-overflows` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `flex-row-arranges-children` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `flex-grow-shares-remaining` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `grid-two-columns` (measurement) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `dense-occluded-row` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`)
- `dense-transparent-band` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `dense-below-fold` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `dense-above-fold` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot`, `shot+dom`)
- `dense-topmost-of-three` (appearance) — `resolved` 6/6 (100%), best alternative 100% (`dom`, `shot+dom`)

## Cases the document got wrong

- `containing-block-skips-static-parent` — `resolved` 3/6 (50%); expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- `repair-shadowed-padding` — `resolved` 5/6 (83%); expected: root>body — its `> panel` block is (0,2,0) against the panel's own (0,1,0), so the panel's own declaration can never win and the 4px has to be changed where it is written
- `predict-containing-block-change` — `resolved` 5/6 (83%); expected: 30,30 — `root>plain` becomes the containing block, so the 10px offsets are measured from its padding edge at 20,20 instead of the root's at 0,0
- `dense-invisible-text` — `resolved` 4/6 (67%); expected: NO — #ffffff text on the root's #ffffff background. Both values are in the document; no `!` line draws the conclusion

## By model

| model | vision | `resolved` | `dom` | `shot` | `shot+dom` |
|---|---|---|---|---|---|
| claude-haiku-4-5 | yes | 46/47 (98%) | 36/47 (77%) | 33/47 (70%) | 38/47 (81%) |
| gemini-3-flash | yes | 47/47 (100%) | 43/47 (91%) | 34/47 (72%) | 45/47 (96%) |
| gemini-3.5-flash-lite | yes | 46/47 (98%) | 42/47 (89%) | 36/47 (77%) | 44/47 (94%) |
| gpt-5.4-mini | yes | 45/47 (96%) | 42/47 (89%) | 36/47 (77%) | 43/47 (91%) |
| gpt-5.4-nano | yes | 44/47 (94%) | 40/47 (85%) | 31/47 (66%) | 39/47 (83%) |
| qwen3.5-plus | yes | 47/47 (100%) | 41/47 (87%) | 33/47 (70%) | 44/47 (94%) |
| glm-5 | **no** | 47/47 (100%) | 45/47 (96%) | n/a | n/a |
| minimax-m2.5 | **no** | 47/47 (100%) | 42/47 (89%) | n/a | n/a |

`glm-5` and `minimax-m2.5` are text-only, so `n/a` in the image arms is a
capability limit, not a result. Two of eight models on this bench cannot be
shown a screenshot at all — a constraint on screenshots as a strategy, not an
accuracy finding, which is why it is reported here and kept out of the tables
above.

## Misreadings

A failure whose prose also gets it wrong — the reader understood the context
and drew the wrong conclusion. Failures where the prose is right and only the
`ANSWER:` line slipped are excluded: those say nothing about the context.

| arm | case | model | answered | expected |
|---|---|---|---|---|
| `resolved` | containing-block-skips-static-parent | gemini-3.5-flash-lite | `30,30` | `10,10` |
| `resolved` | containing-block-skips-static-parent | gpt-5.4-mini | `30,30` | `10,10` |
| `resolved` | containing-block-skips-static-parent | gpt-5.4-nano | `60,60` | `10,10` |
| `resolved` | predict-containing-block-change | gpt-5.4-mini | `60,60` | `30,30` |
| `dom` | transparent-overlay | claude-haiku-4-5 | `NO` | `YES` |
| `dom` | transparent-overlay | gemini-3-flash | `NO` | `YES` |
| `dom` | transparent-overlay | gemini-3.5-flash-lite | `NO` | `YES` |
| `dom` | transparent-overlay | qwen3.5-plus | `NO` | `YES` |
| `dom` | transparent-overlay | minimax-m2.5 | `NO` | `YES` |
| `dom` | overflowing-text | claude-haiku-4-5 | `YES` | `NO` |
| `dom` | zero-size | claude-haiku-4-5 | `NO` | `YES` |
| `dom` | zero-size | gemini-3.5-flash-lite | `NO` | `YES` |
| `dom` | zero-size | gpt-5.4-nano | `NO` | `YES` |
| `dom` | zero-size | qwen3.5-plus | `NO` | `YES` |
| `dom` | zero-size | minimax-m2.5 | `NO` | `YES` |
| `dom` | not-stated | claude-haiku-4-5 | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | gemini-3-flash | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | gemini-3.5-flash-lite | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | gpt-5.4-mini | `black` | `NOT STATED` |
| `dom` | not-stated | gpt-5.4-nano | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | qwen3.5-plus | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | glm-5 | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | not-stated | minimax-m2.5 | `rgb(0, 0, 0)` | `NOT STATED` |
| `dom` | union-coverage | claude-haiku-4-5 | `YES` | `NO` |
| `dom` | union-coverage | gpt-5.4-nano | `YES` | `NO` |
| `dom` | containing-block-skips-static-parent | gpt-5.4-mini | `30,30` | `10,10` |
| `shot` | transparent-overlay | claude-haiku-4-5 | `NO` | `YES` |
| `shot` | transparent-overlay | gpt-5.4-nano | `NO` | `YES` |
| `shot` | dead-declaration | gemini-3.5-flash-lite | `YES` | `NO` |
| `shot` | zero-size | claude-haiku-4-5 | `NO` | `YES` |
| `shot` | zero-size | gpt-5.4-nano | `NO` | `YES` |
| `shot` | zero-size | qwen3.5-plus | `NO` | `YES` |
| `shot` | widest-sibling | claude-haiku-4-5 | `5.0` | `2.5` |
| `shot` | widest-sibling | gemini-3-flash | `2.0` | `2.5` |
| `shot` | widest-sibling | gpt-5.4-mini | `2.2` | `2.5` |
| `shot` | widest-sibling | gpt-5.4-nano | `4.0` | `2.5` |
| `shot` | widest-sibling | qwen3.5-plus | `3.0` | `2.5` |
| `shot` | hover-state | claude-haiku-4-5 | `blue` | `#3355ff` |
| `shot` | hover-state | gemini-3-flash | `blue` | `#3355ff` |
| `shot` | hover-state | gemini-3.5-flash-lite | `blue` | `#3355ff` |
| `shot` | hover-state | gpt-5.4-mini | `blue` | `#3355ff` |
| `shot` | hover-state | gpt-5.4-nano | `blue` | `#3355ff` |
| `shot` | hover-state | qwen3.5-plus | `#4169E1 (or similar medi` | `#3355ff` |
| `shot` | not-stated | gpt-5.4-mini | `black` | `NOT STATED` |
| `shot` | topmost-of-three | gemini-3.5-flash-lite | `root>front` | `root>middle` |
| `shot` | topmost-of-three | gpt-5.4-nano | `root>front` | `root>middle` |
| `shot` | topmost-of-three | qwen3.5-plus | `root>front` | `root>middle` |
| `shot` | own-wins-on-source-order | claude-haiku-4-5 | `Unable to determine from` | `64px` |
| `shot` | own-wins-on-source-order | gemini-3-flash | `50px` | `64px` |
| `shot` | own-wins-on-source-order | gemini-3.5-flash-lite | `30px` | `64px` |
| `shot` | own-wins-on-source-order | gpt-5.4-mini | `40px` | `64px` |
| `shot` | own-wins-on-source-order | gpt-5.4-nano | `0px` | `64px` |
| `shot` | own-wins-on-source-order | qwen3.5-plus | `40px` | `64px` |
| `shot` | largest-by-area | gemini-3-flash | `root>wide` | `root>square` |
| `shot` | state-over-ancestor | claude-haiku-4-5 | `0` | `2px` |
| `shot` | state-over-ancestor | gemini-3-flash | `0px` | `2px` |
| `shot` | state-over-ancestor | gemini-3.5-flash-lite | `0px` | `2px` |
| `shot` | state-over-ancestor | gpt-5.4-mini | `0px` | `2px` |
| `shot` | state-over-ancestor | gpt-5.4-nano | `0px` | `2px` |
| `shot` | state-over-ancestor | qwen3.5-plus | `0px` | `2px` |
| `shot` | containing-block-skips-static-parent | claude-haiku-4-5 | `0,0` | `10,10` |
| `shot` | containing-block-skips-static-parent | gemini-3-flash | `0,0` | `10,10` |
| `shot` | containing-block-skips-static-parent | gemini-3.5-flash-lite | `0,0` | `10,10` |
| `shot` | containing-block-skips-static-parent | gpt-5.4-mini | `0,0` | `10,10` |
| `shot` | containing-block-skips-static-parent | gpt-5.4-nano | `8,8` | `10,10` |
| `shot` | containing-block-skips-static-parent | qwen3.5-plus | `8,8` | `10,10` |
| `shot` | static-position-absolute | claude-haiku-4-5 | `59` | `50` |
| `shot` | static-position-absolute | gemini-3-flash | `40` | `50` |
| `shot` | static-position-absolute | gemini-3.5-flash-lite | `20` | `50` |
| `shot` | static-position-absolute | gpt-5.4-mini | `26` | `50` |
| `shot` | static-position-absolute | gpt-5.4-nano | `26` | `50` |
| `shot` | static-position-absolute | qwen3.5-plus | `16` | `50` |
| `shot` | line-height-ratio-inherits | qwen3.5-plus | `32` | `64` |
| `shot` | predict-containing-block-change | claude-haiku-4-5 | `0,0` | `30,30` |
| `shot` | predict-containing-block-change | gemini-3-flash | `8,8` | `30,30` |
| `shot` | predict-containing-block-change | gemini-3.5-flash-lite | `0,0` | `30,30` |
| `shot` | predict-containing-block-change | gpt-5.4-mini | `0,0` | `30,30` |
| `shot` | predict-containing-block-change | gpt-5.4-nano | `0,0` | `30,30` |
| `shot` | predict-containing-block-change | qwen3.5-plus | `0,0` | `30,30` |
| `shot` | dense-invisible-text | claude-haiku-4-5 | `YES` | `NO` |
| `shot` | dense-invisible-text | gpt-5.4-nano | `YES` | `NO` |
| `shot` | dense-topmost-of-three | gpt-5.4-mini | `root>gamma` | `root>beta` |
| `shot` | dense-topmost-of-three | gpt-5.4-nano | `root>main>r15` | `root>beta` |
| `shot` | dense-topmost-of-three | qwen3.5-plus | `root>gamma` | `root>beta` |
| `shot+dom` | transparent-overlay | claude-haiku-4-5 | `NO` | `YES` |
| `shot+dom` | transparent-overlay | gemini-3.5-flash-lite | `NO` | `YES` |
| `shot+dom` | zero-size | claude-haiku-4-5 | `NO` | `YES` |
| `shot+dom` | zero-size | gpt-5.4-nano | `NO` | `YES` |
| `shot+dom` | zero-size | qwen3.5-plus | `NO` | `YES` |
| `shot+dom` | not-stated | claude-haiku-4-5 | `rgb(0, 0, 0)` | `NOT STATED` |
| `shot+dom` | not-stated | gemini-3-flash | `rgb(0, 0, 0)` | `NOT STATED` |
| `shot+dom` | not-stated | gemini-3.5-flash-lite | `rgb(0, 0, 0)` | `NOT STATED` |
| `shot+dom` | not-stated | gpt-5.4-mini | `black` | `NOT STATED` |
| `shot+dom` | not-stated | gpt-5.4-nano | `rgb(0, 0, 0)` | `NOT STATED` |
| `shot+dom` | not-stated | qwen3.5-plus | `rgb(0, 0, 0)` | `NOT STATED` |
| `shot+dom` | union-coverage | claude-haiku-4-5 | `YES` | `NO` |
| `shot+dom` | containing-block-skips-static-parent | claude-haiku-4-5 | `30,30` | `10,10` |
| `shot+dom` | predict-containing-block-change | gpt-5.4-mini | `60,60` | `30,30` |
| `shot+dom` | dense-occluded-row | gpt-5.4-nano | `YES` | `NO` |

## Caveats

- The 28 original cases are 3–8 nodes at ~400x300, which is the easiest input
  for a vision model and understates the document. The six `dense-*` cases are
  ~45 nodes at 1280x800 for that reason; read those rows first.
- The three flex/grid cases are new; geometry for every case comes from
  Chromium (`resolved-format/measured.ts`), so the layout is the browser's and
  the answer keys are browser-verified.
- Screenshots are viewport-only at 1x. A full-page screenshot would answer the
  below-fold cases and cost proportionally more tokens.
- One case, `dense-invisible-text`, is white text on a white background. The
  document does not join `color` to the colour behind it, so it is expected to
  miss it. It is in the set to mark the boundary of what its readability claim
  means.
