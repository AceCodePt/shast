import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import type { InferHTMLAttributesConfig } from "@/html/attribute-config/types.ts";
import engine from "@/engine/index.ts";
import type { ComponentIds } from "@/engine/types.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_PSEUDO_CLASSES from "@/css/pseudo-class-config/variations/common.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";
import { assertType, type Equal } from "../type-utils.ts";

// ---------------------------------------------------------------------------
// Test-only registry. No vocabulary is baked into `src/`; the mechanism is
// exercised here with an `input` whose `type` gates its attributes and an `id`
// with one literal and one patterned key.
// ---------------------------------------------------------------------------

const GLOBAL_ATTRIBUTES = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: {
    undefined: { self: {}, children: {} },
    "todo-42": { self: { "data-kind": "'literal'" }, children: {} },
    "`todo-${number}`": { self: { "data-kind": "'pattern'" }, children: {} },
  },
});

const TAGS = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
  div: {
    display: "block",
    attributes: {
      mode: {
        undefined: { self: {}, children: {} },
        card: {
          self: { "data-mode": "'card'" },
          children: { "data-slot": "'card-slot'" },
        },
      },
    },
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  span: {
    display: "inline",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  input: {
    display: "inline-block",
    attributes: {
      type: {
        text: {
          self: { maxlength: "number", pattern: "string" },
          children: {},
        },
        number: {
          self: { min: "number", max: "number", step: "number" },
          children: {},
        },
        range: {
          self: { min: "number", max: "number", step: "number" },
          children: {},
        },
        checkbox: { self: { checked: "boolean" }, children: {} },
        radio: { self: { checked: "boolean" }, children: {} },
        file: { self: { accept: "string", multiple: "boolean" }, children: {} },
        submit: { self: {}, children: {} },
      },
      value: "string | undefined",
    },
    innerHTML: [],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: GLOBAL_ATTRIBUTES,
  htmlTagConfig: TAGS,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_PSEUDO_CLASSES,
  cssPropertiesConfig: cssPropertiesConfig(
    SUPPORTED_KEYWORDS,
    CSS_SYNTAX_CONFIG,
    {},
  ),
  cssQueriesConfig: COMMON_QUERIES,
});

// A second registry whose id keys overlap: `todo-42` matches both.
const OVERLAP_GLOBAL_ATTRIBUTES = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: {
    "`todo-${string}`": { self: { "data-kind": "'s'" }, children: {} },
    "`todo-${number}`": { self: { "data-kind": "'n'" }, children: {} },
  },
});

const overlapEngine = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: OVERLAP_GLOBAL_ATTRIBUTES,
  htmlTagConfig: TAGS,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_PSEUDO_CLASSES,
  cssPropertiesConfig: cssPropertiesConfig(
    SUPPORTED_KEYWORDS,
    CSS_SYNTAX_CONFIG,
    {},
  ),
  cssQueriesConfig: COMMON_QUERIES,
});

