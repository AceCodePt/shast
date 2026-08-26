import type {
  BaseCSSAttributeComplexValue,
  BaseCSSAttributesComplexConfig,
} from "@/css/attribute-config/types.ts";
import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type { DSLInfer, SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  InferHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type {
  JoinUnion,
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
    [
      V in keyof CSSAttributesConfig[K] & string as ResolveComplexValue<
        Keywords,
        CSSSyntaxConfig,
        V
      > &
        PropertyKey
    ]: CSSAttributesConfig[K][V] extends BaseCSSAttributeComplexValue[string]
      ? InferPropBag<Keywords, CSSSyntaxConfig, CSSAttributesConfig[K][V][Slot]>
      : {};
  };
};

// One row lookup: `Written` is what the user actually wrote for that gate.
// The `[...]` wrapper keeps the check NON-distributive on purpose: a gate whose
// value is still the open union (the parent-side default, where nothing has
// been written yet) must unlock nothing, exactly as before.
//
// The `[Written] extends [never]` guard comes FIRST and is load-bearing.
// `never` extends everything, so without it a `never` gate value takes the
// lookup branch and produces `Row[never]` -> `never` -> a mapped type over
// `keyof never` (i.e. `PropertyKey`), which collapses the entire surrounding
// intersection to `never` and makes every property in that scope unwritable.
//
// A gate value legitimately becomes `never` when a `> child` selector targets
// an array of children whose element types do not unify: the validator feeds
// the recursion `UnionToIntersection<...>` of the element types, and TypeScript
// reduces an intersection to `never` as soon as a unit-type discriminant
// disagrees -- `{ innerHTML: "a" } & { innerHTML: "b" }` is `never`. The node
// type is then `never`, `T["tag"]` is `never`, and the defaulted `display` is
// `never`. Nothing is known about that node, so nothing should be unlocked.
type GateLookup<Row, Written> = [Written] extends [never]
  ? {}
  : [Written] extends [keyof Row]
    ? Row[Extract<Written, keyof Row>] extends infer Bag
      ? { [P in keyof Bag]: Bag[P] }
      : {}
    : {};

// ---------------------------------------------------------------------------
// Locked props.
//
// A gate variant is a discriminated-union member in spirit: picking
// `display: "flex"` should both grant `gap` AND state, in the type, that
// `gap` is unavailable under `display: "block"`.
//
// Materialising that as an actual union across all gates is not viable -- the
// gates are independent, so the union is their cross product and TypeScript
// distributes it eagerly (TS2590 at 7 gates; the registry has 16). See the
// note at the bottom of this block.
//
// Instead the "denied" half of each variant is kept as a registry-only
// constant: every gate-lockable prop maps to an opaque message type naming the
// values that would unlock it. Intersecting that in costs one mapped type over
// the props of the gates that were actually written, and turns
//
//   Object literal may only specify known properties, and 'gap' does not
//   exist in type '<3000 characters of registry>'
//
// into
//
//   Type '"1px"' is not assignable to type
//   "'gap' requires display: flex | ... | display: inline-grid".
// ---------------------------------------------------------------------------

// Nominal marker intersected into every diagnostic type below. Without it the
// message is an ordinary string literal, so
//   gap: "'gap' requires display: flex"
// would type-check. `Locked` carries a `unique symbol` key, so no string
// literal -- and no value the author can write -- satisfies it.
declare const LOCKED: unique symbol;
export interface Locked {
  readonly [LOCKED]: true;
}

// `CSSAttributesConfig[G][V]["self" | "children"]`, safely.
type SlotOf<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  G extends keyof CSSAttributesConfig,
  V extends keyof CSSAttributesConfig[G],
  Slot extends "self" | "children",
> = CSSAttributesConfig[G][V] extends BaseCSSAttributeComplexValue[string]
  ? CSSAttributesConfig[G][V][Slot]
  : {};

// Every prop any value of gate `G` can unlock.
type GateAllKeys<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  G extends keyof CSSAttributesConfig,
  Slot extends "self" | "children",
> = {
  [V in keyof CSSAttributesConfig[G]]: keyof SlotOf<
    CSSAttributesConfig,
    G,
    V,
    Slot
  >;
}[keyof CSSAttributesConfig[G]];

// --- union -> single string -------------------------------------------------
// A template literal distributes over a union, so `${G}: ${V}` across every
// value of every gate yields the cross product as a union of messages. To get
// ONE message the values have to be joined, and joining needs an ordered
// tuple. Both helpers below are applied only to registry-derived unions, so
// the O(n^2) `UnionToTuple` runs once per (gate, prop) pair for the whole
// program rather than per node.

// The values of gate `G` that unlock prop `P` in `Slot`.
type ValuesUnlocking<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  G extends keyof CSSAttributesConfig,
  P,
  Slot extends "self" | "children",
> = {
  [V in keyof CSSAttributesConfig[G] & string]: P extends keyof SlotOf<
    CSSAttributesConfig,
    G,
    V,
    Slot
  >
    ? V
    : never;
}[keyof CSSAttributesConfig[G] & string];

