import test, { describe } from "node:test";
import assert from "node:assert";
import {
  engine,
  cssAttributeConfig,
  cssPropertiesConfig,
  htmlAttributeConfig,
  htmlTagConfig,
  SUPPORTED_KEYWORDS,
  EMPTY_QUERIES,
  EMPTY_PSEUDO_CLASSES,
  MOCK_CSS_ATTR_CONFIG,
  MOCK_CSS_SYNTAX,
  createComponent,
  renderBound,
} from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("Array innerHTML Children", () => {
    describe("Branching tree variations (arrays + objects + strings)", () => {
      test("interleaved strings and objects in array render in correct order", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: ["", { tag: "span", innerHTML: "middle" }, ""],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>middle</span></div>");
      });

      test("strings, objects, and deeper objects interleaved in array", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              "",
              {
                tag: "div",
                innerHTML: { inner: { tag: "span", innerHTML: "deep" } },
              },
              "",
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><div><span>deep</span></div></div>");
      });

      test("same innerHTML key is array on one array element, object on another, with CSS targeting", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              {
                tag: "li",
                innerHTML: {
                  innerKey: [
                    "",
                    {
                      tag: "div",
                      innerHTML: { check: { tag: "span", innerHTML: "a" } },
                    },
                    "",
                  ],
                },
              },
              {
                tag: "li",
                innerHTML: {
                  innerKey: {
                    tag: "span",
                    innerHTML: {
                      check: { tag: "span", innerHTML: "b" },
                    },
                  },
                },
              },
            ],
          },
          css: {
            "> items": {
              "> innerKey": {
                "> check": { color: "inherit" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("data-cid-items"),
          "array items carry semantic name",
        );
        assert.ok(
          html.includes("data-cid-inner_004bey"),
          "innerKey present on both array elements (object and array entries)",
        );
        assert.ok(
          html.includes("data-cid-check"),
          "check present on deeply nested children",
        );
        assert.ok(css.includes("[data-cid-items]"), "CSS targets items");
        assert.ok(css.includes("[data-cid-inner_004bey]"), "CSS targets innerKey");
        assert.ok(css.includes("[data-cid-check]"), "CSS targets check");
        assert.ok(css.includes("color: inherit;"));
      });

      test("deep branching: array -> object -> array -> mixed strings and objects", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            level1: [
              {
                tag: "div",
                innerHTML: {
                  level2: {
                    tag: "div",
                    innerHTML: {
                      level3: [
                        "",
                        {
                          tag: "span",
                          innerHTML: "found",
                          css: { display: "block" },
                        },
                        "",
                      ],
                    },
                  },
                },
              },
            ],
          },
          css: {
            "> level1": {
              "> level2": {
                "> level3": { color: "inherit" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-level1"));
        assert.ok(html.includes("data-cid-level2"));
        assert.ok(html.includes("data-cid-level3"));
        assert.ok(html.includes("found"));
        assert.ok(css.includes("[data-cid-level1]"));
        assert.ok(css.includes("[data-cid-level2]"));
        assert.ok(css.includes("[data-cid-level3]"));
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("display: block;"));
      });

      test("multiple array keys with interleaved strings, each CSS-targetable", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            groupA: [
              "",
              { tag: "span", innerHTML: "a1" },
              "",
              { tag: "span", innerHTML: "a2" },
            ],
            groupB: [
              { tag: "span", innerHTML: "b1" },
              "",
              { tag: "span", innerHTML: "b2" },
              "",
            ],
          },
          css: {
            "> groupA": { color: "transparent" },
            "> groupB": { color: "currentColor" },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-group_0041"));
        assert.ok(html.includes("data-cid-group_0042"));
        assert.ok(css.includes("[data-cid-group_0041]"));
        assert.ok(css.includes("[data-cid-group_0042]"));
        assert.ok(css.includes("color: transparent;"));
        assert.ok(css.includes("color: currentColor;"));
        assert.ok(html.includes(">a1</span>"));
        assert.ok(html.includes(">a2</span>"));
        assert.ok(html.includes(">b1</span>"));
        assert.ok(html.includes(">b2</span>"));
      });

      test("nested array items with own css each, interleaved with strings", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              "",
              {
                tag: "span",
                innerHTML: "first",
                css: { font: "bold" },
              },
              "",
              {
                tag: "span",
                innerHTML: "second",
                css: { font: "italic" },
              },
              "",
            ],
          },
          css: {
            "> items": { "text-decoration": "underline" },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-items"));
        assert.ok(css.includes("[data-cid-items]"));
        assert.ok(css.includes("text-decoration: underline;"));
        assert.ok(css.includes("font: bold;"));
        assert.ok(css.includes("font: italic;"));
      });

      describe("CSS Class Selectors", () => {
        const CLASS_CSS_ATTRIBUTES = cssAttributeConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {
            color: ["string"],
            display: {
              block: { self: {}, children: {} },
              inline: { self: {}, children: {} },
              "inline-block": { self: {}, children: {} },
              none: { self: {}, children: {} },
            },
          } as const,
        );
        const CLASS_CSS_PROPERTIES = cssPropertiesConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {},
        );

        const CLASS_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
          button: {
            display: "inline-block",
            attributes: {},
            innerHTML: { include: ["#text"] },
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            attributes: {},
            innerHTML: { include: ["#text"] },
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
          div: {
            display: "block",
            attributes: {},
            innerHTML: { all: true },
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });

        const { createComponent: createClassComponent } = engine({
          supportedKeywords: SUPPORTED_KEYWORDS,
          htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            id: ["string", "undefined"],
            class: ["string", "undefined"],
          }),
          htmlTagConfig: CLASS_TAG_CONFIG,
          cssSyntaxConfig: MOCK_CSS_SYNTAX,
          cssAttributesConfig: CLASS_CSS_ATTRIBUTES,
          cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
          cssPropertiesConfig: CLASS_CSS_PROPERTIES,
          cssQueriesConfig: EMPTY_QUERIES,
        });

        test("accepts &.className when class is declared in attributes", () => {
          const config = createClassComponent({
            tag: "button",
            attributes: { class: "active" },
            innerHTML: "Click",
            css: {
              "&.active": { color: "red" },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "button",
            attributes: { class: "active" },
            innerHTML: "Click",
            css: {
              "&.active": { color: "red" },
            },
          });
        });

        test("accepts multiple &.className selectors for multiple declared classes", () => {
          const config = createClassComponent({
            tag: "button",
            attributes: { class: "primary large" },
            innerHTML: "Click",
            css: {
              "&.primary": { color: "blue" },
              "&.large": { color: "red" },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "button",
            attributes: { class: "primary large" },
            innerHTML: "Click",
            css: {
              "&.primary": { color: "blue" },
              "&.large": { color: "red" },
            },
          });
        });

        test("accepts &.className with pseudo-class nesting", () => {
          const CLASS_PSEUDO_TAG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
            button: {
              display: "inline-block",
              attributes: {},
              innerHTML: { include: ["#text"] },
              cssPseudoClass: [":hover"],
              cssPseudoElement: [],
            },
          });
          const { createComponent: createPseudoClassComponent } = engine({
            supportedKeywords: SUPPORTED_KEYWORDS,
            htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
              class: ["string", "undefined"],
            }),
            htmlTagConfig: CLASS_PSEUDO_TAG,
            cssSyntaxConfig: MOCK_CSS_SYNTAX,
            cssAttributesConfig: CLASS_CSS_ATTRIBUTES,
            cssPseudoClassConfig: [":active"],
            cssPropertiesConfig: CLASS_CSS_PROPERTIES,
            cssQueriesConfig: EMPTY_QUERIES,
          });
          const config = createPseudoClassComponent({
            tag: "button",
            attributes: { class: "primary" },
            innerHTML: "Click",
            css: {
              "&.primary": {
                ":hover": { color: "red" },
              },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "button",
            attributes: { class: "primary" },
            innerHTML: "Click",
            css: {
              "&.primary": {
                ":hover": { color: "red" },
              },
            },
          });
        });

        test("accepts &.className with child selector nesting", () => {
          const config = createClassComponent({
            tag: "div",
            attributes: { class: "card" },
            innerHTML: { title: { tag: "span", innerHTML: "Hi" } },
            css: {
              "&.card": {
                "> title": { color: "red" },
              },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "div",
            attributes: { class: "card" },
            innerHTML: { title: { tag: "span", innerHTML: "Hi" } },
            css: {
              "&.card": {
                "> title": { color: "red" },
              },
            },
          });
        });

        test("default CSS config with class attribute renders class in HTML", () => {
          const comp = createComponent({
            tag: "div",
            attributes: { class: "foo bar" },
            css: {
              "&.foo": { color: "inherit" },
            },
          });
          const { html } = renderBound(comp);
          assert.ok(html.includes('class="foo bar"'));
        });

        test("rejects a class selector whose name has special characters", () => {
          assert.throws(
            () =>
              createClassComponent({
                tag: "button",
                attributes: { class: "foo!bar" },
                innerHTML: "Click",
                css: {
                  // @ts-expect-error Invalid class name 'foo!bar' is rejected at the type level
                  "&.foo!bar": { color: "red" },
                },
              }),
            /CSS Error: Class selector '&.foo!bar' has an invalid class name 'foo!bar'/,
          );
        });

        test("accepts class names with hyphens and underscores", () => {
          const config = createClassComponent({
            tag: "button",
            attributes: { class: "foo-bar baz_qux" },
            innerHTML: "Click",
            css: {
              "&.foo-bar": { color: "red" },
              "&.baz_qux": { color: "blue" },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "button",
            attributes: { class: "foo-bar baz_qux" },
            innerHTML: "Click",
            css: {
              "&.foo-bar": { color: "red" },
              "&.baz_qux": { color: "blue" },
            },
          });
        });

        // Type-level probe: a class name must be a legal CSS identifier, so an
        // invalid one is rejected by the type wall where the component is
        // created, and valid multi-class values still typecheck and render.
        test("rejects a class name starting with a digit at the type level", () => {
          assert.throws(
            () =>
              createClassComponent({
                tag: "button",
                attributes: { class: "1bad" },
                innerHTML: "Click",
                css: {
                  // @ts-expect-error '1bad' is not a legal CSS class name
                  "&.1bad": { color: "red" },
                },
              }),
            /CSS Error: Class selector '&.1bad' has an invalid class name '1bad'/,
          );
        });

        test("rejects a class name with an illegal character at the type level", () => {
          assert.throws(
            () =>
              createClassComponent({
                tag: "button",
                attributes: { class: "a b!c" },
                innerHTML: "Click",
                css: {
                  // @ts-expect-error 'b!c' is not a legal CSS class name
                  "&.b!c": { color: "red" },
                },
              }),
            /CSS Error: Class selector '&.b!c' has an invalid class name 'b!c'/,
          );
        });

        test("accepts valid multi-class values and renders their selectors", () => {
          const comp = createClassComponent({
            tag: "button",
            attributes: { class: "foo bar" },
            innerHTML: "Click",
            css: {
              "&.foo": { color: "red" },
              "&.bar": { color: "blue" },
            },
          });
          const { html, css } = renderBound(comp);
          assert.ok(html.includes('class="foo bar"'));
          assert.ok(css.includes("&.foo"));
          assert.ok(css.includes("&.bar"));
        });
      });

      describe("Child Selector CSS Validation", () => {
        const CHILD_CSS_ATTRIBUTES = cssAttributeConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {
            color: ["string"],
            display: {
              block: { self: {}, children: {} },
              inline: { self: {}, children: {} },
              "inline-block": { self: {}, children: {} },
              none: { self: {}, children: {} },
            },
          } as const,
        );
        const CHILD_CSS_PROPERTIES = cssPropertiesConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {},
        );

        const CHILD_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
          div: {
            display: "block",
            attributes: {},
            innerHTML: { all: true },
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            attributes: {},
            innerHTML: { include: ["#text"] },
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });

        const { createComponent: createChildComponent } = engine({
          supportedKeywords: SUPPORTED_KEYWORDS,
          htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            id: ["string", "undefined"],
            class: ["string", "undefined"],
          }),
          htmlTagConfig: CHILD_TAG_CONFIG,
          cssSyntaxConfig: MOCK_CSS_SYNTAX,
          cssAttributesConfig: CHILD_CSS_ATTRIBUTES,
          cssPseudoClassConfig: [":hover"],
          cssPropertiesConfig: CHILD_CSS_PROPERTIES,
          cssQueriesConfig: EMPTY_QUERIES,
        });

        test("accepts a valid > childName selector", () => {
          const config = createChildComponent({
            tag: "div",
            innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
            css: {
              "> title": { color: "red" },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "div",
            innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
            css: {
              "> title": { color: "red" },
            },
          });
        });

        test("rejects > childName that does not match any innerHTML key", () => {
          assert.throws(
            () =>
              createChildComponent({
                tag: "div",
                innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
                css: {
                  // @ts-expect-error
                  "> headnig": { color: "red" },
                },
              }),
            /CSS Error: Child selector '> headnig' references child 'headnig' which is not declared in the element's innerHTML/,
          );
        });

        test("rejects > childName when innerHTML is a string", () => {
          assert.throws(
            () =>
              createChildComponent({
                tag: "span",
                innerHTML: "Hello",
                css: {
                  // @ts-expect-error
                  "> title": { color: "red" },
                },
              }),
            /CSS Error: Child selector '> title' references child 'title' which is not declared in the element's innerHTML/,
          );
        });

        test("rejects > childName when innerHTML is not present", () => {
          assert.throws(
            () =>
              createChildComponent({
                tag: "span",
                css: {
                  // @ts-expect-error
                  "> title": { color: "red" },
                },
              }),
            /CSS Error: Child selector '> title' references child 'title' which is not declared in the element's innerHTML/,
          );
        });

        test("accepts > childName inside a pseudo-class block", () => {
          const config = createChildComponent({
            tag: "div",
            innerHTML: { label: { tag: "span", innerHTML: "Hi" } },
            css: {
              ":hover": { "> label": { color: "red" } },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "div",
            innerHTML: { label: { tag: "span", innerHTML: "Hi" } },
            css: {
              ":hover": { "> label": { color: "red" } },
            },
          });
        });

        test("rejects > childName inside a pseudo-class block when child does not exist", () => {
          assert.throws(
            () =>
              createChildComponent({
                tag: "div",
                innerHTML: { label: { tag: "span", innerHTML: "Hi" } },
                css: {
                  ":hover": {
                    // @ts-expect-error
                    "> headnig": { color: "red" },
                  },
                },
              }),
            /CSS Error: Child selector '> headnig' references child 'headnig' which is not declared in the element's innerHTML/,
          );
        });

        test("accepts &.className inside > childName when the class is declared on the child", () => {
          // Regression: the type level validates &. against the *child's* class
          // attribute inside a `> child` block; the runtime must do the same
          // instead of checking the root's classes at every depth.
          const config = createChildComponent({
            tag: "div",
            attributes: { class: "card" },
            innerHTML: {
              child: {
                tag: "div",
                attributes: { class: "inner" },
                innerHTML: "x",
              },
            },
            css: {
              "> child": {
                "&.inner": { color: "red" },
              },
            },
          });
          assert.strictEqual(
            (config.css["> child"] as Record<string, unknown>)["&.inner"] !==
              undefined,
            true,
          );
        });

        test("accepts valid nested > childName > deeperChild", () => {
          const config = createChildComponent({
            tag: "div",
            innerHTML: {
              card: {
                tag: "div",
                innerHTML: {
                  title: { tag: "span", innerHTML: "Hello" },
                },
              },
            },
            css: {
              "> card": {
                "> title": { color: "red" },
              },
            },
          });
          assert.deepStrictEqual(config, {
            tag: "div",
            innerHTML: {
              card: {
                tag: "div",
                innerHTML: {
                  title: { tag: "span", innerHTML: "Hello" },
                },
              },
            },
            css: {
              "> card": {
                "> title": { color: "red" },
              },
            },
          });
        });

        test("rejects nested > childName when deeper child does not exist in child's innerHTML", () => {
          assert.throws(
            () =>
              createChildComponent({
                tag: "div",
                innerHTML: {
                  card: {
                    tag: "span",
                    innerHTML: "text",
                  },
                },
                css: {
                  "> card": {
                    // @ts-expect-error
                    "> title": { color: "red" },
                  },
                },
              }),
            /CSS Error: Child selector '> title' references child 'title' which is not declared in the element's innerHTML/,
          );
        });
      });

      test("triple-nested array -> object -> array -> object with CSS chain", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            a: [
              {
                tag: "div",
                innerHTML: {
                  b: [
                    {
                      tag: "div",
                      innerHTML: {
                        c: { tag: "span", innerHTML: "deepest" },
                      },
                    },
                  ],
                },
              },
            ],
          },
          css: {
            "> a": {
              "> b": {
                "> c": { color: "transparent" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-a"));
        assert.ok(html.includes("data-cid-b"));
        assert.ok(html.includes("data-cid-c"));
        assert.ok(css.includes("[data-cid-a]"));
        assert.ok(css.includes("[data-cid-b]"));
        assert.ok(css.includes("[data-cid-c]"));
        assert.ok(css.includes("color: transparent;"));
        assert.ok(html.includes("<span data-cid-c>deepest</span>"));
      });
    });
  });
});
