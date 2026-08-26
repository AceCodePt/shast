import { uniqueArray } from "@/types.ts";

type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer L} `
    ? Trim<L>
    : S;

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

type IsUnitValue<S extends string, Units extends readonly string[]> =
  S extends `${number}${Units[number]}` ? true : false;

type IsNumber<S extends string> = S extends `${number}` ? true : false;

type MediaFeatureValueOk<
  F extends string,
  Value extends string,
  V extends QueryVocabulary,
> = F extends V["mediaLengthFeatures"][number]
  ? IsUnitValue<Value, V["lengthUnits"]>
  : F extends V["mediaResolutionFeatures"][number]
    ? IsUnitValue<Value, V["resolutionUnits"]>
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
> = F extends V["containerLengthFeatures"][number]
  ? IsUnitValue<Value, V["lengthUnits"]>
  : false;

type RangeComparison<Inner extends string, V extends QueryVocabulary> =
  Inner extends `${infer L1} ${infer Op1} ${infer F} ${infer Op2} ${infer L2}`
    ? Op1 extends V["rangeOperators"][number]
      ? Op2 extends V["rangeOperators"][number]
        ? F extends V["rangeFeatures"][number]
          ? IsUnitValue<L1, V["lengthUnits"]> extends true
            ? IsUnitValue<L2, V["lengthUnits"]> extends true
              ? true
              : false
            : false
          : false
        : false
      : false
    : false;

type MediaComparison<Inner extends string, V extends QueryVocabulary> =
  Inner extends `${infer A} ${infer Op} ${infer B}`
    ? Op extends V["operators"][number]
      ? MediaFeatureValueOk<A, B, V> extends true
        ? true
        : MediaFeatureValueOk<B, A, V> extends true
          ? true
          : RangeComparison<Inner, V>
      : RangeComparison<Inner, V>
    : RangeComparison<Inner, V>;

type ContainerComparison<Inner extends string, V extends QueryVocabulary> =
  Inner extends `${infer A} ${infer Op} ${infer B}`
    ? Op extends V["operators"][number]
      ? ContainerFeatureValueOk<A, B, V> extends true
        ? true
        : ContainerFeatureValueOk<B, A, V> extends true
          ? true
          : RangeComparison<Inner, V>
      : RangeComparison<Inner, V>
    : RangeComparison<Inner, V>;

type ValidateMediaFeature<S extends string, V extends QueryVocabulary> =
  S extends `(${infer Inner})`
    ? Inner extends `${infer F}:${infer RawValue}`
      ? MediaFeatureValueOk<Trim<F>, Trim<RawValue>, V>
      : MediaComparison<Inner, V>
    : false;

type ValidateContainerFeature<S extends string, V extends QueryVocabulary> =
  S extends `style(${infer Inner})`
    ? Inner extends `--${string}:${string}`
      ? true
      : false
    : S extends `(${infer Inner})`
      ? Inner extends `${infer F}:${infer RawValue}`
        ? ContainerFeatureValueOk<Trim<F>, Trim<RawValue>, V>
        : ContainerComparison<Inner, V>
      : false;

type MediaFeatureList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A} and ${infer B}`
    ? ValidateMediaFeature<Trim<A>, V> extends true
      ? Trim<B> extends MediaFeatureList<Trim<B>, V>
        ? S
        : MediaFeatureList<Trim<B>, V>
      : `Invalid media feature: ${Trim<A>}`
    : ValidateMediaFeature<S, V> extends true
      ? S
      : `Invalid media feature: ${Trim<S>}`;

type MediaQuery<S extends string, V extends QueryVocabulary> =
  S extends `not ${infer R}`
    ? Trim<R> extends V["mediaTypes"][number]
      ? S
      : Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
        ? MediaFeatureList<Trim<F>, V> extends Trim<F>
          ? S
          : MediaFeatureList<Trim<F>, V>
        : Trim<R> extends MediaFeatureList<Trim<R>, V>
          ? S
          : MediaFeatureList<Trim<R>, V>
    : S extends `only ${infer R}`
      ? Trim<R> extends `${V["mediaTypes"][number]} and ${infer F}`
        ? MediaFeatureList<Trim<F>, V> extends Trim<F>
          ? S
          : MediaFeatureList<Trim<F>, V>
        : `Expected media type and conditions after 'only': ${Trim<R>}`
      : S extends V["mediaTypes"][number]
        ? S
        : S extends `${V["mediaTypes"][number]} and ${infer F}`
          ? MediaFeatureList<Trim<F>, V> extends Trim<F>
            ? S
            : MediaFeatureList<Trim<F>, V>
          : MediaFeatureList<S, V>;

type MediaQueryList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A},${infer B}`
    ? MediaQuery<Trim<A>, V> extends Trim<A>
      ? Trim<B> extends MediaQueryList<Trim<B>, V>
        ? S
        : MediaQueryList<Trim<B>, V>
      : `Invalid media query: ${Trim<A>}`
    : MediaQuery<S, V> extends S
      ? S
      : MediaQuery<S, V>;

type ContainerFeatureList<S extends string, V extends QueryVocabulary> =
  S extends `${infer A} and ${infer B}`
    ? ValidateContainerFeature<Trim<A>, V> extends true
      ? Trim<B> extends ContainerFeatureList<Trim<B>, V>
        ? S
        : ContainerFeatureList<Trim<B>, V>
      : `Invalid container feature: ${Trim<A>}`
    : ValidateContainerFeature<S, V> extends true
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