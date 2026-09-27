import type {
  BaseCSSAttributeComplexValue,
  BaseCSSAttributesComplexConfig,
} from "@/css/attribute-config/types.ts";
import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type { BaseKeyframesConfig } from "@/css/keyframes-config/types.ts";
import type {
  AnimationShorthandValue,
  KeyframeNames,
} from "@/engine/animation.ts";
import type { CSSWideKeyword } from "@/css/wide-keyword.ts";
import type {
  CSSIdentifierCharacter,
  CSSIdentifierDigit,
  ContainsIllegalCharacter,
} from "@/css/ident.ts";
import type { DSLInfer, SupportedKeywordsConfig } from "tsyntax";
import type { IsCalcString, ValidateCalc } from "@/css/calc.ts";
import type {
  BaseHTMLAttributesConfig,
  BaseHTMLAttributeComplexValue,
} from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type {
  JoinUnion,
  KeysMatching,
  MakeUndefinedOptional,
  ResolveComplexValue,
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

type IsOptionalAttribute<T> = T extends string
  ? T extends `${string}undefined${string}`
    ? never
    : "attributes"
  : T extends BaseHTMLAttributeComplexValue
    ? "undefined" extends keyof T
      ? never
      : "attributes"
    : "attributes";

type MaybeAttributes<HTMLAttributesConfig extends Record<string, any>> = {
  [K in keyof HTMLAttributesConfig]: IsOptionalAttribute<
    HTMLAttributesConfig[K]
  >;
}[keyof HTMLAttributesConfig];

type ValidateComponentInnerHTMLItemStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  CSSQueriesConfig extends readonly string[],
  CSSKeyframesConfig extends BaseKeyframesConfig,
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
        HTMLGlobalAttributesConfig,
        HTMLTagConfig,
        CSSSyntaxConfig,
        CSSAttributesConfig,
        CSSPseudoClassConfig,
        CSSPropertiesConfig,
        CSSQueriesConfig,
        CSSKeyframesConfig,
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
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  CSSQueriesConfig extends readonly string[],
  CSSKeyframesConfig extends BaseKeyframesConfig,
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
                HTMLGlobalAttributesConfig,
                HTMLTagConfig,
                CSSSyntaxConfig,
                CSSAttributesConfig,
                CSSPseudoClassConfig,
                CSSPropertiesConfig,
                CSSQueriesConfig,
                CSSKeyframesConfig,
                AllowedTags,
                T[K],
                CurrentTag
              >
            : T[K] extends (string | BaseComponentStructure)[]
              ? ValidateComponentInnerHTMLItemStructure<
                  Keywords,
                  HTMLGlobalAttributesConfig,
                  HTMLTagConfig,
                  CSSSyntaxConfig,
                  CSSAttributesConfig,
                  CSSPseudoClassConfig,
                  CSSPropertiesConfig,
                  CSSQueriesConfig,
                  CSSKeyframesConfig,
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

// Whether `S` contains any character that is not a legal CSS identifier
// character. `S` is a single class name (already space-split). The character
// set itself lives in @/css/ident.ts.
type ContainsIllegalClassNameCharacter<S extends string> =
  ContainsIllegalCharacter<S, CSSIdentifierCharacter>;

// Returns `S` unchanged when `S` is a legal CSS class name, otherwise a
// diagnostic string literal. `SplitSpace` applies this to every name so that
// garbage class names fail the type wall where the component is created.
type ValidateClassName<S extends string> = S extends `${infer First}${string}`
  ? First extends CSSIdentifierDigit
    ? `Invalid CSS class name '${S}': must not start with a digit`
    : ContainsIllegalClassNameCharacter<S> extends true
      ? `Invalid CSS class name '${S}': contains an illegal character`
      : S
  : S;

type SplitSpace<S extends string> = string extends S
  ? never
  : S extends never
    ? never
    : Trim<S> extends ""
      ? never
      : Trim<S> extends `${infer Head} ${infer Tail}`
        ? ValidateClassName<Trim<Head>> | SplitSpace<Tail>
        : ValidateClassName<Trim<S>>;

// ---------------------------------------------------------------------------
// grid-area cross-reference.
//
// `grid-template-areas` is a plain CSS string on the parent; `grid-area` names
// one of its areas on a child. Neither DSL constrains the other (both are just
// `string`), so the membership check lives here, in the structural validator,
// which already threads the parent's css through `CSSParent` for `> child`
// blocks. The parent's literal is split into its area-name union exactly the
// way the runtime parses it: whitespace (spaces, newlines, tabs) separates
// cells, each cell is an optionally quoted token, and `.` marks an empty cell
// (no name).
// ---------------------------------------------------------------------------

type StripAreaQuotes<S extends string> = S extends `"${infer R}"`
  ? R
  : S extends `'${infer R}'`
    ? R
    : S extends `"${infer R}`
      ? R
      : S extends `'${infer R}`
        ? R
        : S extends `${infer R}"`
          ? R
          : S extends `${infer R}'`
            ? R
            : S;

type NormalizeAreaWhitespace<S extends string> =
  S extends `${infer H}\n${infer T}`
    ? NormalizeAreaWhitespace<`${H} ${T}`>
    : S extends `${infer H}\r${infer T}`
      ? NormalizeAreaWhitespace<`${H} ${T}`>
      : S extends `${infer H}\t${infer T}`
        ? NormalizeAreaWhitespace<`${H} ${T}`>
        : S;

type SplitAreaTokens<S extends string> =
  Trim<S> extends infer T extends string
    ? T extends ""
      ? never
      : T extends `${infer Head} ${infer Tail}`
        ? Trim<Head> | SplitAreaTokens<Tail>
        : T
    : never;

// The area-name union a parent's `grid-template-areas` literal defines. A
// widened `string` (no literal to read) yields `string`, constraining nothing.
type GridAreaNames<S extends string> = string extends S
  ? string
  : SplitAreaTokens<
        NormalizeAreaWhitespace<S>
      > extends infer Token extends string
    ? Token extends "."
      ? never
      : StripAreaQuotes<Token> extends infer Name extends string
        ? Name extends ""
          ? never
          : Name
        : never
    : never;

// Constrains the written `grid-area` to the parent's area names. Applies only
// when the parent's `grid-template-areas` is a literal this node's `CSSParent`
// actually carries (a `> child` block); an unknown or widened parent adds
// nothing, so the check never rejects what it cannot see.
type GridAreaConstraint<
  CSSValue extends Record<string, any>,
  CSSParent extends Record<string, any>,
> = "grid-area" extends keyof CSSValue
  ? "grid-template-areas" extends keyof CSSParent
    ? CSSParent["grid-template-areas"] extends infer Areas
      ? [Areas] extends [never]
        ? {}
        : [Areas] extends [string]
          ? string extends Areas
            ? {}
            : {
                "grid-area"?:
                  | GridAreaNames<Areas & string>
                  | CSSWideKeyword;
              }
          : {}
      : {}
    : {}
  : {};

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
  [P in keyof Bag]?:
    | DSLInfer<Keywords & CSSSyntaxConfig, Bag[P]>
    | CSSWideKeyword;
};

