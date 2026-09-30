---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Close the three CSS paths that reach emission without the structural wall

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

assertNoStructuralBreakout (src/engine/validate/css.ts:117) is correct after c1ae807 but is invoked from one call site only, deepValidateCSSValue on the component CSS path. Three other routes turn an author- or config-supplied string into emitted stylesheet text and reach none of the scan:

1. Pseudo-class / pseudo-element keys (`:...`) are unvalidated. validateCssBlock (src/engine/validate/css.ts:457-560) treats a ":" key as an ordinary nested block; its only pseudo handling is key.startsWith("::") to track inPseudoElement (449, 534, 545). ValidationContext (src/engine/validate/context.ts) carries no pseudo registry. buildFrame (src/engine/render/collect-rules.ts:328) stores the raw key as a state segment and segmentText (218-220) prints it verbatim, so a key of ':hover} .evil{color:red' renders '&:hover} .evil{color:red { ... }' and the injected selector becomes a live global rule. The sibling paths are all correct: '&.<class>' is regex + declared-class checked (412-428), '@'-rule keys must be exact members of registeredQueries (435), and '> child' keys are escaped via semanticAttribute. Pseudo is the one selector path with no check. Component-data reachable, so the most serious.

2. The style() container-query value is unvalidated. validateStyleQuery (src/css/queries-config/index.ts:82) confirms the property starts with -- and the value is non-empty, then returns; no DSL, no structural scan, no resolution against the properties registry. '@container style(--x: } .evil { color: red })' passes cssQueriesConfig and, once registered, renders as the at-rule header verbatim (frame.atRule). Every other query path validates its value against a DSL.

3. Keyframe values skip the scanner. validateFrameProperty (src/css/keyframes-config/index.ts:37) runs only the DSL parse. box-shadow is '<string>' (src/css/attribute-config/variations/common.ts:35), so box-shadow set to 'none; } .evil{color:red' passes and printKeyframesRule (src/engine/animation.ts:213) prints it verbatim inside @keyframes, letting .evil{color:red} escape the block. Names and selectors are already validated (KEYFRAME_NAME.test, isFrameSelector).

Additionally, a top-level ':' key with a non-object value skips validation entirely: at css.ts:561 '!key.startsWith("&.")' is true, cssAttrs[:hover]/cssProps/slotDSL/lockedMessageFor all miss, and the message is the misleading "'<key>' is not a recognized CSS attribute or property". css: { ":hover": "red" } renders ':hover: red;'.

The fix is one shape: attach the structural scan to "text that becomes part of the emitted stylesheet" rather than to a single call site -- every CSS value wherever it is validated (component blocks, keyframe frames, style() query values), and every key that becomes selector or header text. For pseudo keys that means membership against the pseudo registry, mirroring at-rule keys against the query registry; an unregistered key is rejected before its shape matters, which closes the injection as a side effect of closing the correctness gap. Confirmed end to end at 9ae1a88 by rendering and reading the stylesheet.

Decisions taken with the author: the style() check runs at engine time inside validateCssBlock (where cssPropertiesConfig is already in scope), so cssQueriesConfig's signature and type parameters do not change. No functional-pseudo-class grammar is added: :has(script) and :nonsense-not-registered are rejected purely by membership. The scan is not extended to &.class or > child keys, which are already whitelist/regex checked.

## Requirements

- [ ] Export assertNoStructuralBreakout from src/engine/validate/css.ts and document it as the single wall for text that becomes emitted stylesheet text, listing the four kinds of caller (component values, keyframe values, style() query values, and selector/header keys).
- [ ] Add registeredPseudoClasses: ReadonlySet<string> to ValidationContext in src/engine/validate/context.ts and populate it in engine() (src/engine/index.ts) from new Set(config.cssPseudoClassConfig), next to registeredQueries. Do not add a separate pseudo-element set; pseudo-elements resolve per node from context.tagConfig.
- [ ] In validateCssBlock (src/engine/validate/css.ts), in the nested-block branch, a key whose first character is ':' must be a member of the registered pseudo set: registeredPseudoClasses when the key does not start with '::', and tagConfig[state.nodeTag]?.cssPseudoElement when it does. The check is unconditional (regardless of state.inPseudoElement), so a pseudo-element key nested inside another pseudo-element is rejected by the registry rather than by shape. On a miss throw an error naming the key and listing the registered pseudo-classes, mirroring the unregistered-query message at line 435. No shape check: membership only.
- [ ] In the same branch, run assertNoStructuralBreakout on the pseudo key before walk(...), as an in-loop backstop independent of the registry. Reuse the same call for the at-rule key when it is an @container header that embeds a style() condition, so the shared scan covers header text.
- [ ] For the style() value: when the query key is an @container whose conditions contain style(...), extract its '--property: value', check the property against context.cssPropertiesConfig, and run assertNoStructuralBreakout on the value. Put this in validateCssBlock at engine time. Do not change cssQueriesConfig's signature, add a type parameter, or import engine code into css/queries-config.
- [ ] In src/css/keyframes-config/index.ts, thread the frame name and selector into validateFrameProperty and run assertNoStructuralBreakout on each value (naming the property, like the existing message), keeping the current DSL check. Keyframe names and selectors keep their existing KEYFRAME_NAME / isFrameSelector validation.
- [ ] In validateCssBlock, make a top-level ':' key with a non-block value reach a pseudo-specific error rather than the generic 'is not a recognized CSS attribute or property'. Add '&& !key.startsWith(":")' to the guard at line 561 and throw a 'not a registered pseudo-class' message from the branch.
- [ ] Add tests: in tests/engine/css-value-structure.test.ts or a new file, assert the pseudo payload ':hover} .evil{color:red' and the top-level non-object ':' key throw; in tests/css/queries-integration.test.ts (or a registered-style-query test) assert '@container style(--x: } .evil { color: red })' throws from createComponent before any render; in tests/css/keyframes-integration.test.ts assert a keyframe value 'none; } .evil{color:red' on box-shadow throws. Assert ':nonsense-not-registered' and ':has(script)' are rejected. Add render assertions that a legitimate :hover block, a registered style() query, and a normal keyframe emit unchanged CSS, including the emitted @keyframes text.

## Verification

Run `pnpm test` (tsc --noEmit && node --import=tsx/esm --test) and confirm the full suite passes. Confirm each of the three payloads (pseudo key, style() value, keyframe value) throws from createComponent before any output is produced, and that :nonsense-not-registered and :has(script) are rejected. Render rather than construct: assert the emitted CSS for a legitimate :hover block, a registered style() query, and a normal keyframe is byte-identical to the pre-change output. Add a one-line audit confirming every place a css key or value reaches printBlock/printKeyframesRule sits behind the scan.

## Prohibited Patterns

- Do not extend the structural scan to '&.class' or '> child' keys, and do not escape pseudo keys; those paths are already regex/whitelist checked and the registry membership is the fix, with the scan only a backstop.
- Do not add a selector grammar for functional pseudo-classes (:has(), :not(), :is()); :has(script) must be rejected by membership alone.
- Do not auto-close, escape, or sanitize any value or key; reject it.
- Do not change cssQueriesConfig's signature or add a type parameter to it, and do not import engine modules into src/css/queries-config.
- Do not move any check into the renderer; the wall stays at validation time.
- Do not relax the existing unregistered-query, undeclared-class, or child-selector checks.
