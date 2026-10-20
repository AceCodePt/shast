import type {
  DSLInfer,
  DSLValidateArm,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { CSSSyntaxKeywords } from "@/css/syntax-config/types.ts";

// The authoring surface: an attribute value is an array of single arms. Each
// arm is validated on its own by tsyntax's `DSLValidateArm`, so validation does
// not re-split a value into a union first. `cssAttributeConfig` joins the arms
// with `' | '` before returning, so the runtime surface every consumer reads is
// one joined DSL string per attribute.
export type CSSAttributeArms = readonly string[];

export interface BaseCSSAttributeSimpleConfig {
  [attribute: string]: CSSAttributeArms;
}
export interface BaseCSSAttributeComplexValue {
  [value: string]: {
    self: BaseCSSAttributeSimpleConfig;
    children: BaseCSSAttributeSimpleConfig;
  };
}
export interface BaseCSSAttributesComplexConfig {
  [attribute: string]: BaseCSSAttributeComplexValue | CSSAttributeArms;
}

// Validate every arm of an attribute value independently. An empty arm list is
// a diagnostic string, never a valid value, so `[]` is rejected at the type
// wall (and thrown at runtime by `cssAttributeConfig`).
export type ValidateCSSAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends CSSAttributeArms,
> = Arms extends readonly []
  ? `A CSS attribute must declare at least one arm`
  : {
      readonly [I in keyof Arms]: DSLValidateArm<Keywords, Arms[I] & string>;
    };

// Infer the value a user may write from an attribute's arms: the union of what
// each arm infers to. Mapping arm-by-arm keeps an arm's internal template pipe
// inside one `DSLInfer` instead of letting it split the whole value.
export type InferCSSAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends CSSAttributeArms,
> = Arms[number] extends infer Arm
  ? Arm extends string
    ? DSLInfer<Keywords, Arm>
    : never
  : never;

export type ValidateCSSAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  A extends BaseCSSAttributeSimpleConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: ValidateCSSAttributeValue<S & Keywords, A[K]>;
    }
  : A;

// Named alias rather than an inline conditional: an alias instantiation is
// cached by its arguments, so attributes that share a value or a gate shape
// share one evaluation. The same conditional written inline in a mapped type is
// cached per key (`K`) and shares nothing.
type ValidateCSSAttributeEntry<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  V,
> = V extends BaseCSSAttributeComplexValue
  ? {
      [G in keyof V]: {
        self: ValidateCSSAttributesSimpleConfig<Keywords, S, V[G]["self"]>;
        children: ValidateCSSAttributesSimpleConfig<
          Keywords,
          S,
          V[G]["children"]
        >;
      };
    }
  : ValidateCSSAttributeValue<S & Keywords, Extract<V, CSSAttributeArms>>;

export type ValidateCSSAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  A extends BaseCSSAttributesComplexConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: ValidateCSSAttributeEntry<Keywords, S, A[K]>;
    }
  : A;

export type InferCSSAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  A extends BaseCSSAttributeSimpleConfig,
> = [keyof A] extends [never]
  ? A
  : {
      [K in keyof A]: InferCSSAttributeValue<
        S & Keywords,
        Extract<A[K], CSSAttributeArms>
      >;
    };

export type InferCSSAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends CSSSyntaxKeywords,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
> = {
  [K in keyof CSSAttributesConfig]: K extends keyof CSSAttributesConfig & string
    ? CSSAttributesConfig[K] extends BaseCSSAttributeComplexValue
      ? {
          [V in keyof CSSAttributesConfig[K]]: {
            [K1 in K | keyof CSSAttributesConfig[K][V]["self"]]?: K1 extends K
              ? V
              : InferCSSAttributeValue<
                  Keywords & S,
                  Extract<CSSAttributesConfig[K][V]["self"][K1], CSSAttributeArms>
                >;
          };
        }[keyof CSSAttributesConfig[K]]
      : {
          [A in K]: InferCSSAttributeValue<
            Keywords & S,
            Extract<CSSAttributesConfig[K], CSSAttributeArms>
          >;
        }
    : never;
}[keyof CSSAttributesConfig];
