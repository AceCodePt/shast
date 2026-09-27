// CSS `calc()` support.
//
// One grammar, two walls, deliberately kept in this one file:
//
//   * the type wall (`ValidateCalc`) is a recursive template-literal parser
//     that threads a depth counter through the string to (a) find the matching
//     close parenthesis and (b) split the expression at its top-level operators.
//   * the runtime wall (`parseCalc`) is a small tokenizer/parser with the same
//     depth tracking, used by the engine before a value is accepted.
//
// The grammar this slice implements (a flat operand/operator sequence, which is
// the shape `calc()` actually accepts once nested calls are collapsed into
// single operands):
//
//   calc-expression := `calc(` calc-sequence `)`
//   calc-sequence   := calc-operand (op calc-operand)*
//   calc-operand    := calc-expression | var(--name) | <number><unit>? | <percentage>
//   op              := `+` | `-` | `*` | `/`
//
// `+` and `-` must be surrounded by whitespace (CSS `calc(100%-20px)` is
// invalid, `calc(100% - 20px)` is not). `/` requires a unitless `<number>` on
// its right (CSS forbids dividing by a dimension). For every top-level `*`,
// at least one operand in the multiplicative run must be unitless: multiplying
// two dimensions yields a squared unit no property accepts. Consecutive `*`
// form one run, delimited by `+`, `-` and `/`; at most one operand in a run
// may carry a unit.
//
// Literal operands are classified from their written shape (`IsPlainNumber`
// vs `IsNumberDimensionOrPercentage`). `var()` operands are classified through
// the CSS Properties registry via `varUnitKind`, which is why this module
// imports `var.ts` (one direction: var no longer imports calc).
//
// See docs/css-calc.md for the benchmark that backs the recursion depth chosen
// here.

import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import { varUnitKind, type VarUnitKind } from "@/css/var.ts";
import type { SupportedKeywordsConfig } from "tsyntax";

// ---------------------------------------------------------------------------
// Shared vocabulary.
// ---------------------------------------------------------------------------

// Length/dimension units `calc()` may produce in this slice. The list is the
// union of the units the `common`, `full`, and `minimal` syntax-config
// `<length>` tokens allow, so the deep parser never rejects a unit the shallow
// DSL accepted. `fr` covers `<flex>`.
export type CalcUnit =
  | "px"
  | "rem"
  | "em"
  | "vw"
  | "vh"
  | "vmin"
  | "vmax"
  | "ch"
  | "lh"
  | "rlh"
  | "ex"
  | "rex"
  | "cap"
  | "rcap"
  | "ic"
  | "ric"
  | "dvh"
  | "dvw"
  | "dvmin"
  | "dvmax"
  | "svh"
  | "svw"
  | "svmin"
  | "svmax"
  | "lvh"
  | "lvw"
  | "lvmin"
  | "lvmax"
  | "cqw"
  | "cqh"
  | "cqi"
  | "cqb"
  | "cqmin"
  | "cqmax"
  | "in"
  | "pt"
  | "pc"
  | "cm"
  | "mm"
  | "Q"
  | "q"
  | "fr";

export const CALC_UNITS: readonly CalcUnit[] = [
  "px",
  "rem",
  "em",
  "vw",
  "vh",
  "vmin",
  "vmax",
  "ch",
  "lh",
  "rlh",
  "ex",
  "rex",
  "cap",
  "rcap",
  "ic",
  "ric",
  "dvh",
  "dvw",
  "dvmin",
  "dvmax",
  "svh",
  "svw",
  "svmin",
  "svmax",
  "lvh",
  "lvw",
  "lvmin",
  "lvmax",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  "in",
  "pt",
  "pc",
  "cm",
  "mm",
  "Q",
  "q",
  "fr",
];

// A diagnostic string that no author can write as a CSS value. It is a branded
// object, not a string, so a written value can never be assignable to it. The
// brand is a `unique symbol` so even an object literal cannot satisfy it.
declare const CALC_ERROR: unique symbol;

export interface CalcError<Message extends string> {
  readonly [CALC_ERROR]: Message;
}

// ---------------------------------------------------------------------------
// Type wall.
// ---------------------------------------------------------------------------

type CalcOk = true;

// Whitespace-trim is re-implemented here (rather than imported) so this module
// has no dependency on `@/types.ts`; the two are identical.
type TrimCalc<S extends string> = S extends ` ${infer R}`
  ? TrimCalc<R>
  : S extends `${infer L} `
    ? TrimCalc<L>
    : S;

type IsPlainNumber<S extends string> = TrimCalc<S> extends `${number}`
  ? true
  : false;

type IsNumberDimensionOrPercentage<S extends string> =
  TrimCalc<S> extends `${number}%`
    ? true
    : TrimCalc<S> extends `${number}${CalcUnit}`
      ? true
      : IsPlainNumber<S>;

