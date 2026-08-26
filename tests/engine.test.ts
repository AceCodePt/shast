import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_GLOBAL_PSEUDO_CLASSES_CONFIG from "@/css/pseudo-class-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {
    "--_a": {
      syntax: "<percentage>",
      inherits: false,
      "initial-value": "1%",
    },
  },
);

const {
  createComponent,
  renderComponent: renderBound,
  cssProperties,
} = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
});

describe("engine", () => {
  test("renderComponent is bound to the engine config", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { title: { tag: "h1", innerHTML: "hello" } },
      css: { display: "block", width: "100%", "> title": { color: "inherit" } },
    });

    // Bound call (node only) must equal the unbound call with explicit config.
    const bound = renderBound(component);
    const direct = renderComponent(HTML_TAGS_CONFIG, component);
    assert.deepStrictEqual(bound, direct);

    assert.match(bound.html, /^<div cid-[a-z0-9]+>/);
    assert.ok(bound.html.includes("<h1 cid-title"));
    assert.ok(bound.html.includes("hello"));
    assert.ok(bound.css.includes("width: 100%;"));
  });

  test("implicit display from the tag config is honored at runtime with the real registry", () => {
    // <div> declares display: block, and `width` is a block self prop — so it
    // validates without an explicit display in the css block.
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "hello",
        css: { width: "100%" },
      }),
    );

    // A flex-only prop stays locked under the implicit block display, and the
    // error explains what would unlock it (matching the type-level message).
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "hello",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /CSS Error: 'flex-direction' requires display: flex \| inline-flex/,
    );
  });

  test("void elements from the real config self-close", () => {
    const component = createComponent({
      tag: "img",
      attributes: { src: "a.png", alt: "" },
    });
    const { html } = renderBound(component);
    // A root void element with no css and no semantic name gets no identifier.
    assert.strictEqual(html, `<img src="a.png" alt="">`);
    assert.ok(!html.includes("</img>"));
  });

  test("cssProperties renders the @property config", () => {
    assert.ok(cssProperties.includes("@property --_a"));
  });
});

// ---------------------------------------------------------------------------
// Component validation, exercised through engine().createComponent.
// (Ported from the former create-component.test.ts.)
// ---------------------------------------------------------------------------

const EMPTY_PSEUDO_CLASSES = [] as const;

const MOCK_CSS_ATTR_CONFIG = cssAttributeConfig(SUPPORTED_KEYWORDS, cssSyntaxConfig(SUPPORTED_KEYWORDS, {}), {
  display: {
    block: { self: {}, children: {} },
    inline: { self: {}, children: {} },
    "inline-block": { self: {}, children: {} },
    flex: { self: {}, children: {} },
    grid: { self: {}, children: {} },
    none: { self: {}, children: {} },
    "list-item": { self: {}, children: {} },
    contents: { self: {}, children: {} },
    table: { self: {}, children: {} },
    "table-cell": { self: {}, children: {} },
  },
} as const);

const MOCK_SHARED_ATTRIBUTES = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: "string | undefined",
  class: "string | undefined",
});

