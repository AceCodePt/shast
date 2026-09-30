---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Reject CSS declaration break-out in string-typed values at the runtime wall

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

CSS attribute-config values such as box-shadow, flex, grid-template-areas and place-content are declared as the bare token "<string>" (src/css/attribute-config/variations/common.ts:35,215,273,278). tsyntax maps the `string` token to a match-anything primitive (node_modules/tsyntax/src/index.ts:320 and 394), so validateCssBlock only runs parseValueAgainstDSL and accepts any string. Nothing rejects CSS structural punctuation.

The renderer prints the raw value: collect-rules.ts:322 does `frame.declarations.push([key, String(value)])` and printBlock (collect-rules.ts:452) emits `${key}: ${value};` with no escaping. So `css: { "box-shadow": "none; } body { display: none; } [x] { color: hsl(1 1% 1%)" }` passes createComponent (no `as any` needed) and injects arbitrary rules into the stylesheet. calc() and var() reject the same attack only because their grammars do not admit `;{}`.

The hole is not limited to the four named properties: any value whose matched arm is a raw string (e.g. the `<string>` arm of `content` and `grid-area`, or a `<custom-ident>` value) can carry the same delimiters. Fix the invariant rather than the four properties: a CSS declaration value must not contain a top-level `;`, `{` or `}` outside quoted strings and balanced functions, and must not contain `/*` outside a quoted string.

## Requirements

- [ ] Add a structural guard applied to every string CSS value at the runtime wall (src/engine/validate/css.ts), reached by attribute DSLs, cssPropertiesConfig syntax, and gate-slot DSLs (the gate pre-pass calls deepValidateCSSValue directly, so cover that path too).
- [ ] Reject a `;`, `{` or `}` that occurs at the top level of the value: outside single/double-quoted strings and outside balanced `(...)` (e.g. url(...)). Reject the two-character sequence `/*` anywhere outside a quoted string, including inside parentheses.
- [ ] Allow the delimiters inside quoted strings (e.g. grid-template-areas quotes, a `content` value whose text contains `}`) and inside balanced functions (e.g. background: url(data:image/svg+xml;base64,...)). Handle backslash escapes inside quoted strings.
- [ ] Non-string values and CSS-wide keywords are unaffected; calc() and var() validation is unchanged.
- [ ] Throw an Error in the existing `CSS Error: ...` style naming the property/key and the offending character(s).
- [ ] Tests must cover the exact reported vector for box-shadow, flex, grid-template-areas and place-content, plus a union arm (content or grid-area), and must prove legitimate values still pass.
- [ ] pnpm check and the full test suite pass.

## Verification

With the common registry, createComponent({ tag: "div", innerHTML: "x", css: { "box-shadow": "none; } body { display: none; } [x] { color: hsl(1 1% 1%)" } }) throws. The same value on flex (under display: flex), grid-template-areas and place-content (under display: grid) throws. Legitimate values still pass: "0 1px 2px red", "a a\nb b", '"a a" "b b"', a quoted `}` in content, and background: url(data:image/svg+xml;base64,...). Existing calc and var tests are unchanged. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT escape or re-quote the value to make it safe; quoting changes CSS semantics. Reject instead.
- Do NOT fix only the renderer (collect-rules.ts / render-component.ts); the runtime wall is where the value is validated and where calc()/var() already reject the attack.
- Do NOT reject delimiters that occur inside a quoted string or a balanced function such as url(...); that breaks legitimate grid-template-areas, content and data-URL values.
- Do NOT change the calc() or var() grammars or their error behaviour.
- Do NOT add type-level validation; this is a runtime-wall fix.