type IsVarOperand<S extends string> = S extends `var(--${infer Name})`
  ? Name extends ""
    ? false
    : Name extends `${string}(${string}`
      ? false
      : Name extends `${string})${string}`
        ? false
        : Name extends `${string} ${string}`
          ? false
          : true
  : false;

// Split the inside of a `calc(...)` at its top-level operators, threading the
// parenthesis depth as a tuple (`[...Depth, unknown]` is one deeper). Returns a
// tuple of alternating operand/operator strings, or a `CalcError`.
type CalcTokens<
  S extends string,
  Depth extends readonly unknown[] = [],
  Current extends string = "",
  Acc extends readonly string[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "("
    ? CalcTokens<Rest, [...Depth, unknown], `${Current}(`, Acc>
    : C extends ")"
      ? Depth extends readonly [unknown, ...infer Deeper]
        ? CalcTokens<Rest, Deeper, `${Current})`, Acc>
        : CalcError<"unbalanced parentheses: unexpected ')'">
      : C extends "+" | "-"
        ? Depth extends readonly []
          ? TrimCalc<Current> extends ""
            ? C extends "-"
              ? // A leading `-` is the sign of the first operand, not an operator.
                CalcTokens<Rest, Depth, `${Current}-`, Acc>
              : CalcError<`operator '${C}' has no left operand`>
            : Current extends `${string} `
              ? Rest extends ` ${string}`
                ? CalcTokens<Rest, Depth, "", [...Acc, TrimCalc<Current>, C]>
                : CalcError<`operator '${C}' must be followed by a space`>
              : CalcError<`operator '${C}' must be preceded by a space`>
          : CalcTokens<Rest, Depth, `${Current}${C}`, Acc>
        : C extends "*" | "/"
          ? Depth extends readonly []
            ? TrimCalc<Current> extends ""
              ? CalcError<`operator '${C}' has no left operand`>
              : CalcTokens<Rest, Depth, "", [...Acc, TrimCalc<Current>, C]>
            : CalcTokens<Rest, Depth, `${Current}${C}`, Acc>
          : CalcTokens<Rest, Depth, `${Current}${C}`, Acc>
  : Depth extends readonly []
    ? TrimCalc<Current> extends ""
      ? Acc
      : [...Acc, TrimCalc<Current>]
    : CalcError<"unbalanced parentheses: unclosed '('">;

type ValidateCalcOperand<
  S extends string,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
> = TrimCalc<S> extends infer T extends string
  ? T extends `calc(${string})`
    ? ValidateCalcOuter<T, Props, Keywords, Syntax>
    : T extends `var(${string})`
      ? IsVarOperand<T> extends true
        ? CalcOk
        : CalcError<`invalid var() operand '${T}'`>
      : IsNumberDimensionOrPercentage<T> extends true
        ? CalcOk
        : CalcError<`invalid operand '${T}'`>
  : CalcError<"invalid operand">;

// The unit an operand carries, for the multiplicative-run rule. A nested
// `calc()` has a result the flat parser does not compute, so it is `unknown`
// and passes. A `var()` reads its registered syntax; an unregistered name is
// `invalid` (var's own wall reports it) and also passes here. Anything else is
// classified from its written shape, exactly as the validator does.
type OperandUnitKind<
  Operand extends string,
  Props extends BaseCSSPropertiesConfig,
> = TrimCalc<Operand> extends infer T extends string
  ? T extends `calc(${string})`
    ? "unknown"
    : T extends `var(${infer Name})`
      ? VarUnitKind<Props, TrimCalc<Name>>
      : IsPlainNumber<T> extends true
        ? "unitless"
        : IsNumberDimensionOrPercentage<T> extends true
          ? "unit-bearing"
          : "invalid"
  : "invalid";

// One operand's contribution to its multiplicative run. `SeenUnit` is the
// first unit-bearing operand in the run (since the last `+`, `-`, or `/`), or
// `null`. A second unit-bearing operand fails and names both operands, in the
// style of the division message. `unknown` and `invalid` never count as units.
type RunStep<
  Operand extends string,
  Props extends BaseCSSPropertiesConfig,
  SeenUnit extends string | null,
> = OperandUnitKind<Operand, Props> extends "unit-bearing"
  ? SeenUnit extends string
    ? CalcError<`multiplication operands '${SeenUnit}' and '${TrimCalc<Operand>}' cannot both carry units; at least one must be unitless`>
    : TrimCalc<Operand>
  : SeenUnit;

// Walk the flat operand/operator tuple and enforce the `*` rule over whole
// runs. Runs are delimited by `+`, `-` and `/`; only consecutive `*` carry the
// state forward, which is what makes `2px * 3 * 4px` fail even though every
// adjacent pair passes.
type ValidateProductRuns<
  T extends readonly string[],
  Props extends BaseCSSPropertiesConfig,
  SeenUnit extends string | null = null,
> = T extends readonly []
  ? CalcOk
  : T extends readonly [infer Only extends string]
    ? RunStep<Only, Props, SeenUnit> extends infer Step
      ? [Step] extends [CalcError<string>]
        ? Step
        : CalcOk
      : never
    : T extends readonly [
          infer Left extends string,
          infer Op extends string,
          ...infer Rest extends string[],
        ]
      ? RunStep<Left, Props, SeenUnit> extends infer Step
        ? [Step] extends [CalcError<string>]
          ? Step
          : ValidateProductRuns<
              Rest,
              Props,
              Op extends "*" ? Extract<Step, string | null> : null
            >
        : never
      : CalcOk;

type ValidateCalcTokens<
  T extends readonly string[],
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
> = T extends readonly []
  ? CalcOk
  : T extends readonly [infer Only extends string]
    ? ValidateCalcOperand<Only, Keywords, Syntax, Props>
    : T extends readonly [
          infer Left extends string,
          infer Op extends string,
          ...infer Rest extends string[],
        ]
      ? ValidateCalcOperand<Left, Keywords, Syntax, Props> extends infer ValidLeft
        ? [ValidLeft] extends [CalcOk]
          ? Op extends "/"
            ? Rest extends readonly [
                infer Right extends string,
                ...infer Rest2 extends string[],
              ]
              ? IsPlainNumber<Right> extends true
                ? ValidateCalcTokens<Rest2, Keywords, Syntax, Props>
                : CalcError<`division right operand '${Right}' must be a number`>
              : CalcError<"division is missing a right operand">
            : Op extends "+" | "-" | "*"
              ? Rest extends readonly []
                ? CalcError<"trailing operator with no right operand">
                : ValidateCalcTokens<Rest, Keywords, Syntax, Props>
              : CalcError<`unsupported operator '${Op}'`>
          : ValidLeft
        : never
      : CalcError<"malformed calc() expression">;

type ValidateCalcOuter<
  S extends string,
  Props extends BaseCSSPropertiesConfig,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
> = TrimCalc<S> extends `calc(${infer Inner})`
  ? CalcTokens<Inner> extends infer Tokens
    ? Tokens extends readonly []
      ? CalcError<"empty calc() expression">
      : Tokens extends readonly string[]
        ? ValidateCalcTokens<Tokens, Keywords, Syntax, Props> extends infer Valid
          ? [Valid] extends [CalcOk]
            ? ValidateProductRuns<Tokens, Props>
            : Valid
          : never
        : Tokens
    : never
  : CalcError<`'${TrimCalc<S>}' is not a calc() expression`>;

// The type wall entry point. Returns the written value on success, or a
// `CalcError` diagnostic the author cannot produce (so the assignment fails).
//
// `Props` / `Keywords` / `Syntax` are only needed to classify `var()` operands
// inside a multiplicative run; they default to empty so the literal grammar can
// be checked on its own (as the tests do).
export type ValidateCalc<
  S extends string,
  Props extends BaseCSSPropertiesConfig = {},
  Keywords extends SupportedKeywordsConfig = {},
  Syntax extends Record<string, string> = {},
> = ValidateCalcOuter<S, Props, Keywords, Syntax> extends infer Result
  ? [Result] extends [CalcOk]
    ? S
    : Result
  : never;

// Whether a written value is a `calc()` expression at all. Used to decide when
// the deep parser should run.
export type IsCalcString<S extends string> =
  TrimCalc<S> extends `calc(${string})` ? true : false;

// ---------------------------------------------------------------------------
// Runtime wall.
// ---------------------------------------------------------------------------

const UNITS = new Set<string>(CALC_UNITS.map((unit) => unit.toLowerCase()));

class CalcSyntaxError extends Error {
  constructor(message: string) {
    super(`Invalid calc() value: ${message}`);
    this.name = "CalcSyntaxError";
  }
}

function isPlainNumber(token: string): boolean {
  return /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token.trim());
}

