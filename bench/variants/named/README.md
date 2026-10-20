# `named` variant

A copy of the repository's `src` with every anonymous member of the two big
intersections in `engine/types.ts` extracted into a named type alias:

| | default `src` | this variant |
| --- | --- | --- |
| `ValidateComponentCSSStructure` result | anonymous `{...}` members | `CSSChildBlocks`, `CSSFlatProps`, ... |
| `ValidateComponentStructure` tail | `{ css?: {} } & (...) & (...)` | `ComponentCSSSlot`, `ComponentEmptySlot`, ... |

Scope: `engine/types.ts` only. The other 53 files are byte-identical to `src`.

## What was extracted

`ValidateComponentCSSStructure`'s intersection members: `CSSChildBlocks`,
`CSSFlatProps`, `CSSLockedProps`, `CSSParentProps`, `CSSCustomPropertyProps`,
`CSSPseudoClassBlocks`, `CSSQueryBlocks`, `CSSPseudoElementBlocks`,
`CSSClassBlocks`, `CSSScopedBlocks`.

`ValidateComponentStructure`'s trailing slots: `ComponentCSSSlot`,
`ComponentInnerHTMLSlot`, `ComponentAttributesSlot`,
`ComponentOptionalAttributesSlot`, `ComponentEmptySlot`, and the
`VoidInnerHTMLError` marker.

## How it was built

Copy `src` and replace `engine/types.ts`. [`namedify.mjs`](namedify.mjs)
refreshes the copy while keeping that one file:

```sh
node bench/variants/named/namedify.mjs
```

When `src/engine/types.ts` changes, the named file must be re-derived by hand;
the script only preserves it while syncing the other files.

## Run

Standalone typecheck:

```sh
pnpm exec tsc -p bench/variants/named/tsconfig.json
```

In the harness:

```sh
pnpm bench -- --variants src,named
```

## Measured

Instantiations, `src` against this variant (TypeScript 7.0.2,
`--variants src,named`, check times are means of 3 runs):

| tier | scenario | `src` | `named` | delta |
| --- | --- | ---: | ---: | ---: |
| minimal | null | 147,762 | 148,418 | +0.44% |
| common | null | 292,811 | 293,467 | +0.22% |
| full | null | 595,714 | 596,370 | +0.11% |
| full | simple-small | 864,408 | 865,362 | +0.11% |
| full | classes-big | 937,604 | 940,165 | +0.27% |
| full | mixed-big | 942,483 | 945,695 | +0.34% |
| all 27 | | 13,037,059 | 13,086,370 | **+0.38%** |

Types rise with it: 2,917,547 -> 2,930,476 (+0.44%).

Naming does not reduce instantiations. Each parameterised alias is instantiated
per node, where the inline literal used to be folded into the enclosing
conditional's instantiation, so the cost grows with the scenario and is largest
in relative terms on `minimal` (+0.90%), where the fixed registry cost is
smallest. The `null` floor moves by the same +656 at every tier: that is the
alias declarations themselves.

Check time is within noise at this sample size (sum of the 27 means: 12.92s for
`src`, 12.21s for `named`), so this is a counter experiment, not a wall-clock
win.

The diagnostic trade is small but real: an unknown-property dump prints the
alias name instead of the expanded literal, and is ~35 bytes shorter (750 -> 715
on a `colr` typo probe), but reads as `CSSChildBlocks<...>` rather than a shape.
