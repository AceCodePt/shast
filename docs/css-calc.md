# `calc()` support: design and typecheck benchmark

This slice makes `calc()` a validated CSS value: parsed at the type level, then
parsed again at runtime, and rendered verbatim. Every `calc(` in a written value
is grammar-checked, mirroring `var()`; a value that is exactly one balanced call
also gets the property's slot check. Operands are `<number><unit>?` (length,
angle, time, frequency), `<percentage>`, nested `calc()`, and `var()` references
resolved through the CSS Properties registry.

## Grammar

```
calc-expression := `calc(` calc-sequence `)`
calc-sequence   := calc-operand (op calc-operand)*
calc-operand    := calc-expression | var(--name) | <number><unit>? | <percentage>
op              := `+` | `-` | `*` | `/`
```

- `+` and `-` must be surrounded by whitespace (`calc(100%-20px)` is invalid).
- `+` and `-` require both sides to have the same dimension, or one side to be
  a percentage (which resolves against the other and acts as the wildcard).
  `calc(100% - 20px)`, `calc(50vw + 2rem)`, `calc(2s + 500ms)`,
  `calc(50% + 45deg)` and `calc(2s + 3s)` stand; `calc(2s + 3px)`,
  `calc(45deg + 3px)`, `calc(2Hz + 3s)` and `calc(1 + 2px)` do not.
- `/` allows a unitless `<number>` on its right (the result keeps the left
  operand's dimension) or a right operand of the **same dimension** (the units
  cancel and the result is a number). So `calc(10px / 2)`, `calc(10px / 2px)`,
  `calc(1s / 100ms)` and `calc(45deg / 15deg)` are legal; `calc(100% / 2px)`
  and `calc(10px / 2s)` are not.
- For every `*`, at most one operand in the multiplicative **run** may carry a
  unit (`calc(2px * 3px)`, `calc(100% * 50%)`, `calc(2rem * 3em)` are invalid:
  the product of two units is a squared unit no property accepts). Multiplication
  is commutative, so either side may be the unitless one (`calc(2 * 3px)` and
  `calc(3px * 2)` are both legal). The run is left-associative, so the result of
  a `/` feeds the next `*`: `calc(10px / 2px * 3px)` is a length (the quotient is
  a number) while `calc(10px / 2 * 3px)` is a squared unit and is rejected.
- `var()` operands are classified through their registered syntax. `varUnitKind`
  decides whether an operand carries a unit (the multiplication rule);
  `varDimensions` decides which dimension (+/- , `/`, and the slot check). `<number>`
  and `<integer>` are unitless; `<alpha-value>` is `number | percentage`; the
  named dimension and percentage tokens are placed exactly. `calc(var(--len) * 3)`
  and `calc(var(--num) * var(--len))` pass; `calc(var(--len-a) * var(--len-b))`
  (both `<length>`) fails. An unregistered name is left to var's own wall, which
  rejects it.
- The result must match the slot **when one balanced call spans the whole
  value**: the dimension(s) the property's syntax accepts are checked, so
  `calc(2Hz * 2)` on `width` (`<length-percentage>`) fails and `calc(45deg * 2)`
  on `rotate` (`<angle>`) passes. The check is off when the slot is not a single
  named numeric token (an inline union such as
  `line-height: <number> | <length-percentage>`) or the result is unknown.
- Dispatch is on `calc(` **anywhere** in the value, mirroring `var()`: every
  calc call is grammar-checked. Only a whole-value call gets the slot check,
  because an embedded call has no dimension the property's slot describes
  (`"transform": "translate(calc(100% - 20px), 0)"` is grammar-only).
  `box-shadow: "calc(4px + 2px) calc(4px + 2px) 0 red"` is therefore a legal
  composite, not one malformed expression.
- Boundary rule for a value that begins with `calc(`: if the leading call is
  followed by whitespace, the value is a composite and the remaining calls are
  scanned; if it is followed by any other character (`calc(1px))`,
  `calc(1px)x`), the value is malformed and rejected. The wording lives once in
  `src/css/calc.ts` and both walls emit it.
- Nesting is just call nesting: `calc(calc(100% - 20px) * 2)`. A nested
  `calc()` result is not recomputed by this flat parser, so it is treated as an
  unknown dimension and passes every rule and the slot check. The scanner
  validates the outer call once and resumes after its close, so a nested call is
  not validated twice.

### Which syntaxes admit `calc()`

