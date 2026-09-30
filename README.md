# shast

**shast** - the **s**emantic **H**TML **a**bstract **s**yntax **t**ree. An
**AI-first constrained UI format and validated server-side renderer** built
on closed-world component registries. HTML structure and CSS are typed
against each other and checked at compile time and runtime, constraining
generated UI to the vocabulary and relationships your registry declares.

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
npm install -D @ace-code/shast   # or: pnpm add -D @ace-code/shast
npx shast add src/shast          # default; resolved from your current directory
```

That is the whole setup. `add` vendors the engine, the `minimal`/`common`/`full`
config variations, the public entry and the local `tsyntax` source into the
destination, rewriting every import so the tree is self-contained. You own those
files from then on - there is no build step, no emitted `.js`, and nothing to
ship to the browser.

The vendored tree is **ESM**, so the destination must resolve as ESM: its
nearest `package.json` needs `"type": "module"`. `shast add` does not write a
`package.json` for you - if the destination would be read as CommonJS it stops
and says so, rather than leaving you a tree that fails `tsc` with a TS1295 wall.

The vendored tree also imports its own `.ts` files by their `.ts` extension,
which `tsc` permits only under `"allowImportingTsExtensions": true` - and only
when `"noEmit": true` or `"emitDeclarationOnly": true` is set too. After
vendoring, `shast add` inspects the nearest `tsconfig.json` and reconciles that
option:

- If it is already set, `shast add` says nothing.
- If your config sets `noEmit`/`emitDeclarationOnly` but not the option, it
  explains the change and asks before adding it, editing only the one line so
  your comments and formatting survive. Pass `--yes` to consent without a prompt
  in CI.
- If your config would emit JavaScript, it reports that `.ts`-extension imports
  cannot compile there and leaves your emit settings alone - turning emit off is
  your decision.
- If there is no tsconfig, it prints the options you need but creates no file.

`shast add` never edits a tsconfig without consent, and never sets or flips
`noEmit`, `emitDeclarationOnly` or `outDir`.

```ts
import {
  engine,
  commonHTMLTags,
  commonHTMLAttributes,
  commonCSSSyntax,
  commonCSSAttributes,
  commonCSSPseudoClasses,
  commonCSSQueries,
  commonCSSKeyframes,
  cssPropertiesConfig,
  SUPPORTED_KEYWORDS,
} from "./src/shast/index.ts";
```

That path is the destination you passed to `shast add` — `./src/shast` above
because the command used the default. Vendoring somewhere else means editing the
specifier to match; `add` prints the resolved path when it finishes.

Run it with anything that executes TypeScript directly (`tsx`, `node --import
tsx`, `vitest`, a bundler).

**`shast add` is the only supported way to consume shast. Do not import
`"@ace-code/shast"` directly.** The package ships the CLI as a bundled
`scripts/cli.mjs` and nothing importable; there is no `main`, so a direct import
fails immediately rather than resolving into an alias error three levels deep.
The vendored tree `add` writes is the API surface you actually use.

## Where the walls are

There are exactly two points before the client, and the first one catches
almost everything:

```
  you write                 build                serve                 user
     │                        │                    │                     │
     ▼                        ▼                    ▼                     ▼
  ┌───────┐              ┌─────────┐        ┌───────────────┐      ┌──────────┐
  │  tsc  │─────────────▶│  bundle │───────▶│ createComponent│─────▶│ browser  │
  └───────┘              └─────────┘        └───────────────┘      └──────────┘
      ▲                                          ▲
  catches typed code                    catches the rest: `as any`,
  before the build                      generated code, no `tsc` in the loop
```

Both walls read the **same registry data**, so they cannot drift: a fact the
editor enforces is a fact the server enforces, with the same wording. That is
the property that makes "fail fast" trustworthy - you are never told "it's
fine" by one wall and "it's broken" by the other.

## 30 seconds of shast

The registries below are the ones `shast add` wrote into your tree. Everything
here is a relative import of your own files - see [Install](#install) for why
that is the only supported path:

```ts
import {
  commonHTMLAttributes, commonHTMLTags,
  commonCSSSyntax, commonCSSAttributes, commonCSSPseudoClasses,
  commonCSSQueries, commonCSSKeyframes,
  cssPropertiesConfig, engine, SUPPORTED_KEYWORDS,
} from "./src/shast/index.ts";

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

