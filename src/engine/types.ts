import type {
  BaseCSSAttributeComplexValue,
  BaseCSSAttributesComplexConfig,
} from "@/css/attribute-config/types.ts";
import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type { DSLInfer, SupportedKeywordsConfig } from "@/dsl/index.ts";
import type {
  BaseHTMLAttributesConfig,
  InferHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type {
  MakeUndefinedOptional,
  Trim,
  UnionToIntersection,
} from "@/types.ts";

export type BaseComponentInnerHTMLStructure =
  | string
  | Record<
      string,
      BaseComponentStructure | string | (BaseComponentStructure | string)[]
    >;

export type BaseComponentStructure = {
  tag?: string;
  attributes?: Record<string, any>;
  css?: Record<string, any>;
  innerHTML?: BaseComponentInnerHTMLStructure;
  // This is to make the stuff extra premissible so types won't
  // get screwed over
  [att: string]: unknown;
};

type IsTagAllowText<
  HTMLTagConfig extends BaseHTMLTagConfig,
  Tag extends keyof HTMLTagConfig,
> = "*" extends HTMLTagConfig[Tag]["innerHTML"]
  ? true
  : HTMLTagConfig[Tag]["innerHTML"] extends any[]
    ? "#text" extends HTMLTagConfig[Tag]["innerHTML"][number]
      ? true
      : false
    : false;

type GetAllowedTags<
  HTMLTagConfig extends BaseHTMLTagConfig,
  AllowedTags extends keyof HTMLTagConfig | "#text",
  Tag extends keyof HTMLTagConfig,
> = "*" extends HTMLTagConfig[Tag]["innerHTML"]
  ? AllowedTags
  : HTMLTagConfig[Tag]["innerHTML"] extends any[]
    ? "#text" extends HTMLTagConfig[Tag]["innerHTML"][number]
      ? AllowedTags & HTMLTagConfig[Tag]["innerHTML"][number]
      : HTMLTagConfig[Tag]["innerHTML"][number]
    : never;

type MaybeAttributes<HTMLAttributesConfig extends Record<string, any>> = {
  [K in keyof HTMLAttributesConfig]: K extends string
    ? HTMLAttributesConfig[K] extends `${string}undefined${string}`
      ? never
      : "attributes"
    : never;
}[keyof HTMLAttributesConfig];

type ValidateComponentInnerHTMLItemStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLInferedAttributesConfig extends Record<string, any>,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  AllowedTags extends keyof HTMLTagConfig | "#text",
  T extends BaseComponentStructure | string,
  CurrentTag extends keyof HTMLTagConfig,
> = T extends string
  ? true extends IsTagAllowText<HTMLTagConfig, CurrentTag>
    ? T
    : `This element cannot contain a string`
  : T extends BaseComponentStructure
    ? ValidateComponentStructure<
        Keywords,
        HTMLInferedAttributesConfig,
        HTMLTagConfig,
        CSSSyntaxConfig,
        CSSAttributesConfig,
        CSSPseudoClassConfig,
        CSSPropertiesConfig,
        HTMLTagConfig[CurrentTag]["innerHTML"] extends any[]
          ? // This is the check for when
            "#text" extends HTMLTagConfig[CurrentTag]["innerHTML"][number]
            ? AllowedTags & HTMLTagConfig[CurrentTag]["innerHTML"][number]
            : AllowedTags
          : AllowedTags,
        T,
        GetAllowedTags<HTMLTagConfig, AllowedTags, CurrentTag>
      >
    : never;

type ValidateComponentInnerHTMLStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLInferedAttributesConfig extends Record<string, any>,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  AllowedTags extends keyof HTMLTagConfig | "#text",
  T extends BaseComponentInnerHTMLStructure,
  CurrentTag extends keyof HTMLTagConfig,
> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends string | BaseComponentStructure
            ? ValidateComponentInnerHTMLItemStructure<
                Keywords,
                HTMLInferedAttributesConfig,
                HTMLTagConfig,
                CSSSyntaxConfig,
                CSSAttributesConfig,
                CSSPseudoClassConfig,
                CSSPropertiesConfig,
                AllowedTags,
                T[K],
                CurrentTag
              >
            : T[K] extends (string | BaseComponentStructure)[]
              ? ValidateComponentInnerHTMLItemStructure<
                  Keywords,
                  HTMLInferedAttributesConfig,
                  HTMLTagConfig,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  CSSPseudoClassConfig,
                  CSSPropertiesConfig,
                  AllowedTags,
                  T[K][number],
                  CurrentTag
                >[]
              : never
          : T[K];
      }
    : T extends string
      ? true extends IsTagAllowText<HTMLTagConfig, CurrentTag>
        ? T
        : `This element cannot contain a string`
      : never;

type SplitSpace<S extends string> = string extends S
  ? never
  : S extends never
    ? never
    : Trim<S> extends ""
      ? never
      : Trim<S> extends `${infer Head} ${infer Tail}`
        ? Trim<Head> | SplitSpace<Tail>
        : Trim<S>;

type FilterOut<
  Obj extends Record<string, any>,
  K extends keyof Obj,
  T,
