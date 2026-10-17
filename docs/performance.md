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
| `minimal` | 147,762 | 42,221 | 0.12s |
| `common` | 292,811 | 64,060 | 0.23s |
| `full` | 595,714 | 131,282 | 0.71s |

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
| classes-big | 193,088 | 51,474 |
| classes-small | 190,757 | 51,201 |
| complex-big | 195,684 | 52,619 |
| complex-small | 193,278 | 51,980 |
| mixed-big | 199,250 | 52,114 |
| mixed-small | 195,371 | 51,863 |
| null | 147,762 | 42,221 |
| simple-big | 181,837 | 49,856 |
| simple-small | 179,424 | 49,703 |

### `common` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| classes-big | 401,797 | 85,307 |
| classes-small | 399,180 | 85,016 |
| complex-big | 405,976 | 86,635 |
| complex-small | 403,012 | 85,949 |
| mixed-big | 409,818 | 86,346 |
| mixed-small | 405,839 | 86,033 |
| null | 292,811 | 64,060 |
| simple-big | 372,679 | 79,921 |
| simple-small | 371,067 | 79,938 |

### `full` tier

| Scenario | Instantiations | Types |
| --- | ---: | ---: |
| classes-big | 937,604 | 201,023 |
| classes-small | 934,335 | 200,749 |
| complex-big | 911,857 | 201,630 |
| complex-small | 907,559 | 200,862 |
| mixed-big | 942,483 | 201,714 |
| mixed-small | 938,444 | 201,324 |
| null | 595,714 | 131,282 |
| simple-big | 866,025 | 193,357 |
| simple-small | 864,408 | 193,370 |

## Attribute arms: arrays vs piping

Attribute values are authored as an array of single arms
(`direction: ["'ltr'", "'rtl'"]`), each validated on its own by tsyntax's
`DSLValidateArm`. The [`piped`](../bench/variants/piped/README.md) variant
authors each value as one piped DSL string instead
(`direction: "'ltr' | 'rtl'"`), validated by `DSLValidate`. On the same
scenarios, piping costs more at every tier:

| Tier | Scenario | arrays (`src`) | piped |
| --- | --- | ---: | ---: |
| `minimal` | `null` | 147,762 | 153,871 |
| `common` | `null` | 292,811 | 336,625 |
| `full` | `null` | 595,714 | 676,351 |
| `full` | `classes-big` | 937,604 | 1,050,733 |
| `full` | `mixed-big` | 942,483 | 1,055,612 |

The difference is a fixed per-tier registry cost - it moves the `null` floor by
the whole amount, plus a small constant per scenario - and it tracks the arm
count at roughly **30 instantiations per arm**, paid on every program:
`DSLValidate` splits the whole value and threads an accumulator per arm, where
`DSLValidateArm` runs one bounded check per arm.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
