# shast

**shast** - the **s**emantic **H**TML **a**bstract **s**yntax **t**ree. An
**AI-first constrained UI format and validated server-side renderer** built
on closed-world component registries. HTML structure and CSS are typed
against each other and checked at compile time and runtime, constraining
generated UI to the vocabulary and relationships your registry declares.

## What shast is, and is not

shast owns **component structure and the CSS typed against it**, and outputs two
strings: `html` and `css`. That is the library.

Out of scope:

- **The server.** No framework, router, or template engine.
- **The client.** No runtime, hydration, or event binding.
- **Data.** Loops, conditionals, and fetching happen before `createComponent`.
- **Registry contents.** The `minimal`/`common`/`full` tiers are vendored
  starting points, not package policy.

shast sits where a linter and type checker sit, except it also prints the
artifact it checked; it is not a UI framework.

## The mental model: fail fast, fail accurately

A browser is a forgiving runtime. It silently drops CSS it cannot parse,
ignores selectors that match nothing, ignores properties that do not apply in
the current context, and resolves an unset custom property to its registered
initial value. None of that is an error to the browser, so none of it is
reported. The mistake stays invisible until the app is built, deployed, and
running in front of a user.

shast exists to move that discovery to the two points **before the client**,
and to make the report precise. Two words carry the whole idea:

- **Fail fast.** The first wall fires. `tsc` rejects the component while you
  write it - a red squiggle in your editor, before the build. Anything that
  slips past the types (an `as any`, generated code, a pipeline with no `tsc`)
  is caught by the runtime wall inside `createComponent` - on **your server,
  before the HTML leaves it**. Never in the user's browser, never a month
  later in a bug report.
- **Fail accurately.** The message names the offending token, the expectation,
  and the alternatives: `'gap' requires display: flex | grid | inline-flex |
  inline-grid`, `unknown custom property '--spacng'; register it in the CSS
  Properties config`, `grid-area 'header' does not match any area defined by
  the parent's grid-template-areas (a, b)`. Diagnostic quality is treated as
  an interface, not an accident.

The rest of this README is that claim, demonstrated. The worked component and
every failure example below are excerpts of
[`examples/playground.ts`](examples/playground.ts); run `pnpm playground` to
see all of it, output included.

## Install

```sh
npm install -D @ace-code/shast            # or: pnpm add -D @ace-code/shast
npx shast add src/shast                   # common tier (the default)
npx shast add src/shast --tier minimal    # or: --tier full
```

`shast add` vendors the engine and exactly one tier of the
`minimal`/`common`/`full` config variations into your tree, rewriting every
import so the tree is self-contained, and generates an `index.ts` that wires the
engine to that tier. You own those files from then on; there is no build step,
no emitted `.js`, and nothing to ship to the browser. **Requires TypeScript 5.0
or newer** (developed and benchmarked on 7.0.2) and an ESM destination.
`shast add` is the only supported way to consume shast - do not import
`"@ace-code/shast"` directly. See [docs/install.md](docs/install.md) for
package-manager detection, tsconfig reconciliation, the generated entry, and
switching tiers.

## Where the walls are

There are exactly two points before the client, and the first one catches
almost everything:

```
  you write                 build                 serve                  user
     │                        │                     │                     │
     ▼                        ▼                     ▼                     ▼
  ┌───────┐              ┌──────────┐        ┌─────────────────┐      ┌───────────┐
  │  tsc  │─────────────▶│  bundle  │───────▶│ createComponent │─────▶│  browser  │
  └───────┘              └──────────┘        └─────────────────┘      └───────────┘
      ▲                                          ▲
  catches typed code                    catches the rest: `as any`,
  before the build                      generated code, no `tsc` in the loop
```

Both walls read the **same registry data**, so they cannot drift: a fact the
editor enforces is a fact the server enforces, with the same wording. That is
the property that makes "fail fast" trustworthy - you are never told "it's
fine" by one wall and "it's broken" by the other.

**The wall is exactly as strict as your registry.** The engine enforces the
declared vocabulary and nothing more. The shipped tiers are defaults, not a
security boundary; the way to forbid something is to remove it from the
registry files in your tree.

## 30 seconds of shast