The 30-second card is deliberately small. Here is a realistic one, assembled
through every mechanism at once: named children, a conditional class, `var()`
and `calc()`, a registered `@media` query, a registered `@keyframes`, and a
cross-node `grid-area`.

First the three custom properties the card uses. The registry is the single
source of truth for `var()` - a name that is not here cannot be referenced:

```ts
const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  "--space":  { syntax: "<length>", inherits: false, "initial-value": "0.5rem" },
  "--radius": { syntax: "<length>", inherits: false, "initial-value": "8px" },
  "--brand":  { syntax: "<color>",  inherits: true,  "initial-value": "hsl(220 90% 56%)" },
});
```

Now the component. Note that the class is computed, the query is an exact
registered string, and `grid-area` names are checked against the parent's
literal `grid-template-areas`:

```ts
const planCard = (featured: boolean) => createComponent({
  tag: "article",
  attributes: { class: featured ? "plan featured" : "plan" },
  innerHTML: {
    heading: { tag: "h2", innerHTML: "Studio" },
    price: { tag: "p", innerHTML: "$18 / mo" },
    perks: {
      tag: "ul",
      innerHTML: {
        seats: { tag: "li", innerHTML: "5 seats" },
        storage: { tag: "li", innerHTML: "100 GB" },
      },
    },
  },
  css: {
    display: "grid",
    "grid-template-columns": "auto",
    "grid-template-areas": '"heading price" "perks perks"',
    gap: "calc(var(--space) * 2)",
    padding: "calc(var(--space) * 2)",
    "border": "1px solid var(--brand)",
    "border-radius": "var(--radius)",
    "&.featured": { "border-width": "2px" },
    ":hover": { transform: "scale(1.01)", transition: "transform 150ms ease-out" },
    "> heading": { "grid-area": "heading", "font-size": "calc(var(--space) * 3)" },
    "> price": { "grid-area": "price", "font-weight": "700" },
    "> perks": {
      "grid-area": "perks",
      "list-style-type": "none",
      padding: "0px",
      "> seats": { color: "var(--brand)" },
    },
    "@media (width < 768px)": {
      display: "grid",
      "grid-template-columns": "auto",
      "grid-template-areas": '"heading" "price" "perks"',
    },
  },
});
```

`createComponent` runs the runtime wall there; `renderComponent` emits HTML
and CSS with no client runtime. Its actual output for `planCard(true)`:

```html
<article cid-a4vysi class="plan featured"><h2 cid-heading>Studio</h2><p cid-price>$18 / mo</p><ul cid-perks><li cid-seats>5 seats</li><li>100 GB</li></ul></article>
```

```css
[cid-a4vysi] {
  display: grid;
  grid-template-columns: auto;
  grid-template-areas: "heading price" "perks perks";
  gap: calc(var(--space) * 2);
  padding: calc(var(--space) * 2);
  border: 1px solid var(--brand);
  border-radius: var(--radius);
  &.featured {
    border-width: 2px;
  }
  &:hover {
    transform: scale(1.01);
    transition: transform 150ms ease-out;
  }
  & > [cid-heading] {
    grid-area: heading;
    font-size: calc(var(--space) * 3);
  }
  & > [cid-price] {
    grid-area: price;
    font-weight: 700;
  }
  & > [cid-perks] {
    grid-area: perks;
    list-style-type: none;
    padding: 0px;
    & > [cid-seats] {
      color: var(--brand);
    }
  }
  @media (width < 768px) {
    display: grid;
    grid-template-columns: auto;
    grid-template-areas: "heading" "price" "perks";
  }
}
```

Custom properties are per-consumer, so the registry also emits their
`@property` at-rules. `engine()` returns them as `cssProperties`:

```css
@property --space {
  syntax: "<length>";
  inherits: false;
  initial-value: 0.5rem;
}

@property --radius {
  syntax: "<length>";
  inherits: false;
  initial-value: 8px;
}

@property --brand {
  syntax: "<color>";
  inherits: true;
  initial-value: hsl(220 90% 56%);
}
```

