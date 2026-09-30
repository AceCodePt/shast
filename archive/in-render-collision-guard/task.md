---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Throw on a css scope-hash collision within one render

## Metadata

- **Complexity:** Low
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The scope hash is now 53-bit cyrb53 (src/engine/render/collect-rules.ts:115-148). `collectRules` dedupes emitted blocks by `frame.selector` (`[cid-<hash>]`) at lines 441-448, keeping the first and silently dropping a later block with the same scope, so a collision inside one tree silently misstyles the second component. The widening task explicitly accepted collisions rather than detecting them; that decision is now reversed for the single-tree case.

Key the dedupe on the scope but keep `stableStringify(node.css)` beside it. On a repeat scope, equal fingerprints are genuine sharing (two nodes with identical css must share one block); different fingerprints are a hash collision and must throw, naming the scope and both blocks. A collision across separately rendered/hydrated trees remains undetected by design: the two blocks never meet in one stylesheet, so there is no visible damage. This supersedes the 'collision is accepted, not detected' note on `hashNode`/`scopeAttribute`.

## Requirements

- [ ] In `collectRules` (src/engine/render/collect-rules.ts:441-448), key the dedupe on the scope identity and store `stableStringify(node.css)` with each accepted block. On a scope hit, compare the stored fingerprint: equal means sharing (skip, as today); different means a collision and throws an Error naming the scope (`cid-<hash>`) and both differing css strings.
- [ ] Extract the dedupe into a small exported pure helper so the collision path is directly testable with a forced pair (e.g. `dedupeByScope<T>(entries: readonly { scope: string; fingerprint: string; value: T }[]): T[]`), and have `collectRules` call it. The helper's only behavior: first entry per scope wins; same scope + different fingerprint throws; same scope + same fingerprint is skipped.
- [ ] Update the `hashNode`/`scopeAttribute` doc comments (lines 115-164) to say a collision inside one `collectRules` tree is detected and thrown, while a cross-tree collision stays undetected and accepted (with the hydration/partial-render reason), and to name the guard.
- [ ] Keep `hashNode`'s algorithm, seed and base36 output unchanged; keep `scopeAttribute`'s signature and the `cid-` prefix.
- [ ] Add tests: the helper throws on a forced same-scope/different-fingerprint pair and names both blocks; the helper returns the first value for same-scope/same-fingerprint; an integration test still shows two nodes with identical css emitting one shared block; a render with distinct css is byte-identical to before.

## Verification

`dedupeByScope([{scope:'cid-x', fingerprint:'a', value:1}, {scope:'cid-x', fingerprint:'b', value:2}])` throws an error containing `cid-x`, `a` and `b`. `dedupeByScope([{scope:'cid-x', fingerprint:'a', value:1}, {scope:'cid-x', fingerprint:'a', value:2}])` returns `[1]`. A tree with two nodes carrying identical css still renders one shared scope block; a tree with distinct css renders exactly as before. `pnpm check` and the full test suite pass.

## Prohibited Patterns

- Do NOT widen the hash further or change cyrb53.
- Do NOT throw on equal fingerprints; that is the intended sharing of identical style blocks.
- Do NOT attempt to detect collisions across separate `renderComponent` calls; only the single `collectRules` tree is in scope.
- Do NOT hash the whole node or its attributes; fingerprint `node.css` via `stableStringify`, the same input the hash uses.
- Do NOT change the block-dedupe order or the printed output for non-colliding input.
