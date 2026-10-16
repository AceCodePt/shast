---
wait_human_start: false
wait_human_merge: false
dependencies: [bench-harness-variant-tier, bench-scenarios-as-files, bench-baseline-rerecord]
---

# Task: docs: describe the bench variant/tier/scenario model

## Metadata

- **Complexity:** Medium
- **Priority:** Low
- **Status:** Ready for Handoff

## Context

bench/README.md, docs/performance.md and the README performance section still describe the fixed-cost/slope model, two compilers, and --wall. All of that is gone; this task re-documents the bench and re-quotes the numbers from the re-recorded baseline.

## Requirements

- [ ] Rewrite bench/README.md for the new model: the scenario corpus, the @tier alias and per-(variant,tier,scenario) tsconfig isolation, variants as project copies, the single compiler, the document schema (deltaVsNull/deltaVsBaseline, nearWallProblems), and the flags.
- [ ] Rewrite docs/performance.md and the README "Performance (indicative)" section using the numbers from the re-recorded baseline: per scenario, instantiations/types on the default src variant (and per tier where useful), plus the near-wall scenarios/limitations. Remove the two-compiler comparison and the slope/wall prose.
- [ ] Remove every reference to --wall/--sizes/--compilers and to the old recorded numbers.

## Verification

grep across README.md, docs/performance.md and bench/README.md for "--wall", "--sizes", "--compilers", "slope", "ts5" and "TypeScript 5" returns nothing stale.
Every number quoted in docs/performance.md and the README performance section is reproducible from bench/baseline.json.

## Prohibited Patterns

- Do not quote numbers that are not present in bench/baseline.json.
- Do not leave any description of the removed slope/fixed-cost/two-compiler/wall model.
