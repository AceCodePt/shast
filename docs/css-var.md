# `var()` support: design and typecheck benchmark

This slice makes `var()` a typed reference into the CSS Properties registry.
`var(--name)` used to be opaque text that no wall validated; it now resolves to
the syntax type of the registered property, with validated fallbacks, nesting,
and runtime cycle detection. It builds directly on `css-calc`: `var()` appears
inside `calc()` operands (`calc(var(--spacing) * 2)`) and `calc()` is a legal
fallback.

## Grammar

```
var-expression := `var(` var-args `)`
var-args       := dashed-ident (`,` fallback)?
dashed-ident   := `--` <identifier>
fallback       := calc-expression | var-expression | <literal>
```

- `var()` may appear stand-alone, inside `calc()`, or several times in one
  value (`border: "1px solid var(--c)"`).
- Fallbacks may be literals, other `var()`s, or `calc()` expressions, and may
  nest arbitrarily.
- A fallback is validated against the referenced property's syntax type when
  the name is registered, otherwise against the surrounding context.
- An unknown `--name` is rejected unless a fallback is supplied. A missing
  fallback, an empty fallback (`var(--a, )`), more than one fallback, a name
  without the `--` prefix, and unclosed calls are all rejected.

## The two walls

`src/css/var.ts` holds both walls so they cannot drift:

- **Type wall** (`ValidateVar`): a recursive template-literal scanner. It finds
  each `var(` in the written value, consumes the balanced-paren argument list,
  splits it at top-level commas, checks the name against
  `CSSPropertiesConfig`, resolves the reference to its syntax type via
  `DSLInfer`, and checks the optional fallback. Nested fallbacks recurse to a
  parameterised depth (`VarTypeDepth`); runtime has no bound. The entry point
  returns the written value on success or a branded `VarError` the author cannot
  produce on failure.
- **Runtime wall** (`validateVars`): a small scanner with the same balanced-paren
  and top-level-comma handling. It validates each fallback against the expected
  DSL, and walks the reference graph for **circular** chains, throwing
  `VarSyntaxError` with the full `--a -> --b -> --a` path. The registry builder
  (`cssPropertiesConfig`) runs `assertNoVarCycles` so a malformed registry fails
  where it is declared.

## Wiring

The syntax config defines `<var>` **shallowly** as `` `var(${string})` `` (the
same trick `<calc>` uses), so the registry surface stays a plain union. It is
added to the fundamental numeric, dimension, time, angle, color, image,
position, and line-style tokens; `<string>`-typed shorthands already accept it.
The deep grammar is applied on top by:

- `VarConstraint` in `src/engine/types.ts` — a mapped type over the known CSS
  value keys (top-level string attributes, every gate-unlockable key, registered
  custom properties). It reads the written value back out of the component and
  narrows var-shaped values to `ValidateVar`. The expected context type is
  computed for top-level string attributes and registered custom properties;
  for context-dependent slots (gate-unlocked shorthands, gate values) it is
  `unknown`, which turns the resolved-type match off and leaves it to runtime —
  the spec's "one-level resolution + runtime for the rest".
- `parseCSSValueAgainstDSL` in `src/engine/index.ts` — runs `validateVars` after
  the shallow DSL check whenever the written value contains `var(`, threading
  the custom properties defined in scope (and inherited through nested blocks)
  so cycles are detected.

## Registered properties reject unions in `syntax`

A registered property's `syntax` may **not contain a `|`** by default. This is
shast's policy, not tsyntax's: tsyntax still accepts unions in every other
syntax slot, and nothing in `DSLValidate` changed. The rule exists because a
union operand cannot be classified — `var(--x)` where `--x` is
`<length> | <number>` is neither definitely dimensional nor definitely
unitless, which defeats any rule that needs to know (see
`css-calc-multiplication-units`). A union across unit families
(`<length> | <angle>`) is additionally almost always an authoring mistake: no
value is both a distance and a rotation.

Because a registered `syntax` admits **no string interpolation** — no quoted
literals, no backtick templates — a `|` can only ever be a union separator. The
check is therefore a presence test for the character, not a parse: the type
wall is ``Syntax extends `${string}|${string}` `` → a branded
`PropertySyntaxUnionError`, and the runtime wall is
`syntax.includes("|")` → a throw that names the property and points at the
flag. There is no splitting, no depth tracking, and nothing to drift out of
step with tsyntax.

```ts
cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
  "--size": { syntax: "<length>", inherits: false, "initial-value": "1px" },
});
```

The default is the strict wall; `allowUnions: true` is the escape hatch and
must be passed as the fourth argument:

```ts
cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  SYNTAX,
  {
    "--lh": {
      syntax: "<number> | <length-percentage>",
      inherits: true,
      "initial-value": "1.5",
    },
  },
  { allowUnions: true },
);
```

The `-percentage` family is **not** a union: `<length-percentage>`,
`<angle-percentage>`, `<time-percentage>`, and `<frequency-percentage>` are
single named CSS data types, documented by MDN in their own right and used by
the CSSWG's own `@property` examples. They contain no pipe, so they pass the
check as written. All four are defined in the `full` syntax config, and
`common` ships all four as well; `minimal` ships `<length-percentage>` and
`<time-percentage>` alongside the base types it already has. (One open
question: whether every browser's `CSS.registerProperty` accepts
`"<length-percentage>"` — MDN, the CSSWG examples, and
`postcss-register-property` all treat it as valid, but it has not been
spot-checked in a live console from this repo. shast accepts it; the browser is
the browser.)

### Stricter than the spec, deliberately

This is the first place shast knowingly rejects CSS a browser accepts. The case
given up is a genuine one: a line-height token declared
`@property --lh { syntax: '<number> | <length-percentage>' }`. The escape
hatch is `allowUnions: true`, or two registered properties. The trade is a rare
valid pattern for a **total** (not best-effort) unit rule everywhere else. It
is documented here rather than hidden, and the default can be flipped per
registry without touching tsyntax or any other syntax slot.

The presence test is near zero cost: measured with
`tsc --noEmit --extendedDiagnostics` over the whole repo, it adds ~33K
instantiations on a ~2.82M baseline (+1.2%) and leaves the file count
unchanged. There is no per-character recursion, because nothing is parsed.

## Typecheck benchmark

Measured with `tsc --noEmit --extendedDiagnostics` (TypeScript 7.0.2) over the
whole repo including tests, on the same machine, interleaved runs, median of
three ("before" is the `css-calc` branch point, restored with `git stash`).
Instantiations are deterministic; times vary by a few percent with machine load.

| Metric         | Before (`css-calc`) | After (`css-var`) | Delta   |
| -------------- | ------------------- | ----------------- | ------- |
| Check time     | 1.543 s             | 1.834 s           | +18.8 % |
| Instantiations | 2,258,810           | 2,745,510         | +21.5 % |

Relative to the original naive-validator baseline `css-calc` measured
(2,067,034 instantiations), `css-var` is about 1.33× — comfortably under the
roughly 2× threshold `docs/css-calc.md` names for taking the shallow-fallback
escape hatch. The deep type wall stays live; no fallback was taken.

The cost is the second deep parser in the intersection: one bounded scan per
written var-shaped value, plus one `DSLInfer` for the context and one for the
referenced property's syntax. There is no explosion — the strings are short and
the scanner is bounded by the value's length and `VarTypeDepth`. Realistic
fallback nesting compiles; pathological nesting raises `TS2589` rather than
silently passing, the safe direction for a wall to fail.