The registries below are the ones `shast add` wrote into your tree. Everything
here is imported from your own files, plus the installed `tsyntax` package - see
[Install](#install) for why the vendored tree is the only supported path:

```ts
import engine from "./src/shast/engine/index.ts";
import { cssPropertiesConfig } from "./src/shast/css/properties-config/index.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import commonHTMLTags from "./src/shast/html/tag-config/variations/common.ts";
import commonHTMLAttributes from "./src/shast/html/attribute-config/variations/common.ts";
import commonCSSSyntax from "./src/shast/css/syntax-config/variations/common.ts";
import commonCSSAttributes from "./src/shast/css/attribute-config/variations/common.ts";
import commonCSSPseudoClasses from "./src/shast/css/pseudo-class-config/variations/common.ts";
import commonCSSQueries from "./src/shast/css/queries-config/variations/common.ts";
import commonCSSKeyframes from "./src/shast/css/keyframes-config/variations/common.ts";

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: commonHTMLAttributes,
  htmlTagConfig: commonHTMLTags,
  cssSyntaxConfig: commonCSSSyntax,
  cssAttributesConfig: commonCSSAttributes,
  cssPseudoClassConfig: commonCSSPseudoClasses,
  cssPropertiesConfig: cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {}),
  cssQueriesConfig: commonCSSQueries,   // exact registered query strings
  cssKeyframesConfig: commonCSSKeyframes, // registered @keyframes, referenced by animation
});

const card = createComponent({
  tag: "div",
  innerHTML: {
    title: { tag: "h1", innerHTML: "hello" },
  },
  css: {
    width: "100%",
    "> title": { color: "inherit" }, // typed as a key of innerHTML
  },
});

const { html, css } = renderComponent(card);
// html: <div cid-x1y2z3><h1 cid-title>hello</h1></div>
// css:  scoped rules for [cid-x1y2z3] and its > [cid-title]
```

Now rename `title` to `heading` and forget the CSS:

```ts
innerHTML: { heading: { tag: "h1", innerHTML: "hello" } },
css: { "> title": { ... } }
//     ^^^^^^^^^ error: '"> title"' does not exist in type
//     '{ readonly "> heading"?: ... }'
```

The stale style is not a visual bug you discover next month. It is a red
squiggle right now - and if the types were bypassed, a runtime error instead
of silence.

## One component, all the walls

A realistic component - named children, a conditional class, `var()` and
`calc()`, a registered `@media` query, a registered `@keyframes`, and a
cross-node `grid-area` - is worked end-to-end in
[docs/worked-example.md](docs/worked-example.md), including the rendered HTML,
the emitted CSS, and the `@property` rules. Its three structural bindings
(`> heading`, `&.featured`, `grid-area`) break at compile time when the
structure moves.

## What gets validated

Everything is defined in **closed-world config registries** - tags, allowed
children, attributes (as DSL strings), CSS properties, syntax tokens,
`@property` custom properties, pseudo-classes/elements - and every component
is checked against them **twice**:

| Rule                                                                       | Compile time | Runtime                         |
| -------------------------------------------------------------------------- | ------------ | ------------------------------- |
| Tag exists in the registry                                                 | ✓            | ✓                               |
| Child tag allowed by parent (`ul` → only `li`)                             | ✓            | ✓                               |
| Ancestral inheritance (`a > h1 > b` rejected because `a ∩ h1` forbids `b`) | ✓            | ✓                               |
| Attribute exists and value matches its DSL type                            | ✓            | ✓                               |
| Attribute unlocked by its gate (e.g. `checked` needs `type: checkbox`)     | ✓            | ✓                               |
| CSS property value matches the syntax config                               | ✓            | ✓                               |
| CSS property unlocked by its gate (`gap` needs flex/grid display)          | ✓            | ✓                               |
| `> child` selector targets a real named child (at any nesting depth)       | ✓            | ✓                               |
| `&.class` references a class declared on the context element - including classes computed via template literals (`` class: `${active} card` ``) | ✓            | ✓                               |
| Class name is a legal CSS identifier (`1bad`, `b!c` rejected)              | ✓            | ✓                               |
| Custom property (`--x`) registered and value matches its `syntax`          | ✓            | ✓                               |
| `calc()` dimensions are legal and match the property's slot                | ✓            | ✓                               |
| `var()` names a registered property and no cycle exists                    | ✓            | ✓ (cycles too)                  |
| Registered `@media`/`@container` query key (exact string)                  | ✓            | ✓                               |
| `animation` references a registered `@keyframes`                           | ✓            | ✓                               |
| `grid-area` name is declared by the parent's `grid-template-areas`         | ✓            | ✓                               |
| Pseudo-class/element declared for that tag                                 | ✓            | see [Limitations](docs/limitations.md) |

Every one of these is a mistake that plain CSS lets through and that only
surfaces at runtime in the client - a dropped declaration, a selector that
matches nothing, an animation that never runs. shast finds them at `tsc` and,
for untyped input, on the server before the HTML leaves it.

Composition does not weaken any of this: components built in separate files
and embedded into parents are **re-validated under the parent's context**, at
both levels. Widened types fail closed - they can't be embedded at all. See
[docs/structural-coupling.md](docs/structural-coupling.md) for the verified
guarantees and their test methodology.

## The line shast draws (and won't pretend it doesn't)

shast checks what is **mechanically checkable from declared, unconditional
facts** - the same principle behind the ancestral-inheritance check, which
already threads parent context through the type system at arbitrary depth.

What that means concretely:

- **Checked:** structure, selector targets, child validity, attribute and
  value vocabularies, named relationships between a component's CSS and its
  own tree.
- **Shipped, with more planned:** *unconditional* cross-node style relations
  (e.g. a child declaring `flex: 1` under a parent whose own `css` block
  declares `display: flex`). Both facts are visible in the same definition
  the types already walk. The cheap tiers — same-node rules (`z-index`
  without a stacking context, inline elements ignoring `width`, `gap`
  without flex/grid display) and one-level parent→child rules (flex/grid
  item props, `grid-area` names) — are implemented at both walls. The
  heavier ancestor-chain tiers and the full catalog of common CSS
  "why isn't this working" mistakes live in
  [docs/css-semantic-rules.md](docs/css-semantic-rules.md), ordered by
  type-system cost and gated behind the performance budget. Tracked, not
  promised for the rest.
- **Out of scope, permanently:** *conditional* layout semantics. The moment
  `display` sits behind a media query, a pseudo-class, or resolves via
  inheritance from a parent unknown at definition time, "is `flex: 1`
  meaningful here?" stops having a yes/no answer. Erroring conservatively
  would reject correct code and breed escape hatches; permitting
  optimistically would quietly weaken the guarantee. shast chooses to not
  check what it cannot check honestly.
- **Out of scope, permanently: raw HTML strings.** Every string you write is
  text. `innerHTML: "<b>hi</b>"` renders the literal characters `<b>hi</b>`,
  not bold text - because a string is a *text node*, and the registry enforces
  that a string child is only legal where the tag declares `"#text"`. Markup is
  expressed by nesting: `innerHTML: { b: { tag: "b", innerHTML: "hi" } }`.
  There is no raw/unescaped mode.

  This is not a missing feature, it is the premise. Every guarantee here -
  permitted children, `> child` selectors, cascade resolution, the resolved
  page description the conformance harness checks against the browser - is
  derived from walking the component tree. A raw string is a subtree the
  renderer emits but the tree cannot see, so selectors could not target it,
  the structure checker could not validate it, and "the description matches
  the DOM" would stop being provable. Supporting raw HTML would mean shipping
  a hole in exactly the thing this format exists to make impossible.

  If you are porting existing HTML, that is the work: convert each element
  into a nested component. The type system will walk you through it.

If you adopt shast, you will still ship visual regressions that depend on
facts outside the component tree. The claim is narrower and therefore
keepable: shast catches structural and contextual mistakes that can be
derived efficiently from the explicit component facts it owns, at the
definition site, before your code runs. The precision of the claim mirrors
the precision of the messages.

## AI-first, useful to humans

**For UI generated by an AI model:** shast is a target format with
walls. Components are JSON-shaped (which models emit far more reliably than
JSX), and every emission is validated against a registry *you* define. A
model cannot use a tag, attribute, design token, or custom property that your
registry does not declare - `tsc` rejects it with a pointed message (`'colr'
is not a recognized CSS attribute or property`, `'<p>' is not a permitted
child of <ul>`), and a runtime backstop catches anything that slips past the
types (`as any`, generated code, no `tsc` in the loop). In an era where the
bottleneck is constraining what models produce, the registry isn't
configuration overhead - it's the guardrail itself.

**For humans working in the same format:** the secondary benefit is safer
refactoring. The bug this kills is not *writing* CSS - it's *refactoring*
HTML. You rename a wrapper, move a child,
delete a node… and somewhere a selector silently stops matching. Nothing
fails. The dead CSS just stays there. Name-integrity tools (CSS Modules,
vanilla-extract) verify that a class you reference *exists*; none of them
know the shape of your tree. Here, a component's CSS is typed *against its
own structure*: change the structure and every rule that targeted the old
structure becomes a **compile error at that exact spot**.

## Dynamic components and classes

Components are plain functions, so parameters, conditional classes, and
composition are ordinary TypeScript - and the class wall holds through all of
it. A `&.class` selector is typed against the classes the element can actually
produce, including template literals; once a class value widens to plain
`string` it carries no information and is disregarded - the boundary is exactly
TypeScript's. See [docs/dynamic-classes.md](docs/dynamic-classes.md).

## Conditional attributes and ids

Just as `display: flex` unlocks `gap` in CSS, an HTML attribute value can unlock
further attributes on the same element (`<input type="checkbox" checked>` is
accepted; `type="range"` with `checked` is not). `ComponentIds<T>` is the
structural binding for ids - the receivers behaviour dispatches on, which do not
move when a node is re-nested. See [docs/conditional-attributes.md](docs/conditional-attributes.md).

## Own your registry

The registries are meant to live **inside your codebase** and be tailored to
it - the same philosophy as shadcn: you don't install a black box, you own
the config and grow it as your project grows.

- **Start from `common` (or `minimal`)**, not `full`. Add a tag, an
  attribute, a syntax token *when you need it*, next to the code that needs
  it.
- **`full` is a reference, not a starting point.** It covers essentially the
  entire HTML/CSS surface, and it's extremely unlikely your project wants
  the entire web platform as its vocabulary. A registry that permits
  everything protects against nothing.
- **Smaller registries are strictly better** on every axis this library
  cares about: tighter anti-hallucination walls for AI (a model can't reach
  for a tag your design system doesn't use), sharper autocomplete for
  humans, and a smaller type-checking constant (registry breadth - not
  component count - is what drives editor latency).

Your registry *is* your design system's vocabulary. If `<table>` isn't in
it, nobody - human or model - ships a table. For humans that is a curation
chore; for AI-generated code it is the entire point. Defining what a model
is permitted to emit is the new code review, and the registry is where that
definition lives.

## Browser baseline for the emitted CSS

`renderComponent` emits **nested** CSS, so a browser must understand CSS
Nesting to run any of it (Chrome/Edge 112+, Safari 16.5+, Firefox 117+), plus
`@media` range syntax, `@property`, and `@container` if your registry uses
them. An older engine drops the whole stylesheet silently - no error, no
styling. See [docs/browser-baseline.md](docs/browser-baseline.md).

## Every mistake, and what the two walls say

Each entry pairs a runtime-only CSS mistake with the exact `tsc` message and
the exact server message from `createComponent`. Full catalogue:
[docs/error-catalogue.md](docs/error-catalogue.md) (prose version and archived
provenance: [docs/before-the-browser.md](docs/before-the-browser.md)).

## Recipes

Short excerpts of the building blocks - custom properties, `calc()`, registered
queries and keyframes, gate disclosure, and reuse under later-known context.
See [docs/recipes.md](docs/recipes.md).

## Prior art and lineage

The one-string, two-walls technique - a TypeScript-syntax definition string
parsed identically at the type level and at runtime - is the approach proven
by [ArkType](https://arktype.io). shast applies it to a deliberately smaller
domain: HTML attribute values and CSS values are **scalars** (keyword
unions, numbers, template literals), so shast's DSL intentionally supports
**no arrays and no objects**. That restraint is what keeps the type-level
parser small enough for one maintainer to own and fast enough to stay out of
your editor's way.

You already know the DSL if you know TypeScript: `"'ltr' | 'rtl' |
undefined"` means exactly what it looks like.

## Performance (indicative)

Loading a single-tier `common` tree is a fixed ~1.17M instantiations / ~1.1s of
`tsc` cost before any component is checked; each component then adds ~15K
instantiations / ~25ms. Keep files to a handful of components. See
[docs/performance.md](docs/performance.md).

## Limitations

Three trade-offs and known gaps: pseudo-class/element *usage* is type-checked
but not runtime-checked, wildcard `form`/`dialog` admit child nesting the HTML
parser repairs, and integer-like `innerHTML` keys silently reorder children.
See [docs/limitations.md](docs/limitations.md).

## Repository history

`.orchestration/` and `archive/` are deliberately version-controlled, not
leftover clutter to be cleaned up or `.gitignore`d. They are this project's
development record: `.orchestration/` is the task pipeline and its hooks, and
`archive/` holds the spec and outcome of every completed or abandoned task -
how the project was built, what was tried, and what was discarded and why.
Keeping them tracked means that record is reviewable next to the code it
produced and can differ per branch like anything else, instead of living
outside version control where it would have no history and no backup.

## Status

Early, honest version: one maintainer, 200+ commits, 0.1.0 published, API may
still move. The type-level and runtime guarantees in the table above are tested
(see [docs/structural-coupling.md](docs/structural-coupling.md)). If a
closed-world, server-rendered approach to AI-generated UI resonates with you,
issues and skepticism are equally welcome.

## License

MIT
