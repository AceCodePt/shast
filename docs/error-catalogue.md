# Every mistake, and what the two walls say

Each row is a mistake plain CSS accepts and the browser reveals only at
runtime. The **type wall** is what your editor and `tsc` show; the **server
wall** is what `createComponent` throws before HTML leaves the process. The
messages below are quoted from the two walls, not paraphrased.

## Structure and selectors

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

## Vocabulary

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

## Conditional disclosure (what unlocks what)

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

## Value grammar: `calc()` and `var()`

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
          '("currentColor" | "transparent" | `#${string}` | `rgb(${number} ${number}
          ${number})` | `rgb(${number}, ${number}, ${number})` | … )'.
  server  Invalid var() value: unknown custom property '--spacng';
          register it in the CSS Properties config

--a: "var(--b)"; --b: "var(--a)"           a cycle in the reference graph (runtime only)
  server  Invalid var() value: circular var() reference: --b -> --a -> --b
```

## At-rule context

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

## Cross-node semantics

```
child grid-area not in the parent's grid-template-areas
  tsc     Type '"header"' is not assignable to type
          '"a" | "b" | "inherit" | … | undefined'.
  server  CSS Error: grid-area 'header' does not match any area defined by the
          parent's grid-template-areas (a, b)
```

The same fact, twice, at the two points before the client. Run
`pnpm playground` to watch all of it happen; the prose catalogue with the
archived slice behind each entry is in
[`before-the-browser.md`](before-the-browser.md).
