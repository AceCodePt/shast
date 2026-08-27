import type { SupportedKeywords } from "tsyntax";
import { uniqueArray } from "@/types.ts";
import type { Trim } from "@/types.ts";
import type {
  BaseCSSSyntaxConfig,
  InferCSSSyntax,
} from "@/css/syntax-config/types.ts";

export const OPERATORS = uniqueArray(["<", "<=", ">", ">="]);

export const RANGE_OPS = uniqueArray(["<", "<="]);

export const MEDIA_TYPES = uniqueArray(["all", "screen", "print"]);

export const MEDIA_LENGTH_FEATURES = uniqueArray([
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
]);

export const MEDIA_RESOLUTION_FEATURES = uniqueArray([
  "resolution",
  "min-resolution",
  "max-resolution",
]);

export const MEDIA_RATIO_FEATURES = uniqueArray([
  "device-pixel-ratio",
  "min-device-pixel-ratio",
  "max-device-pixel-ratio",
]);

export const RANGE_FEATURES = uniqueArray(["width", "height"]);

export const ORIENTATION_VALUES = uniqueArray(["portrait", "landscape"]);

export const PREFERS_COLOR_SCHEME_VALUES = uniqueArray(["light", "dark"]);

export const PREFERS_REDUCED_MOTION_VALUES = uniqueArray([
  "reduce",
  "no-preference",
]);

export const CONTAINER_LENGTH_FEATURES = uniqueArray([
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
]);

export const QUERY_VOCABULARY = {
  operators: OPERATORS,
  rangeOperators: RANGE_OPS,
  mediaTypes: MEDIA_TYPES,
  mediaLengthFeatures: MEDIA_LENGTH_FEATURES,
  mediaResolutionFeatures: MEDIA_RESOLUTION_FEATURES,
  mediaRatioFeatures: MEDIA_RATIO_FEATURES,
  rangeFeatures: RANGE_FEATURES,
  orientationValues: ORIENTATION_VALUES,
  prefersColorSchemeValues: PREFERS_COLOR_SCHEME_VALUES,
  prefersReducedMotionValues: PREFERS_REDUCED_MOTION_VALUES,
  containerLengthFeatures: CONTAINER_LENGTH_FEATURES,
} as const;

// The vocabulary is DATA: the interface is derived from the const rather than
// hand-written, so the type cannot drift from the runtime arrays.
export type QueryVocabulary = typeof QUERY_VOCABULARY;

// Value validation reuses the syntax config's own <length> / <resolution> DSL
// tokens — there is no separate unit vocabulary. When a token is absent from
// the config, InferCSSSyntax yields never and the value can never match.
type IsDSLValue<
  Value extends string,
  Cfg extends BaseCSSSyntaxConfig,
  Token extends string,
> = Value extends InferCSSSyntax<SupportedKeywords, Cfg, Token> ? true : false;

type IsNumber<S extends string> = S extends `${number}` ? true : false;

type MediaFeatureValueOk<
  F extends string,
  Value extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = F extends V["mediaLengthFeatures"][number]
  ? IsDSLValue<Value, Cfg, "<length>">
  : F extends V["mediaResolutionFeatures"][number]
    ? IsDSLValue<Value, Cfg, "<resolution>">
    : F extends V["mediaRatioFeatures"][number]
      ? IsNumber<Value>
      : F extends "orientation"
        ? Value extends V["orientationValues"][number]
          ? true
          : false
        : F extends "prefers-color-scheme"
          ? Value extends V["prefersColorSchemeValues"][number]
            ? true
            : false
          : F extends "prefers-reduced-motion"
            ? Value extends V["prefersReducedMotionValues"][number]
              ? true
              : false
            : false;

type ContainerFeatureValueOk<
  F extends string,
  Value extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = F extends V["containerLengthFeatures"][number]
  ? IsDSLValue<Value, Cfg, "<length>">
  : false;

type RangeComparison<
  Inner extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = Inner extends `${infer L1} ${infer Op1} ${infer F} ${infer Op2} ${infer L2}`
  ? Op1 extends V["rangeOperators"][number]
    ? Op2 extends V["rangeOperators"][number]
      ? F extends V["rangeFeatures"][number]
        ? IsDSLValue<L1, Cfg, "<length>"> extends true
          ? IsDSLValue<L2, Cfg, "<length>"> extends true
            ? true
            : false
          : false
        : false
      : false
    : false
  : false;

type MediaComparison<
  Inner extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = Inner extends `${infer A} ${infer Op} ${infer B}`
  ? Op extends V["operators"][number]
    ? MediaFeatureValueOk<A, B, V, Cfg> extends true
      ? true
      : MediaFeatureValueOk<B, A, V, Cfg> extends true
        ? true
        : RangeComparison<Inner, V, Cfg>
    : RangeComparison<Inner, V, Cfg>
  : RangeComparison<Inner, V, Cfg>;

