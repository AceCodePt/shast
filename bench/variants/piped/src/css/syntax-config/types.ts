import type {
  DSLInfer,
  DSLValidateArm,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { JoinTuple } from "@/types.ts";

// The authoring surface: a DSL token is an array of single arms. Each arm is
// validated on its own by tsyntax's `DSLValidateArm`, so a `|` inside a
// template interpolation (`${'a' | 'b'}`) stays part of one arm instead of
// being misread as a top-level union by `DSLValidate`.
export interface BaseCSSSyntaxConfig {
  [attribute: string]: readonly string[];
}

// The runtime surface every consumer reads: each token is one `' | '`-joined
// DSL string. `cssSyntaxConfig` joins the arms before returning, so this is
// what flows into the engine, the attribute/property/query registries and the
// renderer.
export interface CSSSyntaxKeywords {
  [attribute: string]: string;
}

// Validate every arm of a token independently. An empty arm list is a
// diagnostic string, never a valid token, so `[]` is rejected at the type wall
// (and thrown at runtime by `cssSyntaxConfig`).
export type ValidateArms<
  Keywords extends SupportedKeywordsConfig,
  Arms extends readonly string[],
> = Arms extends readonly []
  ? `A syntax token must declare at least one arm`
  : {
      readonly [I in keyof Arms]: DSLValidateArm<Keywords, Arms[I] & string>;
    };

export type ValidateCSSSyntaxConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseCSSSyntaxConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: K extends string
        ? K extends `<${string}>`
          ? ValidateArms<Keywords & T, T[K]>
          : `Should be wrapped with <>`
        : T[K];
    }
  : T;

export type InferCSSSyntaxConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseCSSSyntaxConfig,
> = {
  [K in keyof T]: DSLInfer<
    Keywords & CSSSyntaxKeywordsConfig<T>,
    CSSSyntaxKeywordsConfig<T>[K] & string
  >;
};

// Accepts either authoring shape: the array arms (`BaseCSSSyntaxConfig`) or the
// joined-string runtime shape (`CSSSyntaxKeywords`). The arms are joined into
// one DSL string first, so token references resolve through the string map
// (rather than returning an array) exactly as they did before the split.
export type InferCSSSyntax<
  Keywords extends SupportedKeywordsConfig,
  S extends Record<string, string | readonly string[]>,
  Syn extends string,
> = Syn extends keyof S
  ? DSLInfer<
      Keywords & CSSSyntaxKeywordsConfig<S>,
      CSSSyntaxKeywordsConfig<S>[Syn] & string
    >
  : never;

// Normalises either authoring shape to the joined-string runtime shape: an arm
// array joins in source order into one DSL string; a string passes through.
// Order-preserving (unlike `JoinUnion`) so the joined literal matches the
// runtime `.join(" | ")`.
export type CSSSyntaxKeywordsConfig<T> = {
  [K in keyof T]: T[K] extends readonly string[]
    ? JoinTuple<T[K], " | ">
    : T[K] extends string
      ? T[K]
      : never;
};
