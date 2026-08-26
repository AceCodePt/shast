import { uniqueArray } from "@/types.ts";

type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer L} `
    ? Trim<L>
    : S;

type Num = `${number}`;

export const LENGTH_UNITS = uniqueArray([
  "px",
  "rem",
  "em",
  "vw",
  "vh",
  "vmin",
  "vmax",
  "ch",
  "lh",
  "rlh",
  "ex",
  "rex",
  "cap",
  "rcap",
  "ic",
  "ric",
  "dvh",
  "dvw",
  "dvmin",
  "dvmax",
  "svh",
  "svw",
  "svmin",
  "svmax",
  "lvh",
  "lvw",
  "lvmin",
  "lvmax",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  "in",
  "pt",
  "pc",
  "cm",
  "mm",
  "Q",
]);

export const RESOLUTION_UNITS = uniqueArray(["dpi", "dpcm", "dppx", "x"]);

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

export interface QueryVocabulary {
  readonly operators: readonly string[];
  readonly rangeOperators: readonly string[];
  readonly lengthUnits: readonly string[];
  readonly resolutionUnits: readonly string[];
  readonly mediaTypes: readonly string[];
  readonly mediaLengthFeatures: readonly string[];
  readonly mediaResolutionFeatures: readonly string[];
  readonly mediaRatioFeatures: readonly string[];
  readonly rangeFeatures: readonly string[];
  readonly orientationValues: readonly string[];
  readonly prefersColorSchemeValues: readonly string[];
  readonly prefersReducedMotionValues: readonly string[];
  readonly containerLengthFeatures: readonly string[];
}

export const QUERY_VOCABULARY = {
  operators: OPERATORS,
  rangeOperators: RANGE_OPS,
  lengthUnits: LENGTH_UNITS,
  resolutionUnits: RESOLUTION_UNITS,
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

type Length<Units extends readonly string[]> = `${number}${Units[number]}`;

type Resolution<Units extends readonly string[]> = `${number}${Units[number]}`;

type OpCompare<
  Operators extends readonly string[],
  F extends string,
  V extends string,
> = `(${F} ${Operators[number]} ${V})`;

type RangeCompare<
  RangeOperators extends readonly string[],
  LengthUnits extends readonly string[],
  F extends string,
> = `(${Length<LengthUnits>} ${RangeOperators[number]} ${F} ${RangeOperators[number]} ${Length<LengthUnits>})`;

type MediaFeature<V extends QueryVocabulary> =
  | OpCompare<V["operators"], V["mediaLengthFeatures"][number], Length<V["lengthUnits"]>>
  | `(${V["mediaLengthFeatures"][number]}: ${Length<V["lengthUnits"]>})`
  | RangeCompare<V["rangeOperators"], V["lengthUnits"], V["rangeFeatures"][number]>
  | OpCompare<V["operators"], V["mediaResolutionFeatures"][number], Resolution<V["resolutionUnits"]>>
  | `(${V["mediaResolutionFeatures"][number]}: ${Resolution<V["resolutionUnits"]>})`
  | OpCompare<V["operators"], V["mediaRatioFeatures"][number], Num>
  | `(${V["mediaRatioFeatures"][number]}: ${Num})`
  | `(orientation: ${V["orientationValues"][number]})`
  | `(prefers-color-scheme: ${V["prefersColorSchemeValues"][number]})`
  | `(prefers-reduced-motion: ${V["prefersReducedMotionValues"][number]})`;

type MediaFeatureList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A} and ${infer B}`
    ? Trim<A> extends MediaFeature<V>
      ? Trim<B> extends MediaFeatureList<Trim<B>, V>
        ? S
        : MediaFeatureList<Trim<B>, V>
      : `Invalid media feature: ${Trim<A>}`
    : S extends MediaFeature<V>
      ? S
      : `Invalid media feature: ${Trim<S>}`;

type MediaQuery<S extends string, V extends QueryVocabulary> =
  S extends `not ${infer R}`
    ? Trim<R> extends V["mediaTypes"][number]
      ? S
      : Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
        ? F extends MediaFeatureList<F, V>
          ? S
          : F
        : Trim<R> extends MediaFeatureList<Trim<R>, V>
          ? S
          : `Invalid condition after 'not': ${Trim<R>}`
    : S extends `only ${infer R}`
      ? Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
        ? F extends MediaFeatureList<F, V>
          ? S
          : F
        : `Expected media type and conditions after 'only': ${Trim<R>}`
      : S extends V["mediaTypes"][number]
        ? S
        : S extends `${V["mediaTypes"][number]} and ${infer F}`
          ? F extends MediaFeatureList<F, V>
            ? S
            : F
          : MediaFeatureList<S, V>;

type MediaQueryList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A},${infer B}`
    ? Trim<A> extends MediaQuery<Trim<A>, V>
      ? Trim<B> extends MediaQueryList<Trim<B>, V>
        ? S
        : MediaQueryList<Trim<B>, V>
      : `Invalid media query: ${Trim<A>}`
    : MediaQuery<S, V> extends S
      ? S
      : MediaQuery<S, V>;

type ContainerFeature<V extends QueryVocabulary> =
  | OpCompare<V["operators"], V["containerLengthFeatures"][number], Length<V["lengthUnits"]>>
  | `(${V["containerLengthFeatures"][number]}: ${Length<V["lengthUnits"]>})`
  | RangeCompare<V["rangeOperators"], V["lengthUnits"], V["rangeFeatures"][number]>
  | `style(--${string}: ${string})`;

type ContainerFeatureList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A} and ${infer B}`
    ? Trim<A> extends ContainerFeature<V>
      ? Trim<B> extends ContainerFeatureList<Trim<B>, V>
        ? S
        : ContainerFeatureList<Trim<B>, V>
      : `Invalid container feature: ${Trim<A>}`
    : S extends ContainerFeature<V>
      ? S
      : `Invalid container feature: ${Trim<S>}`;

type ValidateContainerQuery<S extends string, V extends QueryVocabulary> =
  S extends `style(${string}`
    ? ContainerFeatureList<S, V>
    : S extends `(${string}`
      ? ContainerFeatureList<S, V>
      : S extends `${string} ${infer F}`
        ? F extends ContainerFeatureList<F, V>
          ? S
          : F
        : S;

export type ValidateQuery<S extends string, V extends QueryVocabulary> =
  S extends `@media ${infer Q}`
    ? Trim<Q> extends MediaQueryList<Trim<Q>, V>
      ? S
      : MediaQueryList<Trim<Q>, V>
    : S extends `@container ${infer Q}`
      ? Trim<Q> extends ValidateContainerQuery<Trim<Q>, V>
        ? S
        : ValidateContainerQuery<Trim<Q>, V>
      : `Query must start with @media or @container`;

export type ValidateQueries<
  T extends readonly string[],
  V extends QueryVocabulary,
> = {
  [K in keyof T]: T[K] extends string ? ValidateQuery<T[K], V> : T[K];
};