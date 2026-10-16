---
wait_human_start: false
wait_human_merge: false
dependencies: [bench-harness-variant-tier, bench-scenarios-as-files]
---

# Task: bench: re-record bench/baseline.json in the variant/tier schema

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

bench/baseline.json still holds the old rows/slope schema keyed by compiler/tier/shape/n. The harness now diffs against the new variant/tier/scenario document, so the baseline must be re-recorded, otherwise every deltaVsBaseline is null.

## Requirements

- [ ] Run pnpm exec tsx bench/harness.ts --variants src --tiers minimal,common,full --save-baseline.
- [ ] Commit the regenerated bench/baseline.json in the new schema (results keyed by src/<tier>, scenarios keyed by name, deltaVsBaseline null).
- [ ] Note in the commit message that this retires the previously recorded numbers, which bench-docs-scenario-model then re-quotes.

## Verification

node -e "const b=require('./bench/baseline.json'); for (const k of Object.keys(b.results)) console.log(k, Object.keys(b.results[k].scenarios).length)" prints src/minimal, src/common, src/full with one entry per scenario.
A subsequent run with --fail-on-drift exits 0.

## Prohibited Patterns

- Do not hand-edit baseline.json.
- Do not record the baseline from a non-default variant, or from a subset of tiers, unless the docs match.