// Each value of a gate is wrapped in a nominal entry. Two overlapping pattern
// keys both match the written value, so the intersection of their entries has
// `__gateKey: "P1" & "P2"` -> `never`. That is the overlap signal: a lookup
// whose `__gateKey` is `never` matched more than one pattern key, and unlocks
// nothing (the caller can report it). A literal key, which always wins over any
// pattern, yields a single entry whose `__gateKey` is that key.
type GateEntry<V extends string, Props> = {
  __gateKey: V;
  __gateProps: Props;
};

type GateKeyOf<T> = T extends { __gateKey: infer V } ? V : never;

type GatePropsOf<T> = T extends { __gateProps: infer B } ? B : never;

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
      ? GateEntry<
          V,
          InferPropBag<Keywords, CSSSyntaxConfig, CSSAttributesConfig[K][V][Slot]>
        >
      : GateEntry<V, {}>;
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
    ? Row[Extract<Written, keyof Row>] extends infer Entry
      ? [GateKeyOf<Entry>] extends [never]
        ? {}
        : GatePropsOf<Entry> extends infer Bag
          ? { [P in keyof Bag]: Bag[P] }
          : {}
      : {}
    : {};

// True when a written gate value matches more than one pattern key. Literal
// keys win outright, so only the pattern (key-remapped) half can overlap.
type GateOverlaps<Row, Written> = [Written] extends [never]
  ? false
  : [Written] extends [keyof Row]
    ? [GateKeyOf<Row[Extract<Written, keyof Row>]>] extends [never]
      ? true
      : false
    : false;

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
  ]?:
    | ResolveComplexValue<
        Keywords,
        CSSSyntaxConfig,
        keyof CSSAttributesConfig[K] & string
      >
    | CSSWideKeyword;
};