> = Obj[K] extends T ? K : never;

// Union of keys whose value matches T
type KeysMatching<Obj extends Record<string, any>, T> = {
  [K in keyof Obj]: FilterOut<Obj, K, T>;
}[keyof Obj];

// A value key of a complex attribute is either a literal (`"flex"`) or a DSL
// pattern (`"<length>"`). Turn it into the type a user may actually write.
type ResolveComplexValue<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  V extends string,
> = V extends `<${string}>` ? DSLInfer<Keywords & CSSSyntaxConfig, V> : V;

// Every self prop unlocked by the complex attributes actually written on this
// node. Each owner keeps its own props: the contributions are INTERSECTED, so
// an unrelated owner can no longer widen another owner's prop to `string`.
type DependentSelfProps<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSValue extends Record<string, any>,
  Owners extends keyof CSSAttributesConfig & keyof CSSValue = KeysMatching<
    CSSAttributesConfig,
    BaseCSSAttributeComplexValue
  > &
    keyof CSSValue,
> = [Owners] extends [never]
  ? {}
  : UnionToIntersection<
      {
        [K1 in Owners]: {
          [
            V in keyof CSSAttributesConfig[K1] & string
          ]: CSSValue[K1] extends ResolveComplexValue<
            Keywords,
            CSSSyntaxConfig,
            V
          >
            ? CSSAttributesConfig[K1][V] extends BaseCSSAttributeComplexValue[string]
              ? {
                  [P in keyof CSSAttributesConfig[K1][V]["self"]]?: DSLInfer<
                    Keywords & CSSSyntaxConfig,
                    CSSAttributesConfig[K1][V]["self"][P]
                  >;
                }
              : {}
            : {};
        }[keyof CSSAttributesConfig[K1] & string];
      }[Owners]
    >;

type DependentChildrenProps<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSParent extends Record<string, any>,
> = [keyof CSSParent] extends [never]
  ? {}
  : UnionToIntersection<
      | {
          [
            K1 in KeysMatching<
              CSSAttributesConfig,
              BaseCSSAttributeComplexValue
            > &
              keyof CSSParent
          ]: {
            [
              V in keyof CSSAttributesConfig[K1] & string
            ]: CSSParent[K1] extends ResolveComplexValue<
              Keywords,
              CSSSyntaxConfig,
              V
            >
              ? CSSAttributesConfig[K1][V] extends BaseCSSAttributeComplexValue[string]
                ? {
                    [
                      P in keyof CSSAttributesConfig[K1][V]["children"]
                    ]?: DSLInfer<
                      Keywords & CSSSyntaxConfig,
                      CSSAttributesConfig[K1][V]["children"][P]
                    >;
                  }
                : {}
              : {};
          }[keyof CSSAttributesConfig[K1] & string];
        }[KeysMatching<CSSAttributesConfig, BaseCSSAttributeComplexValue> &
          keyof CSSParent]
      | {}
    >;

type CSSNonSelfConfig<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
> = {
  [
    K in KeysMatching<CSSAttributesConfig, BaseCSSAttributeComplexValue>
  ]?: ResolveComplexValue<
    Keywords,
    CSSSyntaxConfig,
    keyof CSSAttributesConfig[K] & string
  >;
};

type ValidateComponentCSSStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  T extends BaseComponentStructure,
  CSSValue extends Record<string, any> | undefined,
  IsInPseudoElement extends boolean,
  CSSParent extends Record<string, any> = CSSNonSelfConfig<
    Keywords,
    CSSSyntaxConfig,
    CSSAttributesConfig
  >,
