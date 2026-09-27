// CSS `var()` support.
//
// One grammar, two walls, kept in this one file exactly like `calc.ts`:
//
//   * the type wall (`ValidateVar`) scans a written CSS value for every
//     `var(...)` call, resolves each reference against the CSS Properties
//     registry, validates the (optional) fallback against the referenced
//     property's syntax type, and fails with a branded `VarError` the author
//     cannot produce.
//   * the runtime wall (`validateVars`) walks the same grammar with balanced
//     parenthesis tracking, validates fallbacks against the expected DSL, and
//     detects circular `var()` chains.
//
// Grammar:
//
//   var-expression := `var(` var-args `)`
//   var-args       := dashed-ident (`,` fallback)?
//   dashed-ident   := `--` <identifier>
//   fallback       := calc-expression | var-expression | <literal>
//
// `var()` may appear stand-alone (`width: var(--spacing)`), inside `calc()`
// (`calc(var(--spacing) * 2)`), or several times in one shorthand
// (`border: "1px solid var(--c)"`). Fallbacks may be literals, other `var()`s,
// or `calc()` expressions, and may nest arbitrarily; only the *type* wall
// bounds the recursion (see `VarTypeDepth`), runtime has no bound.
//
// Cross-references (name -> syntax type) are read from `CSSPropertiesConfig`.
// The deep engine constraint (`VarConstraint` in `engine/types.ts`) mirrors the
// runtime wiring in `engine/index.ts`.

import {
  parseCalc,
  type CalcError,
  type IsCalcString,
  type ValidateCalc,
} from "@/css/calc.ts";
import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import {
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
  type DSLInfer,
} from "tsyntax";

// ---------------------------------------------------------------------------
// Shared vocabulary.
// ---------------------------------------------------------------------------

// A diagnostic string that no author can write as a CSS value. Branded object,
// not a string, so a written value can never be assignable to it. Mirrors
// `CalcError`.
declare const VAR_ERROR: unique symbol;

export interface VarError<Message extends string> {
  readonly [VAR_ERROR]: Message;
}

type VarOk = true;

// How deep the type wall follows nested `var()` fallbacks before giving up.
// Runtime has no such bound; this only keeps the template-literal recursions
// finite. The spec explicitly parameterises this rather than the runtime.
export type VarTypeDepth = readonly [
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
];

type TrimVar<S extends string> = S extends ` ${infer R}`
  ? TrimVar<R>
  : S extends `${infer L} `
    ? TrimVar<L>
    : S;

// Whether a written value contains at least one `var(` call. Unlike calc,
// `var()` can appear anywhere in a value (not only at the front), so the deep
// wall is triggered on a substring rather than a prefix.
export type ContainsVar<S extends string> =
  S extends `${string}var(${string}` ? true : false;

// ---------------------------------------------------------------------------
// Type wall: scanning.
// ---------------------------------------------------------------------------

// Find the first `var(` in `S`. Yields `[Prefix, Rest]` where `Rest` is
// everything after the literal `var(`; `null` when `S` has no `var(`.
type SplitOnVar<S extends string> =
  S extends `${string}var(${infer Rest}` ? [unknown, Rest] : null;

// Given the text just after `var(`, consume characters until the matching
// close parenthesis, threading depth. Returns `[Arguments, Remainder]` where
// `Remainder` starts just after the close paren, or a `VarError` when the call
// is unclosed.
type ExtractVarCall<
  Rest extends string,
  Depth extends readonly unknown[] = [],
  Acc extends string = "",
> = Rest extends `${infer C}${infer R}`
  ? C extends "("
    ? ExtractVarCall<R, [...Depth, unknown], `${Acc}(`>
    : C extends ")"
      ? Depth extends readonly [unknown, ...infer Deeper]
        ? ExtractVarCall<R, Deeper, `${Acc})`>
        : [Acc, R]
      : ExtractVarCall<R, Depth, `${Acc}${C}`>
  : VarError<"unclosed var() call">;

// Split a `var()` argument list at its TOP-LEVEL commas (commas nested inside
// parentheses -- e.g. `rgb(1, 2, 3)` in a fallback -- are preserved).
type SplitVarArgs<
  S extends string,
  Depth extends readonly unknown[] = [],
  Cur extends string = "",
  Acc extends readonly string[] = [],
