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
| `minimal` | 149,004 | 42,336 | 0.12s |
| `common` | 294,053 | 64,175 | 0.29s |
| `full` | 596,956 | 131,397 | 0.73s |

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
| calc-big | 224,316 | 53,128 |
| calc-small | 195,170 | 51,840 |
| classes-big | 194,240 | 51,586 |
| classes-small | 191,921 | 51,313 |
| complex-big | 196,740 | 52,731 |
| complex-small | 194,370 | 52,092 |
| mixed-big | 200,354 | 52,226 |
| mixed-small | 196,499 | 51,975 |
| null | 149,004 | 42,336 |
| simple-big | 183,037 | 49,968 |
| simple-small | 180,624 | 49,815 |

### `common` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 428,631 | 86,692 |
| calc-small | 399,467 | 85,329 |
| classes-big | 402,949 | 85,419 |
| classes-small | 400,344 | 85,128 |
| complex-big | 407,032 | 86,747 |
| complex-small | 404,104 | 86,061 |
| mixed-big | 410,922 | 86,458 |
| mixed-small | 406,967 | 86,145 |
| null | 294,053 | 64,175 |
| simple-big | 373,879 | 80,033 |
| simple-small | 372,267 | 80,050 |

### `full` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 930,644 | 200,707 |
| calc-small | 901,424 | 199,981 |
| classes-big | 938,756 | 201,135 |
| classes-small | 935,499 | 200,861 |
| complex-big | 912,913 | 201,742 |
| complex-small | 908,651 | 200,974 |
| mixed-big | 943,587 | 201,826 |
| mixed-small | 939,572 | 201,436 |
| null | 596,956 | 131,397 |
| simple-big | 867,225 | 193,469 |
| simple-small | 865,608 | 193,482 |

## Attribute arms: arrays vs piping

Attribute values are authored as an array of single arms
(`direction: ["'ltr'", "'rtl'"]`), each validated on its own by tsyntax's
`DSLValidateArm`. The [`piped`](../bench/variants/piped/README.md) variant
authors each value as one piped DSL string instead
(`direction: "'ltr' | 'rtl'"`), validated by `DSLValidate`. On the same
scenarios, piping costs more at every tier:

| Tier | Scenario | arrays (`src`) | piped |
| --- | --- | ---: | ---: |
| `minimal` | `null` | 149,004 | 153,871 |
| `common` | `null` | 294,053 | 336,625 |
| `full` | `null` | 596,956 | 676,351 |
| `full` | `classes-big` | 938,756 | 1,050,733 |
| `full` | `mixed-big` | 943,587 | 1,055,612 |

The difference is a fixed per-tier registry cost - it moves the `null` floor by
the whole amount, plus a small constant per scenario - and it tracks the arm
count at roughly **30 instantiations per arm**, paid on every program:
`DSLValidate` splits the whole value and threads an accumulator per arm, where
`DSLValidateArm` runs one bounded check per arm.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
