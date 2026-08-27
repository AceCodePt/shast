import type {
  DSLInfer,
  SupportedKeywordsConfig,
} from "tsyntax";
import type {
  BaseCSSAttributeComplexValue,
  BaseCSSAttributesComplexConfig,
} from "@/css/attribute-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type {
  CSSIdentifierCharacter,
  CSSIdentifierDigit,
  ContainsIllegalCharacter,
} from "@/css/ident.ts";
import type { KeysMatching, ResolveComplexValue } from "@/types.ts";

export interface BaseKeyframesConfig {
  [name: string]: Record<string, Record<string, any>>;
}

// The union of registered keyframe names; the integration slice constrains the
// `animation` property against it.
export type KeyframeName<C extends BaseKeyframesConfig> = Extract<
  keyof C,
  string
>;

// ---------------------------------------------------------------------------
// Keyframe name validation: a legal CSS identifier (no spaces, no digit start,
// no `--` prefix, no illegal characters). Mirrors the engine's class-name wall
// but is stricter, so a name that passes the type wall is always renderable.
// ---------------------------------------------------------------------------

export type ValidateKeyframeName<S extends string> = S extends ""
  ? `Invalid keyframe name '${S}': must not be empty`
  : S extends `--${string}`
    ? `Invalid keyframe name '${S}': must not start with '--'`
    : S extends `${infer First}${string}`
      ? First extends CSSIdentifierDigit
        ? `Invalid keyframe name '${S}': must not start with a digit`
        : ContainsIllegalCharacter<S, CSSIdentifierCharacter> extends true
          ? `Invalid keyframe name '${S}': contains an illegal character or space`
          : S
      : S;

// ---------------------------------------------------------------------------
// Keyframe selector validation: `from`, `to`, or a percentage (0%, 50%, 100%).
// ---------------------------------------------------------------------------

export type ValidateFrameSelector<S extends string> = S extends
  | "from"
  | "to"
  | `${number}%`
  ? S
  : `Invalid keyframe selector '${S}': must be 'from', 'to', or a percentage like '50%'`;

// `from` and `0%` (and `to` and `100%`) are the same keyframe in CSS, so both
// walls normalize before the duplicate check. The alias map is data shared
// with the runtime normalizeSelector. Object keys are unique strings, so the
// only collisions that can occur are the two alias pairs.
export const KEYFRAME_SELECTOR_ALIASES = {
  from: "0%",
  to: "100%",
} as const;

export type NormalizeSelector<S extends string> =
  S extends keyof typeof KEYFRAME_SELECTOR_ALIASES
    ? (typeof KEYFRAME_SELECTOR_ALIASES)[S]
    : S;

type HasDuplicateSelector<Frames extends Record<string, any>> =
  true extends {
    [Alias in keyof typeof KEYFRAME_SELECTOR_ALIASES]: Alias extends keyof Frames
      ? NormalizeSelector<Alias> extends keyof Frames
        ? true
        : false
      : false;
  }[keyof typeof KEYFRAME_SELECTOR_ALIASES]
    ? true
    : false;

// ---------------------------------------------------------------------------
// Frame property validation: each property's value is checked against the DSL
// the css attributes config declares for that property, exactly like a css
// block — string attributes validate against their DSL, gate attributes
// (complex values) against one of their value keys.
// ---------------------------------------------------------------------------

type FramePropertyValueOk<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributesComplexConfig,
  K extends keyof A & string,
  V,
> = A[K] extends string
  ? V extends DSLInfer<Keywords & S, A[K]>
    ? true
    : false
  : A[K] extends BaseCSSAttributeComplexValue
    ? V extends ResolveComplexValue<Keywords, S, keyof A[K] & string>
      ? true
      : false
    : false;

type FrameProperties<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributesComplexConfig,
  P extends Record<string, any>,
> = {
  [K in keyof P]: K extends string
    ? K extends KeysMatching<A, string>
      ? FramePropertyValueOk<Keywords, S, A, K, P[K]> extends true
        ? P[K]
        : `Invalid value for '${K}': '${P[K] & string}'`
      : K extends KeysMatching<A, BaseCSSAttributeComplexValue>
        ? FramePropertyValueOk<Keywords, S, A, K, P[K]> extends true
          ? P[K]
          : `Invalid value for '${K}': '${P[K] & string}'`
        : `'${K}' is not a recognized CSS property`
    : P[K];
};

type ValidateAnimation<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributesComplexConfig,
  Name extends string,
  Frames,
> = Frames extends Record<string, any>
  ? HasDuplicateSelector<Frames> extends true
    ? `Duplicate keyframe selector in animation '${Name}': 'from'/'0%' and 'to'/'100%' are the same keyframe`
    : {
        [Sel in keyof Frames]: Sel extends string
          ? ValidateFrameSelector<Sel> extends Sel
            ? Frames[Sel] extends Record<string, any>
              ? FrameProperties<Keywords, S, A, Frames[Sel]>
              : `Keyframe selector '${Sel}' in animation '${Name}' must be a properties object`
            : ValidateFrameSelector<Sel>
          : Frames[Sel];
      }
  : `Animation '${Name}' must be a frames object`;

export type ValidateKeyframesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  A extends BaseCSSAttributesComplexConfig,
  C extends BaseKeyframesConfig,
> = {
  [K in keyof C]: K extends string
    ? ValidateKeyframeName<K> extends K
      ? ValidateAnimation<Keywords, S, A, K, C[K]>
      : ValidateKeyframeName<K>
    : C[K];
};
