# Audit record: the resolved-format eval

A second, independent re-derivation of the numbers in
[`resolved-format-eval.md`](resolved-format-eval.md), run after the report was
rewritten. The narrow question: **does the harness, the grader or the write-up
favour the resolved format anywhere it should not.**

Every figure below was recomputed from `evals/out/*/attempts.json` by applying
the `accept` functions directly, without reading `REPORT.md`, plus a re-read of
`cost.json`. The first audit (`resolved-format-eval-audit.md`) was never
committed and is lost; this record is the surviving account.

## What reproduces

| claim | recomputed |
|---|---|
| accuracy 98 / 87 / 72 / 90 | `resolved` 275/282, `dom` 244/282, `shot` 203/282, `shot+dom` 253/282 |
| cost 552 / 1,878 / 611 / 2,323, baseline 6,501 | identical, 192 rows (48 × 4) |
| 1,344 scored calls | 48 × 4 arms × (8 + 8 + 6 + 6 models) |
| tally 6W / 3L / 37 ceiling / 1 tied-low over 47 | identical, case for case |
| noise floor "51 of 846 — 6.0%" | exactly 51/846 on the three byte-identical arms |
| replication moves the tally to 5W / 2L | identical |
| scale 2.97× size-weighted over 38 fixtures | identical |

Method checks that hold:

- **The grader is arm-blind.** One `accept` per case (`evals/cases.ts:27`), applied
  to every arm; `proseAgrees` feeds only the misreadings table, never accuracy.
- **Re-grading is live.** `report.ts:33` re-derives `pass` from the stored reply,
  and the stored and re-derived counts agree on every arm but `resolved`
  (274 → 275), i.e. the `path()` fix is doing what it says.
- **The trust cue is not driving the result.** The neutral-preamble matrix scores
  `resolved` 276/282 against 275/282, +0.4 points.
- **Three decisions cost the format and are real:** the `not-stated` exclusion,
  the hovered `getComputedStyle` dump given to `dom` (`capture.ts:50`), and
  `path()` accepting a leading token.

## Issues found, and where each now lives

The rewrite folded every one of these into the report; none is quietly dropped.

1. **A generated artifact once contradicted the report.** `report.ts` had
   hardcoded prose from an earlier era ("351 of 355 unaffected attempts — 1.1%
   noise", stale denominators and win/loss counts). The regenerated
   `out/REPORT.md` in the current cache is consistent with the report; if the
   artifact and the report ever disagree, the report is authoritative and the
   generator must be fixed to derive, not hardcode.
2. **"`shot+dom` holds every fact the resolved document holds" is false.** It is
   now stated as the opposite: `getComputedStyle` erases the cascade, so the
   `authoring` column is definitional. See the report's
   [where the margin comes from](resolved-format-eval.md#where-the-margin-comes-from).
3. **No `source` (HTML+CSS) arm was run**, and the reason given for skipping it
   ("superseded by `dom`, a strictly stronger baseline") is wrong. Now a
   first-class [threat to validity](resolved-format-eval.md#threats-to-validity),
   alongside the missing `dom+matched-styles` baseline.
4. **A second, uncontrolled trust cue.** The `@` legend sits inside the document,
   so the neutral-preamble control does not cover it. Now disclosed with the other
   mid-flight changes in
   [what changed during the eval](resolved-format-eval.md#what-changed-during-the-eval).

## Minor

- The "it happened 31 times" tie count is now 38 in the report (37 at ceiling,
  1 below).
- Cost means are per-case unweighted and dominated by the dense cases (`dom` max
  10,767 tokens). Labelled as a mean, so a reading hazard rather than an error.
- `evals/out` is untracked (gitignored) and is the only copy of both matrices on
  disk; it is archived as the `evals-cache` release asset rather than committed.

## What is safe to quote

- The aggregate: **98% at 552 mean prompt tokens against 90% / 87% / 72% at
  2,323 / 1,878 / 611.** Reproduced across two matrices, arm ordering identical,
  every arm within 1.4 points.
- **provenance and repair, 6/6 against 0/6**, as a structural absence in the
  alternatives — with the missing-baseline caveat stated beside it.
- The negative result on `measurement` (96 / 97 / 99), which is the most credible
  number here precisely because it runs against the format.

Not safe at a 6% noise floor: the win/loss tally, any category cell, and any
margin of one or two attempts.
