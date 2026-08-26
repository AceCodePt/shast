import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

export interface BaseCSSAttributeSimpleConfig {
  [attribute: string]: string;
}
export interface BaseCSSAttributeComplexValue {
  [value: string]: {
    self: BaseCSSAttributeSimpleConfig;
    children: BaseCSSAttributeSimpleConfig;
  };
}
export interface BaseCSSAttributesComplexConfig {
  [attribute: string]: BaseCSSAttributeComplexValue | string;
}

export type ValidateCSSAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributeSimpleConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: DSLValidate<S & Keywords, A[K]>;
    }
  : A;

export type ValidateCSSAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributesComplexConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: A[K] extends string
        ? DSLValidate<S & Keywords, A[K]>
        : A[K] extends BaseCSSAttributeComplexValue
          ? {
              [V in keyof A[K]]: {
                self: ValidateCSSAttributesSimpleConfig<
                  Keywords,
                  S,
                  A[K][V]["self"]
                >;
                children: ValidateCSSAttributesSimpleConfig<
                  Keywords,
                  S,
                  A[K][V]["children"]
                >;
              };
            }
          : never;
    }
  : A;

export type InferCSSAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributeSimpleConfig,
> = [keyof A] extends [never]
  ? A
  : {
      [K in keyof A]: DSLInfer<S & Keywords, A[K]>;
    };

export type InferCSSAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
> = {
  [K in keyof CSSAttributesConfig]: K extends keyof CSSAttributesConfig & string
    ? CSSAttributesConfig[K] extends string
      ? { [A in K]: DSLInfer<Keywords & S, CSSAttributesConfig[K]> }
      : CSSAttributesConfig[K] extends BaseCSSAttributeComplexValue
        ? {
            [V in keyof CSSAttributesConfig[K]]: {
              [K1 in K | keyof CSSAttributesConfig[K][V]["self"]]?: K1 extends K
                ? V
                : DSLInfer<Keywords & S, CSSAttributesConfig[K][V]["self"][K1]>;
            };
          }[keyof CSSAttributesConfig[K]]
        : never
    : never;
}[keyof CSSAttributesConfig];
