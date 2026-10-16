# Performance (indicative)

The figures below are produced by the in-repo harness in [`bench/`](../bench/)
(`pnpm bench`, recorded in `bench/baseline.json`), so they can be re-measured
rather than taken on trust. Measured on **TypeScript 7.0.2**, the development
target, against a single-tier vendored tree (`shast add`): only the chosen
tier's files are present, and the generated entry imports only that tier, so the
other tiers are never pulled in.

## What the harness measures

The harness runs every **variant x tier x scenario** combination. A scenario is
a tier-agnostic TypeScript file in `bench/scenarios/` that imports the `@tier`
alias; the alias resolves to the vendored tree's entry for the current
(variant, tier). `bench/scenarios/null.ts` imports `@tier` and nothing else, so
it measures the **fixed cost of loading a tree**. Every other scenario carries a
`deltaVsNull` against it, and `--fail-on-drift` compares instantiations and types
against the recorded baseline.

## Fixed cost

Loading a single-tier tree, before any component is checked (TypeScript 7.0.2,
the `null` scenario):

| Tier | Instantiations | Types | Check time |
|---|---:|---:|---:|
| `minimal` | 170,908 | 45,648 | 0.13s |
| `common` | 314,033 | 67,434 | 0.24s |
| `full` | 615,925 | 134,612 | 0.67s |

Instantiation counts are machine-stable; check times vary by machine. The fixed
cost is paid once per program and grows with *config breadth*: keep files to a
handful of components each and the marginal cost stays small.

## TypeScript 5

shast still supports TypeScript 5.0+. The harness measures a single compiler
(the repository's own `typescript`), so it does not produce a TS 5 comparison;
earlier figures for TS 5 came from a two-compiler revision of the harness and
are no longer recorded here.

The same harness informs the fuller analysis in
[`structural-coupling.md`](structural-coupling.md).