const MOCK_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
  div: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  p: {
    display: "block",
    attributes: {},
    innerHTML: ["#text"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  img: {
    display: "inline",
    attributes: { src: "string", alt: "string" },
    innerHTML: [],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  ul: {
    display: "block",
    attributes: {},
    innerHTML: ["li"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  li: {
    display: "block",
    attributes: {},
    innerHTML: ["#text", "div"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

const MOCK_INHERIT_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
  a: {
    display: "inline",
    attributes: {},
    innerHTML: ["#text", "h1", "span", "ul", "div"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  h1: {
    display: "block",
    attributes: {},
    innerHTML: ["#text", "span", "b"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  span: {
    display: "inline",
    attributes: {},
    innerHTML: ["#text", "b"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  b: {
    display: "inline",
    attributes: {},
    innerHTML: ["#text"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  ul: {
    display: "block",
    attributes: {},
    innerHTML: ["li"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  li: {
    display: "block",
    attributes: {},
    innerHTML: ["#text", "div", "span", "b"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  div: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

const MOCK_CSS_SYNTAX = cssSyntaxConfig(SUPPORTED_KEYWORDS, {});
const MOCK_CSS_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  MOCK_CSS_SYNTAX,
  {},
);

const { createComponent: createMockComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
  htmlTagConfig: MOCK_TAG_CONFIG,
  cssSyntaxConfig: MOCK_CSS_SYNTAX,
  cssAttributesConfig: MOCK_CSS_ATTR_CONFIG,
  cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
  cssPropertiesConfig: MOCK_CSS_PROPERTIES,
});

const { createComponent: createInheritComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
  htmlTagConfig: MOCK_INHERIT_CONFIG,
  cssSyntaxConfig: MOCK_CSS_SYNTAX,
  cssAttributesConfig: MOCK_CSS_ATTR_CONFIG,
  cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
  cssPropertiesConfig: MOCK_CSS_PROPERTIES,
});

describe("createComponent (engine)", () => {
  describe("Baseline Structural Checks", () => {
    test("should fail if node is null or not an object", () => {
      assert.throws(
        () =>
          createMockComponent(
            //@ts-expect-error
            null,
          ),
        /Validation Error: Provided node is not a valid component object/,
      );
    });

    test("should fail if tag is missing or is not a string", () => {
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            innerHTML: "text",
          }),
        /Validation Error: Component node is missing a valid string 'tag' property/,
      );
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            tag: 123,
          }),
        /Validation Error: Component node is missing a valid string 'tag' property/,
      );
    });

    test("should fail if tag is not recognized in the registry", () => {
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            tag: "section",
          }),
        /Structural Error: '<section>' is not a recognized configuration tag in your registry/,
      );
    });
  });

  describe("Attribute Validation Firewall", () => {
    test("accepts valid explicit tag attributes and optional global attributes", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: {
          src: "logo.jpg",
          alt: "My Logo",
          id: "main-logo",
        },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: {
          src: "logo.jpg",
          alt: "My Logo",
          id: "main-logo",
        },
      });
    });

    test("should fail when encountering undocumented attributes", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "p",
            attributes: {
              //@ts-expect-error
              href: "https://google.com",
            },
          }),
        /Attribute Error: Property 'href' is not a valid attribute for <p> or the Global configuration registry/,
      );
    });
  });

  describe("Required Attribute Validation", () => {
    test("should fail when a required tag attribute is missing", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: { src: "pic.png" },
          }),
        /Attribute Error: Required attribute 'alt' is missing on <img>/,
      );
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: { alt: "desc" },
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("should fail when all required attributes are missing", () => {
      assert.throws(
        () =>
          // @ts-expect-error - testing runtime validation
          createMockComponent({
            tag: "img",
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("should fail when required attributes are missing and attributes is empty", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: {},
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("passes when all required attributes are present", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: { src: "pic.png", alt: "desc" },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: { src: "pic.png", alt: "desc" },
      });
    });

    test("passes when the tag has no required attributes", () => {
      const config = createMockComponent({
        tag: "div",
      });
      assert.deepStrictEqual(config, { tag: "div" });
    });

    test("should fail with the real config when <a> is missing href", () => {
      assert.throws(
        () =>
          // @ts-expect-error - testing runtime validation
          createComponent({
            tag: "a",
          }),
        /Attribute Error: Required attribute 'href' is missing on <a>/,
      );
    });

    test("passes with the real config when <a> provides href", () => {
      const config = createComponent({
        tag: "a",
        attributes: { href: "https://example.com" },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        attributes: { href: "https://example.com" },
      });
    });
  });

  describe("Void Element Controls", () => {
    test("accepts void elements when innerHTML is absent", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: {
          src: "pic.png",
          alt: "Image text",
        },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: {
          src: "pic.png",
          alt: "Image text",
        },
      });
    });

    test("should fail void elements if string content is passed", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            attributes: {
              src: "pic.png",
              alt: "Image text",
            },
            //@ts-expect-error
            innerHTML: {
              text: "Illegal Text Inside Void Element",
            },
          }),
        /Validation Error: Tag '<img>' is configured as a void element and must not contain any innerHTML or children/,
      );
    });
  });

  describe("Text Content Controls", () => {
    test("accepts string content when the element accepts text nodes", () => {
      const config = createMockComponent({
        tag: "p",
        innerHTML: "Clean inline content",
      });
      assert.deepStrictEqual(config, {
        tag: "p",
        innerHTML: "Clean inline content",
      });
    });

    test("should fail element with string content if it explicitly bars text nodes", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            // @ts-expect-error
            innerHTML: { text: "Illegal Direct Text Node Element" },
          }),
        /Validation Error: Tag '<ul>' innerHTML cannot contain a string without the #text/,
      );
    });
  });

  describe("Structural Hierarchy Arrays", () => {
    test("accepts valid nested configurations matching allowed child arrays", () => {
      const config = createMockComponent({
        tag: "ul",
        innerHTML: {
          child1: {
            tag: "li",
            innerHTML: "text",
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "ul",
        innerHTML: {
          child1: {
            tag: "li",
            innerHTML: "text",
          },
        },
      });
    });

    test("rejects a direct child whose tag is not in the parent's innerHTML whitelist", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            innerHTML: {
              badChild: {
                // @ts-expect-error
                tag: "p",
                innerHTML: "Bad nested block",
              },
            },
          }),
        /Structural Error: '<p>' is not a permitted child of <ul>/,
      );
    });

    test("gates a grandchild by its immediate parent, not the outer ancestor", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  invalidGrandchild: {
                    // @ts-expect-error
                    tag: "p",
                  },
                },
              },
            },
          }),
        /Structural Error: '<p>' is not a permitted child of <li>/,
      );
    });
  });

  describe("innerHTML Structural Inheritance", () => {
    test("conjunctive intersection: a > h1 > span is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          heading: {
            tag: "h1",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          heading: {
            tag: "h1",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("conjunctive intersection rejects a tag the outer ancestor forbids: a > h1 > b", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              heading: {
                tag: "h1",
                innerHTML: {
                  label: {
                    // @ts-expect-error
                    tag: "b",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("nested `*` accepts a tag in the inherited ancestral set: a > div > span", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          wrapper: {
            tag: "div",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          wrapper: {
            tag: "div",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("nested `*` is restricted to the inherited set: a > div > b is rejected", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              wrapper: {
                tag: "div",
                innerHTML: {
                  label: {
                    // @ts-expect-error
                    tag: "b",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("reset structural tag: a > ul > li is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("reset structural tag ignores the ancestral set: a > ul > span is rejected", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              list: {
                tag: "ul",
                innerHTML: {
                  item: {
                    // @ts-expect-error
                    tag: "span",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("ancestral set re-emerges below a reset tag: a > ul > li > div is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  box: {
                    tag: "div",
                  },
                },
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  box: {
                    tag: "div",
                  },
                },
              },
            },
          },
        },
      });
    });

    test("re-emerged ancestral set rejects a tag only the immediate parent allows: a > ul > li > b", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              list: {
                tag: "ul",
                innerHTML: {
                  item: {
                    tag: "li",
                    innerHTML: {
                      emphasis: {
                        // @ts-expect-error
                        tag: "b",
                      },
                    },
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("root `*` accepts any tag: div > b is accepted", () => {
      const config = createInheritComponent({
        tag: "div",
        innerHTML: {
          emphasis: {
            tag: "b",
            innerHTML: "hi",
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: {
          emphasis: {
            tag: "b",
            innerHTML: "hi",
          },
        },
      });
    });
  });

  describe("Component CSS: Pseudo-Class Block Validation", () => {
    const PSEUDO_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        color: "string",
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
          "inline-block": { self: {}, children: {} },
          none: { self: {}, children: {} },
        },
      } as const,
    );
    const PSEUDO_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );
    const GLOBAL_PSEUDO = [":active"] as const;

    const PSEUDO_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
      button: {
        display: "inline-block",
        attributes: {},
        innerHTML: ["#text"],
        cssPseudoClass: [":hover", ":focus"],
        cssPseudoElement: [],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: ["#text"],
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
      div: {
        display: "block",
        attributes: {},
        innerHTML: "*",
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
    });

    const { createComponent: createPseudoComponent } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
      htmlTagConfig: PSEUDO_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PSEUDO_CSS_ATTRIBUTES,
      cssPseudoClassConfig: GLOBAL_PSEUDO,
      cssPropertiesConfig: PSEUDO_CSS_PROPERTIES,
    });

    test("accepts a declared pseudo-class block containing CSS properties", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          color: "black",
          ":hover": { color: "red", display: "block" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          color: "black",
          ":hover": { color: "red", display: "block" },
        },
      });
    });

    test("accepts multiple declared pseudo-classes in the same css block", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { color: "red" },
          ":focus": { color: "blue" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { color: "red" },
          ":focus": { color: "blue" },
        },
      });
    });

    test("accepts a globally-configured pseudo-class on any tag", () => {
      const config = createPseudoComponent({
        tag: "span",
        innerHTML: "text",
        css: {
          ":active": { color: "red" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "span",
        innerHTML: "text",
        css: {
          ":active": { color: "red" },
        },
      });
    });

    test("accepts a pseudo-class inside a child selector, scoped to the child's tag", () => {
      const config = createPseudoComponent({
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          "> label": { ":hover": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          "> label": { ":hover": { color: "red" } },
        },
      });
    });

    test("accepts a child selector inside a pseudo-class block", () => {
      const config = createPseudoComponent({
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          ":active": { "> label": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          ":active": { "> label": { color: "red" } },
        },
      });
    });

    test("accepts a pseudo-class nested inside another pseudo-class", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { ":focus": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { ":focus": { color: "red" } },
        },
      });
    });

    test("rejects a pseudo-class the tag does not declare and is not global", () => {
      createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          // @ts-expect-error
          ":disabled": { color: "red" },
        },
      });
    });

    test("rejects a pseudo-class on a tag with an empty cssPseudoClass list", () => {
      createPseudoComponent({
        tag: "span",
        innerHTML: "text",
        css: {
          // @ts-expect-error
          ":hover": { color: "red" },
        },
      });
    });

    test("rejects a pseudo-class on a tag with no cssPseudoClass key", () => {
      const NO_PSEUDO_TAG_CONFIG = {
        widget: {
          attributes: {},
          innerHTML: ["#text"],
          cssPseudoElement: [],
        },
      };
      const { createComponent: createNoPseudoComponent } = engine({
        supportedKeywords: SUPPORTED_KEYWORDS,
        htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
        // @ts-expect-error
        htmlTagConfig: NO_PSEUDO_TAG_CONFIG,
        cssSyntaxConfig: MOCK_CSS_SYNTAX,
        cssAttributesConfig: PSEUDO_CSS_ATTRIBUTES,
        cssPseudoClassConfig: GLOBAL_PSEUDO,
        cssPropertiesConfig: PSEUDO_CSS_PROPERTIES,
      });
      createNoPseudoComponent({
        tag: "widget",
        attributes: {},
        innerHTML: "text",
        css: {
          ":hover": { color: "red" },
        },
      });
    });
  });

  describe("Component CSS: Pseudo-Element Block Validation", () => {
    const PE_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        color: "string",
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
          "inline-block": { self: {}, children: {} },
          none: { self: {}, children: {} },
        },
      } as const,
    );
    const PE_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );

    const PE_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
      field: {
        display: "inline-block",
        attributes: {},
        innerHTML: ["#text"],
        cssPseudoClass: [":hover"],
        cssPseudoElement: ["::placeholder"],
      },
      box: {
        display: "block",
        attributes: {},
        innerHTML: "*",
        cssPseudoClass: [],
        cssPseudoElement: ["::before", "::after"],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: ["#text"],
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
    });

    const { createComponent: createPEComponent } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
      htmlTagConfig: PE_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PE_CSS_ATTRIBUTES,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: PE_CSS_PROPERTIES,
    });

    test("accepts a declared pseudo-element block containing CSS properties", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          color: "black",
          "::placeholder": { color: "gray", display: "block" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          color: "black",
          "::placeholder": { color: "gray", display: "block" },
        },
      });
    });

    test("accepts multiple declared pseudo-elements in the same css block", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": { color: "red" },
          "::after": { color: "blue" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": { color: "red" },
          "::after": { color: "blue" },
        },
      });
    });

    test("accepts a pseudo-element inside a child selector, scoped to the child's tag", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: { fld: { tag: "field", innerHTML: "x" } },
        css: {
          "> fld": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: { fld: { tag: "field", innerHTML: "x" } },
        css: {
          "> fld": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a child selector inside a pseudo-element block", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: { item: { tag: "span", innerHTML: "x" } },
        css: {
          "::before": { "> item": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: { item: { tag: "span", innerHTML: "x" } },
        css: {
          "::before": { "> item": { color: "red" } },
        },
      });
    });

    test("accepts a pseudo-element inside a class selector block", () => {
      const config = createPEComponent({
        tag: "field",
        attributes: { class: "active" },
        innerHTML: "x",
        css: {
          "&.active": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        attributes: { class: "active" },
        innerHTML: "x",
        css: {
          "&.active": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a pseudo-element inside a pseudo-class block", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          ":hover": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          ":hover": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a pseudo-class inside a pseudo-element block", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          "::placeholder": { ":hover": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          "::placeholder": { ":hover": { color: "gray" } },
        },
      });
    });

    test("rejects a pseudo-element the tag does not declare", () => {
      createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          // @ts-expect-error
          "::before": { color: "red" },
        },
      });
    });

    test("rejects a pseudo-element on a tag with an empty cssPseudoElement list", () => {
      createPEComponent({
        tag: "span",
        innerHTML: "x",
        css: {
          // @ts-expect-error
          "::placeholder": { color: "red" },
        },
      });
    });

    test("rejects a pseudo-element on a tag with no cssPseudoElement key", () => {
      const NO_PE_TAG_CONFIG = {
        plain: {
          attributes: {},
          innerHTML: ["#text"],
          cssPseudoClass: [],
        },
      };
      const { createComponent: createNoPEComponent } = engine({
        supportedKeywords: SUPPORTED_KEYWORDS,
        htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
        // @ts-expect-error
        htmlTagConfig: NO_PE_TAG_CONFIG,
        cssSyntaxConfig: MOCK_CSS_SYNTAX,
        cssAttributesConfig: PE_CSS_ATTRIBUTES,
        cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
        cssPropertiesConfig: PE_CSS_PROPERTIES,
      });
      createNoPEComponent({
        tag: "plain",
        attributes: {},
        innerHTML: "x",
        css: {
          "::placeholder": { color: "red" },
        },
      });
    });

    test("rejects a pseudo-element nested inside another pseudo-element", () => {
      createPEComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": {
            // @ts-expect-error
            "::after": { color: "red" },
          },
        },
      });
    });

    test("rejects a class selector inside a pseudo-element", () => {
      assert.throws(
        () =>
          createPEComponent({
            tag: "field",
            attributes: { class: "active" },
            innerHTML: "x",
            css: {
              "::placeholder": {
                // @ts-expect-error
                "&.active": { color: "gray" },
              },
            },
          }),
        /CSS Error: Class selector '&.active' is not allowed inside a pseudo-element block/,
      );
    });
  });

  describe("Array innerHTML Children", () => {
    describe("Type Validation", () => {
      test("accepts array of child components", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });

      test("accepts mixed single child and array child in the same innerHTML", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "div" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });

      test("accepts empty array where innerHTML allows it", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: [],
          },
        });
      });

      test("accepts array of text nodes when parent allows #text", () => {
        createMockComponent({
          tag: "p",
          innerHTML: {
            texts: ["a", "b"],
          },
        });
      });

      test("accepts mixed text and component children in array", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: ["text", { tag: "div" }],
          },
        });
      });

      test("CSS > selector targets array child at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            items: [{ tag: "span" }, { tag: "span" }],
          },
          css: {
            "> items": { color: "inherit" },
          },
        });
      });

      test("CSS nested > selectors through array child at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            wrapper: [
              {
                tag: "div",
                innerHTML: {
                  inner: { tag: "span" },
                },
              },
            ],
          },
          css: {
            "> wrapper": {
              "> inner": { color: "inherit" },
            },
          },
        });
      });

      test("CSS targeting with mixed single and array children at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "span" },
            multiple: [{ tag: "span" }, { tag: "span" }],
          },
          css: {
            "> single": { color: "inherit" },
            "> multiple": { color: "inherit" },
          },
        });
      });

      test("CSS through array child with partial innerHTML overlap at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "li", innerHTML: { inner1: { tag: "div" } } },
              {
                tag: "li",
                innerHTML: {
                  inner1: {
                    tag: "div",
                    innerHTML: { inner3: { tag: "div" } },
                  },
                  inner2: { tag: "div" },
                },
              },
            ],
          },
          css: {
            display: "block",
            width: "100px",
            "> items": {
              "> inner2": {},
              "> inner1": {
                "> inner3": {},
              },
            },
          },
        });
      });

      test("rejects array with invalid child tag", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: [{ tag: "li" }, { tag: "div" }],
              },
            }),
          /Structural Error:/,
        );
      });

      test("rejects text in array when parent does not allow #text", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: ["text"],
              },
            }),
          /Validation Error:/,
        );
      });
    });

    describe("Runtime Validation", () => {
      test("accepts array of valid child components", () => {
        const config = createMockComponent({
          tag: "ul",
          innerHTML: {
            items: [{ tag: "li" }, { tag: "li" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "ul",
          innerHTML: {
            items: [{ tag: "li" }, { tag: "li" }],
          },
        });
      });

      test("rejects array with invalid child tag at runtime", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: [{ tag: "li" }, { tag: "div" }],
              },
            }),
          /Structural Error: '<div>' is not a permitted child of <ul>/,
        );
      });

      test("rejects text in array when parent does not allow #text", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: ["text"],
              },
            }),
          /Validation Error: Tag '<ul>' innerHTML cannot contain a string without the #text/,
        );
      });

      test("accepts empty array", () => {
        const config = createMockComponent({
          tag: "ul",
          innerHTML: {
            items: [],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "ul",
          innerHTML: {
            items: [],
          },
        });
      });

      test("accepts array of text nodes when parent allows #text", () => {
        const config = createMockComponent({
          tag: "p",
          innerHTML: {
            texts: ["hello", "world"],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "p",
          innerHTML: {
            texts: ["hello", "world"],
          },
        });
      });

      test("accepts mixed text and components in array", () => {
        const config = createMockComponent({
          tag: "li",
          innerHTML: {
            items: ["hello", { tag: "div" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "li",
          innerHTML: {
            items: ["hello", { tag: "div" }],
          },
        });
      });

      test("mixed single and array child syntax in the same innerHTML", () => {
        const config = createMockComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "p", innerHTML: "text" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "div",
          innerHTML: {
            single: { tag: "p", innerHTML: "text" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });
    });

    describe("Render array children", () => {
      test("renders array children in correct order", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "1" },
              { tag: "span", innerHTML: "2" },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>1</span><span>2</span></div>");
      });

      test("renders multiple div siblings correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "div", innerHTML: "a" },
              { tag: "div", innerHTML: "b" },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><div>a</div><div>b</div></div>");
      });

      test("renders array of text nodes in order", () => {
        const comp = createComponent({
          tag: "h1",
          innerHTML: {
            texts: ["Hello ", "World"],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<h1>Hello World</h1>");
      });

      test("renders mixed text and components in array", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: ["text ", { tag: "span", innerHTML: "nested" }],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div>text <span>nested</span></div>");
      });

      test("array children with CSS are scoped correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a", css: { color: "inherit" } },
              { tag: "span", innerHTML: "b", css: { display: "block" } },
            ],
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("<span"));
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("display: block;"));
      });

      test("CSS > selector targets all array children with semantic attribute", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            "> items": { color: "inherit" },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("cid-items"),
          "array children should carry semantic name",
        );
        assert.ok(
          css.includes("[cid-items]"),
          "CSS should target semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
      });

      test("CSS nested > selectors through array child renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            wrapper: [
              {
                tag: "div",
                innerHTML: {
                  inner: { tag: "span", innerHTML: "deep" },
                },
              },
            ],
          },
          css: {
            "> wrapper": {
              "> inner": { color: "inherit" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("cid-wrapper"),
          "array element should carry semantic name",
        );
        assert.ok(
          html.includes("cid-inner"),
          "nested child should carry semantic name",
        );
        assert.ok(
          css.includes("[cid-wrapper]"),
          "CSS should target outer semantic name",
        );
        assert.ok(
          css.includes("[cid-inner]"),
          "CSS should target inner semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
      });

      test("CSS pseudo-class on parent targets array children with > selector", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            ":hover": {
              "> items": { color: "inherit" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("cid-items"));
        assert.ok(css.includes(":hover"));
        assert.ok(css.includes("[cid-items]"));
        assert.ok(css.includes("color: inherit;"));
      });

      test("CSS > selector targets array child with pseudo-class block on the child", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            "> items": {
              color: "inherit",
              ":hover": { color: "transparent" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("cid-items"));
        assert.ok(css.includes("[cid-items]"));
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes(":hover"));
        assert.ok(css.includes("color: transparent;"));
      });

      test("different innerHTML keys on each array element are independently CSS-targetable", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              {
                tag: "div",
                innerHTML: { inner1: { tag: "span", innerHTML: "a" } },
              },
              {
                tag: "div",
                innerHTML: { inner2: { tag: "span", innerHTML: "b" } },
              },
            ],
          },
          css: {
            "> items": {
              "> inner1": { color: "inherit" },
              "> inner2": { display: "block" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("cid-items"),
          "array children carry semantic name",
        );
        assert.ok(
          html.includes("cid-inner1"),
          "first element's inner key is targeted",
        );
        assert.ok(
          html.includes("cid-inner2"),
          "second element's inner key is targeted",
        );
        assert.ok(
          css.includes("[cid-inner1]"),
          "CSS targets inner1 semantic name",
        );
        assert.ok(
          css.includes("[cid-inner2]"),
          "CSS targets inner2 semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("display: block;"));
      });

      test("partial innerHTML overlap across array elements with deep CSS targeting", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              {
                tag: "li",
                innerHTML: { inner1: { tag: "div", innerHTML: "only" } },
              },
              {
                tag: "li",
                innerHTML: {
                  inner1: {
                    tag: "div",
                    innerHTML: { inner3: { tag: "div", innerHTML: "deep" } },
                  },
                  inner2: { tag: "div", innerHTML: "solo" },
                },
              },
            ],
          },
          css: {
            display: "block",
            width: "100px",
            "> items": {
              "> inner2": { color: "inherit" },
              "> inner1": {
                "> inner3": { color: "transparent" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        // All semantic names present
        assert.ok(html.includes("cid-items"), "array elements carry cid-items");
        assert.ok(
          html.includes("cid-inner1"),
          "inner1 present on both array elements",
        );
        assert.ok(
          html.includes("cid-inner2"),
          "inner2 present on second element",
        );
        assert.ok(
          html.includes("cid-inner3"),
          "inner3 present inside second element's inner1",
        );
        // CSS targets each path
        assert.ok(css.includes("[cid-items]"), "CSS targets items");
        assert.ok(css.includes("[cid-inner2]"), "CSS targets inner2");
        assert.ok(css.includes("[cid-inner1]"), "CSS targets inner1");
        assert.ok(css.includes("[cid-inner3]"), "CSS targets inner3");
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("color: transparent;"));
        assert.ok(css.includes("width: 100px;"));
      });

      test("deeply branched arrays: 2 inner1 × 2 inner2 → inner5-8 targetable via CSS", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            inner1: [
              {
                tag: "div",
                innerHTML: {
                  inner2: [
                    {
                      tag: "div",
                      innerHTML: { inner5: { tag: "span", innerHTML: "5" } },
                    },
                    {
                      tag: "div",
                      innerHTML: { inner6: { tag: "span", innerHTML: "6" } },
                    },
                  ],
                },
              },
              {
                tag: "div",
                innerHTML: {
                  inner2: [
                    {
                      tag: "div",
                      innerHTML: { inner7: { tag: "span", innerHTML: "7" } },
                    },
                    {
                      tag: "div",
                      innerHTML: { inner8: { tag: "div", innerHTML: "8" } },
                    },
                  ],
                },
              },
            ],
          },
          css: {
            "> inner1": {
              "> inner2": {
                "> inner5": { color: "inherit" },
                "> inner6": { color: "inherit" },
                "> inner7": { color: "inherit" },
                "> inner8": { color: "inherit" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        // All semantic names present
        assert.ok(
          html.includes("cid-inner1"),
          "array inner1 carries semantic name",
        );
        assert.ok(
          html.includes("cid-inner2"),
          "array inner2 carries semantic name",
        );
        assert.ok(html.includes("cid-inner5"), "inner5 present");
        assert.ok(html.includes("cid-inner6"), "inner6 present");
        assert.ok(html.includes("cid-inner7"), "inner7 present");
        assert.ok(html.includes("cid-inner8"), "inner8 present");
        // CSS targets each path
        assert.ok(css.includes("[cid-inner1]"));
        assert.ok(css.includes("[cid-inner2]"));
        assert.ok(css.includes("[cid-inner5]"));
        assert.ok(css.includes("[cid-inner6]"));
        assert.ok(css.includes("[cid-inner7]"));
        assert.ok(css.includes("[cid-inner8]"));
      });
    });

    describe("Nesting", () => {
      test("array with single element works like bare child", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            item: [{ tag: "span", innerHTML: "single" }],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>single</span></div>");
      });

      test("component in array can have its own array children", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            sections: [
              {
                tag: "div",
                innerHTML: {
                  items: [
                    { tag: "span", innerHTML: "nested1" },
                    { tag: "span", innerHTML: "nested2" },
                  ],
                },
              },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(
          html,
          "<div><div><span>nested1</span><span>nested2</span></div></div>",
        );
      });

      test("deeply nested arrays in complex hierarchy", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            level1: {
              tag: "div",
              innerHTML: {
                level2: [
                  {
                    tag: "div",
                    innerHTML: {
                      level3: [{ tag: "span", innerHTML: "deep" }],
                    },
                  },
                ],
              },
            },
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(
          html,
          "<div><div><div><span>deep</span></div></div></div>",
        );
      });
    });

    describe("Edge Cases", () => {
      test("empty array of children renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: { items: [] },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div></div>");
      });

      test("array with one element renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: { item: [{ tag: "span", innerHTML: "only" }] },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>only</span></div>");
      });

      test("void element rejects innerHTML with array children", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "img",
              // @ts-expect-error
              attributes: { src: "x.png", alt: "" },
              innerHTML: { items: [{ tag: "div" }] },
            }),
          /Validation Error: Tag '<img>' is configured as a void element/,
        );
      });
    });

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
          html.includes("cid-items"),
          "array items carry semantic name",
        );
        assert.ok(
          html.includes("cid-innerKey"),
          "innerKey present on both array elements (object and array entries)",
        );
        assert.ok(
          html.includes("cid-check"),
          "check present on deeply nested children",
        );
        assert.ok(css.includes("[cid-items]"), "CSS targets items");
        assert.ok(css.includes("[cid-innerKey]"), "CSS targets innerKey");
        assert.ok(css.includes("[cid-check]"), "CSS targets check");
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
        assert.ok(html.includes("cid-level1"));
        assert.ok(html.includes("cid-level2"));
        assert.ok(html.includes("cid-level3"));
        assert.ok(html.includes("found"));
        assert.ok(css.includes("[cid-level1]"));
        assert.ok(css.includes("[cid-level2]"));
        assert.ok(css.includes("[cid-level3]"));
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
        assert.ok(html.includes("cid-groupA"));
        assert.ok(html.includes("cid-groupB"));
        assert.ok(css.includes("[cid-groupA]"));
        assert.ok(css.includes("[cid-groupB]"));
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
        assert.ok(html.includes("cid-items"));
        assert.ok(css.includes("[cid-items]"));
        assert.ok(css.includes("text-decoration: underline;"));
        assert.ok(css.includes("font: bold;"));
        assert.ok(css.includes("font: italic;"));
      });

      describe("CSS Class Selectors", () => {
        const CLASS_CSS_ATTRIBUTES = cssAttributeConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {
            color: "string",
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
            innerHTML: ["#text"],
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            attributes: {},
            innerHTML: ["#text"],
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
          div: {
            display: "block",
            attributes: {},
            innerHTML: "*",
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });

        const { createComponent: createClassComponent } = engine({
          supportedKeywords: SUPPORTED_KEYWORDS,
          htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            id: "string | undefined",
            class: "string | undefined",
          }),
          htmlTagConfig: CLASS_TAG_CONFIG,
          cssSyntaxConfig: MOCK_CSS_SYNTAX,
          cssAttributesConfig: CLASS_CSS_ATTRIBUTES,
          cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
          cssPropertiesConfig: CLASS_CSS_PROPERTIES,
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
              innerHTML: ["#text"],
              cssPseudoClass: [":hover"],
              cssPseudoElement: [],
            },
          });
          const { createComponent: createPseudoClassComponent } = engine({
            supportedKeywords: SUPPORTED_KEYWORDS,
            htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
              class: "string | undefined",
            }),
            htmlTagConfig: CLASS_PSEUDO_TAG,
            cssSyntaxConfig: MOCK_CSS_SYNTAX,
            cssAttributesConfig: CLASS_CSS_ATTRIBUTES,
            cssPseudoClassConfig: [":active"],
            cssPropertiesConfig: CLASS_CSS_PROPERTIES,
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
      });

      describe("Child Selector CSS Validation", () => {
        const CHILD_CSS_ATTRIBUTES = cssAttributeConfig(
          SUPPORTED_KEYWORDS,
          MOCK_CSS_SYNTAX,
          {
            color: "string",
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
            innerHTML: "*",
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            attributes: {},
            innerHTML: ["#text"],
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });

        const { createComponent: createChildComponent } = engine({
          supportedKeywords: SUPPORTED_KEYWORDS,
          htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            id: "string | undefined",
            class: "string | undefined",
          }),
          htmlTagConfig: CHILD_TAG_CONFIG,
          cssSyntaxConfig: MOCK_CSS_SYNTAX,
          cssAttributesConfig: CHILD_CSS_ATTRIBUTES,
          cssPseudoClassConfig: [":hover"],
          cssPropertiesConfig: CHILD_CSS_PROPERTIES,
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
        assert.ok(html.includes("cid-a"));
        assert.ok(html.includes("cid-b"));
        assert.ok(html.includes("cid-c"));
        assert.ok(css.includes("[cid-a]"));
        assert.ok(css.includes("[cid-b]"));
        assert.ok(css.includes("[cid-c]"));
        assert.ok(css.includes("color: transparent;"));
        assert.ok(html.includes("<span cid-c>deepest</span>"));
      });
    });
  });

  // -----------------------------------------------------------------------
  // Production mode — validation is skipped, but rendering still works.
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // Production mode — validation is skipped, but rendering still works.
  // -----------------------------------------------------------------------
  describe("production mode", () => {
    const PROD_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        width: "string",
        color: "string",
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
        },
      } as const,
    );
    const PROD_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );

    const PROD_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
      div: {
        display: "block",
        attributes: {},
        innerHTML: "*",
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: ["#text"],
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
    });

    const {
      createComponent: createProdComponent,
      renderComponent: renderProd,
    } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: "string | undefined",
        class: "string | undefined",
      }),
      htmlTagConfig: PROD_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PROD_CSS_ATTRIBUTES,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: PROD_CSS_PROPERTIES,
    }, { skipValidation: true });

    test("skips validation — invalid data passes through", () => {
      const comp = createProdComponent({
        // @ts-expect-error unknown tag passes through in production mode
        tag: "unknown",
      });
      assert.deepStrictEqual(comp, { tag: "unknown" });
    });

    test("skips attribute validation — unknown attributes pass through", () => {
      const comp = createProdComponent({
        tag: "div",
        attributes: {
          // @ts-expect-error unknown attribute passes through in production mode
          href: "https://example.com",
        },
      });
      assert.deepStrictEqual(comp, {
        tag: "div",
        attributes: { href: "https://example.com" },
      });
    });

    test("skips CSS child selector check — invalid child selector passes through", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
        css: {
          // @ts-expect-error unknown child selector passes through in production mode
          "> headnig": { color: "red" },
        },
      });
      assert.deepStrictEqual(comp, {
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
        css: { "> headnig": { color: "red" } },
      });
    });

    test("valid components still render correctly", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "hello" } },
      css: { display: "block", width: "100%", "> title": { color: "inherit" } },
      });
      const { html, css } = renderProd(comp);
      assert.match(html, /^<div cid-[a-z0-9]+>/);
      assert.ok(html.includes("<span cid-title"));
      assert.ok(html.includes("hello"));
      assert.ok(css.includes("width: 100%;"));
    });

    test("deeply nested valid tree renders correctly in production mode", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: {
          level1: {
            tag: "div",
            innerHTML: {
              level2: [
                {
                  tag: "div",
                  innerHTML: {
                    level3: [{ tag: "span", innerHTML: "deep" }],
                  },
                },
              ],
            },
          },
        },
        css: {
          "> level1": {
            "> level2": {
              "> level3": { color: "transparent" },
            },
          },
        },
      });
      const { html, css } = renderProd(comp);
      assert.ok(html.includes("cid-level1"));
      assert.ok(html.includes("cid-level2"));
      assert.ok(html.includes("cid-level3"));
      assert.ok(css.includes("[cid-level1]"));
      assert.ok(css.includes("[cid-level2]"));
      assert.ok(css.includes("[cid-level3]"));
    });
  });
});

