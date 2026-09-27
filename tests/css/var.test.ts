import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import { SUPPORTED_KEYWORDS, type SupportedKeywords, type DSLInfer } from "tsyntax";
import {
  validateVars,
  VarSyntaxError,
  type ContainsVar,
  type ValidateVar,
  type ResolveVar,
} from "@/css/var.ts";
import { assertType, type Equal } from "../type-utils.ts";

// ---------------------------------------------------------------------------
// Type wall helpers.
// ---------------------------------------------------------------------------

const PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {
  "--spacing": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
  "--gap": { syntax: "<length-percentage>", inherits: false, "initial-value": "1rem" },
  "--brand": { syntax: "<color>", inherits: false, "initial-value": "#000000" },
  "--scale": { syntax: "<number>", inherits: false, "initial-value": "2" },
  "--count": { syntax: "<integer>", inherits: false, "initial-value": "1" },
  "--a": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
  "--b": { syntax: "<length>", inherits: false, "initial-value": "2rem" },
  "--c": { syntax: "<length>", inherits: false, "initial-value": "3rem" },
});

type Props = typeof PROPS;
type CommonSyntax = typeof COMMON_SYNTAX;

type Valid<S extends string> = Equal<
  ValidateVar<S, Props, SupportedKeywords, CommonSyntax>,
  S
>;
type Invalid<S extends string> = Equal<
  ValidateVar<S, Props, SupportedKeywords, CommonSyntax> extends string
    ? true
    : false,
  false
>;

// The type `--spacing` (a `<length>`) resolves to -- used to prove `var()`
// resolves to the registered property's syntax type.
type LengthType = DSLInfer<
  SupportedKeywords & CommonSyntax,
  CommonSyntax["<length>"] & string
>;
type ColorType = DSLInfer<
  SupportedKeywords & CommonSyntax,
  CommonSyntax["<color>"] & string
>;

// ---------------------------------------------------------------------------
// A registry the runtime tests share.
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

