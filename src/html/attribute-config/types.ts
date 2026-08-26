import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";

export interface BaseHTMLAttributesConfig {
  [attribute: string]: string;
}

export type ValidateHTMLAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseHTMLAttributesConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: DSLValidate<Keywords, T[K]>;
    }
  : T;

export type InferHTMLAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  A extends BaseHTMLAttributesConfig,
> = {
  [K in keyof A]: K extends string ? DSLInfer<Keywords, A[K]> : A[K];
};
