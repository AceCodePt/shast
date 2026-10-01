// Runnable playground for the README.
//
// Part 1 wires a registry and renders one realistic component through every
// wall at once: named children, a conditional class, `var()` + `calc()`,
// registered `@media`/`@keyframes`, and a cross-node `grid-area`.
//
// Part 2 runs the same mistakes the README talks about and prints the exact
// error each one throws on the server - the messages quoted in the README are
// this file's output, not a paraphrase.
//
// Run it with `pnpm playground`.
import {
  commonCSSAttributes,
  commonCSSKeyframes,
  commonCSSPseudoClasses,
  commonCSSQueries,
  commonCSSSyntax,
  commonHTMLAttributes,
  commonHTMLTags,
  cssPropertiesConfig,
  engine,
  SUPPORTED_KEYWORDS,
} from "../src/index.ts";

// ---------------------------------------------------------------------------
// 1. The registry
//
// Custom properties are per-consumer: nothing is shipped, so the example
// registers the three tokens the card uses. The registry is the single source
// of truth for `var()` - a name that is not here cannot be referenced.
// ---------------------------------------------------------------------------

const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  "--space": {
    syntax: "<length>",
    inherits: false,
    "initial-value": "0.5rem",
  },
  "--radius": {
    syntax: "<length>",
    inherits: false,
    "initial-value": "8px",
  },
  "--brand": {
    syntax: "<color>",
    inherits: true,
    "initial-value": "hsl(220 90% 56%)",
  },
  // Two tokens the cycle demo below points at each other.
  "--a": {
    syntax: "<color>",
    inherits: false,
    "initial-value": "hsl(1 1% 1%)",
  },
  "--b": {
    syntax: "<color>",
    inherits: false,
    "initial-value": "hsl(2 2% 2%)",
  },
});

const { createComponent, renderComponent, cssProperties: propertyRules } =
  engine({
    supportedKeywords: SUPPORTED_KEYWORDS,
    htmlAttributesConfig: commonHTMLAttributes,
    htmlTagConfig: commonHTMLTags,
    cssSyntaxConfig: commonCSSSyntax,
    cssAttributesConfig: commonCSSAttributes,
    cssPseudoClassConfig: commonCSSPseudoClasses,
    cssPropertiesConfig: cssProperties,
    cssQueriesConfig: commonCSSQueries,
    cssKeyframesConfig: commonCSSKeyframes,
  });

// ---------------------------------------------------------------------------
// 2. One component, validated against everything
// ---------------------------------------------------------------------------

const planCard = (featured: boolean) =>
  createComponent({
    tag: "article",
    // A conditional class. The type system sees both possible values, so
    // `&.featured` below is legal and `&.actve` would not be.
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
      ":hover": {
        transform: "scale(1.01)",
        transition: "transform 150ms ease-out",
      },
      "> heading": {
        "grid-area": "heading",
        "font-size": "calc(var(--space) * 3)",
      },
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

const { html, css } = renderComponent(planCard(true));

console.log("=== HTML ===");
console.log(html);
console.log("\n=== CSS ===");
console.log(css);
console.log("\n=== @property ===");
console.log(propertyRules);

// ---------------------------------------------------------------------------
// 3. The same mistakes, and what the server says
//
// Every call below is rejected by `tsc` first; the `@ts-expect-error` comments
// assert that, so `pnpm check` fails if a wall ever stops rejecting the row.
// Running the file is the runtime wall: the printed message is what a server
// logs before any HTML leaves it.
// ---------------------------------------------------------------------------

function report(label: string, run: () => unknown): void {
  try {
    run();
    console.log(`[accepted]  ${label}`);
  } catch (error) {
    console.log(`[rejected]  ${label}\n            ${(error as Error).message}`);
  }
}

console.log("\n=== The two walls ===");

report("typo'd child selector", () =>
  createComponent({
    tag: "div",
    innerHTML: { header: { tag: "h2", innerHTML: "hi" } },
    css: {
      // @ts-expect-error `headnig` is not a child of this element
      "> headnig": { color: "red" },
    },
  }),
);

report("class the element cannot hold", () =>
  createComponent({
    tag: "div",
    attributes: { class: "plan" },
    innerHTML: "x",
    css: {
      // @ts-expect-error `actve` is not a class this element declares
      "&.actve": { color: "red" },
    },
  }),
);

report("illegal class name", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error a class name cannot start with a digit
      "&.1bad": { color: "red" },
    },
  }),
);

