---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: HTML attribute-config: alias the gate/array dispatch

## Metadata

- **Complexity:** Low
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The array-only conversion is already merged (`html-attribute-config-array-only` and `html-tag-config-array-only` are in `archive/`). This task is independent of every other open task and of `css-attribute-config-alias-dispatch`; they can land in either order. See that task for the full explanation of why a named alias is cheaper than the same conditional written inline in a mapped type.

In `src/html/attribute-config/types.ts`, `ValidateHTMLAttributesConfig` has the same pattern: the gate-versus-array dispatch is written inline in the mapped type:

```
[K in keyof T]: T[K] extends BaseHTMLAttributeComplexValue
  ? { [V in keyof T[K]]: ValidateHTMLAttributesSimpleConfig<Keywords, T[K][V]> }
  : ValidateHTMLAttributeValue<Keywords, Extract<T[K], HTMLAttributeArms>>;
```

`src/html/tag-config/types.ts` calls `ValidateHTMLAttributesConfig` per tag and has no dispatch of its own, so it needs no edit and inherits the win.

Measured on `origin/main` at `8c296fc`, TS 7.0.2, `tsc --noEmit --checkers 1 --extendedDiagnostics`, one entry file per run, 0 type errors before and after, `npm test` 839 of 839 passing after. The CSS alias task was also applied for these runs, so only the HTML rows below are attributable to this task, and `src/index.ts` is the combined figure.

| Entry file | Before | After |
|---|---|---|
| `src/html/attribute-config/variations/common.ts` | 18,965 | 18,257 (-3.73%) |
| `src/html/tag-config/variations/common.ts` | 108,010 | 75,384 (-30.21%) |
| `src/index.ts` (both alias tasks) | 326,817 | 240,303 (-26.47%) |

Two caveats the next agent should know. First, the attribute-config entry alone improves only about 4%; almost all of the HTML gain shows up in tag-config. Second, the tag-config figure was measured with the CSS alias applied too, because `src/html/tag-config/variations/common.ts` imports CSS attribute-config; the split between the two tasks for that row is not isolated, so measure it yourself with only this change applied. Earlier percentages for this change predate array-only and no longer apply.

## Requirements

- [ ] In `src/html/attribute-config/types.ts`, add a local (non-exported) alias directly above `ValidateHTMLAttributesConfig`:

```ts
type ValidateHTMLAttributeEntry<
  Keywords extends SupportedKeywordsConfig,
  V,
> = V extends BaseHTMLAttributeComplexValue
  ? {
      [G in keyof V]: ValidateHTMLAttributesSimpleConfig<Keywords, V[G]>;
    }
  : ValidateHTMLAttributeValue<Keywords, Extract<V, HTMLAttributeArms>>;
```

The body is exactly today's inline conditional with `T[K]` renamed to `V` and the inner mapped key renamed to `G`.
- [ ] Change `ValidateHTMLAttributesConfig`'s mapped type to `[K in keyof T]: ValidateHTMLAttributeEntry<Keywords, T[K]>;`. Keep its outer `keyof T extends string ? {...} : T` guard unchanged.
- [ ] Leave `V` a bare, unconstrained type parameter (no `[V] extends [...]` wrapping).
- [ ] Add a short comment directly above the alias, matching the one in `css-attribute-config-alias-dispatch`.
- [ ] Do not touch `ValidateHTMLAttributeValue`, `ValidateHTMLAttributesSimpleConfig`, `FlatHTMLAttributeKeys`, `ComplexHTMLAttributeKeys` or `InferHTMLAttributesConfig`, and do not edit anything under `src/html/tag-config/`. If the tag-config reduction does not show up on re-measurement, the alias was applied wrongly; do not start editing tag-config's own types.

## Verification

`pnpm check` and `pnpm test` green: zero type errors, no unused `@ts-expect-error`, 839 passing. Re-measure on a clean tree, before and after, one run per entry (`src/html/attribute-config/variations/common.ts`, `src/html/tag-config/variations/common.ts`, `src/index.ts`) with `--checkers 1`, and confirm a reduction in all three; measure fresh rather than trusting the table. Note that under TS 7.0.2 `paths` cannot be passed on the CLI and `baseUrl` was removed, so a throwaway tsconfig at the repo root (extending the root config, `files` pinned to one entry) is needed to run tsc per entry. Probe four cases using real DSL tokens in the style of `tests/html/attribute-config.test.ts` and confirm identical accept/reject and diagnostics to before: valid flat arm list, valid gate value, invalid flat value (`@ts-expect-error`), invalid gate-inner value (`@ts-expect-error`).

## Prohibited Patterns

- Do not change which values are accepted or rejected.
- Do not combine this with any other change; land it independently so its win is attributable.
- Do not inline the alias back "for clarity".
- Do not edit `src/html/tag-config/`.
- Do not trust the quoted numbers; measure before and after on the actual change.
- Do not quote wall-clock times.