`calc()` is admitted on every dotted-arithmetic numeric type the shipped syntax
configs define: `<number>`, `<percentage>`, `<length>`, `<angle>`, `<time>`,
`<frequency>`, and `<alpha-value>` (the opacity slot). `<calc>` is a shallow
token (`calc(${string})`) that admits a value at the DSL level; the deep wall
then scans every `calc(` in the written value, tightens it to the real grammar,
and applies the slot check only to a whole-value call. The two walls never
disagree on a unit.

Deliberately **without** `calc()`: `<integer>` (the spec rounds a calc result to
an integer, which this parser does not model), `<resolution>` and `<flex>`
(neither has a `<percentage>`-composed form that could smuggle a unit into the
deep parser, so leaving them out is consistent rather than a silent gap). Adding
one is a one-line change to the syntax tier plus, if it introduces a new
unit, `CalcUnit` in `src/css/calc.ts`.

### Named unions and the multiplication classifier

The no-unions rule (`css-properties-no-unions`) is a presence test for `|` in a
property's `syntax` string, so a named token that *expands* to a union —
`<alpha-value>` is `` `${number}` | `${number}%` ``, `<length-percentage>` is
`<length> | <percentage>` — passes it without containing a pipe. The `*`
classifier treats any such named syntax as unit-bearing. That is the right
call, and the reason is what the declaration means, not merely that some
product would be a squared unit:

- Registering `--a` as `<alpha-value>` declares that it **may hold a
  percentage**. `var(--a) * var(--b)` is then legal for some values of `--a`
  and invalid at computed-value time for others.
- Neither wall can tell which: the value is known only in the browser. An
  accepted expression can therefore silently go invalid-at-computed-value-time
  (IACVT) — exactly the failure the walls exist to catch.
- Rejecting holds the author to their own declaration.

The escape hatch is not a workaround, it is a **more accurate declaration**: if
`--a` only ever holds numbers, register it as `<number>`. That is the
registry-as-source-of-truth ruling applied consistently.

## The two walls

`src/css/calc.ts` holds both walls so they cannot drift:

- **Type wall, grammar** (`ValidateCalc<S, Props, Keywords, Syntax, Expected>`
  and the scanning entry point `ValidateCalcs<...>`): a recursive
  template-literal parser. A depth counter (a tuple, `[...Depth, unknown]` is one
  deeper) finds the matching close parenthesis and splits the sequence at its
  top-level operators. Two further passes run over the flat tuple:
  operand/operator validation, then the dimension algebra (`+`/`-`, `/` and `*`)
  reading `var()` units from `Props`, with the slot check against `Expected`
  last. On success the written value is returned; on failure it is a branded
  `CalcError` the author cannot produce.
- **Type wall, dispatch**: `ContainsCalc<S>` is the substring test (mirroring
  `ContainsVar`), `ExtractCalcCall` finds a call's matching close, and
  `ValidateCalcs` scans left to right, validating each call once and resuming
  after its close. `IsCalcString<S>` is true only when one balanced call spans
  the whole trimmed value; only then does `ValidateCalcs` pass the slot's
  `Expected`. An embedded call is validated with `Expected = "unknown"`.
  `ValidateCalc` remains the whole-value, slot-checking entry point.
- **Runtime wall** (`parseCalc(value, ctx?)` and `validateCalcs(value, ctx)`): a
  small tokenizer/parser with the same depth tracking, plus the same algebra.
  `parseCalc` finds the leading call's matching close by depth (not by slicing
  to the last character) and rejects a value whose first call does not span the
  whole text. `validateCalcs` scans every call like `validateVars`; `containsCalc`
  triggers it and `isCalcString` is true only for a whole balanced call.
  `ctx.properties` supplies the registry so a `var()` operand classifies with a
  lookup, and `ctx.expected` supplies the dimensions the slot accepts (applied
  to the whole-value case only).

**Dispatch follows `var()`.** Any `calc(` anywhere in a value triggers a
grammar scan. Only a value that is exactly one balanced call gets the slot
check; every other calc is grammar-only, because an embedded call inside a
`<string>` composite has no dimension the property's slot describes. A value
that begins with `calc(` may continue only after whitespace: the leading call
is a composite prefix only when followed by whitespace, and `calc(1px))` /
`calc(1px)x` are malformed. The same wording is emitted by both walls.

The syntax config defines `<calc>` **shallowly** as `` `calc(${string})` ``.
That keeps every inferred property type a plain union and keeps the registry
surface unchanged, but it would accept malformed expressions on its own. The
deep grammar is applied on top by:

