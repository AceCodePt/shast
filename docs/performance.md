# Performance (indicative)

The figures below are produced by the in-repo harness in [`bench/`](../bench/)
(`pnpm bench`, recorded in `bench/baseline.json`), so they can be re-measured
rather than taken on trust. Measured on **TypeScript 7.0.2**, the development
target, against the repository's own `src` variant, with the repository's own
`typescript` package as the single compiler.

## What the harness measures

The harness runs every **variant x tier x scenario** combination. A scenario is
a tier-agnostic TypeScript file in `bench/scenarios/` that imports the `@tier`
alias; the alias resolves to the vendored tree's entry for the current
(variant, tier). `bench/scenarios/null.ts` imports `@tier` and nothing else, so
it measures the cost of loading a tree with no components checked. Every other
scenario carries a `deltaVsNull` against it, and `--fail-on-drift` compares
instantiations and types against the recorded baseline.

## The `null` scenario per tier

Loading a tree, before any component is checked (the `null` scenario, default
`src` variant):

| Tier | Instantiations | Types | Check |
| --- | ---: | ---: | ---: |
| `minimal` | 170,908 | 45,648 | 0.13s |
| `common` | 314,033 | 67,434 | 0.23s |
| `full` | 615,925 | 134,612 | 0.68s |

Instantiation counts are machine-stable; check times vary by machine. The cost
grows with tier breadth: keep files to a handful of components each and the
marginal cost stays small.

## Per scenario: instantiations and types

The tables below quote `instantiations` and `types` for every scenario, on the
default (`src`) variant, per tier. All values are read from
`bench/baseline.json`.

### `minimal` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| classes-big | 218,096 | 55,451 |
| classes-small | 215,851 | 55,181 |
| complex-big | 220,909 | 56,611 |
| complex-small | 218,670 | 55,975 |
| mixed-big | 224,381 | 56,099 |
| mixed-small | 220,502 | 55,848 |
| null | 170,908 | 45,648 |
| simple-big | 207,103 | 53,836 |
| simple-small | 204,690 | 53,683 |

### `common` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| classes-big | 424,394 | 89,240 |
| classes-small | 421,913 | 88,951 |
| complex-big | 428,925 | 90,605 |
| complex-small | 426,227 | 89,922 |
| mixed-big | 432,727 | 90,309 |
| mixed-small | 428,748 | 89,996 |
| null | 314,033 | 67,434 |
| simple-big | 395,852 | 83,852 |
| simple-small | 394,151 | 83,869 |

### `full` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| classes-big | 959,549 | 204,914 |
| classes-small | 956,395 | 204,642 |
| complex-big | 934,916 | 205,589 |
| complex-small | 931,124 | 204,822 |
| mixed-big | 964,542 | 205,664 |
| mixed-small | 960,503 | 205,274 |
| null | 615,925 | 134,612 |
| simple-big | 888,395 | 197,248 |
| simple-small | 886,689 | 197,261 |

## Near the wall

With the `full` tier, every scenario except the `simple-*` scenarios runs close
to the compiler's instantiation-depth limit: they fail with `TS2589` and are
listed in `nearWallProblems`. Those are the known limitation of the harness -
their counts are recorded, but the program never finishes checking. The
`minimal` and `common` tiers stay under the limit, and the `simple-*`
scenarios always pass.

The same signal is computed for every (variant, tier) combination; the
recorded baseline lists, per combination, the scenarios that hit it.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
