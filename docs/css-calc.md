# `calc()` support: design and typecheck benchmark

This slice makes `calc()` a validated CSS value: parsed at the type level, then
parsed again at runtime, and rendered verbatim. It is deliberately narrow —
operands are `<number><unit>?`, `<percentage>`, nested `calc()`, and opaque
`var()`; full `var()` typing is the next slice (`css-var`).

## Grammar

```
calc-expression := `calc(` calc-sequence `)`
calc-sequence   := calc-operand (op calc-operand)*
calc-operand    := calc-expression | var(--name) | <number><unit>? | <percentage>
op              := `+` | `-` | `*` | `/`
```

- `+` and `-` must be surrounded by whitespace (`calc(100%-20px)` is invalid).
- `/` requires a unitless `<number>` on its right (`calc(100% / 2px)` is
  invalid; dividing by a dimension is not a thing).
- Mixed units are legal (`calc(100% - 20px)`, `calc(50vw + 2rem)`); unit
  compatibility is the cascade's problem, not this parser's.
- `var()` is accepted opaquely. `calc(var(--spacing) * 2)` passes both walls.
- Nesting is just call nesting: `calc(calc(100% - 20px) * 2)`.

## The two walls

`src/css/calc.ts` holds both walls so they cannot drift:

- **Type wall** (`ValidateCalc<S>`): a recursive template-literal parser. A
  depth counter (a tuple, `[...Depth, unknown]` is one deeper) finds the
  matching close parenthesis and splits the sequence at its top-level
  operators. The entry point returns the written value on success or a branded
  `CalcError` the author cannot produce on failure.
- **Runtime wall** (`parseCalc`): a small tokenizer/parser with the same depth
  tracking. No regex soup; balanced parens are enforced by the scanner.

The syntax config defines `<calc>` **shallowly** as `` `calc(${string})` ``.
That keeps every inferred property type a plain union and keeps the registry
surface unchanged, but it would accept malformed expressions on its own. The
deep grammar is applied on top by:

- `CalcConstraint` in `src/engine/types.ts` — a mapped type over the known CSS
  value keys (top-level string attributes, every gate-unlockable key, registered
  custom properties) that reads the written value back out of the component and
  narrows calc-shaped values to `ValidateCalc`. Mapping over the *written* keys
  instead would declare every typo, disabling the registry's key rejection.
- `parseCSSValueAgainstDSL` in `src/engine/index.ts` — runs `parseCalc` after
  the shallow DSL check whenever the written value is calc-shaped.

`<calc>` is wired into `<number>`, `<percentage>`, and `<length>` across the
`common`, `full`, and `minimal` syntax variations, so `<length-percentage>`
(and everything built on it, e.g. `width`) admits calc.

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
