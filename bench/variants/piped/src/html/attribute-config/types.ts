import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";

// Piping variant: an attribute value is one DSL string whose arms are already
// joined with `' | '` by the author. tsyntax's `DSLValidate` splits the value
// into a union, where the array form validated each arm with `DSLValidateArm`.
export type HTMLAttributeArms = string;

// The flat case: an attribute name maps to its arms.
export interface BaseHTMLAttributeSimpleConfig {
  [attribute: string]: HTMLAttributeArms;
}

// The conditional case: an attribute name maps each possible value directly to
// the attributes that value unlocks. Unlike a CSS gate there is no `self` /
// `children` split: an HTML attribute unlocks siblings on the same element, and
// naming a slot `self` would imply a `children` counterpart that does not exist.
export interface BaseHTMLAttributeComplexValue {
  [value: string]: BaseHTMLAttributeSimpleConfig;
}

export interface BaseHTMLAttributesConfig {
  [attribute: string]: BaseHTMLAttributeComplexValue | HTMLAttributeArms;
}

// Validate the piped value. An empty string is a diagnostic string, never a
// valid value, so `""` is rejected at the type wall (and thrown at runtime by
// `htmlAttributeConfig`).
export type ValidateHTMLAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends HTMLAttributeArms,
> = Arms extends ""
  ? `An HTML attribute must declare at least one arm`
  : DSLValidate<Keywords, Arms>;

// Infer the value a user may write from an attribute's DSL: the union of what
// each piped arm infers to, which `DSLInfer` produces in one pass.
export type InferHTMLAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends HTMLAttributeArms,
> = DSLInfer<Keywords, Arms>;

export type ValidateHTMLAttributesSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  A extends BaseHTMLAttributeSimpleConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: ValidateHTMLAttributeValue<Keywords, A[K]>;
    }
  : A;

// Named alias rather than an inline conditional: an alias instantiation is
// cached by its arguments, so attributes that share a value or a gate shape
// share one evaluation. The same conditional written inline in a mapped type is
// cached per key (`K`) and shares nothing.
type ValidateHTMLAttributeEntry<
  Keywords extends SupportedKeywordsConfig,
  V,
> = V extends BaseHTMLAttributeComplexValue
  ? {
      [G in keyof V]: ValidateHTMLAttributesSimpleConfig<Keywords, V[G]>;
    }
  : ValidateHTMLAttributeValue<Keywords, Extract<V, HTMLAttributeArms>>;

export type ValidateHTMLAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseHTMLAttributesConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: ValidateHTMLAttributeEntry<Keywords, T[K]>;
    }
  : T;

type FlatHTMLAttributeKeys<A> = {
  [K in keyof A]: A[K] extends HTMLAttributeArms ? K : never;
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
      [K in FlatHTMLAttributeKeys<A> & string]: InferHTMLAttributeValue<
        Keywords,
        Extract<A[K], HTMLAttributeArms>
      >;
    }
  : {
      [K in keyof A]: K extends string
        ? A[K] extends BaseHTMLAttributeComplexValue
          ? {
              [V in keyof A[K]]: {
                [K1 in K | keyof A[K][V]]?: K1 extends K
                  ? V
                  : K1 extends keyof A[K][V]
                    ? InferHTMLAttributeValue<
                        Keywords,
                        Extract<A[K][V][K1], HTMLAttributeArms>
                      >
                    : never;
              };
            }[keyof A[K]]
          : {
              [P in K]: InferHTMLAttributeValue<
                Keywords,
                Extract<A[K], HTMLAttributeArms>
              >;
            }
        : never;
    }[keyof A];
