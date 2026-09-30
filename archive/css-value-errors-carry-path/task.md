---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Wrap tsyntax value errors with property, tag, and component path

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The runtime value walls in src/engine/validate/css.ts and src/engine/validate/html.ts call tsyntax's parseValueAgainstDSL directly. On a miss, tsyntax throws `Value of type "string" does not match DSL "<color>"` (node_modules/tsyntax/src/index.ts:451) with no property name, tag, or component path. The README's stated diagnostic standard (lines 9-32 and 318-396) requires the message to name the offending token and expectation, and the README and examples/playground.ts currently quote this bare message. Wrapping must happen at the shast layer, which is the only layer that knows the property, the tag, and where the node sits in the tree.

## Requirements

- [ ] Thread a component path from the validation root through validateHtmlNode (src/engine/validate/html.ts) and validateCssBlock (src/engine/validate/css.ts), derived from the innerHTML key each child was reached by, e.g. `root > item > text`.
- [ ] At every tsyntax parseValueAgainstDSL call site on the value paths (parseCSSValueAgainstDSL in css.ts, and the two calls in html.ts), catch the tsyntax error and rethrow with a `CSS Error:` / `Attribute Error:` prefix naming the property or attribute, the tag, and the path, while preserving the tsyntax prose verbatim. Example: `CSS Error: color on <span> at root > item > text: Value of type "string" does not match DSL "<color>"`.
- [ ] Do not wrap or alter shast-authored errors (child selector, class selector, grid-area, locked, unknown property/attribute); their text must be unchanged.
- [ ] Keep the substring `does not match DSL` intact so existing tests matching it continue to pass.
- [ ] Update the README examples at lines 387-395 and the corresponding output comments in examples/playground.ts to the new messages.
- [ ] Add tests covering a nested-path CSS value error, a root-level CSS value error, and an HTML attribute value error, asserting the property/attribute, tag, path, and DSL prose all appear.
- [ ] pnpm check and the full test suite pass.

## Verification

Create a component whose root child `item` has a child `text` that is a <span> with css: { color: "not-a-color" }; createComponent throws an error containing `color`, `<span>`, `root > item > text`, and `does not match DSL "<color>"`. A root-level bad CSS value and a bad HTML attribute value likewise name their property/attribute, tag, and path. Existing tests matching /does not match DSL/ still pass. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT modify tsyntax or reimplement its DSL check.
- Do NOT swallow or paraphrase the original tsyntax prose.
- Do NOT change type-level (tsc) messages; only the runtime value-error path.
- Do NOT wrap shast-authored errors or change their wording.
- Do NOT weaken or delete existing tests that assert the DSL prose.
