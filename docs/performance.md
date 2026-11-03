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
| `minimal` | 145,341 | 41,477 | 0.13s |
| `common` | 290,390 | 63,326 | 0.23s |
| `full` | 593,293 | 130,551 | 0.69s |

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
| calc-big | 220,676 | 52,269 |
| calc-small | 191,530 | 50,981 |
| classes-big | 190,577 | 50,730 |
| classes-small | 188,258 | 50,457 |
| complex-big | 193,077 | 51,875 |
| complex-small | 190,707 | 51,236 |
| mixed-big | 196,691 | 51,370 |
| mixed-small | 192,836 | 51,119 |
| null | 145,341 | 41,477 |
| simple-big | 179,374 | 49,112 |
| simple-small | 176,961 | 48,959 |

### `common` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 424,972 | 85,840 |
| calc-small | 395,808 | 84,477 |
| classes-big | 399,286 | 84,574 |
| classes-small | 396,681 | 84,283 |
| complex-big | 403,369 | 85,902 |
| complex-small | 400,441 | 85,216 |
| mixed-big | 407,259 | 85,613 |
| mixed-small | 403,304 | 85,300 |
| null | 290,390 | 63,326 |
| simple-big | 370,216 | 79,188 |
| simple-small | 368,604 | 79,205 |

### `full` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| calc-big | 926,961 | 199,859 |
| calc-small | 897,741 | 199,133 |
| classes-big | 935,093 | 200,293 |
| classes-small | 931,836 | 200,019 |
| complex-big | 909,250 | 200,900 |
| complex-small | 904,988 | 200,132 |
| mixed-big | 939,924 | 200,984 |
| mixed-small | 935,909 | 200,594 |
| null | 593,293 | 130,551 |
| simple-big | 863,562 | 192,627 |
| simple-small | 861,945 | 192,640 |

## Attribute arms: arrays vs piping

Attribute values are authored as an array of single arms
(`direction: ["'ltr'", "'rtl'"]`), each validated on its own by tsyntax's
`DSLValidateArm`. The [`piped`](../bench/variants/piped/README.md) variant
authors each value as one piped DSL string instead
(`direction: "'ltr' | 'rtl'"`), validated by `DSLValidate`. On the same
scenarios, piping costs more at every tier:

| Tier | Scenario | arrays (`src`) | piped |
| --- | --- | ---: | ---: |
| `minimal` | `null` | 145,341 | 153,871 |
| `common` | `null` | 290,390 | 336,625 |
| `full` | `null` | 593,293 | 676,351 |
| `full` | `classes-big` | 935,093 | 1,050,733 |
| `full` | `mixed-big` | 939,924 | 1,055,612 |

The difference is a fixed per-tier registry cost - it moves the `null` floor by
the whole amount, plus a small constant per scenario - and it tracks the arm
count at roughly **30 instantiations per arm**, paid on every program:
`DSLValidate` splits the whole value and threads an accumulator per arm, where
`DSLValidateArm` runs one bounded check per arm.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
