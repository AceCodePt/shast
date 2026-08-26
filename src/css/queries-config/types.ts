import type { SupportedKeywords } from "@/dsl/index.ts";
import type { InferCSSSyntax } from "@/css/syntax-config/types.ts";
import type FULL_SYNTAX_CONFIG from "@/css/syntax-config/variations/full.ts";

type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer L} `
    ? Trim<L>
    : S;

type Num = `${number}`;

// Length / Resolution / Number value vocabularies are the DSL's existing
// tokens — the query DSL reuses them rather than re-declaring units.
export type Length = InferCSSSyntax<
  SupportedKeywords,
  typeof FULL_SYNTAX_CONFIG,
  "<length>"
>;

type Resolution = InferCSSSyntax<
  SupportedKeywords,
  typeof FULL_SYNTAX_CONFIG,
  "<resolution>"
>;

type OpCompare<F extends string, V extends string> =
  | `(${F} < ${V})`
  | `(${F} <= ${V})`
  | `(${F} > ${V})`
  | `(${F} >= ${V})`;

type RangeCompare<F extends string> =
  | `(${Length} < ${F} < ${Length})`
  | `(${Length} <= ${F} <= ${Length})`
  | `(${Length} < ${F} <= ${Length})`
  | `(${Length} <= ${F} < ${Length})`;

type MediaLengthFeature =
  | "width"
  | "min-width"
  | "max-width"
  | "height"
  | "min-height"
  | "max-height";

type MediaResolutionFeature =
  | "resolution"
  | "min-resolution"
  | "max-resolution";

type MediaRatioFeature =
  | "device-pixel-ratio"
  | "min-device-pixel-ratio"
  | "max-device-pixel-ratio";

type MediaFeature =
  | OpCompare<MediaLengthFeature, Length>
  | `(${MediaLengthFeature}: ${Length})`
  | RangeCompare<"width" | "height">
  | OpCompare<MediaResolutionFeature, Resolution>
  | `(${MediaResolutionFeature}: ${Resolution})`
  | OpCompare<MediaRatioFeature, Num>
  | `(${MediaRatioFeature}: ${Num})`
  | `(orientation: ${"portrait" | "landscape"})`
  | `(prefers-color-scheme: ${"light" | "dark"})`
  | `(prefers-reduced-motion: ${"reduce" | "no-preference"})`;

type MediaFeatureList<S extends string> = S extends `${infer A} and ${infer B}`
  ? Trim<A> extends MediaFeature
    ? Trim<B> extends MediaFeatureList<Trim<B>>
      ? S
      : MediaFeatureList<Trim<B>>
    : `Invalid media feature: ${Trim<A>}`
  : S extends MediaFeature
    ? S
    : `Invalid media feature: ${Trim<S>}`;

type MediaType = "all" | "screen" | "print";

type MediaQuery<S extends string> = S extends `not ${infer R}`
  ? Trim<R> extends MediaType
    ? S
    : Trim<R> extends `${MediaType} and ${infer F}`
      ? F extends MediaFeatureList<F>
        ? S
        : F
      : Trim<R> extends MediaFeatureList<Trim<R>>
        ? S
        : `Invalid condition after 'not': ${Trim<R>}`
  : S extends `only ${infer R}`
    ? Trim<R> extends `${MediaType} and ${infer F}`
      ? F extends MediaFeatureList<F>
        ? S
        : F
      : `Expected media type and conditions after 'only': ${Trim<R>}`
    : S extends MediaType
      ? S
      : S extends `${MediaType} and ${infer F}`
        ? F extends MediaFeatureList<F>
          ? S
          : F
        : MediaFeatureList<S>;

type MediaQueryList<S extends string> = S extends `${infer A},${infer B}`
  ? Trim<A> extends MediaQuery<Trim<A>>
    ? Trim<B> extends MediaQueryList<Trim<B>>
      ? S
      : MediaQueryList<Trim<B>>
    : `Invalid media query: ${Trim<A>}`
  : MediaQuery<S> extends S
    ? S
    : MediaQuery<S>;

type ContainerLengthFeature =
  | "width"
  | "min-width"
  | "max-width"
  | "height"
  | "min-height"
  | "max-height";

type ContainerFeature =
  | OpCompare<ContainerLengthFeature, Length>
  | `(${ContainerLengthFeature}: ${Length})`
  | RangeCompare<"width" | "height">
  | `style(--${string}: ${string})`;

type ContainerFeatureList<S extends string> = S extends `${infer A} and ${infer B}`
  ? Trim<A> extends ContainerFeature
    ? Trim<B> extends ContainerFeatureList<Trim<B>>
      ? S
      : ContainerFeatureList<Trim<B>>
    : `Invalid container feature: ${Trim<A>}`
  : S extends ContainerFeature
    ? S
    : `Invalid container feature: ${Trim<S>}`;

type ValidateContainerQuery<S extends string> = S extends `style(${string}`
  ? ContainerFeatureList<S>
  : S extends `(${string}`
    ? ContainerFeatureList<S>
    : S extends `${string} ${infer F}`
      ? F extends ContainerFeatureList<F>
        ? S
        : F
      : S;

export type ValidateQuery<S extends string> = S extends `@media ${infer Q}`
  ? Trim<Q> extends MediaQueryList<Trim<Q>>
    ? S
    : MediaQueryList<Trim<Q>>
  : S extends `@container ${infer Q}`
    ? Trim<Q> extends ValidateContainerQuery<Trim<Q>>
      ? S
      : ValidateContainerQuery<Trim<Q>>
    : `Query must start with @media or @container`;

export type ValidateQueries<T extends readonly string[]> = {
  [K in keyof T]: T[K] extends string ? ValidateQuery<T[K]> : T[K];
};