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

Check time is within noise. The first 3-repeat run hinted at a ~5% win for
`named`; that was measurement order, not the code: the same `named`/`null`
measurement reported 0.81s when `src` ran first and 0.68s when `named` ran
first. An order-controlled run (5 full-tier scenarios, 9 repeats, both variant
orders) gives a per-scenario mean of **0.861s for `src` and 0.856s for
`named`**.

### Caching

TypeScript memoises an alias instantiation by the alias and its type arguments.
The members that take only registry arguments - `CSSFlatProps`,
`CSSCustomPropertyProps`, and the zero-arg slots - are instantiated once per
program and are effectively free.

The per-node members (`CSSChildBlocks`, `CSSLockedProps`,
`CSSPseudoClassBlocks`, ...) take the node type `T` and the node's `CSSValue`,
so every node produces a new cache key and the cache never hits. The type-object
count shows it: `named` creates ~500 more distinct types per scenario (one per
member per node), not fewer. There is no cache win to trade against the +0.38%.

Completion is unaffected too: at the end of `css: {` on `mixed-big` both trees
return the same 299 entries, take ~0.73-0.82s on the first request and 16-18ms
warm (see [`../../README.md`](../../README.md#lsp-completion-not-what-the-harness-measures)).
The one-off cold cost is the editor's loading flash, and naming does not move
it.

The gain is at the source level: the members are nameable, navigable, and
individually documented. The diagnostic trade is small: an unknown-property dump
prints the alias name instead of the expanded literal, and is ~35 bytes shorter
(750 -> 715 on a `colr` typo probe), but reads as `CSSChildBlocks<...>` rather
than a shape.
