import test, { describe } from "node:test";
import assert from "node:assert";
import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import type {
  KeyframeName,
  ValidateFrameSelector,
  ValidateKeyframeName,
  ValidateKeyframesConfig,
} from "@/css/keyframes-config/types.ts";
import type { SupportedKeywords } from "tsyntax";
import MINIMAL_KEYFRAMES from "@/css/keyframes-config/variations/minimal.ts";
import COMMON_KEYFRAMES from "@/css/keyframes-config/variations/common.ts";
import FULL_KEYFRAMES from "@/css/keyframes-config/variations/full.ts";
import MINIMAL_ATTRIBUTES from "@/css/attribute-config/variations/minimal.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import FULL_ATTRIBUTES from "@/css/attribute-config/variations/full.ts";
import MINIMAL_SYNTAX from "@/css/syntax-config/variations/minimal.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import FULL_SYNTAX from "@/css/syntax-config/variations/full.ts";
import { assertType, type Equal } from "../type-utils.ts";

type ValidateKeyframes<
  Cfg extends {
    [name: string]: Record<string, Record<string, any>>;
  },
> = ValidateKeyframesConfig<
  SupportedKeywords,
  typeof COMMON_SYNTAX,
  typeof COMMON_ATTRIBUTES,
  Cfg
>;