> = S extends `${infer C}${infer R}`
  ? C extends "("
    ? SplitVarArgs<R, [...Depth, unknown], `${Cur}(`, Acc>
    : C extends ")"
      ? Depth extends readonly [unknown, ...infer Deeper]
        ? SplitVarArgs<R, Deeper, `${Cur})`, Acc>
        : SplitVarArgs<R, Depth, `${Cur})`, Acc>
      : C extends ","
        ? Depth extends readonly []
          ? SplitVarArgs<R, Depth, "", [...Acc, TrimVar<Cur>]>
          : SplitVarArgs<R, Depth, `${Cur},`, Acc>
        : SplitVarArgs<R, Depth, `${Cur}${C}`, Acc>
  : [...Acc, TrimVar<Cur>];

// A legal dashed custom-property name: starts with `--`, non-empty, and free
// of whitespace, parentheses and commas.
type VarNameOk<Name extends string> = Name extends `--${infer N}`
  ? N extends ""
    ? false
    : N extends `${string}(${string}`
      ? false
      : N extends `${string})${string}`
        ? false
        : N extends `${string} ${string}`
          ? false
          : N extends `${string},${string}`
            ? false
            : true
  : false;

// The syntax type a registered property declares, or `never` when unknown.
type PropertySyntaxType<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Name extends string,
> = Name extends keyof Props
  ? Props[Name] extends { syntax: infer S extends string }
    ? DSLInfer<Keywords & Syntax, S>
    : never
  : never;

// `true` when the resolved type is compatible with the expected context type.
// `unknown` context (a context-dependent slot, e.g. a gate-unlocked shorthand)
// accepts anything, matching the spec's "one-level resolution + runtime".
type ContextOk<Resolved, Context> = [Resolved] extends [Context] ? true : false;

// The type of a fallback expression: a nested `var()` resolves recursively to
// its referenced property's syntax type (or its own fallback), a `calc()` is
// validated against the calc grammar and kept verbatim, and a literal is kept
// as its own string type.
type FallbackType<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Fb extends string,
  Context,
  Depth extends readonly unknown[] = [],
> = TrimVar<Fb> extends ""
  ? VarError<"empty var() fallback">
  : TrimVar<Fb> extends `var(${infer Inner})`
    ? Depth extends readonly [unknown, ...infer Deeper]
      ? ResolveVarArgs<Keywords, Syntax, Props, Inner, Context, Deeper>
      : VarError<"var() fallback nesting exceeds the type wall bound">
    : IsCalcString<Fb> extends true
      ? ValidateCalc<Fb> extends infer V
        ? V extends CalcError<string>
          ? V
          : Fb
        : never
      : Fb;

// Validate that a fallback is compatible with the expected type (the
// referenced property's syntax when the name is registered, else the context).
type FallbackOk<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Fb extends string,
  Expected,
  Depth extends readonly unknown[] = [],
> = FallbackType<Keywords, Syntax, Props, Fb, Expected, Depth> extends infer T
  ? T extends VarError<string>
    ? T
    : ContextOk<T, Expected> extends true
      ? VarOk
      : VarError<`fallback '${Fb}' does not match the expected type`>
  : never;

// Resolve a `var(...)` argument list to its resulting type, or a `VarError`.
type ResolveVarArgs<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Args extends string,
  Context,
  Depth extends readonly unknown[] = [],
> = SplitVarArgs<Args> extends infer Parts
  ? Parts extends readonly [infer Only extends string]
    ? ResolveVarName<
        Keywords,
        Syntax,
        Props,
        Only,
        undefined,
        Context,
        Depth
      >
    : Parts extends readonly [infer Name extends string, infer Fb extends string]
      ? ResolveVarName<
          Keywords,
          Syntax,
          Props,
          Name,
          Fb,
          Context,
          Depth
        >
      : VarError<"var() accepts at most one fallback">
  : never;

type ResolveVarName<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Name extends string,
  Fb extends string | undefined,
  Context,
  Depth extends readonly unknown[] = [],
