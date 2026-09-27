import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import {
  parseCalc,
  isCalcString,
  type CalcDimension,
  type ValidateCalc,
} from "@/css/calc.ts";
import { assertType, type Equal } from "../type-utils.ts";

// ---------------------------------------------------------------------------
// Type wall: the recursive template-literal parser.
// ---------------------------------------------------------------------------

type Valid<S extends string> = Equal<ValidateCalc<S>, S>;
type Invalid<S extends string> = Equal<
  ValidateCalc<S> extends string ? true : false,
  false
>;

// The same wall with the registry supplied, so `var()` operands classify
// through their registered syntax.
type ValidP<S extends string> = Equal<
  ValidateCalc<S, Props, SupportedKeywords, typeof COMMON_SYNTAX>,
  S
>;
type InvalidP<S extends string> = Equal<
  ValidateCalc<
    S,
    Props,
    SupportedKeywords,
    typeof COMMON_SYNTAX
  > extends string
    ? true
    : false,
  false
>;

// The wall with the slot's accepted dimensions supplied.
type ValidSlot<S extends string, E extends CalcDimension> = Equal<
  ValidateCalc<S, Props, SupportedKeywords, typeof COMMON_SYNTAX, E>,
  S
>;
type InvalidSlot<S extends string, E extends CalcDimension> = Equal<
  ValidateCalc<
    S,
    Props,
    SupportedKeywords,
    typeof COMMON_SYNTAX,
    E
  > extends string
    ? true
    : false,
  false
>;

// ---------------------------------------------------------------------------
// A minimal registry built on the common syntax/attribute configs. `box` is a
// block by default, so `width` / `height` (gate-unlocked by `display`) are
// writable and carry `<length-percentage>`, which now admits `<calc>`.
// ---------------------------------------------------------------------------

const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, COMMON_ATTRIBUTES, {
  box: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [":hover"],
    cssPseudoElement: ["::before"],
  },
});

const PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {
  "--spacing": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
  "--len-a": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
  "--len-b": { syntax: "<length>", inherits: false, "initial-value": "2rem" },
  "--len": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
  "--num": { syntax: "<number>", inherits: false, "initial-value": "2" },
  "--alpha-a": { syntax: "<alpha-value>", inherits: false, "initial-value": "1" },
  "--alpha-b": { syntax: "<alpha-value>", inherits: false, "initial-value": "1" },
});

type Props = typeof PROPS;

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
    id: "string | undefined",
    class: "string | undefined",
  }),
  htmlTagConfig: TAG_CONFIG,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: COMMON_ATTRIBUTES,
  cssPseudoClassConfig: [":hover"],
  cssPropertiesConfig: PROPS,
  cssQueriesConfig: [],
});

// ---------------------------------------------------------------------------
// A registry that defines a syntax token *as* `calc(...)` and exposes it on a
// width attribute, exercising the "calc token in the attribute config" path.
// ---------------------------------------------------------------------------

const CALC_SYNTAX = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
  "<calc>": "`calc(${string})`",
  "<calc-size>": "<calc>",
});

const CALC_ATTRIBUTES = cssAttributeConfig(SUPPORTED_KEYWORDS, CALC_SYNTAX, {
  display: {
    block: { self: {}, children: {} },
    inline: { self: {}, children: {} },
  },
  width: "<calc-size>",
  height: "<calc-size>",
});

const CALC_TAGS = htmlTagConfig(
  SUPPORTED_KEYWORDS,
  CALC_ATTRIBUTES,
  {
    pane: {
      display: "block",
      attributes: {},
      innerHTML: "*",
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  },
);

const CALC_ENGINE = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
  htmlTagConfig: CALC_TAGS,
  cssSyntaxConfig: CALC_SYNTAX,
  cssAttributesConfig: CALC_ATTRIBUTES,
  cssPseudoClassConfig: [],
  cssPropertiesConfig: cssPropertiesConfig(SUPPORTED_KEYWORDS, CALC_SYNTAX, {}),
  cssQueriesConfig: [],
});

