# One component, all the walls

The 30-second card is deliberately small. This is a realistic one, assembled
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
<article data-cid-a4vysi class="plan featured"><h2 data-cid-heading>Studio</h2><p data-cid-price>$18 / mo</p><ul data-cid-perks><li data-cid-seats>5 seats</li><li>100 GB</li></ul></article>
```

```css
[data-cid-a4vysi] {
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
  & > [data-cid-heading] {
    grid-area: heading;
    font-size: calc(var(--space) * 3);
  }
  & > [data-cid-price] {
    grid-area: price;
    font-weight: 700;
  }
  & > [data-cid-perks] {
    grid-area: perks;
    list-style-type: none;
    padding: 0px;
    & > [data-cid-seats] {
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

(The playground registers two further tokens so the `var()` cycle demo has
something to point at each other; they are omitted from the output above.)
