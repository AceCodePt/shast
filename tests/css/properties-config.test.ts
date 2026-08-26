import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import type { ValidateCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

const SYNTAX = {
  "<length>": "`${number}${'px' | 'rem' | 'em'}`",
  "<color>": "`#${string}` | 'transparent' | 'currentColor'",
  "<number>": "`${number}`",
  "<integer>": "`${bigint}`",
  "<percentage>": "`${number}%`",
} as const;

describe("cssPropertiesConfig", () => {
  describe("Type Validation", () => {
    test("accepts a valid custom property", () => {
      assertType<
        Equal<
          ValidateCSSPropertiesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            {
              "--a": {
                syntax: "<percentage>";
                inherits: true;
                "initial-value": "1%";
              };
            }
          >,
          {
            "--a": {
              syntax: "<percentage>";
              inherits: boolean;
              "initial-value": `${number}%`;
            };
          }
        >
      >();
    });

    test("accepts multiple custom properties", () => {
      assertType<
        Equal<
          ValidateCSSPropertiesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            {
              "--a": {
                syntax: "<percentage>";
                inherits: true;
                "initial-value": "1%";
              };
              "--_a": {
                syntax: "<integer>";
                inherits: false;
                "initial-value": "1";
              };
            }
          >,
          {
            "--a": {
              syntax: "<percentage>";
              inherits: boolean;
              "initial-value": `${number}%`;
            };
            "--_a": {
              syntax: "<integer>";
              inherits: boolean;
              "initial-value": `${bigint}`;
            };
          }
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a single custom property with all fields", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "--a": {
          syntax: "<percentage>",
          inherits: true,
          "initial-value": "1%",
        },
      });
      assert.deepStrictEqual(config, {
        "--a": {
          syntax: "<percentage>",
          inherits: true,
          "initial-value": "1%",
        },
      });
    });

    test("missing initial-value throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            // @ts-expect-error
            "--a": {
              syntax: "<number>",
              inherits: false,
            },
          }),
        /initial-value is required/,
      );
    });

    test("accepts a property with boolean inherits", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "--bg": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "transparent",
        },
      });
      assert.deepStrictEqual(config, {
        "--bg": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "transparent",
        },
      });
    });

    test("accepts a property with template literal syntax", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "--custom": {
          syntax: "<length>",
          inherits: false,
          "initial-value": "1px",
        },
      });
      assert.deepStrictEqual(config, {
        "--custom": {
          syntax: "<length>",
          inherits: false,
          "initial-value": "1px",
        },
      });
    });

    test("returns the same object reference", () => {
      const input = {
        "--a": {
          syntax: "<percentage>",
          inherits: true,
          "initial-value": "1%",
        },
      } as const;
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, input);
      assert.strictEqual(config, input);
    });
  });

  describe("Error handling", () => {
    test("invalid DSL syntax string throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            "--a": {
              // @ts-expect-error
              syntax: "xyz",
              inherits: true,
              // @ts-expect-error
              "initial-value": "",
            },
          }),
        /Invalid DSL string/,
      );
    });

    test("partially invalid syntax union throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            "--a": {
              // @ts-expect-error
              syntax: "<length> | xyz",
              inherits: false,
              // @ts-expect-error
              "initial-value": "asdf",
            },
          }),
        /Invalid DSL string/,
      );
    });

    test("property name without -- prefix throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            // @ts-expect-error
            a: { syntax: "<number>", inherits: false },
          }),
        /You must have the property start with --/,
      );
    });

    test("initial-value mismatch with length syntax throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            "--size": {
              syntax: "<length>",
              inherits: false,
              // @ts-expect-error
              "initial-value": "invalid",
            },
          }),
        /does not match/,
      );
    });

    test("initial-value mismatch with color syntax throws at runtime", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            "--bg": {
              syntax: "<color>",
              inherits: false,
              // @ts-expect-error
              "initial-value": "invalid-color",
            },
          }),
        /does not match/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty config is accepted", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {});
      assert.deepStrictEqual(config, {});
    });

    test("property name with underscore prefix is accepted", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "--_a": { syntax: "<integer>", inherits: false, "initial-value": "1" },
      });
      assert.deepStrictEqual(config, {
        "--_a": { syntax: "<integer>", inherits: false, "initial-value": "1" },
      });
    });

    test("multiple custom properties with various syntax types", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "--main-color": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "currentColor",
        },
        "--spacing": {
          syntax: "<length>",
          inherits: true,
          "initial-value": "1rem",
        },
        "--opacity": {
          syntax: "<number>",
          inherits: false,
          "initial-value": "1",
        },
      });
      assert.deepStrictEqual(config, {
        "--main-color": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "currentColor",
        },
        "--spacing": {
          syntax: "<length>",
          inherits: true,
          "initial-value": "1rem",
        },
        "--opacity": {
          syntax: "<number>",
          inherits: false,
          "initial-value": "1",
        },
      });
    });
  });

  describe("DSL composite template patterns", () => {
    const COLOR_SYNTAX = {
      "<color>":
        "`#${string}` | `hsl(${number} ${number}% ${number}%)` | 'transparent' | 'currentColor'",
    } as const;

    test("accepts a valid hsl() value for <color> syntax", () => {
      const config = cssPropertiesConfig(SUPPORTED_KEYWORDS, COLOR_SYNTAX, {
        "--background-color": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "hsl(1 1% 1%)",
        },
      });
      assert.deepStrictEqual(config, {
        "--background-color": {
          syntax: "<color>",
          inherits: false,
          "initial-value": "hsl(1 1% 1%)",
        },
      });
    });

    test("rejects an invalid hsl() value for <color> syntax", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, COLOR_SYNTAX, {
            "--background-color": {
              syntax: "<color>",
              inherits: false,
              // @ts-expect-error - not a valid hsl() value
              "initial-value": "hsl(nope)",
            },
          }),
        /does not match/,
      );
    });
  });
});