// ---------------------------------------------------------------------------
// HTML attribute gates.
//
// Same mechanism as the CSS gates above, but an HTML attribute value maps
// straight to the attributes it unlocks - there is no `self` / `children`
// split. An HTML attribute unlocks siblings on the same element, and naming a
// slot `self` would imply a `children` counterpart that does not exist. HTML
// DSL strings are validated against `Keywords` alone, so the syntax-config slot
// is the empty object; the pattern-key resolution and the two-key overlap
// signal in `GateLookup` / `GateOverlaps` are shared with CSS.
// ---------------------------------------------------------------------------

type HTMLGateKeys<C extends BaseHTMLAttributesConfig> = KeysMatching<
  C,
  BaseHTMLAttributeComplexValue
>;

type HTMLFlatKeys<C extends BaseHTMLAttributesConfig> = KeysMatching<C, string>;

type AsRecord<T> = T extends Record<string, any> ? T : {};

type InferHTMLPropBag<
  Keywords extends SupportedKeywordsConfig,
  Bag extends Record<string, string>,
> = {
  [P in keyof Bag]?: DSLInfer<Keywords, Bag[P]>;
};

// Registry-only table. Value keys are remapped through `ResolveComplexValue`,
// so a `<token>` or backtick key becomes a pattern type a concrete literal
// matches; each entry is wrapped in a `GateEntry` so two matching patterns
// collapse `__gateKey` to `never`.
type HTMLGateTable<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
> = {
  [K in HTMLGateKeys<C>]: {
    [
      V in keyof C[K] & string as ResolveComplexValue<
        Keywords,
        {},
        V
      > &
        PropertyKey
    ]: C[K][V] extends Record<string, string>
      ? GateEntry<V, InferHTMLPropBag<Keywords, C[K][V]>>
      : GateEntry<V, {}>;
  };
};

// A literal `undefined` value key is how a complex attribute declares itself
// optional, exactly as `| undefined` does for a flat one. `MakeUndefinedOptional`
// then adds the `?`.
type HTMLFlatAttributeBag<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
> = {
  [K in HTMLFlatKeys<C> & string]: DSLInfer<Keywords, C[K] & string>;
};

type HTMLGateKeyBag<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
  Source,
> = {
  [K in HTMLGateKeys<C> & string]: K extends keyof Source
    ? true extends GateOverlaps<HTMLGateTable<Keywords, C>[K], Source[K]>
      ? | (`Value '${Source[K] &
          string}' matches more than one pattern key; overlapping keys are not allowed` &
          Locked)
        | ("undefined" extends keyof C[K] ? undefined : never)
      : ResolveComplexValue<Keywords, {}, keyof C[K] & string>
    : ResolveComplexValue<Keywords, {}, keyof C[K] & string>;
};

// The bag a gate unlocks when it is omitted (or written as `undefined`), taken
// from the gate's `undefined` value key. An omitted gate still contributes its
// declared default - e.g. a `button` without `type` is a submit button.
type HTMLUndefinedBag<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
  K extends keyof C,