- `CalcConstraint` in `src/engine/types.ts` — a mapped type over
  `keyof CSSValue` (the keys the author actually wrote) whose `as` clause keeps
  only a key that is in the registry (top-level string attributes, every
  gate-unlockable key, registered custom properties) and whose written value
  contains `calc(` (`ContainsCalc`). The value side is then an unconditional
  `ValidateCalcs`, passing the registry so `var()` operands classify and the
  key's slot dimensions so a whole-value result is checked. The slot dimensions
  come from `CalcSlotAtomsForKey`: a custom property reads its `syntax`, a
  top-level attribute reads its DSL, a gate value reads its token-shaped value
  keys (`<alpha-value>` for `opacity`), and a gate-unlocked key reads the union
  of the DSLs its gates declare. The registry-membership test in the `as` clause
  is what keeps a written key that is *not* in the registry (a typo, an
  undeclared pseudo-class) from being declared: it remaps to `never`, so the
  registry's excess-property rejection still fires.
- `parseCSSValueAgainstDSL` in `src/engine/validate/css.ts` — runs
  `validateCalcs(value, { properties, expected: slotDimensionsOf(dsl) })` after
  the shallow DSL check whenever the written value contains `calc(`. The
  expected dimensions are passed unconditionally; the scanner applies them only
  when one call spans the whole value (`<string>` yields `undefined`, which
  turns the check off). Gate values (`opacity`, `display`, ...) resolve through
  a shallow pattern match first; the engine then runs the deep half on the
  written value too, using the matched pattern (`<alpha-value>`) as the slot, so
  a gate cannot bypass the calc or var walls while the type wall applies them.

`var()` resolution lives in `src/css/var.ts` (`VarUnitKind` / `VarDimensions` at
the type level, `varUnitKind` / `varDimensions` at runtime). The unit-bearing
classifier answers the multiplication rule; the dimension classifier answers the
`+`/`-` and `/` rules and the slot check. calc imports var, never the reverse:
var's own dependency on calc was removed when fallbacks were removed
(`docs/css-var.md`), so the edge is one-directional and acyclic.

`<calc>` is wired into `<number>`, `<percentage>`, `<length>`, `<angle>`,
`<time>`, `<frequency>`, and `<alpha-value>` across the `common` and `full`
syntax tiers (`minimal` has no angle/frequency/alpha tokens), so
`<length-percentage>`, `<time-percentage>`, and everything built on them admit
calc.

## Typecheck benchmark

Measured with `tsc --noEmit --extendedDiagnostics` (TypeScript 7.0.2) over the
whole repo including tests, on the same machine, interleaved runs, median of
three ("before" is the branch point, restored with `git stash`). Instantiations
are deterministic; times vary by a few percent with machine load.

| Metric         | Before     | After      | Delta   |
| -------------- | ---------- | ---------- | ------- |
| Check time     | 1.172 s    | 1.498 s    | +27.8 % |
| Total time     | 1.388 s    | 1.729 s    | +24.6 % |
| Instantiations | 2,067,034  | 2,238,807  | +8.3 %  |
| Memory used    | 228,833 K  | 246,665 K  | +7.8 %  |

The recursive parser adds a bounded, per-written-calc-literal cost (the strings
are short, and one `calc()` value produces on the order of one instantiation per
character). There is **no explosion**: the check time stays well under the
naive-validator baseline this registry replaced. The per-character scan also
means the type wall is bounded by TypeScript's recursion limit: realistic
expressions (a few hundred characters) compile; a pathological expression in the
kilobyte range raises `TS2589` rather than silently passing, which is the safe
direction for a wall to fail.

### Multiplication rule

The multiplicative-run rule (together with the `/`-continuation fix and the
added angle/time/frequency/alpha coverage) was measured over `src` only (284
files — the benchmark config named in the task brief) with `tsc
--singleThreaded --noEmit --extendedDiagnostics`, "before" restored via `git
worktree` at the parent commit. Instantiations are deterministic.

| Metric         | Before    | After     | Delta  |
| -------------- | --------- | --------- | ------ |
| Instantiations | 535,099   | 535,401   | +302   |
| Types          | 64,964    | 65,112    | +148   |
| Files          | 284       | 284       | 0      |

Literal operands cost nothing new: they classify on the string, reusing
`IsPlainNumber` / `IsNumberDimensionOrPercentage`. The only added work is
reading `var()` operands from the registry, and only when they appear in a
multiplicative run; that resolution is a single keyed lookup
(`VarUnitKind` / `varUnitKind`), never a walk of the property's value.

### Dimension algebra and slot check (this slice)

Same `src`-only config, same method, "before" = the parent commit above (which
already carries the multiplication rule).

