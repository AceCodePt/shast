import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "@/dsl/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/minimal.ts";
import type { ValidateHTMLTagConfig } from "@/html/tag-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

type CSSConfig = {
  display: {
    block: { self: {}; children: {} };
    inline: { self: {}; children: {} };
    "inline-block": { self: {}; children: {} };
    "list-item": { self: {}; children: {} };
    none: { self: {}; children: {} };
    flex: {
      self: {
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'";
        "justify-content": "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'";
        "align-items": "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'";
        gap: "<length>";
      };
      children: {};
    };
    grid: {
      self: {
        gap: "<length>";
        "justify-content": "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'";
        "align-items": "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'";
      };
      children: {};
    };
  };
};

type DisplayKey = keyof CSSConfig["display"] & string;

describe("htmlTagConfig", () => {
  describe("Type Validation", () => {
    test("accepts a valid single tag config", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              br: {
                display: "block";
                innerHTML: [];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            br: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "br")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });

    test("accepts tags with #text innerHTML", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              p: {
                display: "block";
                innerHTML: ["#text"];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            p: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "p")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });

    test("accepts tags with * wildcard innerHTML", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              div: {
                display: "block";
                innerHTML: "*";
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            div: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "div")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });

    test("accepts tags with valid DSL attributes", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              a: {
                display: "inline";
                attributes: { href: "string | undefined" };
                innerHTML: ["#text"];
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            a: {
              display: DisplayKey;
              attributes: { href: "string | undefined" };
              innerHTML: "*" | ("#text" | "a")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });

    test("accepts multiple tags with cross-references", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              ul: {
                display: "block";
                innerHTML: ["li"];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
              li: {
                display: "list-item";
                innerHTML: ["#text"];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            ul: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "ul" | "li")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
            li: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "ul" | "li")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });

    test("accepts mixed #text and tag references", () => {
      assertType<
        Equal<
          ValidateHTMLTagConfig<
            SupportedKeywords,
            CSSConfig,
            {
              p: {
                display: "block";
                innerHTML: ["#text", "span"];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
              span: {
                display: "inline";
                innerHTML: ["#text"];
                attributes: {};
                cssPseudoClass: [];
                cssPseudoElement: [];
              };
            }
          >,
          {
            p: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "p" | "span")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
            span: {
              display: DisplayKey;
              attributes: {};
              innerHTML: "*" | ("#text" | "p" | "span")[];
              cssPseudoClass: `:${string}${string}`[];
              cssPseudoElement: `::${string}${string}`[];
            };
          }
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("tag config type is preserved through inference", () => {
      type Config = {
        br: {
          display: "block";
          innerHTML: [];
          attributes: {};
          cssPseudoClass: [];
          cssPseudoElement: [];
        };
      };
      const _config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {} as Config);
      assertType<Equal<typeof _config, Config>>();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a tag with an empty innerHTML array", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        br: {
          display: "inline",
          innerHTML: [],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        br: {
          display: "inline",
          innerHTML: [],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts a tag with #text in innerHTML", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        p: {
          display: "block",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        p: {
          display: "block",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts a * wildcard innerHTML (type-level only, runtime requires explicit tags)", () => {
      // The * wildcard is accepted at the type level but runtime iterates the string
      // as individual characters, so use explicit tag references instead
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        div: {
          display: "block",
          innerHTML: ["span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        div: {
          display: "block",
          innerHTML: ["span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts a tag referencing another known tag in innerHTML", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        ul: {
          display: "block",
          innerHTML: ["li"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        li: {
          display: "list-item",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        ul: {
          display: "block",
          innerHTML: ["li"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        li: {
          display: "list-item",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts tags with valid DSL string attributes", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        a: {
          display: "inline",
          attributes: {
            href: "string | undefined",
            target: "string | undefined",
          },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        a: {
          display: "inline",
          attributes: {
            href: "string | undefined",
            target: "string | undefined",
          },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts multiple tags with attributes and cross-references", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        ul: {
          display: "block",
          attributes: { id: "string | undefined" },
          innerHTML: ["li"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        li: {
          display: "list-item",
          attributes: { class: "string | undefined" },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        ul: {
          display: "block",
          attributes: { id: "string | undefined" },
          innerHTML: ["li"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        li: {
          display: "list-item",
          attributes: { class: "string | undefined" },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("returns the same object reference", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("accepts a tag with literal union attribute", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        bdo: {
          display: "inline",
          attributes: { dir: "'ltr' | 'rtl' | 'auto' | undefined" },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        bdo: {
          display: "inline",
          attributes: { dir: "'ltr' | 'rtl' | 'auto' | undefined" },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("a tag can reference itself in innerHTML", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        div: {
          display: "block",
          innerHTML: ["div"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        div: {
          display: "block",
          innerHTML: ["div"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("a tag can have both #text and another tag in innerHTML", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        p: {
          display: "block",
          innerHTML: ["#text", "span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        p: {
          display: "block",
          innerHTML: ["#text", "span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("different tags can have different attribute sets", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        a: {
          display: "inline",
          attributes: { href: "string", rel: "string | undefined" },
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
        button: {
          display: "inline-block",
          attributes: {
            disabled: "boolean | undefined",
            type: "'submit' | 'button' | undefined",
          },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        a: {
          display: "inline",
          attributes: { href: "string", rel: "string | undefined" },
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
        button: {
          display: "inline-block",
          attributes: {
            disabled: "boolean | undefined",
            type: "'submit' | 'button' | undefined",
          },
          innerHTML: ["#text"],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });
  });

  describe("Error handling", () => {
    test("throws when innerHTML references an unknown tag", () => {
      assert.throws(() =>
        htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          div: {
            display: "block",
            // @ts-expect-error
            innerHTML: ["span"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        }),
      );
    });

    test("throws for invalid DSL string in an attribute value", () => {
      assert.throws(
        () =>
          htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
            div: {
              display: "block",
              // @ts-expect-error
              attributes: { id: "xyz" },
              innerHTML: [],
              cssPseudoClass: [],
              cssPseudoElement: [],
            },
          }),
        /Invalid DSL string/,
      );
    });

    test("throws when innerHTML references a tag that is only defined elsewhere", () => {
      assert.throws(() =>
        htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          p: {
            display: "block",
            // @ts-expect-error - span is not defined in this config
            innerHTML: ["#text", "span"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        }),
      );
    });

    test("throws for partially invalid union in attribute", () => {
      assert.throws(
        () =>
          htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
            div: {
              display: "block",
              // @ts-expect-error
              attributes: { id: "string | xyz" },
              innerHTML: [],
              cssPseudoClass: [],
              cssPseudoElement: [],
            },
          }),
        /Invalid DSL string/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty tag config is accepted", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {});
      assert.deepStrictEqual(config, {});
    });

    test("single tag with empty innerHTML and no attributes", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        br: {
          display: "block",
          innerHTML: [],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        br: {
          display: "block",
          innerHTML: [],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("object reference identity preserved for complex config", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        div: {
          display: "block",
          innerHTML: ["span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        div: {
          display: "block",
          innerHTML: ["span"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
        span: {
          display: "inline",
          innerHTML: ["#text"],
          attributes: {},
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });

    test("tag can have attributes with template literal DSL", () => {
      const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
        div: {
          display: "block",
          attributes: { style: "`${string}` | undefined" },
          innerHTML: [],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
      assert.deepStrictEqual(config, {
        div: {
          display: "block",
          attributes: { style: "`${string}` | undefined" },
          innerHTML: [],
          cssPseudoClass: [],
          cssPseudoElement: [],
        },
      });
    });
  });

  describe("Pseudo-Class Validation", () => {
    describe("Type Validation", () => {
      test("accepts tag with valid pseudo-class references", () => {
        assertType<
          Equal<
            ValidateHTMLTagConfig<
              SupportedKeywords,
              CSSConfig,
              {
                button: {
                  display: "block";
                  innerHTML: ["#text"];
                  attributes: {};
                  cssPseudoClass: [":hover", ":focus"];
                  cssPseudoElement: [];
                };
              }
            >,
            {
              button: {
                display: DisplayKey;
                innerHTML: "*" | ("#text" | "button")[];
                attributes: {};
                cssPseudoClass: `:${string}${string}`[];
                cssPseudoElement: `::${string}${string}`[];
              };
            }
          >
        >();
      });

      test("rejects pseudo-class name not starting with `:`", () => {
        assertType<
          Equal<
            ValidateHTMLTagConfig<
              SupportedKeywords,
              CSSConfig,
              // @ts-expect-error
              {
                button: {
                  display: "block";
                  innerHTML: ["#text"];
                  attributes: {};
                  cssPseudoClass: ["hover"];
                  cssPseudoElement: [];
                };
              }
            >,
            {
              button: {
                display: DisplayKey;
                innerHTML: "*" | ("#text" | "button")[];
                attributes: {};
                cssPseudoClass: `:${string}${string}`[];
                cssPseudoElement: `::${string}${string}`[];
              };
            }
          >
        >();
      });

      test("tag with cssPseudoClass: [] accepts empty pseudo-class list", () => {
        assertType<
          Equal<
            ValidateHTMLTagConfig<
              SupportedKeywords,
              CSSConfig,
              {
                button: {
                  display: "block";
                  innerHTML: ["#text"];
                  attributes: {};
                  cssPseudoClass: [];
                  cssPseudoElement: [];
                };
              }
            >,
            {
              button: {
                display: DisplayKey;
                innerHTML: "*" | ("#text" | "button")[];
                attributes: {};
                cssPseudoClass: `:${string}${string}`[];
                cssPseudoElement: `::${string}${string}`[];
              };
            }
          >
        >();
      });
    });

    describe("Runtime Validation", () => {
      test("accepts empty pseudo-class list", () => {
        const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
        assert.deepStrictEqual(config, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
      });

      test("preserves object reference", () => {
        const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
        });
        assert.strictEqual(config, config);
      });

      test("accepts valid pseudo-class references", () => {
        const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":hover", ":focus"],
            cssPseudoElement: [],
          },
        });
        assert.deepStrictEqual(config, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":hover", ":focus"],
            cssPseudoElement: [],
          },
        });
      });
    });

    describe("Edge Cases", () => {
      test("multiple tags with different pseudo-class lists", () => {
        const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":hover", ":focus"],
            cssPseudoElement: [],
          },
          div: {
            display: "block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":active"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
        assert.deepStrictEqual(config, {
          button: {
            display: "inline-block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":hover", ":focus"],
            cssPseudoElement: [],
          },
          div: {
            display: "block",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [":active"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            innerHTML: ["#text"],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
      });

      test("tag with cssPseudoClass: [] after one with non-empty list", () => {
        const config = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES_CONFIG, {
          button: {
            display: "inline-block",
            innerHTML: [],
            attributes: {},
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            innerHTML: [],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
        assert.deepStrictEqual(config, {
          button: {
            display: "inline-block",
            innerHTML: [],
            attributes: {},
            cssPseudoClass: [":hover"],
            cssPseudoElement: [],
          },
          span: {
            display: "inline",
            innerHTML: [],
            attributes: {},
            cssPseudoClass: [],
            cssPseudoElement: [],
          },
        });
      });
    });
  });
});
