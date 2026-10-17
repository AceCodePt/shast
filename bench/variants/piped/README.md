# `piped` variant

A copy of the repository's `src` with the attribute authoring shape recoded from
an **array of single arms** to **one piped DSL string**:

| | default `src` | this variant |
| --- | --- | --- |
| authored | `direction: ["'ltr'", "'rtl'"]` | `direction: "'ltr' \| 'rtl'"` |
| arm type | `readonly string[]` | `string` |
| validated by | `DSLValidateArm` per arm | `DSLValidate` over the value |

Scope: the CSS attribute config, the HTML attribute config and the tag configs'
inline attribute bags - 1,494 arm arrays. Structural arrays (`include`,
`cssPseudoClass`, `cssPseudoElement`) and the `syntax-config` /
`keyframes-config` token arms are untouched, so the attribute layer is the only
difference.

## How it was built

[`pipedify.mjs`](pipedify.mjs) did the data step. On top of it, the arm types
and their validators were switched to the piped form:

- `CSSAttributeArms` / `HTMLAttributeArms`: `readonly string[]` to `string`
- `ValidateCSSAttributeValue` / `ValidateHTMLAttributeValue`: `DSLValidateArm`
  per arm to `DSLValidate` over the value
- `InferCSSAttributeValue` / `InferHTMLAttributeValue`: to `DSLInfer`
- both runtimes (`cssAttributeConfig`, `htmlAttributeConfig`): validate the one
  string instead of joining an array
- `engine/types.ts` and `keyframes-config/types.ts`: the flat-attribute key
  selectors and slot writers that assumed `readonly string[]` use `string`

## Run

Standalone typecheck:

```sh
pnpm exec tsc -p bench/variants/piped/tsconfig.json
```

In the harness:

```sh
pnpm bench -- --variants src,piped
```

## Measured

Instantiations on the default scenarios, `src` (arrays) against this variant:

| tier | scenario | `src` | `piped` |
| --- | --- | ---: | ---: |
| minimal | null | 147,762 | 153,871 |
| common | null | 292,811 | 336,625 |
| full | null | 595,714 | 676,351 |
| full | simple-small | 864,408 | 982,079 |
| full | classes-big | 937,604 | 1,050,733 |

Piping raises instantiations at every tier, by roughly **30 per arm**, paid on
every program: `DSLValidate` splits the whole value and threads an accumulator
per arm, where `DSLValidateArm` runs one bounded check per arm.