> = [CSSValue] extends [never]
  ? {}
  : CSSValue extends Record<string, any>
    ? {
        [K in keyof T["innerHTML"] as `> ${K & string}`]?: K extends string
          ? T["innerHTML"][K] extends string[]
            ? never
            : T["innerHTML"][K] extends
                  (string | Record<string, any>)[] | Record<string, any>[]
              ? ValidateComponentCSSStructure<
                  Keywords,
                  HTMLTagConfig,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  CSSPseudoClassConfig,
                  CSSPropertiesConfig,
                  UnionToIntersection<
                    Extract<T["innerHTML"][K][number], BaseComponentStructure>
                  >,
                  CSSValue[`> ${K & string}`],
                  IsInPseudoElement,
                  CSSValue
                >
              : T["innerHTML"][K] extends Record<string, any>
                ? ValidateComponentCSSStructure<
                    Keywords,
                    HTMLTagConfig,
                    CSSSyntaxConfig,
                    CSSAttributesConfig,
                    CSSPseudoClassConfig,
                    CSSPropertiesConfig,
                    T["innerHTML"][K],
                    CSSValue[`> ${K & string}`],
                    IsInPseudoElement,
                    CSSValue
                  >
                : never
          : T["innerHTML"][K];
      } & {
        [K in KeysMatching<CSSAttributesConfig, string>]?: DSLInfer<
          CSSSyntaxConfig & Keywords,
          CSSAttributesConfig[K] & string
        >;
      } & CSSNonSelfConfig<Keywords, CSSSyntaxConfig, CSSAttributesConfig> &
        DependentChildrenProps<
          Keywords,
          CSSSyntaxConfig,
          CSSAttributesConfig,
          CSSParent
        > &
        DependentSelfProps<
          Keywords,
          CSSSyntaxConfig,
          CSSAttributesConfig,
          "display" extends keyof CSSValue
            ? CSSValue
            : CSSValue &
                (T["tag"] extends keyof HTMLTagConfig
                  ? { display: HTMLTagConfig[T["tag"]]["display"] }
                  : {})
        > & {
          [K in keyof CSSParent]?: {};
        } & {
          [K in keyof CSSPropertiesConfig]?: K extends `--${string}`
            ? CSSPropertiesConfig[K]["syntax"] extends string
              ? DSLInfer<
                  Keywords & CSSSyntaxConfig,
                  CSSPropertiesConfig[K]["syntax"]
                >
              : never
            : CSSPropertiesConfig[K];
        } & {
          [
            K in
              | CSSPseudoClassConfig[number]
              | (T["tag"] extends string
                  ? HTMLTagConfig[T["tag"]]["cssPseudoClass"] extends any[]
                    ? HTMLTagConfig[T["tag"]]["cssPseudoClass"][number]
                    : never
                  : never)
          ]?: ValidateComponentCSSStructure<
            Keywords,
            HTMLTagConfig,
            CSSSyntaxConfig,
            CSSAttributesConfig,
            CSSPseudoClassConfig,
            CSSPropertiesConfig,
            T,
            CSSValue[K],
            IsInPseudoElement,
            CSSParent
          >;
        } & (false extends IsInPseudoElement
          ? {
              [
                K in T["tag"] extends string
                  ? HTMLTagConfig[T["tag"]]["cssPseudoElement"] extends any[]
                    ? HTMLTagConfig[T["tag"]]["cssPseudoElement"][number]
                    : never
                  : never
              ]?: ValidateComponentCSSStructure<
                Keywords,
                HTMLTagConfig,
                CSSSyntaxConfig,
                CSSAttributesConfig,
                CSSPseudoClassConfig,
                CSSPropertiesConfig,
                T,
                CSSValue[K],
                true,
                CSSValue
              >;
            } & ("class" extends keyof T["attributes"]
              ? T["attributes"]["class"] extends string
                ? {
                    [
                      K in SplitSpace<T["attributes"]["class"]> as `&.${K}`
                    ]?: ValidateComponentCSSStructure<
                      Keywords,
                      HTMLTagConfig,
                      CSSSyntaxConfig,
                      CSSAttributesConfig,
                      CSSPseudoClassConfig,
                      CSSPropertiesConfig,
                      T,
                      CSSValue[`&.${K}`],
                      false,
                      CSSParent
                    >;
                  }
                : {}
              : {})
          : {})
    : {};

export type ValidateComponentStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLInferedAttributesConfig extends Record<string, any>,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  AllowedTags extends keyof HTMLTagConfig,
  T extends BaseComponentStructure,
  CurrentAllowedTags extends keyof HTMLTagConfig,
> = T["tag"] extends CurrentAllowedTags
  ? {
      [K in keyof T]: K extends string
        ? K extends "tag"
          ? T[K]
          : K extends "css"
            ? T["css"] extends Record<string, any>
              ? ValidateComponentCSSStructure<
                  Keywords,
                  HTMLTagConfig,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  CSSPseudoClassConfig,
                  CSSPropertiesConfig,
                  T,
                  T["css"],
                  false
                >
              : T["css"]
            : K extends "attributes"
              ? HTMLInferedAttributesConfig &
                  (HTMLTagConfig[T["tag"]]["attributes"] extends BaseHTMLAttributesConfig
                    ? MakeUndefinedOptional<
                        InferHTMLAttributesConfig<
                          Keywords,
                          HTMLTagConfig[T["tag"]]["attributes"]
                        >
                      >
                    : {})
              : K extends "innerHTML"
                ? HTMLTagConfig[T["tag"]]["innerHTML"] extends []
                  ? `No innerHTML for void elements` & { _err: true }
                  : T[K] extends BaseComponentInnerHTMLStructure
                    ? ValidateComponentInnerHTMLStructure<
                        Keywords,
                        HTMLInferedAttributesConfig,
                        HTMLTagConfig,
                        CSSSyntaxConfig,
                        CSSAttributesConfig,
                        CSSPseudoClassConfig,
                        CSSPropertiesConfig,
                        AllowedTags,
                        T[K],
                        T["tag"]
                      >
                    : never
                : never
        : never;
    } & { css?: {} } & (HTMLTagConfig[T["tag"]]["innerHTML"] extends []
        ? {}
        : {
            innerHTML?: {};
          }) &
      ("attributes" extends MaybeAttributes<
        HTMLTagConfig[T["tag"]]["attributes"]
      >
        ? {
            attributes: {};
          }
        : {
            attributes?: {};
          })
  : {
      tag: Exclude<CurrentAllowedTags, "#text">;
    };
