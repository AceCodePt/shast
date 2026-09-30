---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Remove the unreachable array branch in renderAttributes

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

renderAttributes (src/engine/render/render-component.ts:53-59) joins array values with a space: `Array.isArray(value) ? value.join(" ") : String(value)`. But attributes are scalars at the type layer - the README (lines 849-853) states the DSL intentionally supports no arrays and no objects, `class` is declared `"string | undefined"` (global attribute config) and `rel` is declared `"string | undefined"` (per-tag, full.ts/common.ts). The branch is therefore unreachable through createComponent; only a widened value (as any / skipValidation) can reach it. tests/render/render-component.test.ts:87 currently locks the space-join behaviour. Decision taken: drop the branch (option A) rather than admit arrays for class/rel, to stay consistent with the no-arrays doctrine.

## Requirements

- [ ] Remove the `Array.isArray(value) ? value.join(" ") :` special case from renderAttributes; serialize remaining values with String(value).
- [ ] Keep the boolean / undefined / null handling, the ATTRIBUTE_NAME_PATTERN output-safety check, and escapeAttributeValue unchanged.
- [ ] Delete or rewrite the test 'array attributes render space-separated, not comma-joined' in tests/render/render-component.test.ts; if kept as documentation, assert the actual chosen behaviour and note arrays are outside the DSL and unreachable through the validated path.
- [ ] Confirm no registry DSL declares an array (class and rel are `string | undefined`).
- [ ] Validated-path HTML output must be byte-identical to today.
- [ ] pnpm check and the full test suite pass.

## Verification

renderAttributes contains no array special case; a search for `Array.isArray` in render-component.ts finds no array-attribute join. Existing render tests that cover validated attributes pass unchanged, and the array-join test is removed or rewritten to the chosen behaviour. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT leave a comment claiming DSL reachability the branch does not have.
- Do NOT change validated-path HTML output.
- Do NOT touch the attribute-name check or attribute-value escaping.
- Do NOT admit arrays for class/rel (that is the rejected option B).
