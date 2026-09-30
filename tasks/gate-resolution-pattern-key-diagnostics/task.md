---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Validate gate pattern keys at config time; document literal-over-pattern precedence

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

src/engine/gate-resolution.ts is shared machinery for both the CSS and HTML gates. resolveGateValue tries literal keys first, then each pattern key via parseValueAgainstDSL inside a try with an empty catch. That swallow correctly means 'this pattern did not match', but it cannot distinguish that from 'this pattern key is not a valid DSL at all'. A gate definition whose value key is malformed therefore reports the author's correct component value as invalid and lists the broken pattern as something they could have written: a definition keyed `<not-a-real-dsl>`, writing `display: flex`, yields `CSS Error: Invalid value 'flex' for 'display'. Expected one of: <not-a-real-dsl>`. The consumer is pointed at correct component code while the real error is in config. Empirically confirmed: cssAttributeConfig currently builds such a config with no error at all (it compiles flat values and self/children bag values but never the value key itself), while validateHTMLAttributes does validate pattern keys but throws a bare `Invalid DSL string` that names neither the gate nor the key. Separately, the literal-over-pattern precedence is a real, order-independent rule (verified in both declaration orders) that is undocumented above resolveGateValue, so the multi-match error reads as though overlap is always caught when ambiguity is only ever detected pattern-against-pattern. The hasOwnProperty.call lookup (not `in`) is already correct for constructor/__proto__ and must not be simplified.

## Requirements

- [ ] In src/css/attribute-config/index.ts, cssAttributeConfig must validate every pattern value key of each object-valued gate by calling dslString on it (keys matching isPatternKey: `<...>` or a backtick template). On failure it throws: Invalid pattern key `<key>` for gate `<gate>`: not a valid DSL. (backticks are literal characters around the key and gate). Validation runs before the existing self/children bag-value compilation. Reuse the exported isPatternKey from src/engine/gate-resolution.ts.
- [ ] In src/html/attribute-config/index.ts, validateHTMLAttributes must replace its bare dslString(supportedKeywords, subKey) pattern-key call with the same try/catch and the same message (Invalid pattern key `<key>` for gate `<gate>`: not a valid DSL.). Flat attribute values and self/bag values keep their existing dslString calls and native `Invalid DSL string` message.
- [ ] In src/engine/gate-resolution.ts, the comment above resolveGateValue documents: a literal key wins outright regardless of declaration order and only the literal's unlocked keys apply (overlap with a pattern is not an error); the multi-match error is detected pattern-against-pattern only, never pattern-against-literal.
- [ ] In src/engine/gate-resolution.ts, a comment at the Object.prototype.hasOwnProperty.call check records that it must remain hasOwnProperty (not `in`) so constructor and __proto__ are treated as unregistered values rather than resolving up the prototype chain.
- [ ] resolveGateValue logic is unchanged: literal-first lookup, the empty catch around parseValueAgainstDSL, and the `matches more than one pattern key` error all stay exactly as they are.
- [ ] Tests: a new tests/engine/gate-resolution.test.ts covers literal-over-pattern in both declaration orders, the multi-pattern ambiguity error, and rejection of `constructor`; tests/css/attribute-config.test.ts and tests/html/attribute-config.test.ts each add a malformed-pattern-key case asserting the config-time throw names the gate and the key; tests/html/conditional-attributes.test.ts adds a pattern-first overlap config proving resolution to the literal and rejection of the pattern's unlocked attribute.
- [ ] Validation is written inline in each config builder; no new shared validation helper function is added.

## Verification

pnpm test passes (tsc --noEmit then the full suite). Specifically: cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, { display: { "<not-a-real-dsl>": { self: {}, children: {} } } }) throws /Invalid pattern key `<not-a-real-dsl>` for gate `display`: not a valid DSL/; htmlAttributeConfig(SUPPORTED_KEYWORDS, { id: { "<not-a-real-dsl>": {} } }) throws the same shape naming gate 'id'; resolveGateValue returns the literal for a definition holding both a literal and a matching pattern in either declaration order; a written `constructor` still throws the Expected-one-of error; a value matching two pattern keys still throws `matches more than one pattern key`.

## Prohibited Patterns

- Do not change resolveGateValue control flow, including its literal-first lookup, empty catch, or multi-match error.
- Do not replace Object.prototype.hasOwnProperty.call with `in` (or any prototype-chain lookup) in resolveGateValue.
- Do not change the `Invalid DSL string` message for flat attribute values or self/bag values; only pattern-key validation gets the new message.
- Do not extract a shared validatePatternKeys-style helper; keep the pattern-key validation inline in each builder.
- Do not weaken or remove the multi-pattern ambiguity error, and do not turn literal/pattern overlap into an error.
- Do not add type-level validation; this is runtime config-time diagnostics plus comments only.
