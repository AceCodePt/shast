---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Document integer-like child keys as a known quirk (no guard)

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

JavaScript reorders object keys that look like array indices (canonical non-negative integer strings such as "0", "1", "42") to the front in ascending numeric order, regardless of insertion order, so an integer-like `innerHTML` key silently reorders children.

An earlier task (archive/reject-integer-child-keys, merged as 16793dc) added a runtime guard rejecting such keys. That decision was reversed: a guard would be dead code, because child names double as selector handles in nested CSS (`> name`) and `> 1` is not a usable identifier, so numeric keys are already outside the intended API shape and are not expected to arise in practice. This task reverts the merged guard and documents the quirk instead.

## Requirements

- [ ] Revert the integer-like child-key guard merged in 16793dc ('Reject integer-like child names at construction'): remove the ARRAY_INDEX check and its explanatory comment from src/engine/validate/html.ts (around lines 14-20 and 243), restoring the previous processChild / Object.entries(innerHTML) behavior.
- [ ] Delete tests/engine/integer-child-keys.test.ts (added by the reverted commit).
- [ ] Add a short note to the README `## Limitations` section: JavaScript orders integer-like string keys first, so a numeric child key silently reorders children; child names double as nested-CSS selector handles and `> 1` is not a usable identifier, so numeric keys are outside the intended API shape and no guard is added (it would be dead code).
- [ ] Do not change any other validation behavior.

## Verification

src/engine/validate/html.ts has no integer-key check and tests/engine/integer-child-keys.test.ts no longer exists. A component with an integer-like child key constructs again (the prior behavior). The README `## Limitations` section carries the quirk note. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT keep any runtime rejection, warning, or reordering of integer-like child keys.
- Do NOT change the escaping in semanticAttribute or the array-child branch.
- Do NOT remove or rewrite the archived archive/reject-integer-child-keys/ record.
- Do NOT add a test asserting the quirk is rejected.
