# shast type-check benchmark harness

This directory holds the harness that produces the performance figures quoted
in [`../README.md`](../README.md) and [`../docs/performance.md`](../docs/performance.md).
It lives in the repo so the numbers have a reproducible source instead of being
"a local benchmark harness that is not included in this repository".

It measures `tsc` cost against the **vendored consumer trees** that `shast add`
writes, so the program under test is exactly what a consumer's compiler sees.
There is a **single compiler**: the repository's own `typescript` package.

## The model: variant x tier x scenario

- **Variant** - a copy of the project used as the source for a run. The
  repository's own `src` is the default variant, spelled `src`; every other
  variant lives in [`variants/`](variants/README.md) (a directory containing a
  `src/`). Each (variant, tier) is vendored once into
  `bench/.generated/<variant>/<tier>/shast` through the real `add()` from
  `scripts/cli.ts`.
- **Tier** - `minimal`, `common`, or `full`: which shipped tier files are
  vendored. Only the chosen tier's files are written, so the other tiers are
  never pulled into the program.
- **Scenario** - a TypeScript file in [`scenarios/`](scenarios/). Scenarios are
  **tier-agnostic**: each imports the `@tier` alias and never names a tier. For
  every (variant, tier, scenario) the harness generates a tsconfig that extends
  the root tsconfig, maps `@tier` at that tree's entry
  (`./shast/index.ts`), and includes exactly that one scenario file. The
  scenario text never changes; only the generated tsconfig does.

`scenarios/null.ts` (`import "@tier";`) is the floor: it measures the cost of
loading a tree with no components checked, and every other scenario carries a
`deltaVsNull` against it.

## Run

```sh
pnpm bench                              # every variant x tier x scenario
pnpm bench -- --variants src,piped,named  # add variants from bench/variants/
pnpm bench -- --tiers common            # one tier
pnpm bench -- --scenarios null          # one scenario
pnpm bench -- --json -                  # emit the result document to stdout
pnpm bench -- --save-baseline           # record bench/baseline.json
pnpm bench -- --fail-on-drift           # exit 1 if a run drifts from baseline
pnpm bench -- --report-only             # re-render RESULTS.md, no measuring
```

Flags: `--variants a,b` (default `src`), `--tiers a,b` (default
`minimal,common,full`), `--scenarios a,b` (default: every file in
`scenarios/`), `--repeats n` (default 3), `--json [path|-]`. `--report-only`
re-renders `RESULTS.md` from the last `results.json` without measuring.

Results are written to `bench/out/results.json` and `bench/out/RESULTS.md`.
`bench/out/` and `bench/.generated/` are gitignored. `bench/baseline.json` is
deliberately tracked: the next run diffs its counters against it and reports
drift.

## What it measures

Every run is `tsc --pretty false --extendedDiagnostics -p <scenario tsconfig>`.

- **Instantiations** - deterministic, machine-stable, and the primary metric.
  Read from a single run.
- **Types** - also deterministic: distinct type objects created. It can move
  while instantiations stay flat, so drift compares both.
- **Check time** / **total time** - wall-clock, machine-dependent. The mean
  over `--repeats` (default 3), formatted as `"0.27s"`.
- **ok** - whether the scenario's program compiled.
- **codes** - the error codes the compiler reported, if any.
- **deltaVsNull** - instantiations minus the `null` scenario's, on the same
  (variant, tier).
- **deltaVsBaseline** - instantiations minus the recorded baseline's for the
  same (variant, tier, scenario), or null when the baseline has no such row.

## LSP completion (not what the harness measures)

The harness measures whole-program `tsc`; it does not model the editor's
completion path, which resolves one contextual type and enumerates its
properties. [`lsp-probe.mjs`](lsp-probe.mjs) drives the API the language server
exposes (`typescript/unstable/sync`) against an already-generated tree:

```sh
node bench/lsp-probe.mjs --scenario mixed-big --at "css: {"
node bench/lsp-probe.mjs --variant named --scenario mixed-big --at "css: {"
```

On the `full` / `mixed-big` tree, completion at the end of `css: {`:

| tree | entries | cold | warm median |
| --- | ---: | ---: | ---: |
| `src` | 299 | 0.73s | 16ms |
| `named` | 299 | 0.73-0.82s | 16-18ms |

Inside `attributes: {` it is 82 entries, ~0.75s cold and ~15ms warm. The entry
lists are identical between the two trees.

The cold request is the editor's loading flash: the first completion after the
program loads resolves the `css` contextual type and enumerates the 15-member
intersection. Warm requests reuse the resolved type and return in ~15ms. Naming
the intersection members moves neither number, so the flash is not something the
names can fix - it is the one-off cost of resolving the type.

## One schema for the result and the baseline

`bench/out/results.json` and `bench/baseline.json` are the same document shape
(`ResultsDocument` in `harness.ts`); the baseline is that document with
`baseline`, `deltaVsNull`, and `deltaVsBaseline` all null. The result carries
the deltas, so the report and the `--fail-on-drift` gate read the same numbers
and can never disagree. `--json -` writes that document to stdout, which moves
all human output to stderr so the pipe stays parseable.

## Recorded baseline

From `pnpm bench -- --save-baseline`, TypeScript 7.0.2. Check time is the mean
of 3 runs on one machine; instantiations are machine-stable. The table quotes
the `null` scenario - the tree loaded, with no components checked - for each
tier of the default variant:

| Tier | Instantiations | Types | Check |
| --- | ---: | ---: | ---: |
| `minimal` | 147,762 | 42,221 | 0.12s |
| `common` | 292,811 | 64,060 | 0.23s |
| `full` | 595,714 | 131,282 | 0.71s |

Every scenario of the default variant compiles at every tier.

## Known results and caveats

- **Instantiation counts are the comparable number across machines**; check
  times vary.
- **The numbers are only as current as the commit.** Re-run `pnpm bench --
  --save-baseline` after a change that could affect type-checking cost.