const { createComponent, renderComponent, cssProperties } = engine({
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

describe("var", () => {
  describe("Type Validation", () => {
    test("accepts var(--registered) stand-alone", () => {
      assertType<Valid<"var(--spacing)">>();
      assertType<Valid<"var(--brand)">>();
      assertType<Valid<"var(--scale)">>();
    });

    test("rejects an unknown property, unconditionally", () => {
      assertType<Invalid<"var(--unknown)">>();
      assertType<Invalid<"var(--space-big)">>();
      // A fallback is no longer an escape hatch for an unknown name.
      assertType<Invalid<"var(--unknown, 2px)">>();
      assertType<Invalid<"var(--unknown, var(--spacing))">>();
    });

    test("rejects a name without the -- prefix", () => {
      assertType<Invalid<"var(bad)">>();
      assertType<Invalid<"var(spacing)">>();
    });

    test("rejects every fallback form: literal, nested var and calc", () => {
      // A literal fallback, even one matching the property's syntax type.
      assertType<Invalid<"var(--spacing, 2px)">>();
      assertType<Invalid<"var(--brand, #ff0000)">>();
      // A fallback that is another var().
      assertType<Invalid<"var(--spacing, var(--a))">>();
      assertType<Invalid<"var(--unknown, var(--spacing))">>();
      // A fallback that is a calc().
      assertType<Invalid<"var(--spacing, calc(1px + 2px))">>();
      // Arbitrary nesting.
      assertType<Invalid<"var(--a, var(--b, var(--c, 4px)))">>();
      // Empty and excess arguments.
      assertType<Invalid<"var(--a, )">>();
      assertType<Invalid<"var(--a, x, y)">>();
      assertType<Invalid<"var(--spacing, 2px, 3px)">>();
    });

    test("rejects every fallback form with the same message", () => {
      // `1px`, ` )` and `x, y` are three arities of the same mistake; the type
      // wall reports them as one identical error, not three arity-specific ones.
      assertType<
        Equal<
          ValidateVar<"var(--a, 1px)", Props, SupportedKeywords, CommonSyntax>,
          ValidateVar<"var(--a, )", Props, SupportedKeywords, CommonSyntax>
        >
      >();
      assertType<
        Equal<
          ValidateVar<"var(--a, x, y)", Props, SupportedKeywords, CommonSyntax>,
          ValidateVar<"var(--a, 1px)", Props, SupportedKeywords, CommonSyntax>
        >
      >();
    });

    test("rejects malformed var() forms", () => {
      assertType<Invalid<"var()">>();
      assertType<Invalid<"var( )">>();
      assertType<Invalid<"var(--spacing, 2px, 3px)">>();
      assertType<Invalid<"var(--spacing, )">>();
      assertType<Invalid<"var(--spacing, var(--unknown))">>();
      assertType<Invalid<"var(--spacing">>();
    });

    test("accepts var() inside calc()", () => {
      assertType<Valid<"calc(var(--spacing) * 2)">>();
      assertType<Valid<"calc(var(--gap) + var(--spacing))">>();
      assertType<Invalid<"calc(var(--unknown) * 2)">>();
    });

    test("accepts multiple var() references in one value", () => {
      assertType<Valid<"var(--a) var(--b)">>();
      assertType<Valid<"1px solid var(--brand)">>();
      assertType<Invalid<"var(--unknown) var(--spacing)">>();
      assertType<Invalid<"var(--spacing) var(--unknown)">>();
      assertType<Invalid<"var(--a) var(--nope)">>();
    });

    test("rejects a var() whose resolved type is incompatible with the context", () => {
      assertType<
        Equal<
          ValidateVar<
            "var(--spacing)",
            Props,
            SupportedKeywords,
            CommonSyntax,
            ColorType
          > extends string
            ? true
            : false,
          false
        >
      >();
      assertType<
        Equal<
          ValidateVar<
            "var(--brand)",
            Props,
            SupportedKeywords,
            CommonSyntax,
            ColorType
          >,
          "var(--brand)"
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("resolves a var() to the registered property's syntax type", () => {
      assertType<
        Equal<
          ResolveVar<"var(--spacing)", Props, SupportedKeywords, CommonSyntax>,
          LengthType
        >
      >();
      assertType<
        Equal<
          ResolveVar<"var(--brand)", Props, SupportedKeywords, CommonSyntax>,
          ColorType
        >
      >();
      assertType<Equal<ContainsVar<"var(--a)">, true>>();
      assertType<Equal<ContainsVar<"1px">, false>>();
      assertType<Equal<ContainsVar<"calc(var(--a) * 2)">, true>>();
    });

    test("infers the written var() literal on the component", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: { width: "var(--spacing)" },
      });
      assertType<Equal<typeof comp.css.width, "var(--spacing)">>();
    });

    test("cssProperties renders the registry verbatim", () => {
      assert.ok(cssProperties.includes("--spacing"));
      assert.ok(cssProperties.includes('syntax: "<length>"'));
    });
  });

  describe("Runtime Validation", () => {
    test("var(--registered) validates and renders verbatim", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: { width: "var(--spacing)", color: "var(--brand)" },
      });
      const { css } = renderComponent(comp);
      assert.ok(css.includes("width: var(--spacing);"));
      assert.ok(css.includes("color: var(--brand);"));
    });

    test("rejects unknown properties and bad names", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            // @ts-expect-error unknown custom property
            css: { width: "var(--unknown)" },
          }),
        /unknown custom property '--unknown'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            // @ts-expect-error name must start with --
            css: { width: "var(bad)" },
          }),
        /must start with '--'/,
      );
    });

    test("rejects an unknown property regardless of anything else in the value", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error unknown custom property inside calc()
              width: "calc(var(--nope) * 2)",
            },
          }),
        /unknown custom property '--nope'/,
      );
    });

    test("rejects every fallback form at runtime", () => {
      const cases = [
        "var(--spacing, 2px)",
        "var(--spacing, )",
        "var(--spacing, 2px, 3px)",
        "var(--unknown, var(--spacing))",
        "var(--spacing, calc(1px + 2px))",
        "var(--a, var(--b, var(--c, 4px)))",
      ] as const;
      for (const value of cases) {
        assert.throws(
          () =>
            createComponent({
              tag: "box",
              innerHTML: "x",
              css: {
                // @ts-expect-error every fallback form is rejected
                width: value,
              },
            }),
          /takes no fallback/,
          `expected '${value}' to be rejected`,
        );
      }
    });

    test("validates var() inside calc()", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: { width: "calc(var(--spacing) * 2)" },
      });
      const { css } = renderComponent(comp);
      assert.ok(css.includes("width: calc(var(--spacing) * 2);"));
    });

    test("validates multiple var() references in a shorthand", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            border: "1px solid var(--brand)",
          },
        }),
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error the second reference is unknown
              border: "1px solid var(--unknown)",
            },
          }),
        /unknown custom property '--unknown'/,
      );
    });

    test("validates var() in a length shorthand property", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { margin: "var(--spacing)", padding: "var(--spacing)" },
        }),
      );
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error unknown custom property
              margin: "var(--unknown)",
            },
          }),
        /unknown custom property '--unknown'/,
      );
    });

    test("rejects malformed var() forms", () => {
      const cases = [
        ["var()", /requires a custom property name/],
        ["var( )", /requires a custom property name/],
        ["var(--spacing, 2px, 3px)", /takes no fallback/],
        ["var(--spacing, )", /takes no fallback/],
        ["var(--spacing", /unclosed var\(\) call|does not match/],
      ] as const;
      for (const [value, pattern] of cases) {
        assert.throws(
          () =>
            createComponent({
              tag: "box",
              innerHTML: "x",
              css: {
                // @ts-expect-error every one of these is malformed
                width: value,
              },
            }),
          pattern,
          `expected '${value}' to be rejected`,
        );
      }
    });

    test("validateVars is exposed for direct use", () => {
      const ctx = {
        properties: PROPS as unknown as Record<
          string,
          { syntax: string; inherits: boolean; "initial-value": string }
        >,
        defined: {},
      };
      assert.doesNotThrow(() => validateVars("var(--spacing)", ctx));
      assert.throws(() => validateVars("var(--nope)", ctx), VarSyntaxError);
      assert.throws(
        () => validateVars("var(--spacing, 2px)", ctx),
        /takes no fallback/,
      );
    });
  });

  describe("Circular references (runtime)", () => {
    test("a circular var chain in a css block throws with a clear message", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "--a": "var(--b)",
              "--b": "var(--a)",
            },
          }),
        /circular var\(\) reference: --a -> --b -> --a|circular var\(\) reference: --b -> --a -> --b/,
      );
    });

    test("a self-referencing var throws at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: { "--a": "var(--a)" },
          }),
        /circular var\(\) reference/,
      );
    });

    test("a circular chain in a :hover block is detected", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              ":hover": {
                "--a": "var(--b)",
                "--b": "var(--a)",
              },
            },
          }),
        /circular var\(\) reference/,
      );
    });
  });

  describe("Registry cycles (runtime)", () => {
    test("cssPropertiesConfig rejects a circular initial-value chain", () => {
      assert.throws(
        () =>
          cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {
            "--x": {
              syntax: "<length>",
              inherits: false,
              "initial-value": "var(--y)",
            },
            "--y": {
              syntax: "<length>",
              inherits: false,
              "initial-value": "var(--x)",
            },
          }),
        /circular var\(\) reference/,
      );
    });
  });
});
