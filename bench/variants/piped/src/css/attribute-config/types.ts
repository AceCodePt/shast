import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { CSSSyntaxKeywords } from "@/css/syntax-config/types.ts";

// Piping variant: an attribute value is one DSL string whose arms are already
// joined with `' | '` by the author (e.g. `"'ltr' | 'rtl'"`). tsyntax's
// `DSLValidate` splits the value into a union, where the array form validated
// each arm on its own with `DSLValidateArm`.
export type CSSAttributeArms = string;

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

// Validate the piped value. An empty string is a diagnostic, never a valid
// value, so `""` is rejected at the type wall (and thrown at runtime by
// `cssAttributeConfig`).
export type ValidateCSSAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends CSSAttributeArms,
> = Arms extends ""
  ? `A CSS attribute must declare at least one arm`
  : DSLValidate<Keywords, Arms>;

// Infer the value a user may write from an attribute's DSL: the union of what
// each piped arm infers to, which `DSLInfer` produces in one pass.
export type InferCSSAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends CSSAttributeArms,
> = DSLInfer<Keywords, Arms>;

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
