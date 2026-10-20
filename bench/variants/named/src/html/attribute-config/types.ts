import type {
  DSLInfer,
  DSLValidateArm,
  SupportedKeywordsConfig,
} from "tsyntax";

// The authoring surface: an attribute value is an array of single arms. Each
// arm is validated on its own by tsyntax's `DSLValidateArm`, so validation does
// not re-split a value into a union first. `htmlAttributeConfig` joins the arms
// with `' | '` before returning, so the runtime surface every consumer reads is
// one joined DSL string per attribute.
export type HTMLAttributeArms = readonly string[];

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

// Validate every arm of an attribute value independently. An empty arm list is
// a diagnostic string, never a valid value, so `[]` is rejected at the type
// wall (and thrown at runtime by `htmlAttributeConfig`).
export type ValidateHTMLAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends HTMLAttributeArms,
> = Arms extends readonly []
  ? `An HTML attribute must declare at least one arm`
  : {
      readonly [I in keyof Arms]: DSLValidateArm<Keywords, Arms[I] & string>;
    };

// Infer the value a user may write from an attribute's arms: the union of what
// each arm infers to. Mapping arm-by-arm keeps an arm's internal template pipe
// inside one `DSLInfer` instead of letting it split the whole value.
export type InferHTMLAttributeValue<
  Keywords extends SupportedKeywordsConfig,
  Arms extends HTMLAttributeArms,
> = Arms[number] extends infer Arm
  ? Arm extends string
    ? DSLInfer<Keywords, Arm>
    : never
  : never;

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