report("property with no gate to unlock it", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error `gap` needs a flex/grid `display`
      gap: "1rem",
    },
  }),
);

report("attribute outside its gate", () =>
  createComponent({
    tag: "input",
    attributes: {
      type: "text",
      // @ts-expect-error `checked` is only unlocked by type: checkbox | radio
      checked: true,
    },
  }),
);

report("calc() with mixed dimensions", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      display: "block",
      // @ts-expect-error a time and a length cannot be added
      width: "calc(2s + 3px)",
    },
  }),
);

report("calc() whose result misses the slot", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      display: "block",
      // @ts-expect-error a frequency is not a <length-percentage>
      width: "calc(2Hz * 2)",
    },
  }),
);

report("unknown custom property", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error `--spacng` is not registered
      color: "var(--spacng)",
    },
  }),
);

report("circular var() chain", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // Each value typechecks on its own; only running the graph reveals the
      // cycle, so this is a runtime-only rejection.
      "--a": "var(--b)",
      "--b": "var(--a)",
      color: "var(--a)",
    },
  }),
);

report("unregistered media query", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error only exact registered query strings typecheck
      "@media (width < 700px)": { color: "red" },
    },
  }),
);

report("animation naming an unregistered keyframe", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error `fadeIn` is not a registered keyframe
      animation: "fadeIn 1s linear",
    },
  }),
);

report("grid-area the parent never declares", () =>
  createComponent({
    tag: "div",
    innerHTML: { header: { tag: "h2", innerHTML: "hi" } },
    css: {
      display: "grid",
      "grid-template-areas": "a a\nb b",
      "> header": {
        // @ts-expect-error `header` is not one of the parent's areas (a, b)
        "grid-area": "header",
      },
    },
  }),
);

report("tag outside the registry", () =>
  createComponent({
    // @ts-expect-error `foo` is not a recognized tag
    tag: "foo",
    innerHTML: "x",
  }),
);

report("attribute outside the registry", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    // @ts-expect-error `onclick` is not a declared global attribute
    attributes: { onclick: "alert(1)" },
  }),
);

report("CSS property outside the registry", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error `colr` is a typo for `color`
      colr: "red",
    },
  }),
);

report("value outside an attribute's DSL", () =>
  createComponent({
    tag: "a",
    innerHTML: "x",
    // @ts-expect-error `_blah` is not one of the declared targets
    attributes: { target: "_blah" },
  }),
);

report("value outside a property's DSL", () =>
  createComponent({
    tag: "div",
    innerHTML: "x",
    css: {
      // @ts-expect-error `capitilize` is a typo for `capitalize`
      "text-transform": "capitilize",
    },
  }),
);

report("child the parent does not permit", () =>
  createComponent({
    tag: "ul",
    innerHTML: {
      // @ts-expect-error <ul> permits only <li>
      item: { tag: "div", innerHTML: "x" },
    },
  }),
);

report("ancestral inheritance: a tag only the immediate parent allows", () =>
  createComponent({
    tag: "a",
    attributes: { href: "/plans" },
    innerHTML: {
      list: {
        tag: "ul",
        innerHTML: {
          item: {
            tag: "li",
            innerHTML: {
              // `li` permits any tag, but an ancestor `<a>` does not permit
              // `<form>`, so the intersection forbids it.
              // @ts-expect-error <a>'s ancestral set does not include <form>
              form: { tag: "form", innerHTML: "x" },
            },
          },
        },
      },
    },
  }),
);

report("text inside a void element", () =>
  createComponent({
    tag: "img",
    attributes: { src: "./x.png", alt: "x" },
    // @ts-expect-error <img> is void and takes no children
    innerHTML: "no",
  }),
);

report("required attribute omitted", () =>
  createComponent({
    tag: "img",
    // @ts-expect-error `src` and `alt` are required on <img>
    attributes: {},
  }),
);
