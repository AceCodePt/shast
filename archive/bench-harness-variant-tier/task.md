---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: bench: rewrite harness to variant x tier x scenario with @tier alias

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The bench currently sweeps tiers x shapes x sizes x two compilers and reports a rows array with fixed-cost and slope tables. We are replacing that with a variant x tier x scenario model, a single compiler, and committed tier-agnostic scenario files imported through a stable "@tier" alias.

Decisions from the design discussion:
- Scenario corpus and harness are decoupled: scenarios import "@tier"; the harness generates a tsconfig per (variant, tier, scenario) whose paths maps "@tier" to that tree's index.ts and whose include names exactly that one scenario file. Scenario text never changes; only the generated tsconfig does.
- A variant is a copy of the project under bench/variants/<name>/ (must contain src/), modified. The repo's own src is the default variant, spelled "src", and is NOT a directory under bench/variants/. Vendor with the existing add({ sourceRoot, tier }) from scripts/cli.ts.
- One compiler only (the repo's "typescript"); no compiler axis.
- No --sizes, --wall, --shapes, --compilers. No slope/fixed-cost tables, no sweeps.
- Document shape mirrors the tsyntax harness: scenarios keyed by name with deltaVsNull and deltaVsBaseline, check/total as "0.27s" strings, codes array, nearWallProblems listing scenarios that tripped TS2589/TS2590.
- The results and baseline files are a single JSON keyed by "<variant>/<tier>", each entry the per-combo document.

## Requirements

- [ ] Create bench/scenarios/null.ts: `import "@tier";` and nothing else (the floor; deltaVsNull is measured against it).
- [ ] Vendor trees with add({ sourceRoot: REPO_ROOT for variant "src", otherwise bench/variants/<name>, tier, dest: bench/.generated/<variant>/<tier>, force: true }). The tree entry is bench/.generated/<variant>/<tier>/shast/index.ts.
- [ ] For each (variant, tier, scenario) write bench/.generated/<variant>/<tier>/tsconfig.<scenario>.json: extends the root tsconfig; compilerOptions.types: []; compilerOptions.paths { "@tier": ["./shast/index.ts"] }; exclude ["node_modules","dist"]; include [the relative path to bench/scenarios/<scenario>.ts] naming exactly the one scenario.
- [ ] Enumerate scenarios from bench/scenarios/*.ts (sorted, extension stripped); --scenarios a,b filters the set.
- [ ] Run tsc with --pretty false --extendedDiagnostics -p <tsconfig>. Instantiations and types from a single run; check/total are the mean over --repeats runs, formatted as "0.27s".
- [ ] Emit bench/out/results.json as { harness: "shast-bench", tsc, generatedAt, baseline, results: { "<variant>/<tier>": { impl, implLabel, variant, tier, scenarios: { <name>: { instantiations, types, check, total, ok, codes, deltaVsNull, deltaVsBaseline } }, nearWallProblems } } }.
- [ ] deltaVsNull = instantiations - the null scenario's; deltaVsBaseline = instantiations - the baseline's same (variant, tier, scenario), or null when absent.
- [ ] nearWallProblems = [{ scenario, codes }] for each scenario whose codes include TS2589 or TS2590.
- [ ] Flags: --variants (default src), --tiers (default minimal,common,full), --scenarios, --repeats (default 3), --json [path|-] (default bench/out/results.json), --save-baseline, --fail-on-drift, --report-only. Remove --compilers, --shapes, --sizes, --wall, --wall-max.
- [ ] bench/baseline.json shares the schema: --save-baseline writes it with deltaVsNull/deltaVsBaseline nulled and baseline null.
- [ ] --fail-on-drift exits 1 when any scenario's instantiations or types differ from the baseline.
- [ ] Remove now-dead code: readTierConfig and the tierMediaQuery/tierKeyframe readers, componentSource/fixtureSource shape generators, slope/fixedCostTable/wallTable, the Row/Diagnostics compiler fields, the wall sweep, and the attachDeltas/documentRows machinery.
- [ ] Create bench/variants/ with a README stating a variant is a copy of the project containing src/, plus the src default.

## Verification

pnpm exec tsx bench/harness.ts --variants src --tiers minimal,common,full --repeats 1 runs and writes bench/out/results.json with src/minimal, src/common, src/full, each carrying a null scenario with ok:true.
--json - writes the same object to stdout with all human output on stderr and parses with node -e.
With a throwaway variant (cp -r src bench/variants/scratch/src), --variants src,scratch yields src/<tier> and scratch/<tier> keys; remove scratch afterward.
--save-baseline then a second run with --fail-on-drift exits 0; edit a source file, re-run --fail-on-drift, exits 1.
--report-only re-renders from the last results.json without measuring.
pnpm test stays green (bench is excluded from the root tsconfig).

## Prohibited Patterns

- Do not keep any two-compiler (ts7/ts5) code path, COMPILER_PACKAGES, or --compilers flag.
- Do not reintroduce shapes, sizes, n-component sweeps, slopes, or a --wall/break-point sweep.
- Do not hardcode tier-specific @media queries or keyframe names into the harness; scenarios are tier-agnostic.
- Do not import the repo's src barrel; vendor per tier with add() and import only through @tier.
- Do not let a scenario file change between variants or tiers; the only per-combo difference is the generated tsconfig.
