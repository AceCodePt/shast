import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";

// The flat case: an attribute name is a DSL string, exactly as before.
export interface BaseHTMLAttributeSimpleConfig {
  [attribute: string]: string;
}

// The conditional case: an attribute name maps each possible value directly to
// the attributes that value unlocks. Unlike a CSS gate there is no `self` /
// `children` split: an HTML attribute unlocks siblings on the same element, and
// naming a slot `self` would imply a `children` counterpart that does not exist.
export interface BaseHTMLAttributeComplexValue {
  [value: string]: BaseHTMLAttributeSimpleConfig;
}

export interface BaseHTMLAttributesConfig {
  [attribute: string]: BaseHTMLAttributeComplexValue | string;
}

export type ValidateHTMLAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  A extends BaseHTMLAttributeSimpleConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: DSLValidate<Keywords, A[K]>;
    }
  : A;

export type ValidateHTMLAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseHTMLAttributesConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: T[K] extends string
        ? DSLValidate<Keywords, T[K]>
        : T[K] extends BaseHTMLAttributeComplexValue
          ? {
              [V in keyof T[K]]: ValidateHTMLAttributesSimpleConfig<
                Keywords,
                T[K][V]
              >;
            }
          : never;
    }
  : T;

type FlatHTMLAttributeKeys<A> = {
  [K in keyof A]: A[K] extends string ? K : never;
}[keyof A];

type ComplexHTMLAttributeKeys<A> = {
  [K in keyof A]: A[K] extends BaseHTMLAttributeComplexValue ? K : never;
}[keyof A];

// All-flat configs keep the historical merged-object shape (one property per
// attribute). As soon as one attribute is complex the shape mirrors the CSS
// inference: a union of value variants, each carrying the gate literal plus the
// attributes it unlocks.
export type InferHTMLAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  A extends BaseHTMLAttributesConfig,
> = [ComplexHTMLAttributeKeys<A>] extends [never]
  ? {
      [K in FlatHTMLAttributeKeys<A> & string]: DSLInfer<
        Keywords,
        A[K] & string
      >;
    }
  : {
      [K in keyof A]: K extends string
        ? A[K] extends string
          ? { [P in K]: DSLInfer<Keywords, A[K]> }
          : A[K] extends BaseHTMLAttributeComplexValue
            ? {
                [V in keyof A[K]]: {
                  [K1 in K | keyof A[K][V]]?: K1 extends K
                    ? V
                    : K1 extends keyof A[K][V]
                      ? DSLInfer<Keywords, A[K][V][K1]>
                      : never;
                };
              }[keyof A[K]]
            : never
        : never;
    }[keyof A];