describe("HTML conditional attributes", () => {
  describe("self unlocks", () => {
    test("accepts an attribute unlocked by the written gate value", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "input",
          attributes: { type: "checkbox", checked: true },
        }),
      );
    });

    test("accepts range's numeric unlocks", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "input",
          attributes: { type: "range", min: 0, max: 100, step: 5 },
        }),
      );
    });

    test("accepts file's string/boolean unlocks", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "input",
          attributes: { type: "file", accept: "image/*", multiple: true },
        }),
      );
    });

    test("rejects checked under range at both walls", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "input",
            attributes: {
              type: "range",
              // @ts-expect-error checked requires type: checkbox | radio
              checked: true,
            },
          }),
        /'checked' requires type: checkbox \| radio/,
      );
    });

    test("rejects accept under text at both walls", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "input",
            attributes: {
              type: "text",
              // @ts-expect-error accept requires type: file
              accept: "image/*",
            },
          }),
        /'accept' requires type: file/,
      );
    });

    test("an unknown attribute keeps its stock type error and a runtime error", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "input",
            attributes: {
              type: "text",
              // @ts-expect-error 'bogus' is not a known attribute
              bogus: "x",
            },
          }),
        /not a valid attribute/,
      );
    });
  });

  describe("patterned id keys", () => {
    test("resolves a numeric pattern and unlocks its attributes", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "span",
          attributes: { id: "todo-42", "data-kind": "literal" },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "span",
          attributes: { id: "todo-7", "data-kind": "pattern" },
        }),
      );
    });

    test("a value matching no key fails with a message about the value", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "span",
            attributes: {
              // @ts-expect-error id must match `todo-${number}`
              id: "todo-x",
            },
          }),
        /'todo-x'/,
      );
    });

    test("overlapping pattern keys are an error at both walls", () => {
      const { createComponent: overlapCreate } = overlapEngine;
      assert.throws(
        () =>
          overlapCreate({
            tag: "span",
            attributes: {
              // @ts-expect-error todo-42 matches both `todo-${string}` and `todo-${number}`
              id: "todo-42",
            },
          }),
        /matches more than one pattern key/,
      );
    });
  });

  describe("children unlocks", () => {
    test("accepts a child attribute unlocked by the parent's gate", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          attributes: { mode: "card" },
          innerHTML: {
            slot: {
              tag: "span",
              attributes: { "data-slot": "card-slot" },
            },
          },
        }),
      );
    });

    test("rejects a child attribute whose parent gate does not unlock it", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: {
              slot: {
                tag: "span",
                attributes: {
                  // @ts-expect-error data-slot is not a valid attribute without mode: card
                  "data-slot": "card-slot",
                },
              },
            },
          }),
        /not a valid attribute/,
      );
    });
  });

  describe("optionality via the undefined arm", () => {
    test("an optional complex attribute can be omitted", () => {
      assert.doesNotThrow(() => createComponent({ tag: "span" }));
    });
  });

  describe("inference", () => {
    test("a complex attribute infers its variants", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            {
              type: {
                text: { self: { maxlength: "number" }; children: {} };
                range: { self: { min: "number" }; children: {} };
              };
            }
          >,
          | { type?: "text"; maxlength?: number }
          | { type?: "range"; min?: number }
        >
      >();
    });
  });

  describe("ComponentIds", () => {
    type Simplify<T> = { [K in keyof T]: T[K] } & {};
    type Ids<T> = ComponentIds<
      T,
      SupportedKeywords,
      typeof GLOBAL_ATTRIBUTES,
      typeof TAGS
    >;

    const fixture = createComponent({
      tag: "div",
      innerHTML: {
        a: { tag: "span", attributes: { id: "todo-42" } },
        b: { tag: "span", attributes: { id: "todo-7" } },
      },
    });
    type FixtureIds = Ids<typeof fixture>;

    test("collects each literal id with its resolved declared values", () => {
      assertType<
        Equal<
          Simplify<FixtureIds>,
          | { "todo-42": { readonly "data-kind"?: "literal" } }
          | { "todo-7": { readonly "data-kind"?: "pattern" } }
        >
      >();
    });

    test("a component with no ids resolves to never", () => {
      const empty = createComponent({ tag: "span" });
      assertType<Equal<Ids<typeof empty>, never>>();
    });

    test("a widened string id contributes nothing", () => {
      const widened: string = "todo-42";
      const withWideId = createComponent({
        tag: "span",
        attributes: {
          // @ts-expect-error a wide string cannot be written against a strict id gate
          id: widened,
        },
      });
      assertType<Equal<Ids<typeof withWideId>, never>>();
    });
  });

  describe("render fill-in", () => {
    test("fills in a single-literal self unlock when absent", () => {
      const { html } = renderComponent(
        createComponent({
          tag: "span",
          attributes: { id: "todo-42" },
        }),
      );
      assert.match(html, /data-kind="literal"/);
    });

    test("writing the literal correctly renders identically to fill-in", () => {
      const filled = renderComponent(
        createComponent({
          tag: "span",
          attributes: { id: "todo-42" },
        }),
      );
      const written = renderComponent(
        createComponent({
          tag: "span",
          attributes: { id: "todo-42", "data-kind": "literal" },
        }),
      );
      assert.strictEqual(filled.html, written.html);
    });

    test("writing the wrong literal fails at both walls", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "span",
            attributes: {
              id: "todo-42",
              // @ts-expect-error data-kind is the single literal "literal"
              "data-kind": "wrong",
            },
          }),
        /does not match DSL/,
      );
    });
  });
});
