# Tasks

## DSL

- [x] **Primitives** - `string`, `number`, `bigint`, `boolean`, `undefined`
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Literals** - `true`, `false`
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Literal Numbers** - `0`, `1`, ...
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Literal Strings** - `""`, `''`, ` `` `
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Literal String with pipe** - `'|'`, `"|"`, `` `|` `` *(edge case)*
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test


- [x] **Union Type** - `|`
  - [x] With Primitives - `string | number | bigint | boolean | undefined`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] With Literal Values
    - [x] Boolean Literal
      - [x] Type Validation
      - [x] Type Inference
      - [x] Runtime Validation
      - [x] Parse
      - [x] Test
    - [x] Number Literal
      - [x] Type Validation
      - [x] Type Inference
      - [x] Runtime Validation
      - [x] Parse
      - [x] Test
    - [x] String Literal
      - [x] Type Validation
      - [x] Type Inference
      - [x] Runtime Validation
      - [x] Parse
      - [x] Test
  - [x] Complex union - `true | 0 | 'a' | \`b\` | undefined | "c"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test

- [x] **Template Literals** - `` `${ }` ``
  - [x] Primitives - `string`, `number`, `bigint`, `boolean`, `undefined`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Literals - `true`, `0`, `"foo"`, `'bar'`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Complex Multi - `` `before${'a' | 'b'}mid${1 | 2}end` ``
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test

- [x] Recursive DSL - `<length>` as `${number}{'%' | 'px'}` 
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Negative Cases**
  - [x] Fails on non-existing keyword `"xyz"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on partially parsable union `"'xyz' | xyz"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on empty string `""`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on trailing pipe `"string |"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on leading pipe `"| string"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on double pipe `"string || number"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on empty union parts `"string |  | number"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on just a pipe `"|"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on illegal characters `( ) [ ] { }`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on mismatched quotes `"'unclosed"`, `"unclosed'"`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on whitespace-only `"   "`
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on unknown keyword in template interpolation `` `/${${unknown}}/` `` *(runtime now rejects as well)*
    - [x] Type Validation
    - [x] Type Inference
    - [x] Runtime Validation
    - [x] Parse
    - [x] Test
  - [x] Fails on type mismatch in `parseValueAgainstDSL` - value doesn't match DSL
    - [x] `"string"` rejects non-strings (number, boolean, undefined)
    - [x] `"number"` rejects non-numbers (string, bigint)
    - [x] `"boolean"` rejects truthy/falsy non-booleans (1, "")
    - [x] `"undefined"` rejects null

---

## HTML Attributes

- [x] **`htmlAttributeConfig` builder** - validates attribute DSL strings at runtime
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Edge Cases**
  - [x] Empty config `{}` accepted
  - [x] Typed `as const` vs mutable config
  - [x] Object reference identity preserved
  - [x] Invalid DSL string throws error

- [x] **Conditional attributes** - an attribute value gates `self` / `children` unlocks, exactly as a CSS gate does
  - [x] Type Validation - locked unlocks branded naming what unlocks them; unknown attributes stay stock
  - [x] Type Inference - complex values infer their per-value variants
  - [x] Runtime Validation - the same accept/reject decisions as the type wall
  - [x] Test - `@ts-expect-error` paired with `assert.throws` per negative case

- [x] **Pattern keys** - value keys written as DSL (`<token>` or backtick template) match a written value
  - [x] Type Validation - literal first, then patterns; two matching keys is an error
  - [x] Type Inference - a matched pattern key resolves to its `self` bag
  - [x] Runtime Validation - one shared resolver for CSS and HTML; overlap throws
  - [x] Test - a value matching no key reports the value, never the key

- [x] **Render fill-in** - a single-literal `self` unlock renders when omitted
  - [x] Type Validation - writing a different value fails
  - [x] Type Inference - `undefined`-arm optionality through `MaybeAttributes`
  - [x] Runtime Validation - the literal is filled in if absent
  - [x] Test - omitted and correctly-written render identically

- [x] **`ComponentIds<T>`** - every literal id written in a component with its resolved key's declared values
  - [x] Type Validation - a widened `string` id contributes nothing
  - [x] Type Inference - literal and patterned ids resolve; duplicates merge
  - [x] Runtime Validation - the component validates under its id gate
  - [x] Test - `Equal` against the exact written literal ids