> = TrimVar<Name> extends infer N extends string
  ? VarNameOk<N> extends true
    ? N extends keyof Props
      ? PropertySyntaxType<Keywords, Syntax, Props, N> extends infer Resolved
        ? Fb extends string
          ? FallbackOk<
              Keywords,
              Syntax,
              Props,
              Fb,
              Resolved,
              Depth
            > extends infer FbResult
            ? FbResult extends VarError<string>
              ? FbResult
              : ContextOk<Resolved, Context> extends true
                ? Resolved
                : VarError<`'${N}' resolves to a type incompatible with this context`>
            : never
          : ContextOk<Resolved, Context> extends true
            ? Resolved
            : VarError<`'${N}' resolves to a type incompatible with this context`>
        : never
      : Fb extends string
        ? FallbackType<
            Keywords,
            Syntax,
            Props,
            Fb,
            Context,
            Depth
          > extends infer T
          ? T extends VarError<string>
            ? T
            : ContextOk<T, Context> extends true
              ? T
              : VarError<`fallback '${Fb}' does not match this context`>
          : never
        : VarError<`unknown custom property '${N}' (no fallback provided)`>
    : VarError<`invalid var() name '${TrimVar<Name>}': must start with '--'`>
  : never;

// Walk `S`, validating every `var()` call it contains. Returns `VarOk` when all
// are valid, or the first `VarError`.
type ScanVars<
  S extends string,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Context,
  Depth extends readonly unknown[] = [],
> = SplitOnVar<S> extends infer Split
  ? Split extends readonly [unknown, infer Rest extends string]
    ? ExtractVarCall<Rest> extends infer Call
      ? Call extends readonly [
          infer Args extends string,
          infer After extends string,
        ]
        ? ResolveVarArgs<
            Keywords,
            Syntax,
            Props,
            Args,
            Context,
            Depth
          > extends infer Result
          ? Result extends VarError<string>
            ? Result
            : ScanVars<After, Keywords, Syntax, Props, Context, Depth>
          : never
        : Call
      : never
    : VarOk
  : never;

// The type wall entry point. Returns the written value on success, or a
// branded `VarError` the author cannot assign to (so the assignment fails).
//
// `Context` is the expected type for the value, when one is known. Slots whose
// type is context-dependent (gate-unlocked shorthands, for instance) pass
// `unknown`, which disables the compatibility half and leaves it to runtime --
// exactly the "one-level resolution + runtime for the rest" the spec asks for.
export type ValidateVar<
  S extends string,
  Props extends BaseCSSPropertiesConfig,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Context = unknown,
  Depth extends readonly unknown[] = VarTypeDepth,
> = ContainsVar<S> extends true
  ? ScanVars<S, Keywords, Syntax, Props, Context, Depth> extends infer Result
    ? Result extends VarError<string>
      ? Result
      : S
    : never
  : S;

// A helper used by tests (and available to authors) to read the type a
// `var()` reference resolves to. Returns `never` when `S` is not a plain
// `var(...)` call.
export type ResolveVar<
  S extends string,
  Props extends BaseCSSPropertiesConfig,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
> = TrimVar<S> extends `var(${infer Inner})`
  ? ResolveVarArgs<Keywords, Syntax, Props, Inner, unknown, VarTypeDepth>
  : never;

// ---------------------------------------------------------------------------
// Runtime wall.
// ---------------------------------------------------------------------------

const DASHED_IDENT = /^--[A-Za-z0-9_-]+$/;

export class VarSyntaxError extends Error {
  constructor(message: string) {
    super(`Invalid var() value: ${message}`);
    this.name = "VarSyntaxError";
  }
}

export interface VarRuntimeContext {
  // The merged DSL config (syntax tokens + supported keywords), used to
  // validate fallbacks against the expected DSL.
  dslConfig: Record<string, string>;
  // The expected DSL for the value being validated (the context).
  dsl: string;
  // The CSS Properties registry.
  properties: Record<
    string,
    { syntax: string; inherits: boolean; "initial-value": string }
  >;
  // Custom-property values defined in the current scope or inherited from an
  // enclosing scope (component-written values shadow the registry).
  defined: Record<string, string>;
}

export function containsVar(value: unknown): value is string {
  return typeof value === "string" && value.includes("var(");
}

