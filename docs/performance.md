# Performance (indicative)

The figures below come from a local benchmark harness that is **not part of
this repository**, so they are indicative, not reproducible here. Measured on
**TypeScript 7.0.2**, the development target, against a single-tier `common`
vendored tree (`--tier common`, the default): only `common.ts` is present, and
the generated entry imports only that tier, so the other tiers are never pulled
in. **TypeScript 5.x is substantially slower** - see the TS 5 comparison below.

Loading that single-tier tree is a **fixed ~1.17M instantiations / ~1.1s** of
`tsc` cost before a single component is checked. On top of that fixed cost,
`tsc` is **linear** in components — a file of 100 modest components
(`ul > li > span`, one `:hover`, one nested `> child`):

| Measure | single-tier `common` tree (`examples/basic.ts`) | +100 components | Per component |
|---|---|---|---|
| Instantiations | 1.17M | 2.69M | ~15K |
| Check time | 1.15s | 3.60s | ~25ms |

Instantiation counts are machine-stable; check times vary by machine. The
earlier ~4.8K / ~5ms figures were taken on a trivial component and
undercounted realistic ones.

## TypeScript 5 comparison

The numbers above are the TS 7 development target. TypeScript 5.x is what most
projects run today, and it is materially slower. On the same harness with 50
realistic components, TypeScript 5.9.3 showed a **fixed ~4.8s baseline** (versus
~1.1s on TS 7) and **~70ms per component** (versus ~25ms), for **~8.3s total**;
editor latency on TS 5 is noticeable. These TS 5 figures are indicative
wall-clock from one machine, not machine-stable like the instantiation counts.
shast still supports TypeScript 5.0+; this is a disclosure, not a change in
support.

Keep files to a handful of components each and the marginal cost stays small;
the fixed registry cost is paid once per program. The same harness produced
the fuller numbers in [`structural-coupling.md`](structural-coupling.md).
