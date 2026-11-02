# Performance (indicative)

The figures below are produced by the in-repo harness in [`bench/`](../bench/)
(`pnpm bench`, recorded in `bench/baseline.json`), so they can be re-measured
rather than taken on trust. Measured on **TypeScript 7.0.2**, the development
target, against the repository's own `src` variant, with the repository's own
`typescript` package as the single compiler and `tsyntax` 1.1.4.

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
| `minimal` | 146,688 | 41,740 | 0.13s |
| `common` | 291,737 | 63,585 | 0.25s |
| `full` | 594,640 | 130,809 | 0.76s |

Instantiation counts are machine-stable; check times vary by machine. The cost
grows with tier breadth: keep files to a handful of components each and the
marginal cost stays small.

## Per scenario: instantiations and types

The tables below quote `instantiations` and `types` for every scenario, on the
default (`src`) variant, per tier. All values are read from
`bench/baseline.json`. Every scenario compiles at every tier.

### `minimal` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 222,014 | 52,532 |
| calc-small | 192,868 | 51,244 |
| classes-big | 191,924 | 50,993 |
| classes-small | 189,605 | 50,720 |
| complex-big | 194,424 | 52,138 |
| complex-small | 192,054 | 51,499 |
| mixed-big | 198,038 | 51,633 |
| mixed-small | 194,183 | 51,382 |
| null | 146,688 | 41,740 |
| simple-big | 180,721 | 49,375 |
| simple-small | 178,308 | 49,222 |

### `common` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 426,295 | 86,099 |
| calc-small | 397,131 | 84,736 |
| classes-big | 400,633 | 84,833 |
| classes-small | 398,028 | 84,542 |
| complex-big | 404,716 | 86,161 |
| complex-small | 401,788 | 85,475 |
| mixed-big | 408,606 | 85,872 |
| mixed-small | 404,651 | 85,559 |
| null | 291,737 | 63,585 |
| simple-big | 371,563 | 79,447 |
| simple-small | 369,951 | 79,464 |

### `full` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 928,284 | 200,117 |
| calc-small | 899,064 | 199,391 |
| classes-big | 936,440 | 200,551 |
| classes-small | 933,183 | 200,277 |
| complex-big | 910,597 | 201,158 |
| complex-small | 906,335 | 200,390 |
| mixed-big | 941,271 | 201,242 |
| mixed-small | 937,256 | 200,852 |
| null | 594,640 | 130,809 |
| simple-big | 864,909 | 192,885 |
| simple-small | 863,292 | 192,898 |

## Attribute arms: arrays vs piping

Attribute values are authored as an array of single arms
(`direction: ["'ltr'", "'rtl'"]`), each validated on its own by tsyntax's
`DSLValidateArm`. The [`piped`](../bench/variants/piped/README.md) variant
authors each value as one piped DSL string instead
(`direction: "'ltr' | 'rtl'"`), validated by `DSLValidate`. On the same
scenarios, piping costs more at every tier:

| Tier | Scenario | arrays (`src`) | piped |
| --- | --- | ---: | ---: |
| `minimal` | `null` | 146,688 | 153,871 |
| `common` | `null` | 291,737 | 336,625 |
| `full` | `null` | 594,640 | 676,351 |
| `full` | `classes-big` | 936,440 | 1,050,733 |
| `full` | `mixed-big` | 941,271 | 1,055,612 |

The difference is a fixed per-tier registry cost - it moves the `null` floor by
the whole amount, plus a small constant per scenario - and it tracks the arm
count at roughly **30 instantiations per arm**, paid on every program:
`DSLValidate` splits the whole value and threads an accumulator per arm, where
`DSLValidateArm` runs one bounded check per arm.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