// Split a `var()` argument list at top-level commas (depth aware).
function splitVarArgs(args: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of args) {
    if (char === "(") {
      depth += 1;
      current += char;
    } else if (char === ")") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

// Validate a single value against a DSL, running the deep calc parser when the
// value is calc-shaped.
function validateValueShallow(
  value: string,
  dsl: string,
  ctx: VarRuntimeContext,
): void {
  parseValueAgainstDSL(ctx.dslConfig, dsl, value as never);
  if (value.trim().startsWith("calc(")) {
    parseCalc(value);
  }
}

// Resolve a registered (or locally defined) custom property for cycle
// detection. Walks the property's own value and recurses into any further
// references.
function resolveVar(
  name: string,
  ctx: VarRuntimeContext,
  visiting: Set<string>,
): void {
  if (visiting.has(name)) {
    throw new VarSyntaxError(
      `circular var() reference: ${[...visiting, name].join(" -> ")}`,
    );
  }
  const value = ctx.defined[name] ?? ctx.properties[name]?.["initial-value"];
  if (value === undefined) return;
  visiting.add(name);
  try {
    scanVars(value, ctx, visiting);
  } finally {
    visiting.delete(name);
  }
}

// Validate the argument list of one `var()` call.
function validateVarArgs(
  args: string,
  ctx: VarRuntimeContext,
  visiting: Set<string>,
): void {
  const parts = splitVarArgs(args);
  if (parts.length === 0 || parts[0] === "") {
    throw new VarSyntaxError("var() requires a custom property name");
  }
  if (parts.length > 2) {
    throw new VarSyntaxError("var() accepts at most one fallback");
  }

  const name = parts[0]!;
  if (!DASHED_IDENT.test(name)) {
    throw new VarSyntaxError(
      `invalid var() name '${name}': must start with '--'`,
    );
  }

  const known = name in ctx.properties || name in ctx.defined;
  const fallback = parts.length === 2 ? parts[1]! : undefined;

  if (fallback !== undefined && fallback === "") {
    throw new VarSyntaxError("empty var() fallback");
  }

  if (!known && fallback === undefined) {
    throw new VarSyntaxError(
      `unknown custom property '${name}' (no fallback provided)`,
    );
  }

  if (fallback !== undefined) {
    // The fallback must be valid against the referenced property's syntax when
    // the name is registered, otherwise against the surrounding context.
    const expectedDsl = known ? ctx.properties[name]!.syntax : ctx.dsl;
    validateValueShallow(fallback, expectedDsl, ctx);
    scanVars(fallback, ctx, visiting);
  }

  if (known) {
    // Resolve the reference (walking its own value) for cycle detection.
    resolveVar(name, ctx, visiting);
  }
}

// Scan a value for every `var()` call and validate it.
function scanVars(
  value: string,
  ctx: VarRuntimeContext,
  visiting: Set<string>,
): void {
  let index = 0;
  while (index < value.length) {
    const start = value.indexOf("var(", index);
    if (start === -1) return;

    let depth = 1;
    let end = start + "var(".length;
    while (end < value.length && depth > 0) {
      const char = value[end]!;
      if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
      if (depth === 0) break;
      end += 1;
    }
    if (depth !== 0) {
      throw new VarSyntaxError("unclosed var() call");
    }

    validateVarArgs(value.slice(start + "var(".length, end), ctx, visiting);
    index = end + 1;
  }
}

// Validate every `var()` reference in `value` against the registry and the
// expected context DSL. Throws `VarSyntaxError` on the first failure, including
// circular reference chains.
export function validateVars(value: unknown, ctx: VarRuntimeContext): void {
  if (!containsVar(value)) return;
  scanVars(value, ctx, new Set());
}

// Detect circular `var()` chains across a whole CSS Properties registry. Called
// by the registry builder so a malformed registry fails where it is declared.
export function assertNoVarCycles(
  properties: Record<
    string,
    { syntax: string; inherits: boolean; "initial-value": string }
  >,
  dslConfig: Record<string, string>,
): void {
  const ctx: VarRuntimeContext = {
    dslConfig,
    dsl: "string",
    properties,
    defined: {},
  };
  for (const name of Object.keys(properties)) {
    const initial = properties[name]!["initial-value"];
    if (!containsVar(initial)) continue;
    resolveVar(name, ctx, new Set());
  }
}
