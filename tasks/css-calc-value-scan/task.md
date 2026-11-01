---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: CSS calc(): scan every calc() call in a value

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The calc wall dispatches on a **prefix** test: `IsCalcString` in `src/css/calc.ts` (and its runtime mirror `isCalcString` in the same file) treat any value whose trimmed text starts with `calc(` as one calc expression, and `CalcConstraint` (`src/engine/types.ts`) plus `deepValidateCSSValue` (`src/engine/validate/css.ts`) then hand the whole string to the deep parser.

That heuristic fails in both directions.

**False positive - a legal composite is rejected.** `box-shadow` and `transform` are `<string>` in the common attribute tier (`src/css/attribute-config/tiers/common.ts`), so a composite value is legal, but if it happens to start with a call it is treated as a single expression:

```
"box-shadow": "calc(4px + 2px) calc(4px + 2px) 0 red"
  -> Invalid calc() value: '...' is not a calc() expression
"box-shadow": "calc(4px + 2px) calc(4px + 2px) 0 oklch(0 0 0)"
  -> Invalid calc() value: unbalanced parentheses: unexpected ')'
```

The second message is the tell: `ValidateCalcOuter` / `parseCalc` slice from the first `(` to the **last** `)`, so the interior contains the first call's close and whatever follows.

**False negative - a call that is not first is never checked.** A calc call embedded after the first token is invisible to both walls:

```
"transform": "translate(calc(1px +))"   -> accepted by both walls
"transition": "width calc(2s + 3px)"    -> accepted by both walls
```

`var()` has no such gap: `ContainsVar` triggers on a substring anywhere in the value, and `ValidateVar` / `validateVars` scan every `var(...)` in it. calc should follow that precedent, which fixes both failures in one slice: a value is *calc-shaped* only when one balanced call spans the whole trimmed text (the only case that has a slot to check), and every calc call in **any** value is grammar-checked. The slot check stays exactly where it is today: whole-value calc only, because an embedded call inside a `<string>` DSL has no dimension to check. Like `var()`, the type wall and runtime wall live in one module and must not drift.

## Requirements

