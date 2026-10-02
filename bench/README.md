# shast type-check benchmark harness

This directory holds the harness that produces the performance figures quoted
in [`../README.md`](../README.md) and [`../docs/performance.md`](../docs/performance.md).
It lives in the repo so the numbers have a reproducible source instead of being
"a local benchmark harness that is not included in this repository".

It measures `tsc` cost against the **vendored single-tier consumer tree** that
`shast add` writes - not against the repo's own `src/index.ts` barrel, which
re-exports all three tiers and would measure a different program.

## Run

```sh
pnpm bench                              # full sweep, both compilers, writes baseline
pnpm bench -- --quick                   # fast smoke run
pnpm bench -- --tiers common --sizes 1,10,50,100
pnpm bench -- --save-baseline           # record bench/baseline.json
pnpm bench -- --fail-on-error           # exit 1 if any fixture fails to compile
```

Results are written to `bench/out/results.json` and `bench/out/RESULTS.md`.
`bench/out/` and `bench/.generated/` are gitignored. `bench/baseline.json` is
deliberately tracked: the next run diffs its instantiation counts against it and
reports drift in `RESULTS.md`.

## The two compilers

The whole point of this harness is that TypeScript 7 (the development target)
and TypeScript 5 (what most consumers run) are measured **side by side and never
confused**. They are installed under distinct package aliases:

| id | package alias | version | role |
| --- | --- | --- | --- |
| `ts7` | `typescript` | 7.0.2 | development target |
| `ts5` | `typescript-5` | 5.9.3 | the consumer reality |

The alias is a plain `devDependency`:

```json
"typescript-5": "npm:typescript@5.9.3"
```

The harness resolves each package's own `bin/tsc` through `require.resolve`, so
every row is labelled with the exact version that produced it. Adding a third
compiler is a matter of adding one alias and one entry to `COMPILER_PACKAGES` in
`harness.ts`.

## What it sweeps

The cartesian product of:

- **Tiers** - `minimal`, `common`, `full`. Each is vendored fresh via the real
  `add()` from `scripts/cli.ts`, so the measured tree is exactly what a consumer
  gets.
- **Component shapes** - `flat`, `modest` (the README's `ul > li > span`, one
  `:hover`, one nested `> child`), `hover`, `media`, `rich` (`display: flex`,
  `calc()`, gated props), and `keyframes`.
- **Component counts** - `1`, `10`, `50`, `100`, plus a `baseline` fixture that
  loads the tree and defines no components.
- **Compilers** - `ts7` and `ts5`.

Every fixture is generated into its own file with its own tsconfig that pins the
measurement options and includes only that file, so no run can be helped by
another's cache. Components are made distinct (distinct text and values) so
TypeScript cannot cache instantiations by identity.

The measurement options mirror the repo's own `tsconfig.json` strictness (minus
the `@/*` path alias the vendored tree does not use). `types: []` keeps
`@types/node` out of the program.

## What it measures

Every run is `tsc --pretty false --extendedDiagnostics -p <fixture tsconfig>`.

- **Instantiations** - deterministic, machine-stable, and the primary metric.
  Read from one run.
- **Check time** - wall-clock, machine-dependent. The mean over `--repeats`
  (default 3).
- **Per-component cost** - the slope between the two largest component counts,
  `(I(n_max) - I(n_prev)) / (n_max - n_prev)`. This is the documented method and
  it excludes the one-time cost of the first component, which would otherwise
  inflate a `(I(n) - I(0)) / n` figure.

## Reading the output

`RESULTS.md` has four sections:

1. **Fixed cost** - the baseline for each tier, both compilers, with ratios.
2. **Per-component cost** - the asymptotic slope per tier and shape, both
   compilers.
3. **Raw measurements** - every row, so nothing is hidden behind a summary.
4. **Baseline drift** - instantiation changes since `bench/baseline.json`.

## Recorded baseline

From `pnpm bench -- --save-baseline` at commit `8c296fc`, TypeScript 7.0.2 and
5.9.3. Check time is the mean of 3 runs on one machine; instantiations are
machine-stable.

Fixed cost (tree loaded, no components):

| tier | ts7 inst | ts7 check | ts5 inst | ts5 check |
| --- | ---: | ---: | ---: | ---: |
| minimal | 186,879 | 158 ms | 90,207 | 1,237 ms |
| common | 403,029 | 317 ms | 173,892 | 1,610 ms |
| full | 770,988 | 901 ms | 416,088 | 2,793 ms |

Per-component slope at `n=100` (`common` tier):

| shape | ts7 inst | ts7 check | ts5 inst | ts5 check |
| --- | ---: | ---: | ---: | ---: |
| flat | 618 | 1.1 ms | 618 | 3.4 ms |
| modest (README shape) | 6,766 | 11.3 ms | 6,766 | 30.3 ms |
| hover | 2,665 | 4.2 ms | 2,665 | 15.5 ms |
| media | 3,076 | 4.0 ms | 3,076 | 14.9 ms |
| rich | 6,904 | 14.5 ms | 6,904 | 37.2 ms |
| keyframes | 1,540 | 2.9 ms | 1,540 | 7.9 ms |

Two things stand out. First, the per-component **instantiation** slope is
identical between TS 5 and TS 7 for every shape: the compilers do the same
marginal work, and TS 7's advantage is the much smaller fixed registry load
(~0.43x the instantiations) plus faster execution (the TS 5 fixed cost is ~5x
the TS 7 one). Second, the README's older figures (fixed ~1.17M / ~1.1s, ~15K /
~25ms per component) are roughly 2-3x the current measured values, consistent
with having been recorded before the single-tier `shast add` entry and the
array-only config optimization landed.

## Known results and caveats

- **The `full` tier does not type-check ordinary components.** Under the
  measurement options, any `full` fixture with a CSS block fails with
  `TS2589: Type instantiation is excessively deep and possibly infinite` at the
  first property. Only the `flat` shape compiles. This is reported as a result,
  not hidden: the harness records the error and keeps going. It is consistent
  with the README's advice that `full` is a reference rather than a starting
  point, but it is stronger - `full` is not usable as a component registry at
  this compiler depth budget.
- **`minimal` lacks some vocabulary** the feature shapes use (`animation`, and
  `calc()` on `width`), so `keyframes` and `rich` do not compile there. The
  `media` shape reads each tier's own registered `@media` string, so it compiles
  on every tier.
- **Instantiation counts are the comparable number across machines**; check
  times vary. The TS 5 check times in particular are wall-clock from one
  machine.
- **The numbers are only as current as the commit.** Re-run `pnpm bench --
  --save-baseline` after a change that could affect type-checking cost.
