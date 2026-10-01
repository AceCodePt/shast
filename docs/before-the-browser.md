# Caught before the browser

A browser is a forgiving runtime. It drops declarations it cannot parse,
ignores selectors that match nothing, silently ignores properties that do not
apply in the current context, and substitutes the registered initial value
when a custom property is unset. None of that is an error to the browser, so
none of it is reported: you find out visually, in a running app, in the
browser.

shast catches most of those bugs before the component is compiled and
shipped to the client. Every value is checked twice against a closed-world
registry — once by `tsc` at authoring time, once by the server-side runtime
in `createComponent` — so the mistakes that would otherwise stay silent until
something looks wrong are instead a red squiggle on your machine or a thrown
error on your server, before HTML is sent.

This document lists the classes of bug that were closed, slice by slice.
Each one is a mistake that plain CSS accepts and the browser only reveals at
runtime. The provenance is the archived task that implemented it
(`archive/<slug>/task.md`).

## At a glance

| Bug that plain CSS only shows in the browser | Browser today | shast |
| --- | --- | --- |
| Typo'd child selector (`> headnig`) | rule matches nothing | compile error + runtime throw |
| Class selector for a class the element cannot hold (`&.actve`) | rule matches nothing | compile error + runtime throw |
| Illegal class name (`&.1bad`, `&.b!c`) | selector never matches | type-level error + runtime throw |
| Property that does nothing in context (`gap` without flex/grid) | declaration ignored | compile error naming what unlocks it |
| Attribute that does nothing in context (`checked` on `type="range"`) | attribute ignored | compile error naming what unlocks it |
| `calc()` unit/dimension error (`calc(2s + 3px)`, `calc(2px * 3px)`) | declaration dropped | compile error + runtime throw |
| `calc()` result wrong for the slot (`calc(2Hz * 2)` on `width`) | declaration dropped | compile error + runtime throw |
| Unknown custom property (`var(--spacng)`) | invalid at computed-value time | compile error + runtime throw |
| Cyclic `var()` chain | invalid at computed-value time | runtime throw naming the cycle |
| Unregistered media/container query | rule never applies | compile error + runtime throw |
| `animation` naming an unregistered keyframe | animation silently never runs | compile error + runtime throw |
| `grid-area` naming an area the parent never declares | item auto-placed, wrong grid | compile error + runtime throw |
| Unknown tag / attribute / CSS property | ignored | compile error + runtime throw |
| Wrong value for an attribute or property DSL | ignored | compile error + runtime throw |
| Child tag outside the parent's `innerHTML` | renders anyway | compile error + runtime throw |
| Text inside a void element | ignored / broken markup | compile error + runtime throw |
| Missing required attribute | renders without it | compile error + runtime throw |

## Structure and selectors

### Dead child selectors (`> childName`)

The original bug this library exists to kill. Rename, move, or delete a child
and the CSS that targeted it does not fail — the selector simply stops
matching and the rule becomes dead. shast names children
(`innerHTML: { title: ... }`) and types `> title` as a key of that structure,
so the stale selector is a compile error at the same call site, and the
runtime backstop throws
`Child selector '> headnig' references child 'headnig' which is not declared in the element's innerHTML`.
Provenance: the structural-coupling work
([`structural-coupling.md`](structural-coupling.md)).

### Dead class selectors (`&.className`)

The class axis of the same bug. `&.class` is typed against the classes the
element's `class` attribute can actually produce — including template-literal
expressions like `` class: `${active} card` `` — so a selector for a class the
element can never be in is a compile error, and the runtime throws
`Class selector '&.actve' references class 'actve' which is not declared on the element`.
Provenance: `archive/css-class-in-media` and the class-selector work.

### Illegal class names

A class name cannot start with a digit or contain an illegal identifier
character. In plain CSS `&.1bad` is a selector that can never match; nothing
tells you. shast rejects it at the type level and at runtime with
`Class selector '&.1bad' has an invalid class name '1bad'`.
Provenance: `archive/css-class-validate-type`.

### Bad trees (tags, children, text, voids)

An unknown tag, a child outside the parent's `innerHTML`, a string where the
tag does not declare `#text`, or content inside a void element are all
mechanically checkable from the registry. The types reject them and the
runtime throws, e.g.
`Structural Error: '<div>' is not a permitted child of <ul>` and
`Tag '<img>' is configured as a void element and must not contain any innerHTML or children`.

The one exception is nested `form`: `form` and `dialog` are wildcards, so
`form > ... > form` satisfies the registry rule and is emitted even though an
HTML parser repairs it on the client rather than rejecting it here.

## Vocabulary

Closed-world registries mean a tag, attribute, CSS property, or custom
property that is not declared is not "unknown once, guess later" — it is a
compile error and a runtime throw:

- `Structural Error: '<foo>' is not a recognized configuration tag in your registry`
- `Attribute Error: Property 'onclick' is not a valid attribute for <div> or the Global configuration registry`
- `CSS Error: 'colr' is not a recognized CSS attribute or property`
- `unknown custom property '--spacng'; register it in the CSS Properties config`

Attribute and property **values** are checked against their DSL too, so a
value outside the declared vocabulary fails at both walls rather than being
ignored by the browser.

## Conditional disclosure (what unlocks what)

