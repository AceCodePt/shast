import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";

// The flat case: an attribute name is a DSL string, exactly as before.
export interface BaseHTMLAttributeSimpleConfig {
  [attribute: string]: string;
}

// The conditional case: an attribute name maps each possible value to what
// that value unlocks on the same element (`self`) and on its direct children
// (`children`). Structurally identical to `BaseCSSAttributeComplexValue`, so
// the shared gate machinery in `engine/types.ts` serves both layers.
export interface BaseHTMLAttributeComplexValue {
  [value: string]: {
    self: BaseHTMLAttributeSimpleConfig;
    children: BaseHTMLAttributeSimpleConfig;
  };
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
              [V in keyof T[K]]: {
                self: ValidateHTMLAttributesSimpleConfig<
                  Keywords,
                  T[K][V]["self"]
                >;
                children: ValidateHTMLAttributesSimpleConfig<
                  Keywords,
                  T[K][V]["children"]
                >;
              };
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
// inference: a union of value variants, each carrying the gate literal plus its
// `self` bag.
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
                  [K1 in K | keyof A[K][V]["self"]]?: K1 extends K
                    ? V
                    : K1 extends keyof A[K][V]["self"]
                      ? DSLInfer<Keywords, A[K][V]["self"][K1]>
                      : never;
                };
              }[keyof A[K]]
            : never
        : never;
    }[keyof A];