| Metric         | Before    | After     | Delta  |
| -------------- | --------- | --------- | ------ |
| Instantiations | 535,401   | 543,908   | +8,507 |
| Types          | 65,115    | 66,769    | +1,654 |
| Files          | 284       | 284       | 0      |
| Check time     | 0.532 s   | 0.553 s   | +4 %   |
| Total time     | 0.844 s   | 0.804 s   | noise  |
| Memory used    | 99,933 K  | 102,680 K | +2.7 % |

The algebra itself (`+`/`-` same-dimension, `/` same-dimension, `*` carried
through a division result) costs about +3,000 instantiation, the `CalcSlotAtoms`
slot check the rest. The slot map is defined over the registry, so it is a
bounded, one-per-(attributes, properties) cost, not per node; only a written
calc value reaches `CalcConstraint` with a concrete slot. It is a single-digit
percentage over the deep parser, well inside the "roughly 2×" threshold the
fallback note sets.

### Constraint inversion: written-key iteration

`CalcConstraint` and `VarConstraint` used to map over `CalcValueKeys`, the
registry-wide union of ~130 string attributes, gate keys, lockable keys and
registered custom properties, testing every key for a written calc/var value.
They now map over `keyof CSSValue` — the handful of keys the author wrote — and
move the registry-membership test and the calc/var token test into the `as`
clause, so the value side is unconditional. The excess-property guarantee is
unchanged: a written key outside `CalcValueKeys` remaps to `never`.

Measured on a vendored `common`-tier consumer tree (TypeScript 7.0.2,
`tsc --noEmit --extendedDiagnostics`), marginal instantiations per component =
`(I(100) − I(50)) / 50`, each component made distinct so nothing is cached.
Instantiations are deterministic; no times are quoted.

| Variant            | Before (registry-wide) | After (written-key) | Delta   |
| ------------------ | ---------------------- | ------------------- | ------- |
| flat               | 3,790                  | 1,380               | −63.6 % |
| one `:hover`       | 7,527                  | 2,951               | −60.8 % |
| one `@media`       | 7,841                  | 3,305               | −57.9 % |
| rich               | 12,487                 | 6,013               | −51.8 % |
| a `calc()` value   | 4,448                  | 1,995               | −55.1 % |
| a `var()` value    | 3,805                  | 1,391               | −63.4 % |
| N=0 fixed cost     | 533,958                | 534,188             | +230    |

The rich component is `display: flex`, a `calc()` on `width`, a registered
custom property, a `:hover` block and an `@media` block. The fixed cost is flat
(+230 instantiations, +0.04 %); every component repays it on the first write.
Validation where it is used is not slower: a `calc()` component costs 1,995
against 1,380 for flat, and a `var()` component 1,391. `docs/css-var.md` shares
this measurement for `VarConstraint`.

### Embedded calc scanning (this slice)

Same method and tree (vendored `common` tier, TypeScript 7.0.2,
`(I(100) − I(50)) / 50`, each component's text and calc literal distinct so
nothing is cached). The component shape is fixed except for the written
`transform`, so the rows isolate the per-value wall:

| Component value                                  | Marginal instantiations |
| ------------------------------------------------ | ----------------------: |
| none (bare flat component)                       |                     304 |
| `transform: "none"`                              |                   1,447 |
| `transform: "calc(100% - Npx)"` (whole value)    |                   2,454 |
| `transform: "translate(calc(100% - Npx), 0)"`    |                   2,543 |

The embedded-call component costs **2,543** marginal instantiations. That is
+89 (+3.6 %) over the whole-value form, which does the same single parse; the
scan adds the extraction walk and nothing more. Against the same component
writing a plain value it is +1,096 (+76 %): the per-value `ValidateCalcs`
dispatch, grammar parse and registry lookups, not an explosion. The 8.4× figure
against a completely bare component attributes the whole per-value path to
calc and is not the scan's incremental cost. The cost is recorded rather than
silently accepted; it stays below the roughly-2× fallback threshold when
compared with a component that writes any value, and it is linear in the number
of written calc values.

## Fallback (not taken)

The explicit fallback, had the benchmark exploded, was to drop the
`CalcConstraint` type member and the `ValidateCalcs` call and accept
`calc(${string})` shallowly at the type wall, keeping `parseCalc` as the runtime
wall — with the cost documented here and the loss of compile-time structural
rejection called out in `docs/structural-coupling.md`. The measurements above
do not justify taking it, so the deep type wall is live. If a future slice (e.g.
`css-var` adding `var()` resolution inside `calc()`) pushes the instantiation
count past roughly 2× the baseline, this is the switch to flip, and the note to
update.
