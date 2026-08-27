import type { DSLInfer, SupportedKeywordsConfig } from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

export type IsUnion<T, U = T> = T extends any
  ? [U] extends [T]
    ? false
    : true
  : never;

export type WidenPrimitive<V> =
  true extends IsUnion<V>
    ? V
    : V extends boolean
      ? boolean
      : V extends number
        ? number
        : V extends string
          ? string
          : V;

export type WidenObject<T> = {
  [K in keyof T]: WidenPrimitive<T[K]>;
};

type UndefinedKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

export type ErrorMessage<M extends string> = `${M}`;

export type IllegalChars = "(" | ")" | "[" | "]" | "{" | "}";

export type IllegalChar<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends IllegalChars
      ? Head
      : IllegalChar<Tail>
    : never;

export type SplitPipe<S extends string> = S extends `${infer A}|${infer B}`
  ? Trim<A> | SplitPipe<B>
  : Trim<S>;

export type EmptyParts<S extends string> =
  SplitPipe<S> extends infer P extends string
    ? P extends ""
      ? "x"
      : never
    : never;

export type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer L} `
    ? Trim<L>
    : S;

export type Simplify<T> = { readonly [K in keyof T]: T[K] } & {};

export type MakeUndefinedOptional<T> = Simplify<
  // Keep keys that DO NOT allow undefined exactly as they are
  {
    readonly [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K];
  } & { [K in UndefinedKeys<T>]?: T[K] } // Apply the `?` modifier to keys that DO allow undefined
>;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I extends U) => void
  ? I
  : never;

export type LastOf<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer R
    ? R
    : never;

export type UnionToTuple<U, L = LastOf<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, L>>, L];

export type JoinTuple<
  A extends readonly string[],
  Sep extends string,
> = A extends readonly [infer H extends string, ...infer R extends string[]]
  ? R extends readonly []
    ? H
    : `${H}${Sep}${JoinTuple<R, Sep>}`
  : "";

export type JoinUnion<U extends string, Sep extends string = " | "> =
  UnionToTuple<U> extends infer A extends readonly string[]
    ? JoinTuple<A, Sep>
    : "";

type HasDuplicate<T extends readonly string[]> = T extends readonly [
  infer Head extends string,
  ...infer Tail extends string[],
]
  ? Head extends Tail[number]
    ? true
    : HasDuplicate<Tail>
  : false;

export function uniqueArray<const T extends readonly string[]>(
  items: HasDuplicate<T> extends true ? `duplicate items in array` : T,
): T {
  const seen: string[] = [];
  for (const item of items) {
    if (seen.includes(item)) {
      throw new Error(`Duplicate item "${item}" in uniqueArray`);
    }
    seen.push(item);
  }
  return items as T;
}

export type FilterOut<
  Obj extends Record<string, any>,
  K extends keyof Obj,
  T,
> = Obj[K] extends T ? K : never;

// Union of keys whose value matches T
export type KeysMatching<Obj extends Record<string, any>, T> = {
  [K in keyof Obj]: FilterOut<Obj, K, T>;
}[keyof Obj];

// A value key of a complex attribute is either a literal (`"flex"`) or a DSL
// pattern (`"<length>"`). Turn it into the type a user may actually write.
export type ResolveComplexValue<
  Keywords extends SupportedKeywordsConfig,
  CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  V extends string,
> = V extends `<${string}>` ? DSLInfer<Keywords & CSSSyntaxConfig, V> : V;