## HTML Tags

- [x] **`htmlTagConfig` builder** - validates tag definitions, cross-references, and attribute DSL
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **innerHTML cross-references**
  - [x] Validates referenced tags exist in config
  - [x] `#text` allowed for text-containing tags
  - [x] `*` wildcard allows any child tag
  - [x] Self-referencing tags (`div` containing `div`)
  - [x] Mixed `#text` + tag references
  - [x] Void elements (empty `innerHTML: []`)

- [x] **Tag-specific attributes**
  - [x] Attributes validated via DSL on each tag
  - [x] Literal union attributes (`dir: "'ltr' | 'rtl' | 'auto' | undefined"`)
  - [x] Per-tag attribute overrides

- [x] **Edge Cases**
  - [x] Empty tag config `{}` accepted
  - [x] Tags with template literal DSL attributes
  - [x] Object reference identity preserved

## CSS Syntax

- [x] **`cssSyntaxConfig` builder** - validates syntax token definitions with recursive keyword resolution
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Recursive keyword resolution** - `<length>` defined as template literal, used in `<length-percentage>` as `"<length> | <percentage>"`
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Parse
  - [x] Test

- [x] **Edge Cases**
  - [x] Circular or self-referencing syntax tokens
  - [x] Unknown token reference raises error
  - [x] Mixed token + literal unions

## CSS Attributes

- [x] **`cssAttributeConfig` builder** - maps CSS property names to syntax tokens or literal DSL strings
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Token resolution & type inference**
  - [x] Single token resolves to raw DSL string
  - [x] Quoted literals infer as quoted string types
  - [x] Mixed token + literal unions
  - [x] Multiple attributes infer as mapped object
  - [x] Unknown token is a type-level error

## CSS Properties

- [x] **`cssPropertiesConfig` builder** - validates CSS `@property` rule definitions (`syntax`, `inherits`, `initial-value`)
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **`syntax` field validation**
  - [x] Must reference valid CSS syntax tokens
  - [x] DSL string validated at runtime via `dslString()`
  - [x] Supports complex DSL unions

- [x] **`inherits` field**
  - [x] Boolean validation
  - [x] Default handling

- [x] **`initial-value` field**
  - [x] Validated against resolved syntax type (runtime)
  - [x] Validated against resolved syntax type (type-level)
  - [x] Required (must be defined, per spec unless `syntax: "*"`)
  - [x] Must match the `syntax` DSL at runtime

- [x] **Property name validation** - names must start with `--`
  - [x] Type-level error for invalid names
  - [x] Runtime check for `--` prefix

- [x] **Edge Cases**
  - [x] Empty config `{}`
  - [x] Multiple custom properties
  - [x] Property names with `_` prefix (`--_a`)

---

## Create Component

- [x] **`createComponent` function** - validates a component structure against all configs
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Tag validation**
  - [x] Recognized tag from tag config passes
  - [x] Unknown tag is a type-level error
  - [x] Missing `tag` property is rejected

- [x] **Attribute validation**
  - [x] Global attributes merged with tag-specific attributes
  - [x] Attribute values type-checked against inferred DSL types
  - [x] Undocumented attributes are rejected
  - [x] Optional attributes (`| undefined`) accept omission

- [x] **innerHTML validation**
  - [x] Text nodes allowed only when the tag allows text (`*` or `#text` in innerHTML)
  - [x] Void elements (empty `innerHTML: []`) reject children
  - [x] Nested hierarchy validated recursively
  - [x] Mixed text + child components