CSS already has conditional disclosure in shast: `display: flex` unlocks
`gap`; `display: block` unlocks `width`. Writing a property nothing unlocked
is a compile error naming what would unlock it, instead of a declaration the
browser ignores because it does not apply. A gate is element-scoped: it follows
the element into `:hover`, `@media`, `@container` and `&.class` blocks (they
target the same box), and resets at a `> child` or a `::before` / `::after`
self slot (a different box). The same mechanism was extended to
HTML attributes — `<input type="range" checked>` fails at both walls with
`'checked' requires type: checkbox | radio`, while `<input type="checkbox" checked>`
is accepted. Gates may be literal values or DSL patterns
(`` `todo-${number}` ``), and a value matching two keys is an error.

Provenance: `archive/html-conditional-attributes`.

### Properties that do nothing in their structural context

Beyond explicit gates, a declaration can be legal yet inert: `width` on an
inline element, `z-index` without a stacking context, `vertical-align`
outside inline/table-cell, a flex/grid item property without a flex/grid
parent, a `grid-area` naming an area the parent never declares. The browser
ignores these; shast rejects them at both walls. The shipped and planned
catalog, ordered by type-system cost, is in
[`css-semantic-rules.md`](css-semantic-rules.md).

## Value grammar: `calc()` and `var()`

The browser drops any declaration whose `calc()` cannot be resolved, and any
value with a `var()` whose property holds the guaranteed-invalid value. shast
parses both:

- **`calc()`** — operands are typed by dimension. `+`/`-` require the same
  dimension (percentage is the wildcard), `/` needs a unitless right operand
  or one of the same dimension, and a multiplicative run may carry at most one
  unit. The result must match the property's slot. So `calc(2s + 3px)`,
  `calc(2px * 3px)`, `calc(10px / 2s)`, and `calc(2Hz * 2)` on `width` are all
  rejected with messages such as
  `calc() result type '<frequency>' is not valid for this property`.
  Provenance: `archive/css-calc`.
- **`var()`** — a reference must name a registered custom property, and the
  reference resolves to that property's registered syntax. An unknown name is
  rejected unconditionally; a circular chain throws at runtime naming the
  path. `var()` takes exactly one argument: shast removed fallbacks on purpose
  because a registered property always resolves to its registered
  `initial-value`, so a fallback could never be read (see
  [`css-var.md`](css-var.md)).
  Provenance: `archive/css-var`.

CSS-wide keywords (`inherit`, `initial`, `unset`, `revert`, `revert-layer`)
are valid on every property, via one seam rather than per-token
config: `archive/css-wide-keywords`.

## At-rule context

### Media and container queries

A query that is not in the registered vocabulary is a rule that never
applies. shast keys component CSS on the exact registered query strings, so
an unregistered or typo'd query is a compile error and the runtime throws
`Query '@media (width < 700px)' is not registered in the cssQueriesConfig`.
Query blocks render as scoped `@media`/`@container` rules, and class
selectors inside them are validated like any other (`archive/css-queries-config`,
`archive/css-queries-integration`, `archive/css-class-in-media`).

### Keyframes

An `animation` whose name no `@keyframes` declares simply never runs — a
notoriously quiet CSS bug. `animation-name` and the shorthand are typed
against the registered keyframes, and the runtime throws
`CSS Error: 'animation' value 'fadeIn' does not reference a registered keyframe`.
Registered keyframes are emitted once and shared. Provenance:
`archive/css-keyframes-config`, `archive/css-keyframes-integration`.

## Cross-node semantics

`grid-area` places an item into a named area declared by the **parent's**
`grid-template-areas`, but nothing in CSS checks that the name exists; a typo
just auto-places the item. shast threads the parent's literal
`grid-template-areas` down and checks membership at both walls:
`CSS Error: grid-area 'c' does not match any area defined by the parent's grid-template-areas`.
Provenance: `archive/css-semantic-grid-area`.

## Why the two walls agree

A wall that only sometimes fires would be worse than none. Several archived
slices are consolidations that make the type level and the runtime derive
from the **same data**, so they cannot drift:

- `archive/consolidate-shared-types` — one data-first CSS identifier module
  (`src/css/ident.ts`) feeding class-name and keyframe-name validation at both
  walls.
- `archive/css-config-types-consolidation` and
  `archive/queries-config-dsl-vocabulary` — config types and query unit
  vocabularies derived from the configs themselves (via the DSL, not
  regex-parsing), so a syntax config that lacks `<resolution>` makes
  resolution queries invalid at both walls.

This is the mechanism behind the claim: the same fact is checked in the
editor and on the server, and the two cannot disagree.

## The honest boundary

shast checks what is mechanically decidable from declared facts. It does not
pretend to check what depends on the browser's layout engine or on a runtime
it cannot see — actual overflow, intrinsic sizes, contrast, specificity
conflicts, and conditional layout semantics are out of scope and listed as
such in [`limitations.md`](limitations.md). The walls agree on the declared
surface: pseudo-class/element *usage* is checked at both, by the same registry
membership; the one narrow gap left is the shape-only check on the tag config's
own `cssPseudoElement` declarations.

The claim this document makes is the keepable one: the silent CSS mistakes a
browser would hide are, for the parts of the surface shast declares, found
before the browser sees them.