> = C[K] extends BaseHTMLAttributeComplexValue
  ? "undefined" extends keyof C[K]
    ? C[K]["undefined"] extends Record<string, string>
      ? InferHTMLPropBag<Keywords, C[K]["undefined"]>
      : {}
    : {}
  : {};

// Every attribute unlocked by the gates on the node. Each owner keeps its own
// props: the contributions are INTERSECTED, so an unrelated owner cannot widen
// another owner's prop to `string`. A gate that is absent (or explicitly
// `undefined`) contributes its `undefined` arm instead.
type DependentHTMLProps<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
  Source,
  Table extends Record<string, any> = HTMLGateTable<Keywords, C>,
  GateKeys extends string = HTMLGateKeys<C> & string,
> = [GateKeys] extends [never]
  ? {}
  : UnionToIntersection<
      {
        [K in GateKeys]: K extends keyof AsRecord<Source>
          ? [AsRecord<Source>[K & keyof AsRecord<Source>]] extends [undefined]
            ? HTMLUndefinedBag<Keywords, C, K>
            : GateLookup<Table[K], AsRecord<Source>[K & keyof AsRecord<Source>]>
          : HTMLUndefinedBag<Keywords, C, K>;
      }[GateKeys]
    >;

// Every attribute any gate can unlock, on this registry.
type HTMLGateAllKeys<
  C extends BaseHTMLAttributesConfig,
  G extends keyof C,
> = {
  [V in keyof C[G]]: C[G][V] extends Record<string, string>
    ? keyof C[G][V]
    : never;
}[keyof C[G]];

type HTMLAllLockableKeys<C extends BaseHTMLAttributesConfig> = {
  [G in HTMLGateKeys<C>]: HTMLGateAllKeys<C, G>;
}[HTMLGateKeys<C>];

type HTMLValuesUnlocking<
  C extends BaseHTMLAttributesConfig,
  G extends keyof C,
  P,
> = {
  [V in keyof C[G] & string]: P extends (C[G][V] extends Record<string, string>
    ? keyof C[G][V]
    : never)
    ? V
    : never;
}[keyof C[G] & string];

type HTMLUnlockedBy<C extends BaseHTMLAttributesConfig, P> = {
  [G in HTMLGateKeys<C>]: [
    HTMLValuesUnlocking<C, G, P>,
  ] extends [never]
    ? never
    : `${G & string}: ${JoinUnion<HTMLValuesUnlocking<C, G, P>>}`;
}[HTMLGateKeys<C>];

type HTMLLockedMessage<C extends BaseHTMLAttributesConfig, P extends string> =
  `'${P}' requires ${JoinUnion<HTMLUnlockedBy<C, P>, ", or ">}`;

// Every attribute a gate can unlock that the author wrote but no written gate
// unlocked. This is the locked half; the unknown half is deliberately left to
// TypeScript's stock TS2353.
type HTMLLockedAttributeKeys<
  C extends BaseHTMLAttributesConfig,
  OwnWritten,
  Unlocked,
> = Exclude<
  Extract<keyof OwnWritten, HTMLAllLockableKeys<C>>,
  keyof Unlocked | HTMLFlatKeys<C> | HTMLGateKeys<C>
>;

type HTMLLockedDiagnostics<
  C extends BaseHTMLAttributesConfig,
  OwnWritten,
  Unlocked,
> = {
  [P in HTMLLockedAttributeKeys<
    C,
    OwnWritten,
    Unlocked
  > & string]?: HTMLLockedMessage<C, P> & Locked;
};

type HTMLAttributesBag<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
  OwnWritten,
> = MakeUndefinedOptional<HTMLFlatAttributeBag<Keywords, C>> &
  MakeUndefinedOptional<HTMLGateKeyBag<Keywords, C, AsRecord<OwnWritten>>> &
  DependentHTMLProps<Keywords, C, AsRecord<OwnWritten>> &
  HTMLLockedDiagnostics<
    C,
    AsRecord<OwnWritten>,
    DependentHTMLProps<Keywords, C, AsRecord<OwnWritten>>
  >;

