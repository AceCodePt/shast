# `calc()` support: design and typecheck benchmark

This slice makes `calc()` a validated CSS value: parsed at the type level, then
parsed again at runtime, and rendered verbatim. Operands are `<number><unit>?`
(length, angle, time, frequency), `<percentage>`, nested `calc()`, and `var()`
references resolved through the CSS Properties registry.

## Grammar

```
calc-expression := `calc(` calc-sequence `)`
calc-sequence   := calc-operand (op calc-operand)*
calc-operand    := calc-expression | var(--name) | <number><unit>? | <percentage>
op              := `+` | `-` | `*` | `/`
```

- `+` and `-` must be surrounded by whitespace (`calc(100%-20px)` is invalid).
- `/` requires a unitless `<number>` on its right (`calc(100% / 2px)` is
  invalid; dividing by a dimension is not a thing). Parsing continues after the
  right operand, so `calc(10px / 2 + 10px)` is legal.
- For every top-level `*`, at least one operand in the multiplicative **run**
  must be unitless (`calc(2px * 3px)`, `calc(100% * 50%)`, `calc(2rem * 3em)`
  are invalid: the product of two units is a squared unit no property accepts).
  Multiplication is commutative, so either side may be the unitless one
  (`calc(2 * 3px)` and `calc(3px * 2)` are both legal).
- Runs, not pairs. Consecutive `*` form one run, delimited by `+`, `-` and `/`;
  at most one operand in a run may carry a unit. So `calc(2px * 3 * 4px)` is
  rejected even though every adjacent pair passes, while `calc(2px * 3 + 4px)`
  is accepted because `+` ends the run.
- Mixed units are legal for `+` and `-` (`calc(100% - 20px)`,
  `calc(50vw + 2rem)`, `calc(2s + 500ms)`); unit compatibility is the cascade's
  problem, not this parser's.
- `var()` operands are classified through their registered syntax: `<number>`
  and `<integer>` are unitless, every other registered syntax carries a unit.
  `calc(var(--len) * 3)` and `calc(var(--num) * var(--len))` pass;
  `calc(var(--len-a) * var(--len-b))` (both `<length>`) fails. An unregistered
  name is left to var's own wall, which rejects it.
- Nesting is just call nesting: `calc(calc(100% - 20px) * 2)`. A nested
  `calc()` result is not recomputed by this flat parser, so it is treated as an
  unknown unit and passes the run rule.

### Which syntaxes admit `calc()`

`calc()` is admitted on every dotted-arithmetic numeric type the shipped syntax
configs define: `<number>`, `<percentage>`, `<length>`, `<angle>`, `<time>`,
`<frequency>`, and `<alpha-value>` (the opacity slot). `<calc>` is a shallow
token (`calc(${string})`); the deep parser then accepts the same dimension
units those types declare, so the two walls never disagree on a unit.

Deliberately **without** `calc()`: `<integer>` (the spec rounds a calc result to
an integer, which this parser does not model), `<resolution>` and `<flex>`
(neither has a `<percentage>`-composed form that could smuggle a unit into the
deep parser, so leaving them out is consistent rather than a silent gap). Adding
one is a one-line change to the syntax variation plus, if it introduces a new
unit, `CalcUnit` in `src/css/calc.ts`.

### Named unions and the multiplication classifier

The no-unions rule (`css-properties-no-unions`) is a presence test for `|` in a
property's `syntax` string, so a named token that *expands* to a union —
`<alpha-value>` is `` `${number}` | `${number}%` ``, `<length-percentage>` is
`<length> | <percentage>` — passes it without containing a pipe. For the
`*` rule the classifier treats any such named syntax as unit-bearing, which is
the conservative call: it rejects `calc(var(--a) * var(--b))` when both are
`<alpha-value>` even though the two numbers would multiply legally. It never
accepts an invalid product. A precise answer would need the classification to
understand each named token's expansion; that is a deliberate non-goal here.

## The two walls

`src/css/calc.ts` holds both walls so they cannot drift:

- **Type wall** (`ValidateCalc<S, Props, Keywords, Syntax>`): a recursive
  template-literal parser. A depth counter (a tuple, `[...Depth, unknown]` is
  one deeper) finds the matching close parenthesis and splits the sequence at
  its top-level operators. A second pass over the flat tuple enforces the `*`
  run rule, reading `var()` units from `Props`. The entry point returns the
  written value on success or a branded `CalcError` the author cannot produce
  on failure.
- **Runtime wall** (`parseCalc(value, ctx?)`): a small tokenizer/parser with the
  same depth tracking, plus the same run rule. `ctx` supplies the registry so a
  `var()` operand classifies with a single lookup. No regex soup; balanced
  parens are enforced by the scanner.

The syntax config defines `<calc>` **shallowly** as `` `calc(${string})` ``.
That keeps every inferred property type a plain union and keeps the registry
surface unchanged, but it would accept malformed expressions on its own. The
deep grammar is applied on top by:

- `CalcConstraint` in `src/engine/types.ts` — a mapped type over the known CSS
  value keys (top-level string attributes, every gate-unlockable key, registered
  custom properties) that reads the written value back out of the component and
  narrows calc-shaped values to `ValidateCalc`, passing the registry so `var()`
  operands classify. Mapping over the *written* keys instead would declare every
  typo, disabling the registry's key rejection.
- `parseCSSValueAgainstDSL` in `src/engine/index.ts` — runs `parseCalc(value,
  { properties })` after the shallow DSL check whenever the written value is
  calc-shaped.

`var()` resolution lives in `src/css/var.ts` (`VarUnitKind` at the type level,
`varUnitKind` at runtime). calc imports var, never the reverse: var's own
dependency on calc was removed when fallbacks were removed
(`docs/css-var.md`), so the edge is one-directional and acyclic.

`<calc>` is wired into `<number>`, `<percentage>`, `<length>`, `<angle>`,
`<time>`, `<frequency>`, and `<alpha-value>` across the `common` and `full`
syntax variations (`minimal` has no angle/frequency/alpha tokens), so
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

### Multiplication rule (this slice)

The multiplicative-run rule (together with the `/`-continuation fix and the
added angle/time/frequency/alpha coverage) was measured over `src` only (284
files — the benchmark config named in the task brief) with `tsc
--singleThreaded --noEmit --extendedDiagnostics`, "before" restored via `git
stash`. Instantiations are deterministic.

| Metric         | Before    | After     | Delta  |
| -------------- | --------- | --------- | ------ |
| Instantiations | 535,099   | 535,401   | +302   |
| Types          | 64,964    | 65,112    | +148   |
| Files          | 284       | 284       | 0      |

Literal operands cost nothing new: they classify on the string, reusing
`IsPlainNumber` / `IsNumberDimensionOrPercentage`. The only added work is
reading `var()` operands from the registry, and only when they appear in a
multiplicative run; that resolution is a single keyed lookup
(`VarUnitKind` / `varUnitKind`), never a walk of the property's value. Well
under the "few thousand" fold threshold.

## Fallback (not taken)

The explicit fallback, had the benchmark exploded, was to drop the
`CalcConstraint` type member and the `ValidateCalc` call and accept
`calc(${string})` shallowly at the type wall, keeping `parseCalc` as the runtime
wall — with the cost documented here and the loss of compile-time structural
rejection called out in `docs/structural-coupling.md`. The measurements above
do not justify taking it, so the deep type wall is live. If a future slice (e.g.
`css-var` adding `var()` resolution inside `calc()`) pushes the instantiation
count past roughly 2× the baseline, this is the switch to flip, and the note to
update.