describe("cssKeyframesConfig", () => {
  describe("Type Validation", () => {
    test("accepts a legal keyframe name", () => {
      assertType<Equal<ValidateKeyframeName<"fade">, "fade">>();
    });

    test("accepts a name with a leading hyphen", () => {
      assertType<Equal<ValidateKeyframeName<"-bounce">, "-bounce">>();
    });

    test("rejects a name starting with a digit", () => {
      assertType<
        Equal<
          ValidateKeyframeName<"123fade">,
          "Invalid keyframe name '123fade': must not start with a digit"
        >
      >();
    });

    test("rejects a name containing a space", () => {
      assertType<
        Equal<
          ValidateKeyframeName<"fade out">,
          "Invalid keyframe name 'fade out': contains an illegal character or space"
        >
      >();
    });

    test("rejects a name with a -- prefix", () => {
      assertType<
        Equal<
          ValidateKeyframeName<"--fade">,
          "Invalid keyframe name '--fade': must not start with '--'"
        >
      >();
    });

    test("accepts from, to, and percentage selectors", () => {
      assertType<Equal<ValidateFrameSelector<"from">, "from">>();
      assertType<Equal<ValidateFrameSelector<"to">, "to">>();
      assertType<Equal<ValidateFrameSelector<"50%">, "50%">>();
    });

    test("rejects a non-percentage selector", () => {
      assertType<
        Equal<
          ValidateFrameSelector<"halfway">,
          "Invalid keyframe selector 'halfway': must be 'from', 'to', or a percentage like '50%'"
        >
      >();
    });

    test("valid config validates to itself", () => {
      const config = {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      } as const;
      assertType<Equal<ValidateKeyframes<typeof config>, typeof config>>();
    });

    test("invalid frame property value becomes an error string", () => {
      const config = {
        fade: { from: { opacity: "not-a-number" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>["fade"]["from"],
          { readonly opacity: "Invalid value for 'opacity': 'not-a-number'" }
        >
      >();
    });

    test("unknown frame property becomes an error string", () => {
      const config = {
        fade: { from: { frobnicate: "0" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>["fade"]["from"],
          { readonly frobnicate: "'frobnicate' is not a recognized CSS property" }
        >
      >();
    });

    test("invalid keyframe name becomes an error string", () => {
      const config = {
        "bad name": { from: { opacity: "0" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>,
          { readonly "bad name": "Invalid keyframe name 'bad name': contains an illegal character or space" }
        >
      >();
    });

    test("invalid selector becomes an error string", () => {
      const config = {
        fade: { halfway: { opacity: "0" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>["fade"],
          { readonly halfway: "Invalid keyframe selector 'halfway': must be 'from', 'to', or a percentage like '50%'" }
        >
      >();
    });

    test("duplicate selector (from + 0%) becomes an error string", () => {
      const config = {
        fade: { from: { opacity: "0" }, "0%": { opacity: "1" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>["fade"],
          "Duplicate keyframe selector in animation 'fade': 'from'/'0%' and 'to'/'100%' are the same keyframe"
        >
      >();
    });

    test("duplicate selector (to + 100%) becomes an error string", () => {
      const config = {
        fade: { to: { opacity: "1" }, "100%": { opacity: "1" } },
      } as const;
      assertType<
        Equal<
          ValidateKeyframes<typeof config>["fade"],
          "Duplicate keyframe selector in animation 'fade': 'from'/'0%' and 'to'/'100%' are the same keyframe"
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("infers the exact keyframe name union", () => {
      const keyframes = cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        pulse: { "0%": { opacity: "0.5" }, "100%": { opacity: "1" } },
      });
      assertType<Equal<keyof typeof keyframes, "fade" | "pulse">>();
      assertType<Equal<KeyframeName<typeof keyframes>, "fade" | "pulse">>();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a valid config", () => {
      const config = cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        pulse: { "0%": { opacity: "0.5" }, "100%": { opacity: "1" } },
      });
      assert.deepStrictEqual(Object.keys(config), ["fade", "pulse"]);
    });

    test("accepts percentage frames with decimals", () => {
      const config = cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, {
        wobble: { "0%": {}, "25.5%": { opacity: "0.5" }, "100%": {} },
      });
      assert.deepStrictEqual(Object.keys(config), ["wobble"]);
    });

    test("returns the config and preserves the reference", () => {
      const input = {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      } as const;
      const config = cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, input);
      assert.strictEqual(config, input);
      assert.deepStrictEqual(config, input);
    });

    test("throws for an illegal keyframe name", () => {
      assert.throws(
        () => {
          // @ts-expect-error illegal keyframe name is a type-level error
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { "bad name": { from: { opacity: "0" } } });
        },
        /Invalid keyframe name/,
      );
    });

    test("throws for a non-percentage selector", () => {
      assert.throws(
        () => {
          // @ts-expect-error non-percentage selector is a type-level error
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { fade: { halfway: { opacity: "0" } } });
        },
        /Invalid keyframe selector/,
      );
    });

    test("throws for an invalid frame property value", () => {
      assert.throws(
        () => {
          // @ts-expect-error invalid frame property value is a type-level error
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { fade: { from: { opacity: "not-a-number" } } });
        },
        /Invalid value/,
      );
    });

    test("throws for an unknown frame property", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown frame property is a type-level error
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { fade: { from: { frobnicate: "0" } } });
        },
        /not a recognized CSS property/,
      );
    });

    test("throws for a duplicate selector (from + 0%)", () => {
      assert.throws(
        () => {
          // @ts-expect-error from and 0% are the same keyframe
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { fade: { from: { opacity: "0" }, "0%": { opacity: "1" } } });
        },
        /Duplicate keyframe selector/,
      );
    });

    test("throws for a duplicate selector (to + 100%)", () => {
      assert.throws(
        () => {
          // @ts-expect-error to and 100% are the same keyframe
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { fade: { to: { opacity: "1" }, "100%": { opacity: "1" } } });
        },
        /Duplicate keyframe selector/,
      );
    });

    test("the attribute config's vocabulary drives which properties are valid", () => {
      assert.throws(
        () => {
          // @ts-expect-error minimal attributes has no rotate property
          return cssKeyframesConfig(MINIMAL_SYNTAX, MINIMAL_ATTRIBUTES, { spin: { from: { rotate: "0deg" } } });
        },
        /not a recognized CSS property/,
      );
    });

    test("frame property values validate against the syntax config's DSL", () => {
      const config = cssKeyframesConfig(FULL_SYNTAX, FULL_ATTRIBUTES, {
        grow: { from: { margin: "1cqw" }, to: { margin: "10cqw" } },
      });
      assert.deepStrictEqual(Object.keys(config), ["grow"]);

      assert.throws(
        () => {
          // @ts-expect-error common syntax has no cqw unit, so 1cqw is invalid
          return cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, { grow: { from: { margin: "1cqw" } } });
        },
        /Invalid value/,
      );
    });
  });

  describe("Variations", () => {
    test("Minimal variation builds and infers its names", () => {
      assert.deepStrictEqual(Object.keys(MINIMAL_KEYFRAMES), ["blink", "grow"]);
      assertType<Equal<keyof typeof MINIMAL_KEYFRAMES, "blink" | "grow">>();
    });

    test("Common variation builds and infers its names", () => {
      assert.deepStrictEqual(Object.keys(COMMON_KEYFRAMES), [
        "fade",
        "pulse",
        "slide",
      ]);
      assertType<
        Equal<keyof typeof COMMON_KEYFRAMES, "fade" | "pulse" | "slide">
      >();
    });

    test("Full variation builds and infers its names", () => {
      assert.deepStrictEqual(Object.keys(FULL_KEYFRAMES), ["bounce", "spin"]);
      assertType<Equal<keyof typeof FULL_KEYFRAMES, "bounce" | "spin">>();
    });
  });
});