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

// ---------------------------------------------------------------------------
// Gate tables.
//
// A "gate" is a complex attribute (`display`, `position`, ...): the value the
// user writes unlocks further props on the node itself (`self`) and on its
// direct children (`children`).
//
// These two tables are parameterised ONLY by the registry, never by the node
// being checked, so TypeScript instantiates them once for the whole program
// and every node afterwards is a cache hit + one indexed access.
// ---------------------------------------------------------------------------

type GateKeys<CSSAttributesConfig extends BaseCSSAttributesComplexConfig> =
  KeysMatching<CSSAttributesConfig, BaseCSSAttributeComplexValue>;

type InferPropBag<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  Bag extends Record<string, string>,
> = {
  [P in keyof Bag]?: DSLInfer<Keywords & CSSSyntaxConfig, Bag[P]>;
};

// `{ display: { flex: {...}, block: {...} }, perspective: { `${number}px`: {...} } }`
// Value keys written as DSL tokens (`"<length>"`) are resolved through the key
// remap, so a token becomes a *pattern* key that a concrete literal matches.
type GateTable<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  Slot extends "self" | "children",
> = {
  [K in GateKeys<CSSAttributesConfig>]: {
    [V in keyof CSSAttributesConfig[K] &
      string as ResolveComplexValue<Keywords, CSSSyntaxConfig, V> &
      PropertyKey]: CSSAttributesConfig[K][V] extends BaseCSSAttributeComplexValue[string]
      ? InferPropBag<Keywords, CSSSyntaxConfig, CSSAttributesConfig[K][V][Slot]>
      : {};
  };
};

// One row lookup: `Written` is what the user actually wrote for that gate.
// The `[...]` wrapper keeps the check NON-distributive on purpose: a gate whose
// value is still the open union (the parent-side default, where nothing has
// been written yet) must unlock nothing, exactly as before.
type GateLookup<Row, Written> = [Written] extends [keyof Row]
  ? Row[Extract<Written, keyof Row>] extends infer Bag
    ? { [P in keyof Bag]: Bag[P] }
    : {}
  : {};

// Every prop unlocked by the gates actually written in `Source`. Each owner
// keeps its own props: the contributions are INTERSECTED, so an unrelated
// owner can no longer widen another owner's prop to `string`.
type DependentProps<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  Slot extends "self" | "children",
  Source extends Record<string, any>,
  Table extends Record<string, any> = GateTable<
    Keywords,
    CSSSyntaxConfig,
    CSSAttributesConfig,
    Slot
  >,
  Owners extends string = GateKeys<CSSAttributesConfig> & keyof Source & string,
> = [Owners] extends [never]
  ? {}
  : UnionToIntersection<
      {
        [K in Owners]: GateLookup<Table[K], Source[K]>;
      }[Owners]
    >;

type DependentSelfProps<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSValue extends Record<string, any>,
> = DependentProps<
  Keywords,
  CSSSyntaxConfig,
  CSSAttributesConfig,
  "self",
  CSSValue
>;

type DependentChildrenProps<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSParent extends Record<string, any>,
> = DependentProps<
  Keywords,
  CSSSyntaxConfig,
  CSSAttributesConfig,
  "children",
  CSSParent
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