type ContainerComparison<
  Inner extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = Inner extends `${infer A} ${infer Op} ${infer B}`
  ? Op extends V["operators"][number]
    ? ContainerFeatureValueOk<A, B, V, Cfg> extends true
      ? true
      : ContainerFeatureValueOk<B, A, V, Cfg> extends true
        ? true
        : RangeComparison<Inner, V, Cfg>
    : RangeComparison<Inner, V, Cfg>
  : RangeComparison<Inner, V, Cfg>;

type ValidateMediaFeature<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `(${infer Inner})`
  ? Inner extends `${infer F}:${infer RawValue}`
    ? MediaFeatureValueOk<Trim<F>, Trim<RawValue>, V, Cfg>
    : MediaComparison<Inner, V, Cfg>
  : false;

type ValidateContainerFeature<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `style(${infer Inner})`
  ? Inner extends `--${string}:${string}`
    ? true
    : false
  : S extends `(${infer Inner})`
    ? Inner extends `${infer F}:${infer RawValue}`
      ? ContainerFeatureValueOk<Trim<F>, Trim<RawValue>, V, Cfg>
      : ContainerComparison<Inner, V, Cfg>
    : false;

type MediaFeatureList<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `${infer A} and ${infer B}`
  ? ValidateMediaFeature<Trim<A>, V, Cfg> extends true
    ? Trim<B> extends MediaFeatureList<Trim<B>, V, Cfg>
      ? S
      : MediaFeatureList<Trim<B>, V, Cfg>
    : `Invalid media feature: ${Trim<A>}`
  : ValidateMediaFeature<S, V, Cfg> extends true
    ? S
    : `Invalid media feature: ${Trim<S>}`;

type MediaQuery<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `not ${infer R}`
  ? Trim<R> extends V["mediaTypes"][number]
    ? S
    : Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
      ? MediaFeatureList<Trim<F>, V, Cfg> extends Trim<F>
        ? S
        : MediaFeatureList<Trim<F>, V, Cfg>
      : Trim<R> extends MediaFeatureList<Trim<R>, V, Cfg>
        ? S
        : MediaFeatureList<Trim<R>, V, Cfg>
  : S extends `only ${infer R}`
    ? Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
      ? MediaFeatureList<Trim<F>, V, Cfg> extends Trim<F>
        ? S
        : MediaFeatureList<Trim<F>, V, Cfg>
      : `Expected media type and conditions after 'only': ${Trim<R>}`
    : S extends V["mediaTypes"][number]
      ? S
      : S extends `${V["mediaTypes"][number]} and ${infer F}`
        ? MediaFeatureList<Trim<F>, V, Cfg> extends Trim<F>
          ? S
          : MediaFeatureList<Trim<F>, V, Cfg>
        : MediaFeatureList<S, V, Cfg>;

type MediaQueryList<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `${infer A},${infer B}`
  ? MediaQuery<Trim<A>, V, Cfg> extends Trim<A>
    ? Trim<B> extends MediaQueryList<Trim<B>, V, Cfg>
      ? S
      : MediaQueryList<Trim<B>, V, Cfg>
    : `Invalid media query: ${Trim<A>}`
  : MediaQuery<S, V, Cfg> extends S
    ? S
    : MediaQuery<S, V, Cfg>;

type ContainerFeatureList<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `${infer A} and ${infer B}`
  ? ValidateContainerFeature<Trim<A>, V, Cfg> extends true
    ? Trim<B> extends ContainerFeatureList<Trim<B>, V, Cfg>
      ? S
      : ContainerFeatureList<Trim<B>, V, Cfg>
    : `Invalid container feature: ${Trim<A>}`
  : ValidateContainerFeature<S, V, Cfg> extends true
    ? S
    : `Invalid container feature: ${Trim<S>}`;

type ValidateContainerQuery<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `style(${string}`
  ? ContainerFeatureList<S, V, Cfg>
  : S extends `(${string}`
    ? ContainerFeatureList<S, V, Cfg>
    : S extends `${string} ${infer F}`
      ? F extends ContainerFeatureList<F, V, Cfg>
        ? S
        : F
      : S;

export type ValidateQuery<
  S extends string,
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = S extends `@media ${infer Q}`
  ? Trim<Q> extends MediaQueryList<Trim<Q>, V, Cfg>
    ? S
    : MediaQueryList<Trim<Q>, V, Cfg>
  : S extends `@container ${infer Q}`
    ? Trim<Q> extends ValidateContainerQuery<Trim<Q>, V, Cfg>
      ? S
      : ValidateContainerQuery<Trim<Q>, V, Cfg>
    : `Query must start with @media or @container`;

export type ValidateQueries<
  T extends readonly string[],
  V extends QueryVocabulary,
  Cfg extends BaseCSSSyntaxConfig,
> = {
  [K in keyof T]: T[K] extends string ? ValidateQuery<T[K], V, Cfg> : T[K];
};