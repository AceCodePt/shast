import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";

export interface BaseCSSSyntaxConfig {
  [attribute: string]: string;
}

export type ValidateCSSSyntaxConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseCSSSyntaxConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: K extends string
        ? K extends `<${string}>`
          ? DSLValidate<Keywords & T, T[K]>
          : `Should be wrapped with <>`
        : T[K];
    }
  : T;

export type InferCSSSyntaxConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseCSSSyntaxConfig,
> = {
  [K in keyof T]: DSLInfer<Keywords & T, T[K] & string>;
};

export type InferCSSSyntax<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  Syn extends string,
> = Syn extends keyof S ? DSLInfer<Keywords & S, S[Syn] & string> : never;
