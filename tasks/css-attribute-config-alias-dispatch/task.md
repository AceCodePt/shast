---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: CSS attribute-config: alias the gate/array dispatch

## Metadata

- **Complexity:** Low
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The array-only conversion is already merged (`css-attribute-config-array-only` is in `archive/`), and `package.json` pins `tsyntax ^1.1.0`. This task builds on that code and is independent of any other open task.

In `src/css/attribute-config/types.ts`, `ValidateCSSAttributesConfig` still writes its gate-versus-array dispatch inline inside a mapped type. Written inline, TypeScript caches this conditional per mapped-type key (`K`), so the identical conditional is re-evaluated for every attribute in a config even when attributes share a value or a gate shape. Moving the same conditional into a named type alias that takes the value as a parameter lets TypeScript cache by the alias's actual arguments, so attributes with the same value or gate shape share one evaluation. This is a type-level restructuring only: no runtime change, no config change, no new syntax.

Measured on `origin/main` at `8c296fc` (array-only fully merged), TS 7.0.2, `tsc --noEmit --checkers 1 --extendedDiagnostics`, one entry file per run, 0 type errors before and after, `npm test` 839 of 839 passing after:

| Entry file | Before | After (both alias tasks applied) |
|---|---|---|
| `src/css/attribute-config/variations/common.ts` | 87,525 | 64,588 (-26.21%) |
| `src/index.ts` | 326,817 | 240,303 (-26.47%) |

Those "after" numbers had both alias tasks (this one and `html-attribute-config-alias-dispatch`) applied together. The CSS entry above is attributable to this task alone because it does not import HTML attribute-config. Whole-repo `tsc -p .` including tests and examples went from 1,934,432 to 1,843,295 (-4.71%): tests and examples dominate that total, so expect a much smaller whole-repo percentage than per-entry. Earlier percentages quoted for this change were measured before array-only landed and no longer apply; do not use them.

## Requirements

- [ ] In `src/css/attribute-config/types.ts`, add a local (non-exported) alias directly above `ValidateCSSAttributesConfig`:

```ts
type ValidateCSSAttributeEntry<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  V,
> = V extends BaseCSSAttributeComplexValue
  ? {
      [G in keyof V]: {
        self: ValidateCSSAttributesSimpleConfig<Keywords, S, V[G]["self"]>;
        children: ValidateCSSAttributesSimpleConfig<Keywords, S, V[G]["children"]>;
      };
    }
  : ValidateCSSAttributeValue<S & Keywords, Extract<V, CSSAttributeArms>>;
```

The body is exactly today's inline conditional with the outer `A[K]` renamed to `V` and the inner mapped key renamed to `G`.
- [ ] Change `ValidateCSSAttributesConfig`'s mapped type to `[K in keyof A]: ValidateCSSAttributeEntry<Keywords, S, A[K]>;`. Keep its outer `keyof A extends string ? {...} : A` guard unchanged.
- [ ] Leave `V` as a bare, unconstrained type parameter. Do not rewrite the test as `[V] extends [BaseCSSAttributeComplexValue]`: that defeats the narrowing that makes `V[G]["self"]` type-check.
- [ ] Add a short comment directly above the alias saying why it is a named alias and not inline (alias instantiations are cached by their arguments; the same conditional inline in a mapped type is cached per key and shares nothing), so a future editor does not inline it back.
- [ ] Do not touch `ValidateCSSAttributeValue`, `ValidateCSSAttributesSimpleConfig`, `InferCSSAttributeValue`, `InferCSSAttributesSimpleConfig` or `InferCSSAttributesConfig`. A matching extraction on the infer side may be worth measuring separately; it is out of scope here.

## Verification

`pnpm check` and `pnpm test` green: zero type errors, no unused `@ts-expect-error`, 839 passing. Re-measure on a clean tree, before and after, with one run per entry (`src/css/attribute-config/variations/common.ts` and `src/index.ts`) using `--checkers 1`, and confirm a reduction in both. Measure fresh: do not assume the table above still holds on a different TypeScript version or after other work lands. Note that under TS 7.0.2 `paths` cannot be passed on the CLI and `baseUrl` was removed, so a throwaway tsconfig at the repo root (extending the root config, `files` pinned to one entry) is needed to run tsc per entry. Probe four cases and confirm identical accept/reject and identical diagnostics to before: a valid flat arm list, a valid gate value, a flat value using an unsupported token (`@ts-expect-error`), and a gate's `self` bag using an unsupported token (`@ts-expect-error`).

## Prohibited Patterns

- Do not change which values are accepted or rejected.
- Do not combine this with any other change; land it alone so its instantiation win is attributable.
- Do not inline the alias back "for clarity".
- Do not trust the quoted numbers; measure before and after on the actual change.
- Do not quote wall-clock times.
