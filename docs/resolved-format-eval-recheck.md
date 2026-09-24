# Recheck of `resolved-format-eval.md`

A second independent re-derivation, after the fixes prompted by a first audit
(`resolved-format-eval-audit.md`, **since lost — never committed**). Same narrow
question: **does the harness, the grader or the write-up favour the resolved
format anywhere it should not.**

Every figure below was recomputed from `evals/out/*/attempts.json` by applying the
current `accept` functions directly, without reading `REPORT.md`, plus a fresh
`pnpm eval:scale` and a re-read of `out/cost.json`.

Answer: **nothing is fabricated, the aggregate result reproduces twice, and four
claims still need fixing — two of them framing, one a stale artifact, one a
missing baseline.**

## What reproduces

| claim | recomputed |
|---|---|
| accuracy 98 / 87 / 72 / 90 | `resolved` 275/282, `dom` 244/282, `shot` 203/282, `shot+dom` 253/282 |
| cost 552 / 1,878 / 611 / 2,323, baseline 6,501 | identical, 192 rows (48 × 4) |
| 1,344 scored calls | 384 + 384 + 288 + 288 |
| tally 6W / 3L / 37 ceiling / 1 tied-low over 47 | identical, case for case |
| noise floor "51 of 846 — 6.0%" | exactly 51/846 on the three byte-identical arms |
| replication moves the tally to 5W / 2L | identical |
| scale 2.97× size-weighted over 38 fixtures | identical |

Method checks that hold:

- **The grader is arm-blind.** One `accept` per case (`evals/cases.ts:27`), applied
  to every arm; `proseAgrees` feeds only the misreadings table, never accuracy.
- **Re-grading is live.** `report.ts:33` re-derives `pass` from the stored reply,
  and the stored and re-derived counts now agree on every arm but `resolved`
  (274 → 275), i.e. the `path()` fix is doing what it says.
- **The trust cue is not driving the result.** This is the strongest single piece
  of evidence for objectivity: the neutral-preamble matrix scores `resolved`
  276/282 against 275/282, +0.4 points.
- **Three decisions cost the format and are real:** the `not-stated` exclusion,
  the hovered `getComputedStyle` dump now given to `dom` (`capture.ts:50`), and
  `path()` accepting a leading token.

## Issues still live

### 1. `out/REPORT.md` contradicts the doc

`report.ts:294-301` hardcodes prose from an earlier era: "351 of 355 unaffected
attempts — 1.1% noise", "250/264 and 252/264", "6 wins / 5 losses into 5 wins /
7 losses". Current data: 51/846 (6.0%), denominators are 282, and the shift is
6W/3L → 5W/2L. `resolved-format-eval.md` has all three right; the generated
artifact readers are pointed at does not.

This is the stale-denominator failure the doc retracts elsewhere, reappearing in
the one file that is supposed to be derived rather than written.

**Fix:** derive the paragraph from the two matrices the way the cost ratios are
derived, or delete the figures and link to the doc.

### 2. "`shot+dom` holds every fact the resolved document holds" is false

Stated at `report.ts:120`, `arms.ts:23` and `resolved-format-eval.md:102`.
`out/capture/provenance/dom.txt` carries `border-radius: 12px` on the panel and
nothing about where it came from. The `←` lines are **additional facts**, not
arithmetic left un-worked-out.

That sentence is what makes `provenance` 6/6 against 0/6 read as an empirical
result rather than a definitional one. The finding is worth keeping — it is
structural, and re-running cannot move it — but it has to be stated as "the
alternatives do not carry the fact", which is what the body text already says.

### 3. No `source` (HTML+CSS) arm

`resolved-format-eval.md:294` records it as "not run — superseded by `dom`, a
strictly stronger baseline". `dom` is not strictly stronger: source **contains**
provenance and dead-state cascade, which is exactly what the two surviving
findings measure and exactly what `dom` lacks. And by this repo's own
`eval:scale`, source is ~3× *smaller* than the document.

So the two widest margins are measured only against arms that were denied the
source code, while the realistic agent context is source + screenshot + devtools.
This is the first question an outside reader asks.

**Fix:** run a `source` arm, or narrow the claim to "against evidence derived from
the rendered page".

### 4. A second, unmeasured trust cue

The `@` legend inside the document — "already resolved, not relative to the
parent" — is arm-exclusive and was added after seeing three cases fail.
`--preamble=neutral` removes the preamble only, so the trust cue is controlled
partially. Disclosed as "three cases are no longer blind" (`:738`), but the
control run does not cover it.

## Minor

- `resolved-format-eval.md:299` — "it happened 31 times" is stale; the current run
  has 38 ties (37 at ceiling, 1 below).
- Cost means are per-case unweighted and dominated by the dense cases (`dom` max
  10,767 tokens). The mean is labelled as a mean, so this is a reading hazard
  rather than an error.
- `evals/out` is still untracked and still the only copy of both matrices.

## What is safe to quote

- The aggregate: **98% at 552 mean prompt tokens against 90% / 87% / 72% at
  2,323 / 1,878 / 611.** Reproduced across two matrices, arm ordering identical,
  every arm within 1.4 points.
- **provenance and repair, 6/6 against 0/6**, as a structural absence in the
  alternatives — with issue 3 stated beside it.
- The negative result on `measurement` (96 / 97 / 99), which is the most credible
  number here precisely because it runs against the format.

Not safe at a 6% noise floor: the win/loss tally, any category cell, and any
margin of one or two attempts.
