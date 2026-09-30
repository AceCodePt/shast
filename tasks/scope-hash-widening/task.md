---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Widen the css scope hash from FNV-1a/32 to cyrb53 (53-bit)

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

scopeAttribute (src/engine/render/collect-rules.ts:135-137) returns `cid-<hashNode(node.css)>`, and hashNode (collect-rules.ts:115-124) is FNV-1a/32 over stableStringify(node.css). collectRules dedupes emitted blocks by that scope attribute (collect-rules.ts:414-421), so two different css blocks that hash to one scope share a cid-, the stylesheet keeps only the first, and the second component is silently mis-styled.

The collision is real and reproducible: { width: "300978px" } and { width: "1428402px" } both hash to hsyt7c; scanning sequential widths, the first duplicate is at 1428402 against 300978. The birthday bound gives a 1% chance of at least one collision at about 9,292 distinct blocks in one document (50% near 77,163).

Decision: do NOT add collision detection or throw. A guard would only see one collectRules tree, so it would miss collisions between components rendered separately or hydrated in pieces, while hard-failing a render that did compose both -- inconsistent protection and an availability risk for a probabilistic event. Instead widen the hash to 53 bits, moving the 1% point to about 13.5 million distinct blocks (50% near 112 million), far above realistic pages (normally under 10,000).

Keep hashing `css` only. Hashing the whole node would break the intended sharing of identical style blocks, which is what makes two components with the same css reuse one scope.

## Requirements

- [ ] Replace the FNV-1a/32 implementation in hashNode (src/engine/render/collect-rules.ts:115-124) with cyrb53 (53-bit), seed 0, using only Math.imul and bitwise ops -- no BigInt, no node:crypto, no new dependency.
- [ ] Return the 53-bit integer as a base36 string (as today's hashNode returns a base36 string), so scopeAttribute still yields `cid-<base36>`.
- [ ] Continue to hash stableStringify(node.css) only -- never the whole node or its attributes.
- [ ] Do NOT add any collision detection, comparison or throw; dedupe behaviour and rendered output for existing cases are unchanged.
- [ ] Keep scopeAttribute's signature and the `cid-` prefix unchanged.
- [ ] Update the comment on hashNode/scopeAttribute to state the 53-bit width, the birthday bound (about 1% at 13.5M distinct blocks) and that a collision is accepted rather than detected, with the hydration/partial-render reason.
- [ ] Tests pin the widened hash and prove the former FNV collision pair now maps to distinct scopes.
- [ ] pnpm check and the full test suite pass.

## Verification

With seed 0, cyrb53 of the stringified blocks gives: '{"width":"300978px"}' -> ni3841x8ei, '{"width":"1428402px"}' -> e5mod9fxcs, '{"color":"red"}' -> 21762ralqm3 (pin these in a unit test). scopeAttribute on the two former-collision nodes now returns different attributes. Two nodes with identical css still share one scope and the stylesheet still contains one copy of that block. Existing render and resolved-format/cascade tests are unchanged. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT add a collision guard, comparison or throw on scope equality; that option was explicitly rejected because hydration/partial rendering makes it inconsistent and can fail a render.
- Do NOT hash the whole node, its attributes or its children; only the css block.
- Do NOT use BigInt or node:crypto, and do NOT add a dependency.
- Do NOT change the `cid-` prefix or scopeAttribute's signature.
- Do NOT change how identical css blocks are shared or how blocks are printed.
