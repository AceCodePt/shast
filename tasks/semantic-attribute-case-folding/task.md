---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Fold uppercase in semanticAttribute so cid- names stay injective in HTML

## Metadata

- **Complexity:** Low
- **Priority:** High
- **Status:** Ready for Handoff

## Context

semanticAttribute (src/engine/render/escape.ts:85-99) maps [A-Za-z0-9-] literally and every other UTF-16 code unit to _<4-digit hex>. The function feeds both the HTML identifier (render-component.ts:116) and the `& > [cid-<name>]` selector (collect-rules.ts:181), which is what keeps the two sites in agreement.

The encoding is injective at the string level, but not in HTML: the HTML parser lowercases attribute names, and CSS attribute-name matching is ASCII case-insensitive in HTML documents. So siblings named `Title` and `title` render cid-Title and cid-title, both attributes collapse to cid-title in the browser, and both rules match both elements. `someImage` and `someimage` have the same problem.

Fold uppercase before escaping (encode A-Z as _00xx like any other non-literal code unit) so every emitted attribute is lowercase and distinct names -- including case-only-distinct ones -- can never collide. Ordinary all-lowercase names stay byte-identical.

## Requirements

- [ ] In semanticAttribute (src/engine/render/escape.ts:85-99), remove A-Z from the literal set; map each uppercase code unit to `_` + its 4-digit lowercase hex (e.g. T -> _0054), exactly like other non-literal code units. Keep a-z, 0-9 and `-` literal and keep `_` escaped as _005f.
- [ ] The encoding stays injective: distinct names never collide, including names that differ only in case.
- [ ] Every emitted attribute matches /^cid-[a-z0-9_-]+$/ and contains no uppercase letters, so HTML lowercasing cannot merge two attributes.
- [ ] Both the HTML site (render-component.ts:116) and the selector site (collect-rules.ts:181) keep going through this one function; do not add a second escaping path.
- [ ] Ordinary all-lowercase names are byte-identical to today (title -> cid-title, some-image -> cid-some-image). camelCase names change (someImage -> cid-some_0049mage).
- [ ] Update the two escaping tests and their VALID_ESCAPED_ATTRIBUTE regexes: tests/render/semantic-name-escaping.test.ts (the `someImage`/`title` expectations and the /^cid-[A-Za-z0-9_-]+$/ constant) and tests/engine/semantic-name-escaping.test.ts.
- [ ] pnpm check and the full test suite pass.

## Verification

semanticAttribute("Title") !== semanticAttribute("title"), and neither output contains an uppercase letter. Rendering a parent with siblings `Title` and `title` produces two attributes that differ after lowercasing, and each `& > [cid-...]` selector matches only its own child. semanticAttribute("title") is still cid-title and semanticAttribute("some-image") is still cid-some-image; every output matches /^cid-[a-z0-9_-]+$/. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT reject case-only-distinct sibling names instead of escaping them; escaping is the chosen policy and must keep accepting every key.
- Do NOT add type-level key validation or expand the type system.
- Do NOT hash the name; lowercase names must stay readable.
- Do NOT change the `cid-` prefix or the `_` escape marker.
- Do NOT escape only the HTML site or only the selector site; use the semanticAttribute seam so they cannot diverge.