- [ ] `src/css/calc.ts`, type wall: make `IsCalcString<S>` true only when one balanced `calc(...)` call spans the whole trimmed value. A prefix test is not enough: thread parenthesis depth to the matching close and require the remainder to be empty after trimming.
- [ ] `src/css/calc.ts`, type wall: add `ContainsCalc<S>` (substring test, mirroring `ContainsVar`), an `ExtractCalcCall` scanner (mirroring `ExtractVarCall`) and `ValidateCalcs<S, Props, Keywords, Syntax, Expected>`. Scan left to right; validate a call once and continue **after** its close, so a nested call is not validated twice (the deep parser already validates nested operands). An unclosed call yields a `CalcError<"unclosed calc() call">`, never a silent pass.
- [ ] `src/css/calc.ts`, type wall: `ValidateCalcs` applies `Expected` only when the value is one whole calc call; an embedded call validates with `Expected = "unknown"`. `ValidateCalc` stays the whole-value, slot-checking entry point.
- [ ] `src/css/calc.ts`, runtime wall: `isCalcString` returns true only for a whole balanced call; add `containsCalc` and `validateCalcs(value, ctx)` scanning exactly like `validateVars` (same left-to-right extraction, same skip-inside-an-earlier-call rule), throwing `CalcSyntaxError` on the first failure.
- [ ] `src/css/calc.ts`, runtime wall: `parseCalc` finds the matching close of the leading call instead of slicing to the last character. A value whose first call does not span the whole text is rejected with a specific message (not `unbalanced parentheses`).
- [ ] Boundary rule for a value that begins with `calc(`: if the leading call is followed by whitespace, the value is a composite and the remaining calls are scanned; if it is followed by any other character (for example `"calc(1px))"`), the value is malformed and rejected. State this rule once, in `src/css/calc.ts`, and carry the same wording into the diagnostics.
- [ ] `src/engine/types.ts`: `CalcConstraint` keeps a written key when `ContainsCalc<CSSValue[K]>` is true (not `IsCalcString`), and its value side becomes `ValidateCalcs` with the key's slot from `CalcSlotAtomsForKey`. The registry-membership test in the `as` clause is unchanged.
- [ ] `src/engine/validate/css.ts`: `deepValidateCSSValue` runs `validateCalcs` whenever `containsCalc(value)`; pass `expected: slotDimensionsOf(dsl)` unconditionally and let `ValidateCalcs` apply it only to the whole-value case (`<string>` already yields `undefined`). Keep the `var()` scan and the structural scan exactly as they are.
- [ ] `tests/css/calc.test.ts`, type wall and runtime: accept `"calc(4px + 2px) calc(4px + 2px) 0 red"` and the `oklch`-terminated variant (the two shapes that regress today); reject `"calc(1px +) 2px"` (malformed leading call) and `"calc(1px))"` (non-whitespace after the close); reject `"translate(calc(1px +))"` and `"width calc(2s + 3px)"` in a `<string>` slot; accept `"translate(calc(100% - 20px), 0)"`; keep `width: "calc(2Hz * 2)"` rejected by the slot check; assert a nested `calc(calc(100% - 20px) * 2)` still validates and is parsed once.
- [ ] `tests/css/calc.test.ts`: add engine-level cases with `createComponent`/`renderComponent` so dispatch is exercised, not only `parseCalc`/`ValidateCalc` directly. A component with `"box-shadow": "calc(4px + 2px) calc(4px + 2px) 0 red"` renders and its CSS contains the value verbatim; a component with `transform: "translate(calc(1px +))"` throws.
- [ ] Docs: `docs/css-calc.md` - document the dispatch rule (whole value = grammar + slot; any other calc = grammar only; values are scanned for `calc(` anywhere, mirroring `var()`) in "The two walls"; update the nested-call and "Which syntaxes admit calc()" prose if it states the prefix rule. `docs/error-catalogue.md` - add the composite-accepted and unclosed/trailing-junk cases under "Value grammar: `calc()` and `var()`". `README.md` - the "`calc()` dimensions are legal and match the property's slot" row should read as whole-value slot plus per-call grammar. Re-check `docs/limitations.md` for a prefix-only statement and update it.
- [ ] Measure the type-wall cost with the method already used in `docs/css-calc.md` (marginal instantiations on a vendored consumer tree, `(I(100) - I(50)) / 50`): record a component whose value contains an embedded calc, e.g. `"transform": "translate(calc(100% - 20px), 0)"`. Add the number to `docs/css-calc.md`; if the delta is material (roughly 2x or more over the flat component), document the cost rather than silently accepting it.

## Verification

`pnpm check` and `pnpm test` are green with no unused `@ts-expect-error` directives (TS2578 is the tripwire). Probes, both walls: `box-shadow: "calc(4px + 2px) calc(4px + 2px) 0 red"` renders and its CSS contains the value verbatim; `transform: "translate(calc(1px +))"` is a type-level error and a runtime throw; `transition: "width calc(2s + 3px)"` is rejected at both walls; `transform: "translate(calc(100% - 20px), 0)"` passes both; `width: "calc(2Hz * 2)"` still fails with `calc() result type 'frequency' is not valid for this property`; a whole `"calc(1px)"` in a `<string>` slot (e.g. `"box-shadow": "calc(1px)"`) passes grammar with no slot check; `"calc(1px))"` is rejected. The old `isCalcString` prefix behaviour rejects no composite value any more.

## Prohibited Patterns

- Do not keep the prefix test as the dispatch rule, and do not special-case `box-shadow`, `transform` or `transition`; the fix is generic over any written value.
- Do not add per-property CSS grammar for composite values. Embedded calls get the calc grammar only; the dimension/slot check stays whole-value only.
- Do not change `var()` scanning (`ContainsVar` / `ValidateVar` / `validateVars`) or its quoted-text behaviour in this slice. Mirror it (quoted text is not exempt) so the two walls stay parallel; a quoted-text exemption is a separate change touching both scanners.
- Do not rescan inside an already-extracted call and validate a nested calc twice.
- Do not weaken the whole-value slot check or the structural breakout scan.
- Do not accept a malformed calc just because more tokens follow it: only a well-formed leading call may be followed by a composite remainder.
- Do not let the type wall and runtime wall diverge. Any shape rule lands in both, in `src/css/calc.ts`, with shared message wording.