// Tag attributes shadow same-named global attributes.
type MergeAttributesConfig<
  Global extends BaseHTMLAttributesConfig,
  Tag extends BaseHTMLAttributesConfig,
> = Omit<Global, keyof Tag> & Tag;

type MergedHTMLAttributesConfig<
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  Tag extends keyof HTMLTagConfig,
> = MergeAttributesConfig<
  HTMLGlobalAttributesConfig,
  HTMLTagConfig[Tag]["attributes"]
>;

type ValidateComponentHTMLAttributes<
  Keywords extends SupportedKeywordsConfig,
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  Tag extends keyof HTMLTagConfig,
  OwnWritten,
> = HTMLAttributesBag<
  Keywords,
  MergedHTMLAttributesConfig<HTMLGlobalAttributesConfig, HTMLTagConfig, Tag>,
  OwnWritten
>;

// ---------------------------------------------------------------------------
// ComponentIds.
//
// Every literal `id` written anywhere in a component, mapped to the value its
// resolved key declares. With a registry supplied, that is the bag the id key
// the value resolved to (literal first, then pattern keys; a value matching two
// keys contributes nothing). Without a registry it falls back to the attributes
// the element itself carries. A non-literal (widened `string`, or a component
// with no ids at all) contributes `never`; duplicate ids merge.
// ---------------------------------------------------------------------------

type NodeTagOf<T> = T extends { tag: infer G extends string } ? G : never;

type NodeAttributesOf<T> = T extends { attributes: infer A } ? AsRecord<A> : {};

type NodeInnerOf<T> = T extends { innerHTML: infer I } ? I : never;

type MergedConfigForTag<
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  Tag,
> = Tag extends keyof HTMLTagConfig
  ? MergeAttributesConfig<
      HTMLGlobalAttributesConfig,
      HTMLTagConfig[Tag]["attributes"]
    >
  : HTMLGlobalAttributesConfig;

type IdGateRow<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
> = C extends { id: infer IdDef }
  ? IdDef extends BaseHTMLAttributeComplexValue
    ? HTMLGateTable<Keywords, { id: IdDef }>["id"]
    : never
  : never;

type IdDeclaredBag<
  Keywords extends SupportedKeywordsConfig,
  C extends BaseHTMLAttributesConfig,
  Id extends string,
> = IdGateRow<Keywords, C> extends infer Row
  ? [Row] extends [never]
    ? never
    : Id extends keyof Row
      ? [GateKeyOf<Row[Id]>] extends [never]
        ? never
        : GatePropsOf<Row[Id]> extends infer Bag
          ? { [P in keyof Bag]: Bag[P] }
          : never
      : never
  : never;

type IdEntryForNode<
  Keywords extends SupportedKeywordsConfig,
  Global extends BaseHTMLAttributesConfig,
  TagConfig extends BaseHTMLTagConfig,
  T,
  WithRegistry extends boolean,
> = NodeAttributesOf<T> extends { id: infer Id }
  ? string extends Id
    ? never
    : Id extends string
      ? {
          [K in Id]: WithRegistry extends true
            ? IdDeclaredBag<
                Keywords,
                MergedConfigForTag<Global, TagConfig, NodeTagOf<T>>,
                K
              >
            : Omit<NodeAttributesOf<T>, "id">;
        }
      : never
  : never;

type ChildIdEntries<
  Keywords extends SupportedKeywordsConfig,
  Global extends BaseHTMLAttributesConfig,
  TagConfig extends BaseHTMLTagConfig,
  V,
  WithRegistry extends boolean,
> = V extends string
  ? never
  : V extends readonly unknown[]
    ? {
        [I in keyof V]: ChildIdEntries<
          Keywords,
          Global,
          TagConfig,
          V[I],
          WithRegistry
        >;
      }[number]
    : V extends BaseComponentStructure
      ? ComponentIdEntries<Keywords, Global, TagConfig, V, WithRegistry>
      : never;