function isPercentage(token: string): boolean {
  const t = token.trim();
  return t.endsWith("%") && isPlainNumber(t.slice(0, -1));
}

function isDimension(token: string): boolean {
  const t = token.trim();
  const match = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?([a-z%]+)$/i.exec(t);
  if (match === null) return false;
  return match[1] !== "%" && UNITS.has(match[1]!.toLowerCase());
}

function isVarOperand(token: string): boolean {
  const match = /^var\((--[^()\s]+)\)$/.exec(token.trim());
  return match !== null;
}

function isCalcOperand(token: string): boolean {
  return token.trim().startsWith("calc(");
}

// Split a `calc(...)` interior at top-level operators, tracking parenthesis
// depth. This is the runtime twin of the type-level `CalcTokens`.
function tokenizeCalc(inner: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i]!;
    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth < 0) {
        throw new CalcSyntaxError("unbalanced parentheses: unexpected ')'");
      }
      current += char;
      continue;
    }
    if (depth === 0 && (char === "+" || char === "-")) {
      if (current.trim() === "") {
        // A leading `-` signs the operand; a leading `+` is malformed.
        if (char === "-") {
          current += char;
          continue;
        }
        throw new CalcSyntaxError(`operator '${char}' has no left operand`);
      }
      if (!current.endsWith(" ")) {
        throw new CalcSyntaxError(
          `operator '${char}' must be preceded by a space`,
        );
      }
      if (inner[i + 1] !== " ") {
        throw new CalcSyntaxError(
          `operator '${char}' must be followed by a space`,
        );
      }
      tokens.push(current.trim(), char);
      current = "";
      continue;
    }
    if (depth === 0 && (char === "*" || char === "/")) {
      if (current.trim() === "") {
        throw new CalcSyntaxError(`operator '${char}' has no left operand`);
      }
      tokens.push(current.trim(), char);
      current = "";
      continue;
    }
    current += char;
  }

  if (depth !== 0) {
    throw new CalcSyntaxError("unbalanced parentheses: unclosed '('");
  }
  if (current.trim() !== "") {
    tokens.push(current.trim());
  }
  return tokens;
}