describe("implicit display from tag config at type level", () => {
  const CSS_ATTRS = cssAttributeConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {
    display: {
      block: { self: { width: "string", height: "string" }, children: {} },
      inline: { self: { "vertical-align": "string" }, children: {} },
      flex: { self: { "flex-direction": "'row' | 'column'" }, children: {} },
    },
  } as const);

  const CSS_PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {});

  const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRS, {
    div: {
      display: "block",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "flex-box": {
      display: "flex",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "inline-el": {
      display: "inline",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  });

  const { createComponent } = engine({
    supportedKeywords: SUPPORTED_KEYWORDS,
    htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
    htmlTagConfig: TAG_CONFIG,
    cssSyntaxConfig: MOCK_CSS_SYNTAX,
    cssAttributesConfig: CSS_ATTRS,
    cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
    cssPropertiesConfig: CSS_PROPS,
  }, { skipValidation: true });

  test("implicit flex display unlocks flex-direction", () => {
    createComponent({ tag: "flex-box", innerHTML: "x", css: { "flex-direction": "row" } });
  });

  test("implicit block display unlocks width and height", () => {
    createComponent({ tag: "div", innerHTML: "x", css: { width: "100%", height: "auto" } });
  });

  test("implicit inline display unlocks vertical-align", () => {
    createComponent({ tag: "inline-el", innerHTML: "x", css: { "vertical-align": "middle" } });
  });

  test("explicit display in CSS overrides implicit", () => {
    // div has display: "block" in config, explicit display: "flex" should unlock flex props
    createComponent({ tag: "div", innerHTML: "x", css: { display: "flex", "flex-direction": "column" } });
  });

  test("implicit display does not unlock non-matching dependent props", () => {
    // div has display: "block", so flex-direction should not be allowed without explicit display
    createComponent({ tag: "div", innerHTML: "x", css: {
      // @ts-expect-error
      "flex-direction": "row"
    } });
  });
});