// Registry-only: for prop `P`, one clause per gate that can unlock it, with
// that gate's qualifying values joined into a single string.
type UnlockedBy<CSSAttributesConfig extends BaseCSSAttributesComplexConfig, P> =
  | {
      [G in GateKeys<CSSAttributesConfig>]: [
        ValuesUnlocking<CSSAttributesConfig, G, P, "self">,
      ] extends [never]
        ? never
        : `${G & string}: ${JoinUnion<ValuesUnlocking<CSSAttributesConfig, G, P, "self">>}`;
    }[GateKeys<CSSAttributesConfig>]
  | {
      [G in GateKeys<CSSAttributesConfig>]: [
        ValuesUnlocking<CSSAttributesConfig, G, P, "children">,
      ] extends [never]
        ? never
        : `${G & string}: ${JoinUnion<ValuesUnlocking<CSSAttributesConfig, G, P, "children">>} on the parent`;
    }[GateKeys<CSSAttributesConfig>];

// One clause per gate, joined again so the whole diagnostic is a single string
// literal rather than a union TypeScript has to print member by member.
type LockedMessage<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  P extends string,
> = `'${P}' requires ${JoinUnion<UnlockedBy<CSSAttributesConfig, P>, ", or ">}`;

// NOTE: there is deliberately no branded "unknown property" check here.
// An earlier revision added one (mapping every key the registry does not know
// onto a `'x' is not a property in this registry` message) so that typos would
// stop producing TypeScript's stock TS2353 dump. It was removed because it lost
// on every axis that was measured:
//
//   * cost: 6-11% extra type instantiations and 17-25% extra check time, the
//     single largest contributor to this validator being slower than the naive
//     one -- while changing no accept/reject decision anywhere in the suite.
//   * message quality: it produced a WORSE diagnostic than the built-in. TS2353
//     already says "'foo' does not exist in type ...", whereas the branded
//     version reported the assignability failure of a synthetic string.
//   * the giant registry dump it was meant to suppress is an artifact of
//     `noErrorTruncation: true` in tsconfig.json, not of TS2353. With the flag
//     at its default the stock message is ~430 chars.
//
// The locked-property check below is a different story and does earn its cost:
// TS2353 can only say a prop "does not exist", it cannot say *why*, and "'gap'
// requires display: flex | grid | inline-flex | inline-grid" is information
// TypeScript has no way to produce on its own.

// Every prop any gate can unlock, on this element or through its parent.
// Registry-only, so it is instantiated once for the whole program.
type AllLockableKeys<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
> = {
  [G in GateKeys<CSSAttributesConfig>]:
    | GateAllKeys<CSSAttributesConfig, G, "self">
    | GateAllKeys<CSSAttributesConfig, G, "children">;
}[GateKeys<CSSAttributesConfig>];

// The denied half of the gate variants is applied inline in
// `ValidateComponentCSSStructure` -- see the note there for why it is not a
// named alias. It maps the props the author actually wrote, minus everything
// the written gates unlocked, onto `LockedMessage`.

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

// The author's CSS, with `display` filled in from the tag's default when they
// did not write it themselves.
//
// This must be a single named alias rather than two copies of the same
// conditional. `DependentSelfProps` is instantiated with this exact type twice
// -- once as a member of the result intersection and once inside the locked-prop
// exclusion -- and TypeScript caches instantiations by type IDENTITY, not by
// syntactic shape. Two separate (but identical) conditional expressions produce
// two different type objects, so the whole gate resolution used to be computed
// from scratch the second time.
type WithDefaultDisplay<
  HTMLTagConfig extends BaseHTMLTagConfig,
  T extends BaseComponentStructure,
  CSSValue extends Record<string, any>,
> = "display" extends keyof CSSValue
  ? CSSValue
  : CSSValue &
      (T["tag"] extends keyof HTMLTagConfig
        ? { display: HTMLTagConfig[T["tag"]]["display"] }
        : {});

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
        // This member, `CSSNonSelfConfig` below, and the custom-property member
        // further down are all registry-only and have disjoint key sets, so they
        // can be folded into a single mapped type with a value-side conditional
        // (9 intersection members -> 7). That was tried and REVERTED: it cost
        // +1,272 instantiations on plain-200, +274 on pseudo-200 and +6,434 on
        // the error path, for a check time that was a wash in an interleaved
        // A/B (0.234s vs 0.238s plain, 0.446s vs 0.448s pseudo). Dispatching on
        // the value side per key over ~130 keys costs more than the two
        // intersection members it removes -- the same reason the
        // cheap-shape-test-first `as` remap was reverted earlier. Keep them
        // separate: each is a trivial mapped type cached once for the program.
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
          WithDefaultDisplay<HTMLTagConfig, T, CSSValue>
        > & {
          // NOTE: written inline rather than through the `LockedProps` alias on
          // purpose. A type alias applied to type arguments keeps its
          // aliasSymbol, so TypeScript prints it as `LockedProps<{...registry
          // ...}, ...>` inside any TS2353 "unknown property" dump -- which
          // doubles the size of the very message we are trying to shrink.
          // Inlined, it resolves to `{}` in the common case and prints as
          // nothing.
          [
            P in Exclude<
              Extract<keyof CSSValue, AllLockableKeys<CSSAttributesConfig>>,
              | keyof DependentSelfProps<
                  Keywords,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  WithDefaultDisplay<HTMLTagConfig, T, CSSValue>
                >
              | keyof DependentChildrenProps<
                  Keywords,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  CSSParent
                >
              | KeysMatching<CSSAttributesConfig, string>
            > &
              string
          ]?: LockedMessage<CSSAttributesConfig, P> & Locked;
        } & {
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
