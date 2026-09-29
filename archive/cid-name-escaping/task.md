---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Escape innerHTML child names into valid CSS-identifier attributes

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

An innerHTML record key is a "child name", and it becomes the semantic attribute `cid-<name>` by string concatenation in `semanticAttribute` (src/engine/render/collect-rules.ts:134). That single function feeds both the HTML identifier (render-component.ts:115) and the `& > [cid-<name>]` selector (collect-rules.ts:180). The key is never validated at either wall: the type layer is `[K in keyof T["innerHTML"]]` with no constraint (types.ts:147) and derives the `> name` selector keys from it (types.ts:1241); at runtime `validateComponentNode` iterates `Object.values(innerHTML)` and ignores the keys (index.ts:732), while `validateCSS` only checks membership (`childName in contextInnerHTML`, index.ts:363). A key like `"my item"` or `a"]b` therefore passes both walls and emits `<span cid-my item>` and `& > [cid-a"]b]` — a malformed attribute and an invalid selector.

Rather than reject keys or grow the type system, escape the name so every key is accepted and always emits a valid attribute and selector. `_` is the escape marker and a literal `_` is itself escaped, so the encoding stays injective (no two distinct keys can emit the same attribute, which would make a parent selector match the wrong child). Ordinary names are untouched.

## Requirements

- [ ] `semanticAttribute(name)` escapes, never rejects: map `[A-Za-z0-9-]` literally and every other character (including `_`, the escape marker) to `_` + its 4-digit lowercase UTF-16 code-unit hex. Examples: `my item` -> `my_0020item`, `a"]b` -> `a_0022_005db`, `inner_1` -> `inner_005f1`; `title`, `someImage`, `some-image` are unchanged.
- [ ] The encoding is injective: distinct keys never collide onto one attribute, so a `> name` selector can never match a different child.
- [ ] Keep the `cid-` prefix, so the full attribute is a valid CSS identifier and HTML attribute name for any key, including empty strings, digit-leading keys, and keys containing space, quotes, brackets, or `=`.
- [ ] No type-system change and no runtime key rejection: `childrenNamed`, the `> name` membership check in engine/index.ts, and `ValidateComponentCSSStructure` continue to use the raw key, which is retained on the `SelectorSegment`.
- [ ] The HTML identifier (render-component.ts:115) and the selector (collect-rules.ts:180) both go through this one function, so they stay byte-identical; no second escaping path.
- [ ] Ordinary names render byte-identically to today.
- [ ] Tests: keys with special characters type-check and pass the runtime wall; `"my item"` and `a"]b` render an attribute and a selector that both match `^cid-[A-Za-z0-9_-]+$` and are byte-equal to each other, with the raw string absent from the output; two distinct special names in the same parent produce distinct attributes; existing semantic-naming output is unchanged.
- [ ] `pnpm check` and the full test suite pass.

## Verification

`renderComponent` with `innerHTML: { "my item": { tag: "span", innerHTML: "x" } }` and `css: { "> my item": { color: "red" } }` emits an HTML attribute and a CSS selector attribute that both match `^cid-[A-Za-z0-9_-]+$` and are byte-equal; the literal `my item` appears nowhere in the output.
The same holds for a key like `a"]b`. `title`/`someImage` output is unchanged (`<h1 cid-title>`, `& > [cid-title]`). `pnpm check` passes.

## Prohibited Patterns

- Do NOT reject, drop, or sanitize away any key or character — escape it; the point is to let keys pass both walls.
- Do NOT add type-level key validation or otherwise expand the type system.
- Do NOT hash the name — ordinary names must stay readable.
- Do NOT escape only the HTML site or only the selector site; use the `semanticAttribute` seam so they cannot diverge.
- Do NOT change what counts as a valid CSS class name or the `&.` selector path.