// The registry slice calc needs to classify a `var()` operand. Only the
// declared syntax is read -- a lookup, never a walk of the property's value.
export interface CalcVarContext {
  properties: Record<string, { syntax: string }>;
}

// Validate one operand and return the unit it carries, for the run rule. A
// nested `calc()` result is `unknown`; an unregistered `var()` name is
// `unknown` too, so var's own wall reports it rather than a guessed unit.
// Throws on a malformed operand, exactly as `validateCalcOperand` did.
function classifyCalcOperand(
  token: string,
  ctx?: CalcVarContext,
): "unitless" | "unit-bearing" | "unknown" {
  const t = token.trim();
  if (isCalcOperand(t)) {
    parseCalc(t, ctx);
    return "unknown";
  }
  if (t.startsWith("var(")) {
    if (!isVarOperand(t)) {
      throw new CalcSyntaxError(`invalid var() operand '${t}'`);
    }
    if (ctx === undefined) return "unknown";
    const name = t.slice("var(".length, -1).trim();
    const kind = varUnitKind(name, ctx.properties);
    return kind === "invalid" ? "unknown" : kind;
  }
  if (isPlainNumber(t)) return "unitless";
  if (isPercentage(t) || isDimension(t)) return "unit-bearing";
  throw new CalcSyntaxError(`invalid operand '${t}'`);
}

function validateCalcTokens(
  tokens: readonly string[],
  ctx?: CalcVarContext,
): void {
  if (tokens.length === 0) {
    throw new CalcSyntaxError("empty calc() expression");
  }
  // The first unit-bearing operand in the current multiplicative run, or null.
  // `+`, `-` and `/` start a new run; `*` carries the state forward, so a
  // second unit-bearing operand anywhere in the run fails and names both.
  let seenUnit: string | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (i % 2 === 0) {
      const kind = classifyCalcOperand(token, ctx);
      if (kind === "unit-bearing") {
        if (seenUnit !== null) {
          throw new CalcSyntaxError(
            `multiplication operands '${seenUnit}' and '${token.trim()}' cannot both carry units; at least one must be unitless`,
          );
        }
        seenUnit = token.trim();
      }
      continue;
    }
    if (token !== "+" && token !== "-" && token !== "*" && token !== "/") {
      throw new CalcSyntaxError(`unsupported operator '${token}'`);
    }
    if (i + 1 >= tokens.length) {
      throw new CalcSyntaxError("trailing operator with no right operand");
    }
    if (token === "/" && !isPlainNumber(tokens[i + 1]!)) {
      throw new CalcSyntaxError(
        `division right operand '${tokens[i + 1]}' must be a number`,
      );
    }
    if (token !== "*") seenUnit = null;
  }
}

// Parse and validate a `calc()` value. Returns the value unchanged on success
// so it can be threaded straight into the render pipeline. `ctx` supplies the
// registry used to classify `var()` operands inside a multiplicative run.
export function parseCalc(value: string, ctx?: CalcVarContext): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("calc(") || !trimmed.endsWith(")")) {
    throw new CalcSyntaxError(`'${value}' is not a calc() expression`);
  }
  const inner = trimmed.slice("calc(".length, -1);
  validateCalcTokens(tokenizeCalc(inner), ctx);
  return value;
}

// True when the value looks like a `calc()` call and therefore must clear the
// deep parser. Mirrors the type-level `IsCalcString`.
export function isCalcString(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith("calc(");
}
