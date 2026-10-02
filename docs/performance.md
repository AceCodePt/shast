# Performance (indicative)

The figures below are produced by the in-repo harness in [`bench/`](../bench/)
(`pnpm bench`, recorded in `bench/baseline.json`), so they can be re-measured
rather than taken on trust. Measured on **TypeScript 7.0.2**, the development
target, against a single-tier `common` vendored tree (`--tier common`, the
default): only `common.ts` is present, and the generated entry imports only that
tier, so the other tiers are never pulled in. **TypeScript 5.x is substantially
slower** - see the TS 5 comparison below.

## Fixed and per-component cost

Loading a single-tier tree is a **fixed ~403K instantiations / ~0.3s** of `tsc`
cost before a component is checked; each modest component (`ul > li > span`, one
`:hover`, one nested `> child`) then adds **~7K instantiations / ~11ms**. The
fixed cost by tier (TypeScript 7.0.2):

| Tier | Fixed instantiations | Fixed check time |
|---|---|---|
| `minimal` | 186,879 | 0.16s |
| `common` | 403,029 | 0.32s |
| `full` | 770,988 | 0.90s |

Per-component slope at `n=100` on the `common` tier:

| Shape | Instantiations | Check time |
|---|---|---|
| flat | 618 | 1.1ms |
| modest | 6,766 | 11.3ms |
| hover | 2,665 | 4.2ms |
| media | 3,076 | 4.0ms |
| rich | 6,904 | 14.5ms |
| keyframes | 1,540 | 2.9ms |

Instantiation counts are machine-stable; check times vary by machine. The
harness measures the slope between the two largest component counts, which
excludes the one-time cost of the first component that a `(I(n) - I(0)) / n`
figure would fold in. The earlier ~1.17M / ~15K figures predate the single-tier
`shast add` entry and the array-only config optimization and are no longer
current.

## TypeScript 5 comparison

The numbers above are the TS 7 development target. TypeScript 5.x is what most
projects run today, and it is materially slower. On the same harness with
TypeScript 5.9.3, the `common` fixed baseline was **~1.6s** (versus ~0.3s on
TS 7, about **5x**) and each modest component added **~30ms** (versus ~11ms,
about **3x**), **~3.5s total for 50**. The per-component *instantiation* slope is
identical between the two compilers (6,766 for `modest` on both); TS 5's fixed
load is lower in instantiations (173,892) but slower in wall-clock. These TS 5
figures are indicative wall-clock from one machine, not machine-stable like the
instantiation counts. shast still supports TypeScript 5.0+; this is a
disclosure, not a change in support.

Keep files to a handful of components each and the marginal cost stays small;
the fixed registry cost is paid once per program. The same harness produced
the fuller numbers in [`structural-coupling.md`](structural-coupling.md).