// -----------------------------------------------------------------------
// Runtime CSS attribute validation
// -----------------------------------------------------------------------
describe("runtime CSS attribute validation", () => {
  const CSS_ATTRS = cssAttributeConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {
    color: "string",
    display: {
      block: { self: { width: "string" }, children: {} },
      inline: { self: { "vertical-align": "string" }, children: {} },
      flex: {
        self: { "flex-direction": "'row' | 'column'" },
        children: { flex: "string" },
      },
    },
  } as const);

  const CSS_PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {});

  const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRS, {
    div: {
      display: "block",
      attributes: {},
      innerHTML: "*",
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    span: {
      display: "inline",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "flex-box": {
      display: "flex",
      attributes: {},
      innerHTML: "*",
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  });

  const { createComponent } = engine({
    supportedKeywords: SUPPORTED_KEYWORDS,
    htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
    htmlTagConfig: TAG_CONFIG,
    cssSyntaxConfig: MOCK_CSS_SYNTAX,
    cssAttributesConfig: CSS_ATTRS,
    cssPseudoClassConfig: [":hover"],
    cssPropertiesConfig: CSS_PROPS,
  });

  test("accepts a valid simple CSS attribute value", () => {
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { color: "red" } }),
    );
  });

  test("accepts a valid complex CSS attribute value", () => {
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { display: "flex" } }),
    );
  });

  test("rejects an unknown CSS attribute at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error unknown prop is rejected at runtime
            unknownProp: "x",
          },
        }),
      /not a recognized CSS attribute or property/,
    );
  });

  test("rejects an invalid value type for a simple CSS attribute at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error color is a string DSL
            color: 42,
          },
        }),
      /does not match DSL/,
    );
  });

  test("rejects an invalid value key for a complex CSS attribute", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error grid is not a display value in this registry
            display: "grid",
          },
        }),
      /Invalid value 'grid' for 'display'/,
    );
  });

  test("rejects a dependent self-prop without its parent attribute value at runtime", () => {
    // flex-direction is only unlocked by display: flex, and the runtime no
    // longer reports it as an unknown prop — it says what would unlock it.
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /'flex-direction' requires display: flex/,
    );
  });

  test("accepts a dependent self-prop unlocked by the parent complex value", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { display: "flex", "flex-direction": "row" },
      }),
    );
  });

  test("rejects a dependent self-prop with an invalid value type at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            // @ts-expect-error flex-direction is a 'row' | 'column' DSL
            "flex-direction": 42,
          },
        }),
      /does not match DSL/,
    );
  });

  test("resolves gate values regardless of property order", () => {
    // flex-direction must be unlocked even though it is written before display
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { "flex-direction": "row", display: "flex" },
      }),
    );
  });

  test("explains the gate and values that would unlock a locked self-prop", () => {
    // div defaults to display: block, which does not unlock flex-direction
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /CSS Error: 'flex-direction' requires display: flex/,
    );
  });

  test("an explicit non-unlocking gate value still reports the locked prop", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "block",
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /'flex-direction' requires display: flex/,
    );
  });

  // ------------------------------------------------------------------
  // Implicit display from the tag config
  // ------------------------------------------------------------------

  test("implicit display from the tag config unlocks matching self props", () => {
    // div declares display: block, so width (a block self prop) is valid even
    // without an explicit display in the css block — the runtime wall now
    // agrees with the type level (WithDefaultDisplay).
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { width: "100%" } }),
    );
  });

  test("implicit display does not unlock non-matching self props", () => {
    // span declares display: inline, whose self props exclude width
    assert.throws(
      () =>
        createComponent({
          tag: "span",
          innerHTML: "x",
          css: {
            // @ts-expect-error width is locked under display: inline
            width: "100%",
          },
        }),
      /'width' requires display: block/,
    );
  });

  test("explicit display in the css overrides the implicit one", () => {
    // div defaults to block, but an explicit display: flex unlocks flex-direction
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { display: "flex", "flex-direction": "column" },
      }),
    );
  });

  // ------------------------------------------------------------------
  // Children-slot dependent props (parent gates in `> child` blocks)
  // ------------------------------------------------------------------

  test("a parent gate unlocks children-slot props inside > child blocks", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: { c: { tag: "span", innerHTML: "x" } },
        css: { display: "flex", "> c": { flex: "1" } },
      }),
    );
  });

  test("a locked children-slot prop reports 'on the parent'", () => {
    // div defaults to block, whose children slot is empty
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error flex is only unlocked by an explicit display: flex
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("children-slot props require an explicit parent gate, not the implicit one", () => {
    // flex-box defaults to display: flex, but the children slot only reads
    // gates the author explicitly wrote in this scope (mirrors the type level,
    // where CSSParent is the written css, not WithDefaultDisplay).
    assert.throws(
      () =>
        createComponent({
          tag: "flex-box",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error the implicit flex display does not unlock children props
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("a non-unlocking parent gate value keeps children-slot props locked", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "block",
            "> c": {
              // @ts-expect-error flex is locked under display: block
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("children-slot props stay locked inside pseudo-class blocks", () => {
    // The top-level display: flex does not leak into the :hover scope; the
    // children slot there is empty (mirrors CSSParent threading at the type
    // level, which is reset per CSS scope).
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "flex",
            ":hover": {
              "> c": {
                // @ts-expect-error the top-level display does not reach the :hover scope
                flex: "1",
              },
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("a child block resolves its own self props from the child's implicit display", () => {
    // `> c` targets a div (display: block), so width (a block self prop) is
    // unlocked inside the child block without an explicit display there.
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: { c: { tag: "div", innerHTML: "x" } },
        css: { "> c": { width: "100%" } },
      }),
    );
  });

  test("a child block uses its own tag's implicit display, not the parent's", () => {
    // `> c` targets a span (display: inline), whose self props exclude width
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error the child span is inline, so width stays locked
              width: "100%",
            },
          },
        }),
      /'width' requires display: block/,
    );
  });

  test("accepts a CSS custom property with a valid value", () => {
    const CSS_PROPS_WITH_VAR = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      { "--my-var": { syntax: "string", inherits: false, "initial-value": "hello" } },
    );

    const { createComponent: createWithVar } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
      htmlTagConfig: TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: CSS_ATTRS,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: CSS_PROPS_WITH_VAR,
    });

    assert.doesNotThrow(() =>
      createWithVar({ tag: "div", innerHTML: "x", css: { "--my-var": "world" } }),
    );
  });

  test("rejects a CSS custom property with an invalid value type at runtime", () => {
    const CSS_PROPS_WITH_VAR = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      { "--my-var": { syntax: "string", inherits: false, "initial-value": "hello" } },
    );

    const { createComponent: createWithVar } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
      htmlTagConfig: TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: CSS_ATTRS,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: CSS_PROPS_WITH_VAR,
    });

    assert.throws(
      () =>
        createWithVar({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error --my-var is a string DSL
            "--my-var": 42,
          },
        }),
      /does not match DSL/,
    );
  });
});
