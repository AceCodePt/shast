// CSS `var()` support.
//
// One grammar, two walls, kept in this one file exactly like `calc.ts`:
//
//   * the type wall (`ValidateVar`) scans a written CSS value for every
//     `var(...)` call, resolves each reference against the CSS Properties
//     registry, and fails with a branded `VarError` the author cannot produce.
//   * the runtime wall (`validateVars`) walks the same grammar with balanced
//     parenthesis tracking and detects circular `var()` chains.
//
// Grammar:
//
//   var-expression := `var(` dashed-ident `)`
//   dashed-ident   := `--` <identifier>
//
// `var()` may appear stand-alone (`width: var(--spacing)`), inside `calc()`
// (`calc(var(--spacing) * 2)`), or several times in one shorthand
// (`border: "1px solid var(--c)"`).
//
// There is deliberately NO fallback argument. Per spec a fallback is consulted
// only when the referenced property holds the guaranteed-invalid value; a
// registered property always has a mandatory `initial-value`, and shast rejects
// references to unregistered names, so every `var()` shast emits references a
// property that can never be guaranteed-invalid. A fallback shast validated
// could never be read by the browser, so validating one would be work with no
// effect. See docs/css-var.md for the full argument.
//
// This module does not import `calc.ts`. A written CSS value is dispatched once
// by the engine (`src/engine/index.ts`): calc-shaped values go to calc's
// parser, and values containing `var(` go here. `var()` operands inside a
// `calc()` are calc's business; the engine's separate `VarConstraint` still
// resolves them at the type level, because the dispatch is not exclusive.
//
// Cross-references (name -> syntax type) are read from `CSSPropertiesConfig`.
// The deep engine constraint (`VarConstraint` in `engine/types.ts`) mirrors the
// runtime wiring in `engine/index.ts`.

import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import { type DSLInfer, type SupportedKeywordsConfig } from "tsyntax";

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

// The one message every fallback form is rejected with -- `var(--a, 1px)`,
// `var(--a, )`, `var(--a, x, y)`. Built in one place so the type wall and the
// runtime wall cannot drift, and so the docs pointer rides along.
type NoFallbackError<Subject extends string> =
  VarError<`var() takes no fallback; the registered initial-value of ${Subject} applies instead (see docs/css-var.md)`>;

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

// Resolve a `var(...)` argument list to its resulting type, or a `VarError`.
//
// `var()` takes exactly one argument: a dashed-ident. Any top-level comma is a
// fallback and is rejected wholesale -- `var(--a, 1px)`, `var(--a, )` and
// `var(--a, x, y)` all get the same message. A name can never contain a comma,
// so a comma can only be a fallback separator and needs no depth tracking.
type ResolveVarArgs<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Args extends string,
  Context,
> = TrimVar<Args> extends infer A extends string
  ? A extends `${infer Name},${string}`
    ? TrimVar<Name> extends infer N extends string
      ? N extends ""
        ? NoFallbackError<"the referenced property">
        : NoFallbackError<N>
      : never
    : ResolveVarName<Keywords, Syntax, Props, A, Context>
  : never;

type ResolveVarName<
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
  Name extends string,
  Context,
> = TrimVar<Name> extends infer N extends string
  ? VarNameOk<N> extends true
    ? N extends keyof Props
      ? PropertySyntaxType<Keywords, Syntax, Props, N> extends infer Resolved
        ? ContextOk<Resolved, Context> extends true
          ? Resolved
          : VarError<`'${N}' resolves to a type incompatible with this context`>
        : never
      : // The registry is the single source of truth for custom properties. A
        // name that is not in it is a mistake, never a value to be guessed at.
        VarError<`unknown custom property '${N}'; register it in the CSS Properties config`>
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
            Context
          > extends infer Result
          ? Result extends VarError<string>
            ? Result
            : ScanVars<After, Keywords, Syntax, Props, Context>
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
> = ContainsVar<S> extends true
  ? ScanVars<S, Keywords, Syntax, Props, Context> extends infer Result
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
  ? ResolveVarArgs<Keywords, Syntax, Props, Inner, unknown>
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

// Validate the argument list of one `var()` call. The list must be exactly one
// dashed-ident; any comma is a fallback and is rejected.
function validateVarArgs(
  args: string,
  ctx: VarRuntimeContext,
  visiting: Set<string>,
): void {
  const name = args.trim();
  if (name === "") {
    throw new VarSyntaxError("var() requires a custom property name");
  }

  const comma = name.indexOf(",");
  if (comma !== -1) {
    const referenced = name.slice(0, comma).trim();
    const subject = referenced === "" ? "the referenced property" : referenced;
    throw new VarSyntaxError(
      `var() takes no fallback; the registered initial-value of ${subject} applies instead (see docs/css-var.md)`,
    );
  }

  if (!DASHED_IDENT.test(name)) {
    throw new VarSyntaxError(
      `invalid var() name '${name}': must start with '--'`,
    );
  }

  if (!(name in ctx.properties) && !(name in ctx.defined)) {
    throw new VarSyntaxError(
      `unknown custom property '${name}'; register it in the CSS Properties config`,
    );
  }

  // Resolve the reference (walking its own value) for cycle detection.
  resolveVar(name, ctx, visiting);
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

// Validate every `var()` reference in `value` against the registry. Throws
// `VarSyntaxError` on the first failure, including circular reference chains.
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
): void {
  const ctx: VarRuntimeContext = {
    properties,
    defined: {},
  };
  for (const name of Object.keys(properties)) {
    const initial = properties[name]!["initial-value"];
    if (!containsVar(initial)) continue;
    resolveVar(name, ctx, new Set());
  }
}
