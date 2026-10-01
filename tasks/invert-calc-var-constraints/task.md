---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Invert CalcConstraint and VarConstraint to iterate written keys

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

CalcConstraint (src/engine/types.ts:1125) and VarConstraint (src/engine/types.ts:1189) both map over CalcValueKeys (src/engine/types.ts:1059), a registry-wide union of every string-valued attribute, every gate key, every lockable key, and all registered custom properties (~130 keys). For each of those keys they test whether the author wrote it and whether its value is calc-shaped (IsCalcString) or contains var() (ContainsVar). So every component pays for calc()/var() validation it never uses, and the two constraints re-run in full inside every :hover, @media, @container, class and child block. Ablation at 2ced762 (common tier, marginal instantiations per component, N=50-100) attributed the large majority of both flat and nested cost to these two: replacing CalcConstraint with {} moved flat 4,020 to 2,349 and block 3,517 to 1,856; replacing VarConstraint with {} moved flat to 2,340 and block to 1,847; replacing AnimationKeyframeConstraints with {} moved block 3,517 to 3,507 (noise). The fix is to invert the iteration: map over keyof CSSValue (the handful of keys actually written) and move the existing registry-membership test and the IsCalcString/ContainsVar token test into the mapped type's `as` clause. The value side then becomes an unconditional ValidateCalc / ValidateVar, because a key only survives the remap if it needs validating. The as filter is what preserves the excess-property guarantee the current comment calls out: a written key that is not in CalcValueKeys maps to never and is never declared, so TS2353 still fires for typos. The prototype measured, common tier, marginal instantiations per component: flat 4,020 to 1,866 (-53.6%), one :hover 7,537 to 3,173 (-57.9%), one @media 7,851 to 3,527 (-55.1%), a rich component (display:flex, a calc(), a custom property, :hover and @media) 12,275 to 6,326 (-48.5%). Fixed cost rose 2,525 instantiations (593,238 to 595,763 at N=0), which the first component repays. Validation where it is actually used did not get slower: a component with a calc() costs 1,906 against 1,866 for plain, and one with a var() costs 2,202.

## Requirements

- [ ] In src/engine/types.ts, rewrite CalcConstraint to map over `[K in keyof CSSValue as ...]` instead of over CalcValueKeys. The as clause keeps K only when: K is a string; K extends CalcValueKeys<CSSAttributesConfig, CSSPropertiesConfig>; CSSValue[K] extends string; and IsCalcString<CSSValue[K]> extends true. The value side is an unconditional ValidateCalc<CSSValue[K] & string, CSSPropertiesConfig, Keywords, CSSSyntaxConfig, K extends string ? CalcSlotAtomsForKey<CSSAttributesConfig, CSSPropertiesConfig, K> : "unknown">.
- [ ] Rewrite VarConstraint the same way: map over keyof CSSValue, put the CalcValueKeys membership test, the string test and ContainsVar<CSSValue[K]> into the as clause, and make the value side an unconditional ValidateVar<CSSValue[K] & string, CSSPropertiesConfig, Keywords, CSSSyntaxConfig, VarContextType<...>>.
- [ ] Keep CalcValueKeys, CalcSlotAtomsForKey, IsCalcString, ContainsVar, ValidateCalc and ValidateVar exactly as they are; only the direction of iteration changes.
- [ ] Update the comment blocks above CalcConstraint and VarConstraint to describe the inverted iteration and record all three prior-art warnings: (a) a previous attempt folded nine intersection members into seven and was reverted for costing +1,272 instantiations on plain-200; (b) a 'cheap-shape-test-first as remap' was tried and reverted earlier; (c) a registry-only hoist produced byte-identical instantiation counts and must not be revisited. State that this inversion is different in kind (it changes what is iterated, not how members are grouped) and that any deviation from the measured shape needs its own benchmark.
- [ ] Update the note at src/engine/types.ts:1280-1290 so it distinguishes the reverted cheap-shape-first as remap from this measured CalcConstraint/VarConstraint inversion.
- [ ] Update docs/css-calc.md (the CalcConstraint description around lines 112-121) and docs/css-var.md (around line 95) to say the constraint maps over the written keys filtered to the registry-eligible, token-shaped ones, not over the registry-wide key union.
- [ ] Add an instantiations-only benchmark subsection (to docs/css-calc.md and docs/css-var.md, or one shared note) recording the six variants (flat, one :hover, one @media, rich, plus the N=0 fixed cost) measured at the current HEAD.
- [ ] No runtime change: src/css/calc.ts, src/css/var.ts and src/engine/validate/css.ts are untouched.
- [ ] No existing test should need to change. If any @ts-expect-error becomes unused, that is a wall regression to fix in the types, not a directive to delete.

## Verification

npx tsc --noEmit (or pnpm check) is clean with zero unused @ts-expect-error directives anywhere in the suite (a softened wall shows up as TS2578, which is the tripwire). pnpm test (tsc --noEmit then the full node --test suite) is green. Then, in a vendored consumer tree, nine explicit negative probes must each still be rejected: a misspelled property at top level, inside :hover and inside @media (TS2353); a bad calc unit such as calc(4px + 2deg) flat and inside :hover; an unregistered var(--nope) flat and inside :hover; and a bad enum value flat and inside :hover. Confirm the positive side too: a valid calc() on width and a registered var() on width still type-check. Re-measure the six variants at the current HEAD and quote instantiation counts only, never wall-clock time.

## Prohibited Patterns

- Do not replace the IsCalcString/ContainsVar token tests with a generic parenthesis check; gradients (linear-gradient(...)) and relative colour syntax are functional notation too and would fire the gate for nothing. The token test must look at the whole value string, not just its leading function name, because a gradient can contain a var().
- Do not remove the as filter or drop the CalcValueKeys membership test from it; that re-opens the excess-property hole (a typo with a calc-shaped value would be declared).
- Do not change CalcValueKeys, CalcSlotAtomsForKey, CalcSlotAtoms, IsCalcString, ContainsVar, ValidateCalc or ValidateVar.
- Do not change runtime code (src/css/calc.ts, src/css/var.ts, src/engine/validate/css.ts).
- Do not revisit the registry-only hoist; it produced byte-identical instantiation counts.
- Do not fold the intersection members again (the reverted 9->7 attempt).
- Do not quote wall-clock times in the benchmark docs; instantiations only.
- Do not add or remove @ts-expect-error directives to make the suite pass.