- [x] **innerHTML structural inheritance** - the set of allowed child tags propagates down the tree, gated by whether a tag declares `#text`; compile and runtime must agree
  - [x] Type Validation
  - [x] Runtime Validation
  - [x] Test
  - [x] `#text`-bearing tag is *conjunctive*: its children are validated against `inheritedAllowed ∩ tag.innerHTML`, and it narrows the inherited set for everything nested below it
  - [x] Non-`#text` array tag is a *reset*: its direct children are validated against exactly `tag.innerHTML`, and it passes the inherited set through unchanged
  - [x] The inherited restriction re-emerges one level below a reset tag (`a > ul > li` validates `li`'s children against `a.innerHTML ∩ li.innerHTML`)
  - [x] `*` tag *inherits* the ancestral set: a root `*` accepts any tag, but a nested `*` is limited to the inherited set (e.g. `ul > li > div > <x>` restricts `<x>`)
  - [x] Intersection example: `a > h1 > span` limited to `a.innerHTML ∩ h1.innerHTML`; a tag allowed by `h1` alone (e.g. `b`) is rejected under `a`
  - [x] Structural example: `a > ul` accepts only `li`

- [x] **CSS validation**
  - [x] Property values validated against CSS syntax config via `DSLInfer`
  - [x] CSS custom properties (`--*`) resolved against CSS properties config
  - [x] Child CSS selectors (`> childName`) allow per-child CSS blocks
  - [x] Nested CSS selectors validated recursively
  - [x] Runtime validates `> childName` selector keys against the component's `innerHTML` keys — the type level rejects a typo'd selector (e.g. `> headnig`), but `validateComponentNode` currently accepts it, so the runtime wall has a hole when types are bypassed (found via cross-component composition testing, see `docs/structural-coupling.md`)
    - [x] Runtime Validation
    - [x] Test

---

## Render Component

- [x] **`renderComponent` function** - converts a component structure to separate HTML and CSS strings
  - [x] Type Validation (via engine binding `ValidateComponentStructure`)
  - [x] Test

- [x] **HTML string output**
  - [x] Tag name rendered correctly
  - [x] Void elements (`br`, `hr`, `img`) self-close properly
  - [x] Non-void elements wrap children

- [x] **Attribute rendering**
  - [x] Attributes serialized to HTML attribute syntax
  - [x] Boolean attributes (`true` renders without value, `false` omits attribute)
  - [x] Undefined/optional attributes omitted
  - [ ] Global attributes applied to all components
  - [ ] Tag-specific attributes applied correctly

- [x] **Text & children rendering**
  - [x] Text nodes rendered as-is
  - [x] Child components rendered recursively
  - [x] Mixed text and component children in correct order
  - [ ] Void elements reject children (error or ignored)

- [x] **CSS string output**
  - [x] Styled components receive a `cid-<hash>` attribute; children receive a semantic `cid-<name>` attribute only when targeted by a `> childName` direct child selector
  - [x] Scope hash is derived from the component's `css` block, not from instance data
  - [x] Instances with an identical `css` block share one scope and are emitted once
  - [x] Inline `css` block properties collected as scoped CSS rules
  - [x] Child CSS selectors (`> childName`) applied to corresponding children
  - [x] Pseudo-class blocks included in scoped styles
  - [x] Pseudo-element blocks included in scoped styles
  - [ ] Variation CSS merged with inline CSS
  - [ ] Property values validated against CSS syntax at runtime
  - [x] CSS output separate from HTML string (user handles integration)

- [ ] **Edge Cases**
  - [x] Empty component (no children, no CSS)
  - [x] Deeply nested components
  - [x] Components with all optional attributes omitted
  - [ ] Components with variations applied

---

## Render CSS Properties Config using the @property rule

- [x] **`renderCSSPropertiesConfig` function** - converts custom properties object to CSS string
  - [x] Runtime Validation
  - [x] Test

- [x] **Custom property rendering**
  - [x] Properties with `--` prefix rendered correctly
  - [x] `initial-value` always rendered (required per spec)
  - [x] Properties output in correct CSS `@property` format

- [x] **Edge Cases**
  - [x] Empty custom properties object
  - [x] Multiple properties with mixed types
  - [x] Numeric string values

---

## Pseudo-Class Config Builder

- [x] **`cssPseudoClassConfig` builder** - validates a pseudo-class config array
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Prefix validation**
  - [x] Accepts `:` prefixed strings
  - [x] Rejects names without `:` prefix
  - [x] Runtime throws for missing `:` prefix
  - [x] Returns config unchanged

- [x] **Edge Cases**
  - [x] Empty array `[]` accepted

## Tag Config Pseudo-Class Declaration

- [x] **Extend `BaseHTMLTagConfig` with optional `cssPseudoClass: string[]` field**
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Declaration rules**
  - [x] Accepts tag with valid pseudo-class references
  - [x] Rejects pseudo-class name not starting with `:`
  - [x] Tag without `cssPseudoClass` key = no pseudo-class support
  - [x] Tag with `cssPseudoClass: []` = no pseudo-class support
  - [x] Runtime accepts empty pseudo-class list
  - [x] Runtime preserves object reference

- [x] **Edge Cases**
  - [x] Multiple tags with different pseudo-class lists

## Component CSS: Pseudo-Class Block Validation

- [x] **Extend `ValidateComponentCSSStructure` to validate pseudo-class blocks against tag's `cssPseudoClass`**
  - [x] Type Validation
  - [x] Type Inference
  - [x] Test

- [x] **Block rules**
  - [x] Pseudo-class with all its CSS properties passes
  - [x] Pseudo-class on tag that doesn't declare it is rejected
  - [x] Pseudo-class on tag with `cssPseudoClass: []` is rejected
  - [x] Pseudo-class on tag with no `cssPseudoClass` key is rejected
  - [x] Multiple pseudo-classes in same css block accepted
  - [x] Globally-configured pseudo-class accepted on any tag

- [x] **Nesting**
  - [x] Pseudo-class inside child selector (`> child: { ":hover": {...} }`)
  - [x] Child selector inside pseudo-class (`":hover": { "> child": {...} }`)
  - [x] Pseudo-class inside nested pseudo-class (`":hover": { ":focus": {...} }`)

---

## Tag Config Pseudo-Element Declaration

- [x] **Extend `BaseHTMLTagConfig` with optional `cssPseudoElement` field**
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Declaration rules**
  - [x] Accepts `::` prefixed pseudo-element strings in tag config
  - [x] Rejects pseudo-element names not starting with `::`
  - [x] Tag with `cssPseudoElement: []` = no additional pseudo-element support

- [x] **Edge Cases**
  - [x] Multiple tags with different pseudo-element lists

## Component CSS: Pseudo-Element Block Validation

- [x] **Extend `ValidateComponentCSSStructure` to validate pseudo-element blocks against tag's `cssPseudoElement`**
  - [x] Type Validation
  - [x] Type Inference
  - [x] Test

- [x] **Block rules**
  - [x] Pseudo-element with all its CSS properties passes
  - [x] Pseudo-element on tag that doesn't declare it is rejected
  - [x] Pseudo-element on tag with `cssPseudoElement: []` is rejected
  - [x] Pseudo-element on tag with no `cssPseudoElement` key is rejected
  - [x] Multiple pseudo-elements in same css block accepted
  - [x] Pseudo-element nested inside another pseudo-element is rejected

- [x] **Nesting**
  - [x] Pseudo-element inside child selector (`> child: { "::placeholder": {...} }`)
  - [x] Child selector inside pseudo-element (`"::placeholder": { "> child": {...} }`)
  - [x] Pseudo-element inside pseudo-class (`":hover": { "::placeholder": {...} }`)
  - [x] Pseudo-class inside pseudo-element (`"::placeholder": { ":hover": {...} }`)

## Complex CSS Calc

- [ ] **`calc()` expression support in CSS values** - `calc()` parsed, validated, and rendered as a CSS value
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Test

- [ ] **Calc expressions**
  - [ ] Nested calc expressions `calc(calc(...))`
  - [ ] Calc with mixed units `calc(100% - 20px)`, `calc(50vw + 2rem)`
  - [ ] Calc with CSS variables `calc(var(--spacing) * 2)`

- [ ] **Calc in CSS context**
  - [ ] Inline `css: { width: "calc(100% - 40px)" }` validated against CSS syntax
  - [ ] Syntax token defined as `calc(...)` in CSS attribute config

- [ ] **Edge Cases**
  - [ ] Malformed calc expressions rejected
  - [ ] Unclosed parentheses in calc
  - [ ] Calc with unsupported operators
  - [ ] Empty calc `calc()`

---

## CSS Variable Usage from Property Registry

- [ ] **`var()` reference support in CSS values** - `var(--my-color)` referencing a property defined in CSS Properties config
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Test

- [ ] **Variable resolution rules**
  - [ ] `var(--name)` resolves to the syntax type of the registered property
  - [ ] Unknown `--name` (not in CSS Properties config) is rejected
  - [ ] Property without a `--` prefix is rejected
  - [ ] `var()` used in a context where the resolved type is compatible with the expected CSS value syntax

- [ ] **Fallback values**
  - [ ] `var(--name, <fallback>)` — fallback validated against the property's syntax type
  - [ ] Fallback can be a literal value, another `var()`, or a `calc()`
  - [ ] Fallback type-checked to match the expected context type

- [ ] **Nesting and composition**
  - [ ] `var()` inside `calc()` — `calc(var(--spacing) * 2)`
  - [ ] Multiple `var()` references in a single CSS value
  - [ ] `var()` in CSS shorthand properties

- [ ] **Edge Cases**
  - [ ] `var()` without arguments (malformed)
  - [ ] `var()` with extra arguments beyond fallback
  - [ ] Circular `var()` references (runtime detection)
  - [ ] Missing fallback for unknown property at runtime

---

## Array innerHTML Children

- [x] **Support array of child components** - `innerHTML: { child: [{ tag: "div" }, { tag: "div" }] }` for multiple semantically identical children
  - [x] Type Validation
  - [x] Type Inference
  - [x] Runtime Validation
  - [x] Test

- [x] **Validation rules**
  - [x] Array children validated individually against tag's innerHTML rules
  - [x] Mixed single child and array child syntax distinguished
  - [x] Empty array `[]` accepted where `innerHTML` allows it
  - [x] Array of text nodes `["a", "b"]`
  - [x] Mixed text nodes and component children in array

- [x] **Render array children**
  - [x] Array children rendered in correct order
  - [x] Multiple `<div>` siblings rendered correctly
  - [x] Array of text nodes concatenated/rendered in order

- [x] **Nesting**
  - [x] Arrays nested inside arrays
  - [x] Array with single element equivalent to bare child
  - [x] Deeply nested arrays in complex hierarchies

- [x] **Edge Cases**
  - [x] Empty array of children
  - [x] Array with one element
  - [x] Very large arrays
  - [x] Arrays with mixed types (text + components)

---

## CSS Queries Config

- [ ] **`cssQueriesConfig` builder** - validates query alias definitions (`@phone` -> `@media (width < 768px)`) with recursive DSL validation
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Test

- [ ] **Media Query DSL** - `@media (prefers-reduced-motion: reduce)`, `@media (width < 768px)`, `@media (768px <= width < 1024px)`
  - [ ] Width/height comparison operators (`>`, `<`, `>=`, `<=`) with units
  - [ ] `prefers-color-scheme` (light / dark)
  - [ ] `prefers-reduced-motion` (reduce / no-preference)
  - [ ] `orientation` (portrait / landscape)
  - [ ] `resolution` / `device-pixel-ratio` queries
  - [ ] Compound conditions with `and` / `,` (or)
  - [ ] `not` / `only` keywords
  - [ ] Media types (`all`, `screen`, `print`)
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Parse
  - [ ] Test

- [ ] **Container Query DSL** - `@container (width > 400px)`, `@container sidebar (min-width: 600px)`
  - [ ] Width/height comparison operators with units
  - [ ] Named container scoping (`@container sidebar (...)`)
  - [ ] Style queries (`@container style(--theme: dark)`)
  - [ ] Compound conditions with `and` / `,`
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Parse
  - [ ] Test

- [ ] **Variations**
  - [ ] Minimal - common width breakpoints, `prefers-reduced-motion`
  - [ ] Common - width/height, `prefers-color-scheme`, `orientation`, `resolution`, basic container
  - [ ] Full - all media features, container style queries, complex compound conditions

- [ ] **Component CSS integration** - query aliases resolved in component CSS as `{ "@phone": { ... } }` expanded to scoped `@media` / `@container` blocks
  - [ ] Query alias (`@phone`) at top level of component CSS
  - [ ] Query alias inside pseudo-class blocks
  - [ ] Query alias inside pseudo-element blocks
  - [ ] Properties, pseudo-classes, and child selectors inside query alias block
  - [ ] Nested query aliases
  - [ ] Unknown query alias is a type-level error
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Test

- [ ] **Rendering**
  - [ ] Query alias resolves to full `@media` / `@container` rule in scoped CSS
  - [ ] Multiple query aliases rendered in order
  - [ ] CID scoping preserved inside expanded query blocks

- [ ] **Edge Cases**
  - [ ] Empty config `{}` accepted
  - [ ] Query alias must start with `@`
  - [ ] Unknown alias reference raises error
  - [ ] Empty query alias block (no properties) in component CSS
  - [ ] Invalid media/container DSL string raises error

---

## CSS Class Selectors

- [x] **`class` attribute supports space-separated class names** — `class: "foo bar"` declares multiple classes on an element
  - [x] Type Validation
  - [x] Type Inference
  - [x] Test

- [x] **Class targeting in CSS blocks** — `css: { "&.foo": { ... }, "&.bar": { ... } }` targets individual declared classes
  - [x] Type Validation
  - [x] Type Inference
  - [x] Test

- [x] **Selector rules**
  - [x] `&.className` only valid if `className` is part of the element's `class` attribute
  - [x] Unknown class in CSS selector is a type-level error
  - [x] Multiple classes on same element targetable individually
  - [x] Pseudo-classes applied via nesting inside `&.className` block
  - [x] Pseudo-elements applied via nesting inside `&.className` block

- [ ] **Type-level class-name validation** — `ValidateClassName` rejects an invalid CSS class identifier at compile time, applied to the `class` attribute (`SplitSpace`) and the `&.${K}` selector keys in `ValidateComponentCSSStructure`
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Test

- [ ] **Nesting**
  - [ ] `&.className` inside `@media` blocks
  - [x] `&.className` inside pseudo-class blocks
  - [x] `&.className` inside pseudo-element blocks
  - [x] Child selectors inside `&.className` blocks (`> childName`)

- [x] **Rendering**
  - [x] `class` attribute rendered as space-separated string in HTML output
  - [x] `&.foo` selectors rendered nested as `&.foo` under the element's `[cid-<hash>]` scope
  - [x] CID scoping preserved on class selectors

- [x] **Edge Cases**
  - [x] Element with no `class` attribute rejects `&.` selectors
  - [x] Empty `class` attribute `""`
  - [x] Duplicate class names ignored
  - [x] Class name with special characters

---

## CSS Semantic Rules (structure → style validity)

- [ ] **Structure → style validity checks** - extends validation from "is this token legal" to "does this declaration do anything in its structural context", threaded like innerHTML ancestral inheritance. Ordered by type-system cost (Tier A cheapest)
  - [ ] Type Validation
  - [ ] Type Inference
  - [ ] Runtime Validation
  - [ ] Test

- [x] **Tier A — same-node rules** (intra-block conditional, no threading)
  - [x] `z-index` requires a stacking context (`position` ≠ static, or opacity/transform/filter)
  - [x] Inline elements reject `width` / `height` / `margin-top` / `margin-bottom`
  - [x] `vertical-align` valid only on inline / inline-block / table-cell
  - [-] Non-animatable `transition` / `animation` property
  - [x] `text-align` context (block containers)
  - [x] Container-only props require own flex/grid display (`gap` / `justify-content` / `align-items`)

- [x] **Tier B — one-level parent → child threading**
  - [x] Flex/grid item props require flex/grid parent (`flex` / `order` / `align-self` / `grid-column` / `grid-row`)
  - [-] `grid-area` name validated against parent's `grid-template-areas`

- [ ] **Tier C — ancestor-chain boolean threading**
  - [ ] `position: absolute` needs a positioned ancestor
  - [ ] `position: sticky` needs a threshold + no scroll-clipping ancestor
  - [ ] `position: fixed` containing block changed by ancestor `transform` / `filter` / `will-change`
  - [ ] `overflow` clipping an absolutely-positioned descendant
  - [ ] `height: 100%` chain to a definite-height ancestor

- [ ] **Tier D — union-carrying** (gate behind perf budget)
  - [ ] Conditional display invalidates child layout props (error only when meaningful in zero states)
  - [ ] Multi-state dead-property detection

- [ ] **Out of scope** (not statically decidable)
  - [ ] `inherit` value / contrast (extrinsic render context)
  - [ ] Actual content overflow / fit (layout-computed)
  - [ ] Flex `min-width: auto` overflow (needs intrinsic content size)
  - [ ] Specificity / `!important` conflicts across components (extrinsic cascade)
  - [ ] `100vw` scrollbar, missing assets, responsive design intent (runtime / intent)