Three structural bindings are visible in that one component: `> heading` (a
named child), `&.featured` (a class the element can actually hold, even though
it is computed), and `grid-area: "heading"` (a name the parent's literal
`grid-template-areas` declares). Break any of them and the component does not
compile - and if the types are bypassed, it does not render.

(The playground registers two further tokens so the `var()` cycle demo below
has something to point at each other; they are omitted from the output above.)

## Browser baseline for the emitted CSS

`renderComponent` emits **nested** CSS - `& > [cid-x]`, `&:hover`, `&.featured`,
and `@media` blocks written inside a rule - not flattened selectors. A browser
has to understand that nesting to run any of it. The minimum versions that do:

| Browser         | Minimum version |
| --------------- | --------------- |
| Chrome / Edge   | 112             |
| Safari          | 16.5            |
| Firefox         | 117             |

The example stylesheet [above](#one-component-all-the-walls) is the exact output
format; `& > [cid-heading]` is a nested rule, not an accident of formatting.

The output relies on three more features besides nesting, so check them too:

- **`@media` range syntax** - queries are registered as literal strings such as
  `@media (width < 768px)`, and `collect-rules.ts` prints them verbatim rather
  than rewriting them to `max-width`. That form is baseline 2023: Chrome/Edge
  104+, Safari 16.4+, Firefox 102+ ([MDN][mdn-range]). On an older engine the
  whole query block is dropped.
- **`@property`** - `renderCSSPropertiesConfig` emits one `@property` rule per
  registered custom property (see [above](#one-component-all-the-walls)). It
  registered as baseline widely available in 2024: Chrome/Edge 85+, Safari
  16.4+, Firefox 128+ ([MDN][mdn-at-property]). Without it the property still
  resolves through `var()`; only its registered syntax, inheritance and initial
  value are lost.
- **`@container`** - queries are typed as `@media ...` or `@container ...`
  alike, so if your registry contains an `@container` key, the output may carry
  one. That is a separate, later baseline: Chrome/Edge 105+, Safari 16+,
  Firefox 110+ ([MDN][mdn-at-container]). A browser without container queries
  drops the block just as silently.

Nesting is used on purpose: the cascade shast resolves and the browser resolves
come from the same facts. A `"> name"` key is a child of *this* element, and
`&.featured` is a state of *this* element, so printing them nested keeps the
selector text literally equal to the authoring structure - the same structure
`collectRules` walks to report provenance ("which block declared this?"). It is
produced in one place: `printBlock` in
[`src/engine/render/collect-rules.ts`](src/engine/render/collect-rules.ts), the
same frames the resolver reads.

**The consequence on older runtimes.** A browser without CSS Nesting parses
none of it. A nested rule inside a declaration block is invalid there, so the
stylesheet is dropped - with no error, console message or exception. The page
renders with its HTML intact and **no styling at all**, which is precisely the
silent, browser-only failure shast exists to move earlier. The same is true for
each feature above: an unparsed `@property`, `@container` or range `@media`
block is not an error to the browser, only a rule that never applies. Either
raise your browser floor to the versions in the table, or flatten the emitted
stylesheet yourself before shipping; shast does not emit a fallback copy.

[mdn-range]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries#syntax
[mdn-at-property]: https://developer.mozilla.org/en-US/docs/Web/CSS/@property
[mdn-at-container]: https://developer.mozilla.org/en-US/docs/Web/CSS/@container

## Every mistake, and what the two walls say

Each row is a mistake plain CSS accepts and the browser reveals only at
runtime. The **type wall** is what your editor and `tsc` show; the **server
wall** is what `createComponent` throws before HTML leaves the process. The
messages below are quoted from the two walls, not paraphrased.

### Structure and selectors

```
> headnig                                  a child selector that no longer matches
  tsc     Object literal may only specify known properties, and '"> headnig"'
          does not exist in type '{ readonly "> header"?: {}; … }'
  server  CSS Error: Child selector '> headnig' references child 'headnig'
          which is not declared in the element's innerHTML

&.actve                                    a class the element can never hold
  tsc     Object literal may only specify known properties, and '"&.actve"'
          does not exist in type '{ … }'
  server  CSS Error: Class selector '&.actve' references class 'actve'
          which is not declared on the element

&.1bad                                     an illegal class name (a selector that never matches)
  tsc     Object literal may only specify known properties, and '"&.1bad"'
          does not exist in type '{ … }'
  server  CSS Error: Class selector '&.1bad' has an invalid class name '1bad'

ul > div                                   a child the parent does not permit
  tsc     Type '"div"' is not assignable to type '"li"'.
  server  Structural Error: '<div>' is not a permitted child of <ul>

a > ul > li > form                         ancestral inheritance: li allows it, an ancestor <a> does not
  tsc     Type '"form"' is not assignable to type
          '"br" | "div" | "h1" | … | "ul"'.
  server  Structural Error: '<form>' is not a permitted child of <li>

img with innerHTML "no"                    text inside a void element
  tsc     Type '"no"' is not assignable to type
          '"No innerHTML for void elements" & { _err: true; }'.
  server  Validation Error: Tag '<img>' is configured as a void element and must
          not contain any innerHTML or children

img without src                            a required attribute omitted
  tsc     Type '{}' is not assignable to type '{ readonly alt: string; … }'.
  server  Attribute Error: Required attribute 'src' is missing on <img>
```

### Vocabulary

```
tag: "foo"                                 a tag outside the registry
  tsc     Type '"foo"' is not assignable to type
          '"a" | "article" | "br" | … | "ul"'.
  server  Structural Error: '<foo>' is not a recognized configuration tag in your registry

onclick="…"                                an attribute outside the registry
  tsc     Object literal may only specify known properties, and 'onclick'
          does not exist in type '{ readonly class?: string | undefined; … }'.
  server  Attribute Error: Property 'onclick' is not a valid attribute for <div>
          or the Global configuration registry

colr                                       a CSS property outside the registry
  tsc     Object literal may only specify known properties, but 'colr' does not
          exist in type '{ … }'. Did you mean to write 'color'?
  server  CSS Error: 'colr' is not a recognized CSS attribute or property

target: "_blah"                            a value outside an attribute's DSL
  tsc     Type '"_blah"' is not assignable to type
          '"_blank" | "_parent" | "_self" | "_top" | undefined'.
  server  Attribute Error: target on <a> at root: Value of type "string" does
          not match DSL "'_self' | '_blank' | '_parent' | '_top' | undefined"

text-transform: "capitilize"               a value outside a property's DSL
  tsc     Type '"capitilize"' is not assignable to type
          '"capitalize" | "lowercase" | "none" | "uppercase" | CSSWideKeyword'.
          Did you mean '"capitalize"'?
  server  CSS Error: text-transform on <div> at root: Value of type "string"
          does not match DSL "'none' | 'uppercase' | 'lowercase' | 'capitalize'"
```

### Conditional disclosure (what unlocks what)

```
gap without display                        a property nothing in context unlocks
  tsc     Type '"1rem"' is not assignable to type
          '"'gap' requires display: flex | grid | inline-flex | inline-grid" & Locked'.
  server  CSS Error: 'gap' requires display: flex | inline-flex | grid | inline-grid

input[type=text] + checked                 an attribute nothing on the element unlocks
  tsc     Type 'true' is not assignable to type
          '"'checked' requires type: checkbox | radio" & Locked'.
  server  Attribute Error: 'checked' requires type: checkbox | radio
```

### Value grammar: `calc()` and `var()`

```
width: "calc(2s + 3px)"                    operands of incompatible dimensions
  tsc     Type '"calc(2s + 3px)"' is not assignable to type
          'CalcError<"addition operands '2s' and '3px' have incompatible types;
          both must have the same type, or one must be a percentage">'.
  server  Invalid calc() value: addition operands '2s' and '3px' have incompatible
          types; both must have the same type, or one must be a percentage

width: "calc(2Hz * 2)"                     a legal calc whose result misses the property's slot
  tsc     Type '"calc(2Hz * 2)"' is not assignable to type
          'CalcError<"calc() result type 'frequency' is not valid for this property">'.
  server  Invalid calc() value: calc() result type 'frequency' is not valid for this property

color: "var(--spacng)"                     an unregistered custom property
  tsc     Type '"var(--spacng)"' is not assignable to type
          '("currentColor" | "transparent" | `#${string}` | … )'.
  server  Invalid var() value: unknown custom property '--spacng';
          register it in the CSS Properties config

--a: "var(--b)"; --b: "var(--a)"           a cycle in the reference graph (runtime only)
  server  Invalid var() value: circular var() reference: --b -> --a -> --b
```

### At-rule context

```
"@media (width < 700px)"                   an unregistered query never applies
  tsc     Object literal may only specify known properties, and
          '"@media (width < 700px)"' does not exist in type '{ … }'.
  server  CSS Error: Query '@media (width < 700px)' is not registered in the
          cssQueriesConfig. Registered queries are: @media (width < 768px), …

animation: "fadeIn 1s"                     a keyframe that does not exist
  tsc     Type '"fadeIn 1s linear"' is not assignable to type
          '"Invalid animation shorthand 'fadeIn 1s linear': must reference a
          registered keyframe (fade | pulse | slide)"'.
  server  CSS Error: 'animation' value 'fadeIn 1s linear' does not reference a
          registered keyframe. Registered keyframes are: fade, pulse, slide
```

### Cross-node semantics

```
child grid-area not in the parent's grid-template-areas
  tsc     Type '"header"' is not assignable to type
          '"a" | "b" | "inherit" | … | undefined'.
  server  CSS Error: grid-area 'header' does not match any area defined by the
          parent's grid-template-areas (a, b)
```

The same fact, twice, at the two points before the client. Run
`pnpm playground` to watch all of it happen; the full catalogue with the
archived slice behind each entry is in
[docs/before-the-browser.md](docs/before-the-browser.md).

## Recipes

Short, focused excerpts of the building blocks. Each one is a fragment of the
card above or its registry.

### Registering and referencing a custom property

The registry is the source of truth: an unregistered name is rejected
unconditionally, and `@property` rules are emitted from the same entries.

```ts
const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  "--space": { syntax: "<length>", inherits: false, "initial-value": "0.5rem" },
  "--brand": { syntax: "<color>", inherits: true, "initial-value": "hsl(220 90% 56%)" },
});

// used standalone, in a shorthand, and inside calc():
padding: "var(--space)";
border: "1px solid var(--brand)";
gap: "calc(var(--space) * 2)";   // also needs display: flex | grid on this element
```

`var()` takes exactly one argument on purpose. A fallback
(`var(--space, 1rem)`) can never be read, because a registered property always
resolves to its registered `initial-value`:

```
server  Invalid var() value: var() takes no fallback; the registered
        initial-value of --space applies instead (see docs/css-var.md)
```

### `calc()`

Operands are typed by dimension. `+`/`-` need the same dimension (percentage
acts as the wildcard), `/` needs a unitless right operand or one of the same
dimension, and a multiplicative run may carry at most one unit. The result
must match the property's slot.

```ts
display: "grid";
width: "calc(100% - var(--space))";  // <length-percentage> slot; percentage is the + / - wildcard
gap: "calc(var(--space) * 2)";       // <length> * <number> -> <length>
font-size: "calc(var(--space) * 3)"; // <length-percentage> slot
```

### Registered queries and keyframes

Both are keyed by exact, registered strings - not by a parser that might
disagree. Register the small set you use; an unregistered key is a compile
error and a runtime throw.

```ts
cssQueriesConfig: ["@media (width < 768px)", "@container (width > 400px)"],
cssKeyframesConfig: cssKeyframesConfig(commonCSSSyntax, commonCSSAttributes, {
  fade: { from: { opacity: "0" }, to: { opacity: "1" } },
}),
```

```ts
"@media (width < 768px)": { display: "grid", "grid-template-columns": "auto" },
animation: "fade 1s linear",     // renders the referenced @keyframes exactly once
```

### Conditional disclosure: gates unlock

`display: flex` unlocks `gap` on the same element; `display: grid` unlocks
`grid-template-areas` and, for its children, `grid-area`. An attribute gate
works the same way: `input[type=checkbox]` unlocks `checked`, and a gate whose
value is a single literal is filled in for you when omitted.

```ts
// valid - display: grid unlocks the grid properties, and the child's
// grid-area is checked against the parent's literal areas
css: {
  display: "grid",
  "grid-template-areas": '"heading price" "perks perks"',
  "> heading": { "grid-area": "heading" },
}
```

### Valid when context becomes known

A reusable child does not need to know its parent when it is defined. Its
literal structure is preserved, then checked again when a parent supplies the
missing context:

```ts
const item = { tag: "li", innerHTML: "item" } as const;

createComponent({
  tag: "ul",
  innerHTML: { item }, // valid: <ul> permits <li>
});
```

The same child embedded under a parent that does not permit `<li>` is rejected
at the parent call. This is not limited to direct children: the
ancestral-inheritance rules already thread parent context through an entire
prebuilt subtree. Unknown context is not guessed at; once composition makes it
known, validity is narrowed there.

## AI-first, useful to humans

**For UI generated by an AI model:** shast is a target format with
walls. Components are JSON-shaped (which models emit far more reliably than
JSX), and every emission is validated against a registry *you* define. A
model cannot invent a tag, attribute, design token, or custom property -
`tsc` rejects it with a pointed message (`'colr' is not a recognized CSS
attribute or property`, `'<p>' is not a permitted child of <ul>`), and a
runtime backstop catches anything
that slips past the types (`as any`, generated code, no `tsc` in the loop).
Because rendering is server-side, that backstop runs exactly where it
matters: invalid generated components fail **on your server, before HTML is
ever sent** - not in a user's browser. In an era where the bottleneck is
constraining what models produce, the registry isn't configuration
overhead - it's the guardrail itself.

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
composition are ordinary TypeScript - and the class wall holds through all
of it. A `&.class` selector is typed against the classes actually declared
in the element's `class` attribute, including classes computed at runtime
through template literals:

```ts
const card = (num: number) => {
  const active = num > 1 ? "active" : "";
  return createComponent({
    tag: "li",
    attributes: { class: `${active} card` },
    innerHTML: {
      someImage: { tag: "img", attributes: { alt: "", src: "" } },
      content: {
        tag: "a",
        attributes: { href: "" },
        innerHTML: { content: { tag: "div", innerHTML: {} } },
        css: { ":link": {} }, // pseudo-class, validated for <a>
      },
    },
    css: {
      width: "100px",
      "&.active": {}, // valid: 'active' is a possible class above
      "> content": {}, // valid: 'content' is a named child
    },
  });
};
```

Remove `active` from the class expression - or typo the selector as
`&.actve` - and the rule is a compile error, same as a renamed child. The
guarantee doesn't loosen because the class is conditional: the type system
sees every class the expression can produce, so styles for a state the
element can never be in are caught, not shipped.

### The one rule: the type must be known at compile time

Class checking in shast operates on **types, not source text**. This is the
opposite of Tailwind's model: Tailwind discovers class names by scanning
your files as strings, so a dynamically *constructed* class name
(`` `text-${color}-500` ``) silently escapes the scanner and breaks. shast
doesn't care how the class string is built - concatenated, computed,
returned from a helper - as long as TypeScript can compute its **literal
type**. You can create the type or compute it; what matters is that it's
known:

```ts
// ✅ known - checked
class: "card"
class: num > 1 ? "active card" : "card"        // "active card" | "card"
class: `${active} card`                        // if active: "active" | ""
class: variantClass(props.kind)                // if it returns "primary" | "ghost"

// ❌ not known - disregarded by the wall
class: userInput                               // typed as string
class: classNames.join(" ")                    // string
class: legacyHelper()                          // untyped / returns string
```

**For better or for worse.** The better: total freedom in *how* you build
class strings, with no scanner heuristics to appease - the check follows
the type system wherever it can see. The worse: the moment a class value
widens to plain `string`, it carries no information, and validation over it
is disregarded - the class wall simply does not cover that expression. The
boundary is exactly TypeScript's boundary, nothing smarter and nothing
dumber. If you want a dynamic-but-checked class, give it a type: a `const`
map, an `as const` array, a helper with a literal-union return type - the
usual TypeScript moves all work.

## Conditional attributes and ids

Just as `display: flex` unlocks `gap` in CSS, an HTML attribute value can
unlock further attributes on the **same element**. (An HTML attribute is not a
fact a child element inherits, so there is no `children` slot - and no `self`
slot either, since a slot named `self` would imply a `children` counterpart. The
value maps straight to the attributes it unlocks.) In the registry an attribute
is either a DSL string (unconditional) or a map from each possible value to what
that value unlocks:

```ts
htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: {
    undefined: {}, // id is optional
    "todo-42": { "data-kind": "'literal'" },
    "`todo-${number}`": { "data-kind": "'pattern'" },
  },
}),
```

With `input` declaring `checked` under `type: checkbox | radio`, writing
`<input type="range" checked>` fails at both walls with
`'checked' requires type: checkbox | radio`, while `<input type="checkbox"
checked>` is accepted. The shipped vocabulary gates other elements the same way:
`button[type]` unlocks the form-override group for `submit` (and for an omitted
`type`, which defaults to submit), `form[method]` unlocks `enctype` only for
`post`, and `track[kind]` unlocks `srclang`/`label`/`default` for the subtitle
kinds. An omitted gate contributes its `undefined` arm, so omitting a gate still
unlocks whatever its default value implies. A value key written as DSL - a
`<token>` or a backtick template such as `` `todo-${number}` `` - is a **pattern
key**: resolution is literal first, a value matching two keys is an error, and a
value matching none reports a message about the value. Optionality is declared
with an `undefined` arm, exactly as `| undefined` does for a flat attribute.
Where an unlocked attribute's declared type is exactly one literal,
`renderComponent` fills it in when omitted; writing it is allowed, writing a
different value is an error at both walls.

This is the third structural binding, alongside `> title` (a named child) and
`&.active` (a class declared on the element). `ComponentIds<T>` is the
structural binding for ids - the receivers the behaviour layer dispatches on,
which do not move when a node is re-nested:

```ts
type Ids = ComponentIds<
  typeof component,
  typeof SUPPORTED_KEYWORDS,
  typeof commonHTMLAttributes,
  typeof commonHTMLTags
