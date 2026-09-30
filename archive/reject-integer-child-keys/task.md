---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Reject integer-like child names at construction

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

`innerHTML` is a plain object keyed by child name. JavaScript reorders object keys that look like array indices (canonical non-negative integer strings such as `"0"`, `"1"`, `"42"`) to the front in ascending numeric order, regardless of the order the author wrote them, so `{ b: ..., 1: ..., a: ... }` renders its children reordered. Child names are also selector handles (`> name`) and identifiers, and a bare integer is not a usable identifier, so integer-like keys are outside the intended API shape.

Reject them at construction (`createComponent` -> `validateHtmlNode`) with a clear message, turning a silent reorder into an error. Preserving authored order was considered and rejected: the names are not usable handles either way. Non-integer keys, including names with spaces or punctuation (already escaped by `semanticAttribute`), keep working.

## Requirements

- [ ] In `validateHtmlNode` (src/engine/validate/html.ts), when iterating the keys of an object `innerHTML`, reject any child key JavaScript treats as an array index: a canonical non-negative integer string (`/^(?:0|[1-9]\d*)$/`) whose numeric value is < 2^32 - 1. Throw before validating the child, naming the key and the parent tag, with a message that child names must be valid identifiers (not integer-like keys).
- [ ] Arrays remain the supported way to repeat a child; array elements are unaffected.
- [ ] Non-integer string keys (including `"my item"`, `"#text"`, `"-1"`, `"01"`, `"1.5"`) are unaffected and render as today.
- [ ] Keep the check on the runtime construction path (`validateHtmlNode`). Type-level parity is out of scope for this task.
- [ ] Add tests: a component with an integer-like child key throws at `createComponent` with the message naming the key; a component with non-integer keys (including one with a space) still constructs and renders; array children still work.

## Verification

`createComponent({ tag: 'ul', innerHTML: { 1: { tag: 'li', innerHTML: 'x' } } })` throws with a message naming `1` and saying child names must be valid identifiers. A component with `innerHTML: { 'my item': { tag: 'li', innerHTML: 'x' } }` still constructs and renders. Array children are unchanged. `pnpm check` and the full test suite pass.

## Prohibited Patterns

- Do NOT silently rename or reorder integer-like keys.
- Do NOT reject non-integer names, including names with spaces or punctuation; they are escaped, not rejected.
- Do NOT change the array-child branch or its ordering.
- Do NOT add type-level enforcement; runtime construction is the enforcement point for this task.
- Do NOT change the escaping in `semanticAttribute`.