describe("calc", () => {
  describe("Type Validation", () => {
    test("accepts length/percentage arithmetic", () => {
      assertType<Valid<"calc(100% - 40px)">>();
      assertType<Valid<"calc(50vw + 2rem)">>();
      assertType<Valid<"calc(100% - 20px)">>();
      assertType<Valid<"calc(10px / 2)">>();
      assertType<Valid<"calc(2 * 3px)">>();
      assertType<Valid<"calc(-40px + 100%)">>();
      assertType<Valid<"calc(100% - -40px)">>();
      assertType<Valid<"calc(2 * -3)">>();
      assertType<Valid<"calc(100%/2)">>();
      assertType<Valid<"calc( 100% - 40px )">>();
    });

    test("accepts nested calc and var operands", () => {
      assertType<Valid<"calc(calc(100% - 20px) * 2)">>();
      assertType<Valid<"calc(var(--spacing) * 2)">>();
      assertType<Valid<"calc(var(--a) + var(--b))">>();
    });

    test("rejects multiplying two unit-bearing operands", () => {
      assertType<Invalid<"calc(2px * 3px)">>();
      assertType<Invalid<"calc(100% * 50%)">>();
      assertType<Invalid<"calc(2rem * 3em)">>();
      // Runs, not adjacent pairs: the run carries the first unit to the last.
      assertType<Invalid<"calc(2px * 3 * 4px)">>();
    });

    test("accepts a unitless operand anywhere in a multiplicative run", () => {
      assertType<Valid<"calc(2 * 3px)">>();
      assertType<Valid<"calc(3px * 2)">>();
      assertType<Valid<"calc(2px * 3 * 4)">>();
      assertType<Valid<"calc(100% * 2)">>();
      // `+` delimits the run, so the earlier `2px` does not constrain `4px`.
      assertType<Valid<"calc(2px * 3 + 4px)">>();
    });

    test("classifies var() operands through the registry", () => {
      assertType<ValidP<"calc(var(--len) * 3)">>();
      assertType<ValidP<"calc(3 * var(--len))">>();
      assertType<ValidP<"calc(var(--num) * var(--len))">>();
      assertType<ValidP<"calc(var(--num) * var(--num))">>();
      assertType<InvalidP<"calc(var(--len-a) * var(--len-b))">>();
      assertType<InvalidP<"calc(var(--len) * var(--len))">>();
      assertType<InvalidP<"calc(2px * var(--len))">>();
    });

    test("holds the author to a named syntax that may hold a percentage", () => {
      // `<alpha-value>` is number | percentage. The classifier is unit-bearing,
      // so a two-reference product is rejected even though a number*number
      // would be legal: the value is only known at computed-value time, and an
      // accepted expression could silently go IACVT. The escape hatch is to
      // declare `<number>` when the property only ever holds numbers.
      assertType<InvalidP<"calc(var(--alpha-a) * var(--alpha-b))">>();
      assertType<ValidP<"calc(var(--alpha-a) * 3)">>();
      assertType<ValidP<"calc(3 * var(--alpha-a))">>();
    });

    test("accepts a division whose right side continues into addition", () => {
      // Regression: the `/` branch used to resume on the operator after the
      // right operand, so `+` was misread as an operand.
      assertType<Valid<"calc(10px / 2 + 10px)">>();
      assertType<Valid<"calc(10px / 2 - 10px)">>();
      assertType<Valid<"calc(10px + 10px / 2)">>();
      // `10px / 2` is a length, so `* 3px` is a squared unit: the division
      // result feeds the multiplication run.
      assertType<Invalid<"calc(10px / 2 * 3px)">>();
    });

    test("accepts time, angle and frequency units", () => {
      assertType<Valid<"calc(150ms * 2)">>();
      assertType<Valid<"calc(2s + 500ms)">>();
      assertType<Valid<"calc(45deg * 2)">>();
      assertType<Valid<"calc(1turn + 90deg)">>();
      assertType<Valid<"calc(2kHz * 2)">>();
      // Two unit-bearing operands in one run still fail.
      assertType<Invalid<"calc(150ms * 2s)">>();
      assertType<Invalid<"calc(45deg * 2rad)">>();
    });

    test("rejects mixed-dimension addition", () => {
      assertType<Valid<"calc(2s + 500ms)">>();
      assertType<Valid<"calc(45deg + 1turn)">>();
      assertType<Valid<"calc(2Hz + 3kHz)">>();
      assertType<Valid<"calc(2rem + 3px)">>();
      assertType<Invalid<"calc(2s + 3px)">>();
      assertType<Invalid<"calc(45deg + 3px)">>();
      assertType<Invalid<"calc(2Hz + 3s)">>();
      assertType<Invalid<"calc(1 + 2px)">>();
      // A percentage resolves against the other side, so it is the wildcard.
      assertType<Valid<"calc(100% - 40px)">>();
      assertType<Valid<"calc(50% + 45deg)">>();
    });

    test("accepts same-dimension division, which cancels to a number", () => {
      assertType<Valid<"calc(10px / 2px)">>();
      assertType<Valid<"calc(1s / 100ms)">>();
      assertType<Valid<"calc(45deg / 15deg)">>();
      assertType<Valid<"calc(10px / 2)">>();
      assertType<Invalid<"calc(100% / 2px)">>();
      assertType<Invalid<"calc(10px / 2s)">>();
      // The quotient is a number, so it feeds the next factor as unitless.
      assertType<Valid<"calc(10px / 2px * 3px)">>();
      assertType<Invalid<"calc(10px / 2 * 3px)">>();
    });

    test("rejects a result dimension the slot does not accept", () => {
      assertType<ValidSlot<"calc(100% - 40px)", "length" | "percentage">>();
      assertType<ValidSlot<"calc(2 * 3px)", "length">>();
      assertType<ValidSlot<"calc(45deg * 2)", "angle">>();
      assertType<ValidSlot<"calc(0.5 * 0.5)", "number" | "percentage">>();
      assertType<InvalidSlot<"calc(2Hz * 2)", "length" | "percentage">>();
      assertType<InvalidSlot<"calc(45deg * 2)", "length" | "percentage">>();
      assertType<InvalidSlot<"calc(2s / 500ms)", "angle">>();
      // `unknown` (nested calc, unplaced var syntax) turns the check off.
      assertType<ValidSlot<"calc(calc(1px) * 2)", "length">>();
    });

    test("rejects malformed calc", () => {
      assertType<Invalid<"calc()">>();
      assertType<Invalid<"calc( )">>();
      assertType<Invalid<"calc(100% -)">>();
      assertType<Invalid<"calc(100% - 40px">>();
      assertType<Invalid<"calc(100% - 40px))">>();
      assertType<Invalid<"calc(100% * 40px 2)">>();
      assertType<Invalid<"calc(100% / 2px)">>();
      assertType<Invalid<"calc(100% / nope)">>();
      assertType<Invalid<"calc(nope)">>();
      assertType<Invalid<"calc(+ 2px)">>();
      assertType<Invalid<"calc(100%+2px)">>();
      assertType<Invalid<"calc(100%-2px)">>();
      assertType<Invalid<"calc(var(--spacing)">>();
    });

    test("createComponent enforces the deep type wall on a css block", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { width: "calc(100% - 40px)" },
      });
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { ":hover": { width: "calc(50vw + 2rem)" } },
      });
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error calc() has no left operand
            width: "calc(* 2px)",
          },
        }),
      );
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error unclosed parenthesis
            width: "calc(100% - 40px",
          },
        }),
      );
    });

    test("createComponent applies the slot dimension", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          width: "calc(100% - 40px)",
          rotate: "calc(45deg * 2)",
          "animation-duration": "calc(150ms * 2)",
        },
      });
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error a frequency result on a length slot
            width: "calc(2Hz * 2)",
          },
        }),
      );
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error mixed-dimension addition
            width: "calc(2s + 3px)",
          },
        }),
      );
    });

    test("a calc() syntax token in an attribute config typechecks", () => {
      CALC_ENGINE.createComponent({
        tag: "pane",
        innerHTML: "x",
        css: { width: "calc(100% - 40px)" },
      });
      assert.throws(() =>
        CALC_ENGINE.createComponent({
          tag: "pane",
          innerHTML: "x",
          css: {
            // @ts-expect-error division by a dimension is invalid
            width: "calc(100% / 2px)",
          },
        }),
      );
    });
  });

  describe("Type Inference", () => {
    test("infers the written calc literal", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: { width: "calc(100% - 40px)" },
      });
      assertType<Equal<typeof comp.css.width, "calc(100% - 40px)">>();
    });

    test("the shallow <calc> token infers as calc(${string})", () => {
      assertType<Equal<typeof CALC_SYNTAX["<calc>"], "`calc(${string})`">>();
    });
  });

  describe("Parse (runtime parser)", () => {
    test("accepts valid expressions and returns them verbatim", () => {
      assert.strictEqual(parseCalc("calc(100% - 40px)"), "calc(100% - 40px)");
      assert.strictEqual(parseCalc("calc(50vw + 2rem)"), "calc(50vw + 2rem)");
      assert.strictEqual(parseCalc("calc(10px / 2)"), "calc(10px / 2)");
      assert.strictEqual(
        parseCalc("calc(100% - -40px)"),
        "calc(100% - -40px)",
      );
      assert.strictEqual(parseCalc("calc(2 * -3)"), "calc(2 * -3)");
      assert.strictEqual(
        parseCalc("calc(calc(100% - 20px) * 2)"),
        "calc(calc(100% - 20px) * 2)",
      );
      assert.strictEqual(
        parseCalc("calc(var(--spacing) * 2)"),
        "calc(var(--spacing) * 2)",
      );
    });

    test("rejects malformed expressions", () => {
      assert.throws(() => parseCalc("calc()"), /empty calc/);
      assert.throws(() => parseCalc("calc( )"), /empty calc/);
      assert.throws(() => parseCalc("calc(100% -)"), /space|trailing operator|no right operand/);
      assert.throws(() => parseCalc("calc(100% /)"), /trailing operator/);
      assert.throws(() => parseCalc("calc(100% *)"), /trailing operator/);
      assert.throws(() => parseCalc("calc(100% - 40px"), /not a calc/);
      assert.throws(() => parseCalc("calc(100% - 40px))"), /unexpected '\)'/);
      assert.throws(() => parseCalc("calc(* 2px)"), /no left operand/);
      assert.throws(() => parseCalc("calc(100% + 2px"), /not a calc|unbalanced/);
      assert.throws(() => parseCalc("calc(100% ^ 2px)"), /invalid operand/);
      assert.throws(() => parseCalc("calc(100% / 2px)"), /must be a number/);
      assert.throws(
        () => parseCalc("calc(100% / abc)"),
        /invalid operand|must be a number/,
      );
      assert.throws(() => parseCalc("calc(nope)"), /invalid operand/);
      assert.throws(() => parseCalc("calc(100%+2px)"), /space/);
      assert.throws(() => parseCalc("calc(100%-2px)"), /space/);
    });

    test("accepts same-dimension division", () => {
      assert.doesNotThrow(() => parseCalc("calc(10px / 2px)"));
      assert.doesNotThrow(() => parseCalc("calc(1s / 100ms)"));
      assert.doesNotThrow(() => parseCalc("calc(10px / 2px * 3px)"));
      assert.throws(() => parseCalc("calc(100% / 2px)"), /must be a number/);
      assert.throws(() => parseCalc("calc(10px / 2s)"), /must be a number/);
    });

    test("isCalcString only flags calc() values", () => {
      assert.strictEqual(isCalcString("calc(1px)"), true);
      assert.strictEqual(isCalcString("1px"), false);
      assert.strictEqual(isCalcString(42), false);
    });

    test("classifies var() operands when given a registry", () => {
      const ctx = {
        properties: {
          "--len": { syntax: "<length>" },
          "--num": { syntax: "<number>" },
          "--alpha": { syntax: "<alpha-value>" },
        },
      };
      assert.doesNotThrow(() => parseCalc("calc(var(--len) * 2)", ctx));
      assert.doesNotThrow(() => parseCalc("calc(var(--num) * var(--len))", ctx));
      assert.throws(
        () => parseCalc("calc(var(--len) * var(--len))", ctx),
        /multiplication operands 'var\(--len\)' and 'var\(--len\)'/,
      );
      // `<alpha-value>` may hold a percentage, so it is unit-bearing: a
      // two-reference product is rejected, a reference times a number passes.
      assert.throws(
        () => parseCalc("calc(var(--alpha) * var(--alpha))", ctx),
        /multiplication operands 'var\(--alpha\)' and 'var\(--alpha\)'/,
      );
      assert.doesNotThrow(() => parseCalc("calc(var(--alpha) * 3)", ctx));
    });
  });

  describe("Runtime Validation", () => {
    test("valid calc values validate and render verbatim", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          width: "calc(100% - 40px)",
          height: "calc(50vw + 2rem)",
        },
      });
      const { css } = renderComponent(comp);
      assert.ok(css.includes("width: calc(100% - 40px);"));
      assert.ok(css.includes("height: calc(50vw + 2rem);"));
    });

    test("nested calc and var operands validate at runtime", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          width: "calc(calc(100% - 20px) * 2)",
          height: "calc(var(--spacing) * 2)",
        },
      });
      const { css } = renderComponent(comp);
      assert.ok(css.includes("width: calc(calc(100% - 20px) * 2);"));
      assert.ok(css.includes("height: calc(var(--spacing) * 2);"));
    });

    test("rejects multiplying two unit-bearing operands at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two dimensions
              width: "calc(2px * 3px)",
            },
          }),
        /multiplication operands .* cannot both carry units/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two percentages
              width: "calc(100% * 50%)",
            },
          }),
        /multiplication operands .* cannot both carry units/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two dimensions
              width: "calc(2rem * 3em)",
            },
          }),
        /multiplication operands .* cannot both carry units/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two dimensions in one run
              width: "calc(2px * 3 * 4px)",
            },
          }),
        /multiplication operands '2px' and '4px'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two registered <length> vars
              width: "calc(var(--len-a) * var(--len-b))",
            },
          }),
        /multiplication operands 'var\(--len-a\)' and 'var\(--len-b\)'/,
      );
      // A gate value (`opacity`) now reaches the deep wall too, so it cannot
      // quietly accept a bad product through the shallow `<alpha-value>` match.
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error two dimensions as an opacity gate value
              opacity: "calc(2px * 3px)",
            },
          }),
        /multiplication operands '2px' and '3px'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error <alpha-value> may hold a percentage
              opacity: "calc(var(--alpha-a) * var(--alpha-b))",
            },
          }),
        /multiplication operands 'var\(--alpha-a\)' and 'var\(--alpha-b\)'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error unknown custom property in a gate value
              opacity: "var(--nope)",
            },
          }),
        /unknown custom property '--nope'/,
      );
    });

    test("accepts a unitless operand in a multiplicative run at runtime", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            width: "calc(2 * 3px)",
            height: "calc(3px * 2)",
          },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            width: "calc(2px * 3 * 4)",
            height: "calc(100% * 2)",
          },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            width: "calc(2px * 3 + 4px)",
            height: "calc(var(--len) * 3)",
          },
        }),
      );
    });

    test("accepts a division continued by addition at runtime", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            width: "calc(10px / 2 + 10px)",
            height: "calc(10px / 2 - 10px)",
          },
        }),
      );
    });

    test("accepts time and angle calc values at runtime", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "animation-duration": "calc(150ms * 2)",
            "transition-delay": "calc(2s + 500ms)",
            rotate: "calc(45deg * 2)",
            opacity: "calc(0.5 * 0.5)",
          },
        }),
      );
    });

    test("enforces the slot dimension at runtime", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            width: "calc(100% - 40px)",
            rotate: "calc(45deg * 2)",
            "animation-duration": "calc(150ms * 2)",
            opacity: "calc(2s / 500ms)",
          },
        }),
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error a frequency result on a length slot
              width: "calc(2Hz * 2)",
            },
          }),
        /result type 'frequency'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error mixed-dimension addition
              width: "calc(2s + 3px)",
            },
          }),
        /addition operands '2s' and '3px'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error the quotient is a number, not a length
              width: "calc(10px / 2px)",
            },
          }),
        /result type 'number'/,
      );
    });

    test("malformed calc values are rejected at runtime", () => {
      const cases = [
        "calc()",
        "calc(100% -)",
        "calc(100% - 40px",
        "calc(* 2px)",
        "calc(100% / 2px)",
        "calc(100%+2px)",
        "calc(nope)",
      ] as const;
      for (const value of cases) {
        assert.throws(
          () =>
            createComponent({
              tag: "box",
              innerHTML: "x",
              css: {
                // @ts-expect-error every one of these is malformed calc()
                width: value,
              },
            }),
          /calc|Invalid DSL|does not match/,
          `expected '${value}' to be rejected`,
        );
      }
    });

    test("a calc() syntax token in an attribute config validates at runtime", () => {
      assert.doesNotThrow(() =>
        CALC_ENGINE.createComponent({
          tag: "pane",
          innerHTML: "x",
          css: { width: "calc(100% - 40px)" },
        }),
      );
      assert.throws(
        () =>
          CALC_ENGINE.createComponent({
            tag: "pane",
            innerHTML: "x",
            css: {
              // @ts-expect-error malformed calc
              width: "calc(100% -)",
            },
          }),
        /calc/,
      );
    });
  });
});