>;
// { "todo-42": { "data-kind"?: "literal" } }
//   | { "todo-7": { "data-kind"?: "pattern" } }
```

It collects every literal `id` written in the component with the values its
resolved key declares; a widened `string` id contributes nothing, duplicate ids
merge, and a component with no ids resolves to `never`.

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
| Pseudo-class/element declared for that tag                                 | ✓            | see [Limitations](#limitations) |

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

The figures below come from a local benchmark harness that is **not part of
this repository**, so they are indicative, not reproducible here. Measured on
TypeScript 7.0.2 against the `common` registry.

Loading `common` is a **fixed ~1.17M instantiations / ~1.1s** of `tsc` cost
before a single component is checked. On top of that fixed cost, `tsc` is
**linear** in components — a file of 100 modest components (`ul > li > span`,
one `:hover`, one nested `> child`):

| Measure | `common` only (`examples/basic.ts`) | +100 components | Per component |
|---|---|---|---|
| Instantiations | 1.17M | 2.69M | ~15K |
| Check time | 1.15s | 3.60s | ~25ms |

Instantiation counts are machine-stable; check times vary by machine. The
earlier ~4.8K / ~5ms figures were taken on a trivial component and
undercounted realistic ones.

Keep files to a handful of components each and the marginal cost stays small;
the fixed registry cost is paid once per program. The same harness produced
the fuller numbers in [docs/structural-coupling.md](docs/structural-coupling.md).

## Limitations

Some limitations are **deliberate trade-offs** to keep the type system
snappy; others are **known gaps**. They are listed here rather than hidden in
either category's fine print.

### Known gaps (runtime wall only - the type wall covers these today)

- **Pseudo-class/element usage** in css blocks and pseudo-element
  declarations in the tag config are type-checked but not runtime-checked.

CSS property values and custom properties (`--*`) are now validated at
runtime inside `createComponent`. The remaining gap covers only
pseudo-class/element usage — worth knowing if you rely on the runtime wall
alone (e.g. validating untyped AI output without running `tsc`).

## Status

Early, honest version: one maintainer, 200+ commits, no releases yet. The
type-level and runtime guarantees in the table above are tested (see
[docs/structural-coupling.md](docs/structural-coupling.md)); the API surface
may still move. If a closed-world, server-rendered approach to AI-generated
UI resonates with you, issues and skepticism are equally welcome.

## License

MIT