type InnerIdEntries<
  Keywords extends SupportedKeywordsConfig,
  Global extends BaseHTMLAttributesConfig,
  TagConfig extends BaseHTMLTagConfig,
  Inner,
  WithRegistry extends boolean,
> = Inner extends Record<string, any>
  ? {
      [K in keyof Inner]: ChildIdEntries<
        Keywords,
        Global,
        TagConfig,
        Inner[K],
        WithRegistry
      >;
    }[keyof Inner]
  : never;

type ComponentIdEntries<
  Keywords extends SupportedKeywordsConfig,
  Global extends BaseHTMLAttributesConfig,
  TagConfig extends BaseHTMLTagConfig,
  T,
  WithRegistry extends boolean,
> = [T] extends [never]
  ? never
  : T extends BaseComponentStructure
    ?
        | IdEntryForNode<Keywords, Global, TagConfig, T, WithRegistry>
        | InnerIdEntries<
            Keywords,
            Global,
            TagConfig,
            NodeInnerOf<T>,
            WithRegistry
          >
    : never;

export type ComponentIds<
  T,
  Keywords extends SupportedKeywordsConfig = SupportedKeywordsConfig,
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig = never,
  HTMLTagConfig extends BaseHTMLTagConfig = never,
> = ComponentIdEntries<
  Keywords,
  HTMLGlobalAttributesConfig,
  HTMLTagConfig,
  T,
  [HTMLGlobalAttributesConfig] extends [never]
    ? [HTMLTagConfig] extends [never]
      ? false
      : true
    : true
>;

// The registered keyframes constrain the two longhands that name one. Names are
// global, so this depends only on the registry, never on the node's context.
//
// `animation-name` narrows to the literal names (`none` and the CSS-wide
// keywords stay legal). The shorthand cannot be expressed as a union of valid
// strings -- "contains a registered name" is not a type TypeScript can build --
// so it validates the author's own value, exactly as the *Config builders do:
// a valid value passes through, an invalid one becomes a diagnostic literal the
// author cannot produce. Both are gated on the property existing in the
// registry, so a registry without animation support gains nothing.
type AnimationKeyframeConstraints<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSKeyframesConfig extends BaseKeyframesConfig,
  CSSValue extends Record<string, any>,
> = [KeyframeNames<CSSKeyframesConfig>] extends [never]
  ? {}
  : ("animation-name" extends keyof CSSAttributesConfig
      ? {
          "animation-name"?:
            | KeyframeNames<CSSKeyframesConfig>
            | "none"
            | CSSWideKeyword;
        }
      : {}) &
      ("animation" extends keyof CSSAttributesConfig
        ? "animation" extends keyof CSSValue
          ? {
              animation?: AnimationShorthandValue<
                CSSValue["animation"],
                KeyframeNames<CSSKeyframesConfig>
              >;
            }
          : {}
        : {});

// ---------------------------------------------------------------------------
// calc() deep validation.
//
// The syntax config admits calc() shallowly (`<calc>` resolves to
// `calc(${string})`), which keeps the inferred property types a plain union but
// would accept malformed expressions. This member narrows a written calc()
// value to the real grammar via `ValidateCalc`.
//
// It maps over the *known* CSS value keys -- top-level string attributes, every
// key a gate can unlock on `self`/`children`, and registered custom properties
// -- and reads the written value back out of `CSSValue`. Mapping over the
// written keys instead would turn every excess-property key (a typo, an
// undeclared pseudo-class) into a declared one and silently disable the
// registry's key rejection; all of these key sets are already declared by the
// other members, so this adds no new key.
//
// A malformed value yields a branded `CalcError`, which no string is assignable
// to, so the deep check fails where the shallow one passed. Non-calc values
// contribute `unknown` and change no decision.
// ---------------------------------------------------------------------------
type CalcValueKeys<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
> =
  | KeysMatching<CSSAttributesConfig, string>
  | GateKeys<CSSAttributesConfig>
  | AllLockableKeys<CSSAttributesConfig>
  | (keyof CSSPropertiesConfig & string);

