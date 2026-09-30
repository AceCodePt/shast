---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Migrate tag-config innerHTML to a discriminated all/include object

## Metadata

- **Complexity:** High
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

Today a tag's `innerHTML` is `"*" | (keyof TagDefinition | "#text")[]`, so three structural probes recover one fact the registry author already knew: is it `"*"`, an array, or an empty array. `"*"` and `[]` are opposites (everything and nothing) yet share the representation "not a normal list", which is why a void check written as `Array.isArray(x) && x.length === 0` looks right and why there are two independent copies of it. This task replaces the string-or-array union with a discriminated object so the kind is stated, not inferred.

New shape (both declarations in `src/html/tag-config/types.ts`):
```ts
innerHTML:
  | { all: true; include?: never }
  | { all?: never; include: (keyof TagDefinition | "#text")[] }
```
Mapping is one-for-one with today: `{ all: true }` is the old `"*"`, `{ include: [...] }` is the old array, `{ include: [] }` is the void-element form. `never` closes the arms, so `{ all: true, include: [...] }` is rejected at authoring time.

Semantics are unchanged and must stay exactly as they are:
- `all` allows text at both walls (`src/engine/validate/html.ts` line ~173 `allowsText = isWildcard || declaresText`, and `IsTagAllowText` returning true for `"*"` in `src/engine/types.ts`) AND contributes nothing to the forwarded tag set (it forwards the inherited set untouched).
- `include` containing `#text` intersects with the parent's set and forwards the intersection.
- `include` without `#text` is strict-children-only and forwards what it inherited.
- `#text` is never synthesized into the forwarded set by `all`.

Compiler cost: measured on a fresh vendored copy of e484008 with all six code sites migrated, consumer-side `tsc --extendedDiagnostics` shows the per-component slope unchanged (103 types and ~7,900 instantiations per component either way), the +434 types being the union declared once, with instantiations falling at every size measured. Re-run the same harness on the branch rather than carrying this forward.

No compatibility shim: there are no external consumers (project has no releases), and accepting both shapes would keep the three structural probes alive, which is the thing being removed.

## Requirements

- [ ] Change both `innerHTML` declarations in `src/html/tag-config/types.ts`: `BaseHTMLTagConfig` and `ValidateHTMLTagConfig`.
- [ ] Migrate the type helpers in `src/engine/types.ts`: `IsTagAllowText`, `GetAllowedTags`, the inline forwarding block in the recursion (~lines 120-125), and the two `extends []` void checks (~lines 1498 and 1518, which become `extends { include: readonly [] }`).
- [ ] Migrate the runtime validation in `src/html/tag-config/index.ts`: skip when `all` is set, iterate `include` otherwise, keeping the existing per-entry check against known tags.
- [ ] Migrate `src/engine/validate/html.ts`: `isVoid`, `isWildcard`, and `ownList` read the object's keys.
- [ ] Migrate `src/engine/render/render-component.ts` (~lines 149-152) in the same pass. The renderer keeps its own void check separate from the validator's; `Array.isArray` on an object union still typechecks and is always false, so leaving it behind ships `<img></img>` with a clean `tsc`.
- [ ] Migrate all three registry variations together (HTMLTagConfig is one type): `minimal.ts` (13 entries: 3 wildcards, 3 void, 7 lists), `common.ts` (32: 12/3/17), `full.ts` (97: 24/8/65) - 142 entries total.
- [ ] Migrate the 17 registry-bearing files under `tests/`: tests/css/queries-integration.test.ts, tests/css/css-class-in-media.test.ts, tests/css/keyframes-integration.test.ts, tests/css/var.test.ts, tests/css/calc.test.ts, tests/html/tag-config.test.ts, tests/html/conditional-attributes.test.ts, tests/render/semantic-name-escaping.test.ts, tests/render/render-component.test.ts, tests/resolved-format/cascade.test.ts, tests/engine/harness.ts, tests/engine/pseudo-class.test.ts, tests/engine/pseudo-element.test.ts, tests/engine/runtime-css-attributes.test.ts, tests/engine/array-children-branching.test.ts, tests/engine/implicit-display.test.ts, tests/engine/render.test.ts. Rewrite the 11 hard-coded old-union assertions in tests/html/tag-config.test.ts. `examples/` needs no change (only component-level innerHTML, no registry shape).
- [ ] Add a README Limitations entry as a `###` sibling of `### Integer-like child keys silently reorder children`: wildcard tags (`form`, `dialog`) admit child nesting the HTML parser repairs, with nested `form` the sharpest case (`form > ... > form` is representable because `form` is a wildcard). Note it satisfies the registry rule rather than breaking a promise; no document makes an "unrepresentable" claim in those words. Answer the ancestor question head-on: banning a `form` ancestor is mechanically doable, but the validator is one-directional and does not track the ancestor tag chain, so it is a decision rather than an oversight. Note the `<form method="dialog">` inside `<dialog>` inside a `<form>` pattern as the case a consumer is most likely to hit.
- [ ] Add one line to `docs/before-the-browser.md` under "Bad trees (tags, children, text, voids)" noting the nested-form exception - a prose line, not a table row that would imply a catch.
- [ ] Add type-level guards/tests: `{ all: false }` is rejected, `{ all: true, include: [...] }` is rejected, a void tag is not treated as `all`, and a wildcard tag is not treated as void (guards against `all` widening to `boolean` through the mapped type, which would collapse both arms).

## Verification

- `pnpm check` (tsc --noEmit) is clean and the full test suite (`pnpm test`) is green.
- Render a void tag and confirm it self-closes: `<img alt="" src="/x.png">`.
- Render a wildcard tag with a string child and confirm both walls accept it (guards the all-allows-text semantic).
- ul > li accepted; ul > span rejected; p > span > div rejected through the intermediate tag; img with a child rejected.
- include containing #text intersects with a restricting ancestor (the a > h1 > b case); include without #text restricts its own children but forwards the inherited set to grandchildren.
- `{ all: false }` and `{ all: true, include: [...] }` are authoring-time errors.
- Re-run the `tsc --extendedDiagnostics` harness and confirm the per-component slope is unchanged.

## Prohibited Patterns

- Do NOT add a compatibility shim or accept both the old string-or-array union and the new object; that keeps the three structural probes alive.
- Do NOT change any innerHTML semantics (all/allows-text, include-with-#text intersection, include-without-#text forwarding).
- Do NOT leave any `Array.isArray(tagDefinition.innerHTML)` void check behind in the validator or renderer.
- Do NOT migrate only one registry variation or leave a registry half-migrated.
- Do NOT add new dependencies.
