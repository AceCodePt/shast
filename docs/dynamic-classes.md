# Dynamic components and classes

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

## The one rule: the type must be known at compile time

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