type CalcConstraint<
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  CSSValue extends Record<string, any>,
> = {
  [K in CalcValueKeys<
    CSSAttributesConfig,
    CSSPropertiesConfig
  >]?: K extends keyof CSSValue
    ? CSSValue[K] extends string
      ? IsCalcString<CSSValue[K]> extends true
        ? ValidateCalc<CSSValue[K] & string>
        : unknown
      : unknown
    : unknown;
};

type ValidateComponentCSSStructure<
  Keywords extends SupportedKeywordsConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  CSSQueriesConfig extends readonly string[],
  CSSKeyframesConfig extends BaseKeyframesConfig,
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
                  CSSQueriesConfig,
                  CSSKeyframesConfig,
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
                    CSSQueriesConfig,
                    CSSKeyframesConfig,
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
        [K in KeysMatching<CSSAttributesConfig, string>]?:
          | DSLInfer<CSSSyntaxConfig & Keywords, CSSAttributesConfig[K] & string>
          | CSSWideKeyword;
      } & AnimationKeyframeConstraints<
        CSSAttributesConfig,
        CSSKeyframesConfig,
        CSSValue
      > &
        CalcConstraint<
          CSSAttributesConfig,
          CSSPropertiesConfig,
          CSSValue
        > &
        CSSNonSelfConfig<Keywords, CSSSyntaxConfig, CSSAttributesConfig> &
        DependentChildrenProps<
          Keywords,
          CSSSyntaxConfig,
          CSSAttributesConfig,
          CSSParent
        > &
        GridAreaConstraint<CSSValue, CSSParent> &
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
              ?
                  | DSLInfer<
                      Keywords & CSSSyntaxConfig,
                      CSSPropertiesConfig[K]["syntax"]
                    >
                  | CSSWideKeyword
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
            CSSQueriesConfig,
            CSSKeyframesConfig,
            T,
            CSSValue[K],
            IsInPseudoElement,
            CSSParent
          >;
        } & {
          [
            K in CSSQueriesConfig[number]
          ]?: CSSValue[K] extends Record<string, any>
            ? ValidateComponentCSSStructure<
                Keywords,
                HTMLTagConfig,
                CSSSyntaxConfig,
                CSSAttributesConfig,
                CSSPseudoClassConfig,
                CSSPropertiesConfig,
                CSSQueriesConfig,
                CSSKeyframesConfig,
                T,
                CSSValue[K],
                IsInPseudoElement,
                CSSParent
              >
            : `Query block '${K}' must be a CSS block object`;
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
                CSSQueriesConfig,
                CSSKeyframesConfig,
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
                      CSSQueriesConfig,
                      CSSKeyframesConfig,
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
  HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  HTMLTagConfig extends BaseHTMLTagConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  CSSQueriesConfig extends readonly string[],
  CSSKeyframesConfig extends BaseKeyframesConfig,
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
                  CSSQueriesConfig,
                  CSSKeyframesConfig,
                  T,
                  T["css"],
                  false
                >
              : T["css"]
            : K extends "attributes"
              ? ValidateComponentHTMLAttributes<
                  Keywords,
                  HTMLGlobalAttributesConfig,
                  HTMLTagConfig,
                  T["tag"] & keyof HTMLTagConfig,
                  T["attributes"]
                >
              : K extends "innerHTML"
                ? HTMLTagConfig[T["tag"]]["innerHTML"] extends []
                  ? `No innerHTML for void elements` & { _err: true }
                  : T[K] extends BaseComponentInnerHTMLStructure
                    ? ValidateComponentInnerHTMLStructure<
                        Keywords,
                        HTMLGlobalAttributesConfig,
                        HTMLTagConfig,
                        CSSSyntaxConfig,
                        CSSAttributesConfig,
                        CSSPseudoClassConfig,
                        CSSPropertiesConfig,
                        CSSQueriesConfig,
                        CSSKeyframesConfig,
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
