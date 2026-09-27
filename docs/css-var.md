# `var()` support: design and typecheck benchmark

This slice makes `var()` a typed reference into the CSS Properties registry.
`var(--name)` used to be opaque text that no wall validated; it now resolves to
the syntax type of the registered property, and runtime detects circular
references. It builds directly on `css-calc`: `var()` appears inside `calc()`
operands (`calc(var(--spacing) * 2)`).

`var()` takes **exactly one argument**: a registered dashed-ident. There is no
fallback argument, on purpose — see [Why there is no fallback](#why-there-is-no-fallback).

## Grammar

```
var-expression := `var(` dashed-ident `)`
dashed-ident   := `--` <identifier>
```

- `var()` may appear stand-alone, inside `calc()`, or several times in one
  value (`border: "1px solid var(--c)"`).
- A name without the `--` prefix, an empty argument list, a fallback of any
  shape (`var(--a, 1px)`, `var(--a, )`, `var(--a, x, y)`), and unclosed calls
  are all rejected.
- An unknown `--name` is rejected unconditionally.

## Why there is no fallback

A reader who knows CSS fallbacks will expect `var(--a, 1px)` to be accepted.
It is deliberately not, and the argument has three steps:

1. **Per spec, a fallback is consulted only when the referenced property holds
   the *guaranteed-invalid* value.** It is not the default, not a hint, not a
   browser-compat shim: it fires only in that one state.
2. **A registered property can never hold the guaranteed-invalid value.** The
   `@property` descriptor requires an `initial-value`, shast's
   `BaseCSSPropertiesConfig` requires one too (`initial-value` is mandatory),
   and the browser falls back to that initial value whenever the property is
   otherwise unset.
3. **shast rejects references to names that are not in the registry.** The
   registry is the single source of truth for custom properties.

Together: every `var()` shast ever emits references a registered property, and
every registered property always resolves. A fallback shast validated would
never be read by the browser. Validating it would be work spent on a value with
no effect — not redundant, simply dead. That is why the grammar is
`var-args := dashed-ident` rather than carrying a second argument the browser
would ignore.

The same reasoning removes the old "unknown name is rescued by a fallback"
escape hatch. If a `--name` is not in the registry, it is a mistake, not a
value to be guessed at. The error is:

```
unknown custom property '--x'; register it in the CSS Properties config
```

There is no other permissive path and there should not be one.

### This is not an omission

The removal is a deliberate behaviour change, confirmed with the project owner.
A fallback is legal CSS and shast rejects it. The registry, not the fallback,
is where a default belongs in shast: a custom property's default is its
registered `initial-value`, declared once where the property is declared.
Writing it again at every use site is duplication that cannot affect the
result.

## The two walls

`src/css/var.ts` holds both walls so they cannot drift:

- **Type wall** (`ValidateVar`): a recursive template-literal scanner. It finds
  each `var(` in the written value, consumes the balanced-paren argument list,
  and checks the name against `CSSPropertiesConfig`, resolving the reference to
  its syntax type via `DSLInfer`. The entry point returns the written value on
  success or a branded `VarError` the author cannot produce on failure.
- **Runtime wall** (`validateVars`): a small scanner with the same
  balanced-paren handling. It walks the reference graph for **circular** chains,
  throwing `VarSyntaxError` with the full `--a -> --b -> --a` path. The registry
  builder (`cssPropertiesConfig`) runs `assertNoVarCycles` so a malformed
  registry fails where it is declared.

There is no fallback to validate and no fallback nesting to bound, so the type
wall needs no recursion-depth counter. `ValidateVar` does not import or call
`calc.ts`; a `var()` inside a `calc()` is calc's grammar.

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
- `parseCSSValueAgainstDSL` in `src/engine/index.ts` — the **single dispatch
  point** for the deep grammars. A written value is inspected once: calc-shaped
  values go to calc's `parseCalc`, and any value containing `var(` goes to
  `validateVars`, threading the custom properties defined in scope (and
  inherited through nested blocks) so cycles are detected. The two are not
  exclusive, because a `calc()` may contain `var()` operands.

Neither module calls the other: `var.ts` has no import of `calc.ts` (the
verifiable outcome of this slice), and the engine decides which wall sees the
value. calc is now free to import var's name resolution in one direction,
without a cycle, when its multiplication rules need to know whether a `var()`
operand is dimensional.

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
`<time-percentage>` alongside the base types it already has.

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

## `calc()` in `initial-value`

`initial-value` is typed by `DSLInfer` over the property's `syntax`
(`src/css/properties-config/types.ts`). shast adds no calc support here, on
purpose. This is not "deferred" and not "hard" — it is no benefit.

The spec permits `calc()` in an `initial-value`, but only barely. The descriptor
must be **computationally independent**: convertible to a computed value using
only global information (CSS Properties and Values API Level 1). That excludes:

- `var()` references,
- percentages (`calc(100% + 12px)` resolves against the containing block),
- font-relative units (`em`, `rem`, `ch`) and container-relative units (`cqi`).

What survives is arithmetic over absolute units and plain numbers —
`calc(4px + 2px)`. That resolves to a constant. **The author can write the
constant.** The browser contributes nothing authoring time cannot, so a calc
path here would add validation machinery with no capability behind it.

A reader who checks the spec will find calc is legal in this position and
assume shast forgot. It did not; the constant is the supported form.

### Known, accepted, not in scope

Two cases of the same shape are seen, weighed, and left alone:

- `DSLInfer` over `<length>` admits `em`, `rem` and `ch`, so shast accepts
  `initial-value: "2em"`. That value is not computationally independent, so the
  browser rejects the whole `@property` rule and the property silently stays
  unregistered — a quiet runtime failure rather than a loud one at the wall.
- Because `<length>` and `<number>` include `<calc>` shallowly, a calc-shaped
  `initial-value` (including a non-computationally-independent
  `calc(100% + 12px)`) can clear the DSL check. shast does not deepen the check
  for `initial-value`; the browser rejects the rule, exactly as above.

Relative units and calc are not expected in this position, and both are
avoidable by writing the constant. Recorded so the next reader knows they were
seen and weighed, not missed.

## Typecheck benchmark

Measured with `tsc --noEmit --extendedDiagnostics` over the whole repo including
tests, on the same machine. Instantiations are deterministic; times vary by a
few percent with machine load.

| Metric         | With fallbacks | No fallbacks | Delta    |
| -------------- | -------------- | ------------ | -------- |
| Instantiations | 2,855,652      | 2,839,115    | −16,537  |
| Types          | 301,114        | 298,879      | −2,235   |
| Files          | 307            | 307          | 0        |

Removing fallbacks **reduces** the load: the recursive `FallbackType` /
`FallbackOk` / `VarTypeDepth` machinery — the bulk of what the `css-var` slice
added — is gone. The type wall now does one bounded scan per written var-shaped
value plus one `DSLInfer` for the referenced property's syntax; it no longer
recurses on nested fallbacks at all. The runtime wall correspondingly loses the
fallback branch and the shallow calc parse it used to perform on calc-shaped
fallbacks.

The engine still runs calc's parser and var's scanner on a value like
`calc(var(--a) * 2)`, so real nesting keeps both walls live, but neither wall
imports the other and neither has a recursive fallback path to bound.
