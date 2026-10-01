---
wait_human_start: false
wait_human_merge: false
dependencies: [invert-calc-var-constraints]
---

# Task: Propagate gates through same-element blocks (:hover, @media, @container, &.class)

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Gates are element-scoped: display:flex unlocks gap on the element itself (self slot) and flex on its direct children (children slot). Today the gate state is read only from the block the author wrote it in, so it does not follow the element into nested blocks that target the same element. With display:flex written once at component level, gap is rejected inside @media, @container and :hover, and justify-content likewise; flex:1 is rejected inside :hover > c; and grid-area inside :hover > c loses its closed-world cross-check against the element's grid-template-areas (a soundness gap, not only a false rejection). The workaround in use is to re-declare display:flex inside the nested block. This is a correctness item, not a performance one: a @media/@container/pseudo-class/class block targets the same element, and nothing in CSS changes the element's display there. The structural type already encodes the right rule for the parent slot: at the six recursive call sites of ValidateComponentCSSStructure (src/engine/types.ts:1246,1263,1375,1393,1416,1435) the > child calls pass CSSValue as the new CSSParent (a different element) while the pseudo-class and query calls pass CSSParent through unchanged (same element). The gate state should follow the same rule. CSS semantics, decided with the author: (1) both self gates and children gates follow the element through same-element blocks (:hover, :focus, @media, @container, &.class) and reset at a different element (> child); (2) a pseudo-element generates its own box, so the element's gates do NOT unlock self props on it (gap on ::before needs ::before{display:flex}), but ::before/::after ARE child boxes, so the element's children gates and grid-template-areas DO apply to them (flex and grid-area on ::before are valid when the element is flex/grid); (3) gap inside > span stays rejected unless the span itself is display:flex, because that is a different element; (4) the existing rule that the children slot ignores the tag's implicit display (only explicitly written gates unlock children) is unchanged. Cost measured: re-declaring the gate inside the block costs 608 instantiations for @media and 298 for :hover, and gate resolution is roughly 15% of block cost; block cost is otherwise identical whether or not a gate is active. Block cost is expected to fall slightly once the redundant re-declaration goes away.

## Requirements

- [ ] Type level: add a single new parameter to ValidateComponentCSSStructure in src/engine/types.ts carrying the target element's effective CSS value (e.g. CSSElementValue), defaulted so the top-level call keeps today's behaviour (element value = the written css). Define a merge helper: a mapped type over the base keys that are absent from the written value, intersected with the written value, so the current block's written gates win over inherited ones.
- [ ] Replace both uses of WithDefaultDisplay<HTMLTagConfig, T, CSSValue> in the body (the DependentSelfProps call and the inline locked-prop exclusion) with one named alias that applies WithDefaultDisplay to CSSElementValue. It must stay a single named alias so TypeScript caches it by identity, as the existing comment at src/engine/types.ts:589-598 requires.
- [ ] At the recursive call sites: > child and :: pass CSSParent = CSSElementValue (the enclosing element's effective value) and reset CSSElementValue to the child/pseudo-element block's own written value; :, @ and &. pass CSSParent unchanged and set CSSElementValue to the merge of the enclosing CSSElementValue with the nested block's written value.
- [ ] Runtime (src/engine/validate/css.ts): thread the same state through CssBlockState - the element's resolved gate map and its grid-template-areas. Per block, merge the block's own resolved explicit gates over the inherited ones (block wins) and add the tag's implicit display only for the self slot. Use the merged self gates for the 'self' slotDSL lookup. For > child and ::, take the child's parentGates and parentGridAreas from the enclosing element's merged state and reset the element state to the child block's own. For :, @ and &., inherit the element state and pass parentGates/parentGridAreas through unchanged. Keep parentGates' existing meaning (the children-slot gate source) and the existing 'implicit display does not unlock children' rule.
- [ ] The :: self slot must not inherit the element's gates; only its children/grid-area half (CSSParent) does.
- [ ] > span / > child self props must not inherit the parent element's gates; they come from the child's own block plus the child's implicit display, as today.
- [ ] Tests: add positive tests that display:flex declared once at component level unlocks the registry's gate-unlocked self prop (e.g. gap/justify-content, or the mock registry's equivalent) inside :hover, inside @media and inside @container with the gate not restated, and that flex (a children-slot prop) is accepted inside :hover > c with the gate only at component level. Add negative tests that with no display:flex those props are still rejected in all of those positions. Add a test pinning the > span decision: gap inside > span is rejected even when the parent element is display:flex, unless the span itself declares it. Update tests/engine/runtime-css-attributes.test.ts:318-339: :hover > c { flex } is now valid, so the @ts-expect-error comes out, the test becomes a positive assertion, and the comment at :319 is rewritten to describe the new rule. Add a grid-area test: a > child inside :hover resolves grid-area against the element's top-level grid-template-areas at both walls.
- [ ] Docs: update README.md:617-622 and docs/structural-coupling.md so the gate description states the element-scoped rule and the reset at a different element (and at a pseudo-element's self slot).
- [ ] Both walls must agree: any accept/reject decision changed at the type level must be mirrored at runtime, and vice versa.

## Verification

pnpm test is green (tsc --noEmit then the full node --test suite). With display: 'flex' declared once at component level and not restated, gap and justify-content are accepted at the type level and at runtime inside :hover, inside @media and inside @container; flex is accepted inside :hover > c. With no display: flex anywhere, the same props are rejected in all of those positions (the gate must propagate, not disappear). gap inside > span is still rejected when the span is not flex. A > child inside :hover resolves grid-area against the element's top-level grid-template-areas at both walls. Re-measure block cost (one :hover, one @media) at the current HEAD with the redundant display re-declaration removed and quote instantiation counts only; expect it to fall slightly. Confirm no unused @ts-expect-error remains (TS2578 is the tripwire).

## Prohibited Patterns

- Do not propagate the element's gates into a > child block's SELF slot, nor into a :: block's SELF slot; only the children/grid-area half (CSSParent) crosses a pseudo-element.
- Do not propagate the parent element's gates into the child's self props.
- Do not make the children slot honour the tag's implicit display; the existing explicit-only rule and its test stay.
- Do not implement the merge as a plain intersection of gate values; display:'block' & display:'flex' collapses to never and would wrongly lock the block's own unlocked props. The block's written gate must win.
- Do not duplicate the WithDefaultDisplay conditional instead of using one named alias; TypeScript caches by identity and a second copy recomputes the whole gate resolution (see the comment at src/engine/types.ts:589-598).
- Do not change CalcConstraint or VarConstraint in this task; that is the dependency's job.
- Do not quote wall-clock times; instantiations only.
- Do not remove or skip the grid-area cross-check for nested blocks; restore it.
