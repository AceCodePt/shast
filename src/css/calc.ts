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
// invalid, `calc(100% - 20px)` is not). The three binary rules are type
// arithmetic over dimensions:
//
//   * `+`/`-` require both sides to have the same dimension, or one side to be
//     a percentage (which resolves against the other). `calc(2s + 3px)` is
//     rejected; `calc(100% - 40px)`, `calc(50vw + 2rem)` and `calc(2s + 500ms)`
//     stand.
//   * `*` allows at most one unit-bearing operand in a run, so the product is a
//     single dimension (or unitless). `calc(2px * 3px)` is rejected.
//   * `/` allows a unitless right operand (the result keeps the left's
//     dimension) or a right operand of the same dimension (the units cancel and
//     the result is a number). `calc(10px / 2px)` and `calc(1s / 100ms)` stand;
//     `calc(100% / 2px)` does not.
//
// A nested `calc()` operand is not recomputed by this flat parser and an
// unregistered `var()` name is left to var's own wall, so both classify as an
// unknown dimension and pass every rule (slot included).
//
// Literal operands are classified from their written shape (`IsPlainNumber`
// vs `IsNumberDimensionOrPercentage`). `var()` operands are classified through
// the CSS Properties registry via `varUnitKind` (unit-bearing or not) and
// `varDimensions` (which dimension), which is why this module imports `var.ts`
// (one direction: var no longer imports calc).
//
// See docs/css-calc.md for the benchmark that backs the recursion depth chosen
// here.

import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";
import {
  varDimensions,
  varUnitKind,
  type VarDimensionAtom,
  type VarDimensions,
  type VarUnitKind,
} from "@/css/var.ts";
import type { SupportedKeywordsConfig } from "tsyntax";

// ---------------------------------------------------------------------------
// Shared vocabulary.
// ---------------------------------------------------------------------------

// The unit families `calc()` may produce. `fr` covers `<flex>`. `<resolution>`
// is deliberately absent: nothing wires `<calc>` into it, so its units cannot
// reach this parser. The three shipped syntax configs declare every unit below,
// so the deep parser never rejects a unit the shallow DSL accepted.
export type LengthUnit =
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
  | "q";

export type AngleUnit = "deg" | "rad" | "turn" | "grad";
export type TimeUnit = "s" | "ms";
export type FrequencyUnit = "Hz" | "kHz";
export type FlexUnit = "fr";

export type CalcUnit =
  | LengthUnit
  | AngleUnit
  | TimeUnit
  | FrequencyUnit
  | FlexUnit;

// The dimension an operand carries, once its unit (or lack of one) is known.
// `VarDimensionAtom` is owned by `var.ts` so the registry classifier and the
// calc algebra agree on the vocabulary.
export type CalcDimension = VarDimensionAtom;

// A calc result/operand is a set of possible dimensions (a union) or `unknown`
// (`unknown` absorbs, and turns every rule and the slot check off).
type AtomSet = CalcDimension | "unknown";

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
  "deg",
  "rad",
  "turn",
  "grad",
  "s",
  "ms",
  "Hz",
  "kHz",
];

// A diagnostic string that no author can write as a CSS value. It is a branded
// object, not a string, so a written value can never be assignable to it. The
// brand is a `unique symbol` so even an object literal cannot satisfy it.
declare const CALC_ERROR: unique symbol;

export interface CalcError<Message extends string> {
  readonly [CALC_ERROR]: Message;
}

// The one wording for each shape rule, shared by both walls so they cannot
// drift.
//
// Boundary rule: a value that begins with `calc(` is a composite only when the
// leading call is followed by whitespace (the remaining calls are then
// scanned). A leading call followed by any other character -- `calc(1px))`,
// `calc(1px)x` -- is malformed, not a composite.
const CALC_BOUNDARY_MESSAGE =
  "a leading calc() call must be followed by whitespace before any further tokens";
const CALC_UNCLOSED_MESSAGE = "unclosed calc() call";

// ---------------------------------------------------------------------------
// Type wall.
// ---------------------------------------------------------------------------

type CalcOk = true;

// Whitespace-trim is re-implemented here (rather than imported) so this module
// has no dependency on `@/types.ts`. It trims the CSS whitespace set (space,
// tab, newline, carriage return, form feed), which is what the runtime
// `.trim()` sees in a real CSS value.
type TrimCalc<S extends string> = S extends
  | ` ${infer R}`
  | `\t${infer R}`
  | `\n${infer R}`
  | `\r${infer R}`
  | `\f${infer R}`
  ? TrimCalc<R>
  : S extends
        | `${infer L} `
        | `${infer L}\t`
        | `${infer L}\n`
        | `${infer L}\r`
        | `${infer L}\f`
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

// The dimension a literal operand carries, from its written unit. `never` when
// the operand is not a recognised dimension (a plain number is handled before
// this is reached). `%` is its own dimension; the arithmetic treats it as the
// wildcard.
type LiteralDimension<S extends string> =
  TrimCalc<S> extends `${number}%`
    ? "percentage"
    : TrimCalc<S> extends `${number}${LengthUnit}`
      ? "length"
      : TrimCalc<S> extends `${number}${AngleUnit}`
        ? "angle"
        : TrimCalc<S> extends `${number}${TimeUnit}`
          ? "time"
          : TrimCalc<S> extends `${number}${FrequencyUnit}`
            ? "frequency"
            : TrimCalc<S> extends `${number}${FlexUnit}`
              ? "flex"
              : never;

// The dimension(s) a `var()` operand carries, read from its registered syntax.
// An unregistered name is `unknown` (var's own wall reports it) rather than a
// guessed unit.
type OperandDimensions<
  Operand extends string,
  Props extends BaseCSSPropertiesConfig,
> = TrimCalc<Operand> extends infer T extends string
  ? T extends `calc(${string})`
    ? "unknown"
    : T extends `var(${infer Name})`
      ? T extends `var(--${string})`
        ? VarDimensions<Props, TrimCalc<Name>>
        : "unknown"
      : IsPlainNumber<T> extends true
        ? "number"
        : LiteralDimension<T> extends infer D
          ? [D] extends [never]
            ? "unknown"
            : D
          : "unknown"
  : "unknown";

// Whether an operand carries a unit, for the multiplication rule. This is kept
// distinct from `OperandDimensions`: a registered syntax the classifier cannot
// place (`<color>`) is still unit-bearing, exactly as `varUnitKind` says, even
// though its dimension is unknown.
type OperandUnitBearing<
  Operand extends string,
  Props extends BaseCSSPropertiesConfig,
> = TrimCalc<Operand> extends infer T extends string
  ? T extends `calc(${string})`
    ? false
    : T extends `var(${infer Name})`
      ? IsVarOperand<T> extends true
        ? VarUnitKind<Props, TrimCalc<Name>> extends "unit-bearing"
          ? true
          : false
        : false
      : IsPlainNumber<T> extends true
        ? false
        : IsNumberDimensionOrPercentage<T> extends true
          ? true
          : false
  : false;

// Collapse a distributed union that may contain `CalcError`s: a single error is
// itself (so the author sees it), a union of one is the union, and a union with
// an error anywhere is the error (any binding that fails, fails the value).
type AnyCalcError<T> = Extract<T, CalcError<string>>;
type Settle<T> = [AnyCalcError<T>] extends [never] ? T : AnyCalcError<T>;

// `*` on two known dimensions. The caller has already rejected two units, so at
// least one side is a number and this never errors in practice.
type MulAtom<A extends CalcDimension, B extends CalcDimension> =
  A extends "number" ? B : B extends "number" ? A : CalcError<"multiplication operands cannot both carry units; at least one must be unitless">;

type MulAtoms<A extends AtomSet, B extends AtomSet> =
  "unknown" extends A | B
    ? "unknown"
    : Settle<
        A extends any
          ? B extends any
            ? MulAtom<A & CalcDimension, B & CalcDimension>
            : never
          : never
      >;

// `/` on two known dimensions: a unitless right operand keeps the left's
// dimension; the same dimension on both sides cancels to a number; anything
// else is a diagnostic.
type DivAtom<
  A extends CalcDimension,
  B extends CalcDimension,
  Right extends string,
> = B extends "number"
  ? A
  : A extends B
    ? "number"
    : CalcError<`division right operand '${TrimCalc<Right>}' must be a number, or both operands must have the same type`>;

type DivAtoms<
  A extends AtomSet,
  B extends AtomSet,
  Right extends string,
> = "unknown" extends A | B
  ? "unknown"
  : Settle<
      A extends any
        ? B extends any
          ? DivAtom<A & CalcDimension, B & CalcDimension, Right>
          : never
        : never
    >;

// `+`/`-` on two known dimensions: equal dimensions stand; a percentage on
// either side contributes itself plus the other; otherwise a diagnostic.
type AddAtom<
  A extends CalcDimension,
  B extends CalcDimension,
  ARep extends string | null,
  BRep extends string | null,
> = A extends "percentage"
  ? "percentage" | B
  : B extends "percentage"
    ? "percentage" | A
    : A extends B
      ? A
      : CalcError<`addition operands '${ARep & string}' and '${BRep & string}' have incompatible types; both must have the same type, or one must be a percentage`>;

type AddAtoms<
  A extends AtomSet,
  B extends AtomSet,
  ARep extends string | null,
  BRep extends string | null,
> = "unknown" extends A | B
  ? "unknown"
  : Settle<
      A extends any
        ? B extends any
          ? AddAtom<A & CalcDimension, B & CalcDimension, ARep, BRep>
          : never
        : never
    >;

type MultiplicationError<
  Rep extends string | null,
  Operand extends string,
> = CalcError<`multiplication operands '${Rep & string}' and '${TrimCalc<Operand>}' cannot both carry units; at least one must be unitless`>;

// Walk the flat operand/operator tuple, folding a multiplicative `term` and an
// additive `sum`. `termUnit`/`termUnitRep` remember the single unit-bearing
// operand of the current term so the multiplication message can name both
// sides. `sum` is `"empty"` until the first `+`/`-`.
type EvalSteps<
  Tokens extends readonly string[],
  Props extends BaseCSSPropertiesConfig,
  TermDims extends AtomSet,
  TermUnit extends boolean,
  TermUnitRep extends string | null,
  TermRep extends string,
  SumDims extends AtomSet | "empty" | CalcError<string>,
  PrevTermRep extends string | null,
> = Tokens extends readonly [
  infer Op extends string,
  infer Operand extends string,
  ...infer Rest extends string[],
]
  ? Op extends "*"
    ? OperandUnitBearing<Operand, Props> extends true
      ? TermUnit extends true
        ? MultiplicationError<TermUnitRep, Operand>
        : EvalSteps<
            Rest,
            Props,
            MulAtoms<TermDims, OperandDimensions<Operand, Props>>,
            true,
            Operand,
            TermRep,
            SumDims,
            PrevTermRep
          >
      : EvalSteps<
          Rest,
          Props,
          MulAtoms<TermDims, OperandDimensions<Operand, Props>>,
          TermUnit,
          TermUnitRep,
          TermRep,
          SumDims,
          PrevTermRep
        >
    : Op extends "/"
      ? OperandUnitBearing<Operand, Props> extends false
        ? EvalSteps<
            Rest,
            Props,
            TermDims,
            TermUnit,
            TermUnitRep,
            TermRep,
            SumDims,
            PrevTermRep
          >
        : DivAtoms<
              TermDims,
              OperandDimensions<Operand, Props>,
              Operand
            > extends infer D
          ? [D] extends [CalcError<string>]
            ? D
            : EvalSteps<
                Rest,
                Props,
                D & AtomSet,
                false,
                null,
                TermRep,
                SumDims,
                PrevTermRep
              >
          : never
      : Op extends "+" | "-"
        ? SumDims extends "empty"
          ? EvalSteps<
              Rest,
              Props,
              OperandDimensions<Operand, Props>,
              OperandUnitBearing<Operand, Props>,
              OperandUnitBearing<Operand, Props> extends true
                ? Operand
                : null,
              Operand,
              TermDims,
              TermRep
            >
          : SumDims extends CalcError<string>
            ? SumDims
            : AddAtoms<
                  SumDims & AtomSet,
                  TermDims,
                  PrevTermRep,
                  TermRep
                > extends infer S
              ? [S] extends [CalcError<string>]
                ? S
                : EvalSteps<
                    Rest,
                    Props,
                    OperandDimensions<Operand, Props>,
                    OperandUnitBearing<Operand, Props>,
                    OperandUnitBearing<Operand, Props> extends true
                      ? Operand
                      : null,
                    Operand,
                    S & AtomSet,
                    TermRep
                  >
              : never
        : never
  : SumDims extends "empty"
    ? TermDims
    : SumDims extends CalcError<string>
      ? SumDims
      : AddAtoms<SumDims & AtomSet, TermDims, PrevTermRep, TermRep>;

type EvalCalc<
  Tokens extends readonly string[],
  Props extends BaseCSSPropertiesConfig,
> = Tokens extends readonly [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? EvalSteps<
      Rest,
      Props,
      OperandDimensions<First, Props>,
      OperandUnitBearing<First, Props>,
      OperandUnitBearing<First, Props> extends true ? First : null,
      First,
      "empty",
      null
    >
  : never;

// The dimensions a slot's syntax accepts, when the DSL is one of the named
// numeric tokens. `"unknown"` means "cannot tell", which turns the check off.
// The token set must stay in step with the runtime `slotDimensionsOf`.
//
// A lookup table rather than a conditional chain: this is evaluated for every
// candidate property, and one indexed access is markedly cheaper than walking
// a dozen `extends` branches (about -2,300 instantiations per program on the
// bench corpus). The table is also the readable form of the mapping.
type SlotAtomLookup = {
  "<number>": "number";
  "<integer>": "number";
  "<percentage>": "percentage";
  "<length>": "length";
  "<line-width>": "length";
  "<angle>": "angle";
  "<time>": "time";
  "<frequency>": "frequency";
  "<flex>": "flex";
  "<alpha-value>": "number" | "percentage";
  "<length-percentage>": "length" | "percentage";
  "<length> | <percentage>": "length" | "percentage";
  "<angle-percentage>": "angle" | "percentage";
  "<angle> | <percentage>": "angle" | "percentage";
  "<time-percentage>": "time" | "percentage";
  "<time> | <percentage>": "time" | "percentage";
  "<frequency-percentage>": "frequency" | "percentage";
  "<frequency> | <percentage>": "frequency" | "percentage";
  "<track-breadth>": "length" | "percentage" | "flex";
  "<track-size>": "length" | "percentage" | "flex";
};

type SlotAtom<T extends string> =
  TrimCalc<T> extends infer S extends string
    ? S extends keyof SlotAtomLookup
      ? SlotAtomLookup[S]
      : "unknown"
    : "unknown";

// Distributive so a union of DSLs (every gate that unlocks a key) becomes the
// union of what they accept, and any unrecognised member makes it `unknown`.
export type CalcSlotAtoms<DSL extends string> = DSL extends string
  ? SlotAtom<DSL>
  : never;

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
    ? ValidateCalcOuter<T, Props, Keywords, Syntax, "unknown">
    : T extends `var(${string})`
      ? IsVarOperand<T> extends true
        ? CalcOk
        : CalcError<`invalid var() operand '${T}'`>
      : IsNumberDimensionOrPercentage<T> extends true
        ? CalcOk
        : CalcError<`invalid operand '${T}'`>
  : CalcError<"invalid operand">;

// Validate every operand (including a nested `calc()`'s grammar) and the
// operator structure. The dimension rules are a separate pass (`EvalCalc`), so
// a malformed operand is reported before a dimension mismatch.
type ValidateCalcTokens<
  T extends readonly string[],
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Props extends BaseCSSPropertiesConfig,
> = T extends readonly []
  ? CalcError<"empty calc() expression">
  : T extends readonly [infer Only extends string]
    ? ValidateCalcOperand<Only, Keywords, Syntax, Props>
    : T extends readonly [
          infer Left extends string,
          infer Op extends string,
          ...infer Rest extends string[],
        ]
      ? ValidateCalcOperand<Left, Keywords, Syntax, Props> extends infer ValidLeft
        ? [ValidLeft] extends [CalcOk]
          ? Op extends "+" | "-" | "*" | "/"
            ? Rest extends readonly []
              ? CalcError<"trailing operator with no right operand">
              : ValidateCalcTokens<Rest, Keywords, Syntax, Props>
            : CalcError<`unsupported operator '${Op}'`>
          : ValidLeft
        : never
      : CalcError<"malformed calc() expression">;

// Attach the slot check: the calc result must be assignable to the dimensions
// the property's syntax accepts. `unknown` on either side turns it off.
type CheckSlot<R extends AtomSet, Expected> = "unknown" extends R
  ? CalcOk
  : [Expected] extends ["unknown"]
    ? CalcOk
    : [Exclude<R, "unknown">] extends [Expected]
      ? CalcOk
      : CalcError<`calc() result type '${Exclude<R, "unknown"> & string}' is not valid for this property`>;

type ValidateCalcOuter<
  S extends string,
  Props extends BaseCSSPropertiesConfig,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
  Expected,
> = TrimCalc<S> extends `calc(${infer Inner})`
  ? CalcTokens<Inner> extends infer Tokens
    ? Tokens extends readonly []
      ? CalcError<"empty calc() expression">
      : Tokens extends readonly string[]
        ? ValidateCalcTokens<Tokens, Keywords, Syntax, Props> extends infer Valid
          ? [Valid] extends [CalcOk]
            ? EvalCalc<Tokens, Props> extends infer Result
              ? [Result] extends [CalcError<string>]
                ? Result
                : CheckSlot<Result & AtomSet, Expected>
              : never
            : Valid
          : never
        : Tokens
    : never
  : CalcError<`'${TrimCalc<S>}' is not a calc() expression`>;

// The type wall entry point. Returns the written value on success, or a
// `CalcError` diagnostic the author cannot produce (so the assignment fails).
//
// `Props` / `Keywords` / `Syntax` classify `var()` operands inside the
// expression; they default to empty so the literal grammar can be checked on
// its own (as the tests do). `Expected` is the dimension(s) the slot accepts,
// `"unknown"` when it cannot be determined.
export type ValidateCalc<
  S extends string,
  Props extends BaseCSSPropertiesConfig = {},
  Keywords extends SupportedKeywordsConfig = {},
  Syntax extends Record<string, string> = {},
  Expected extends AtomSet = "unknown",
> = ValidateCalcOuter<S, Props, Keywords, Syntax, Expected> extends infer Result
  ? [Result] extends [CalcOk]
    ? S
    : Result
  : never;

// Whether a written value contains at least one `calc(` call. Like `var()`,
// calc can appear anywhere in a value, so the deep wall is triggered on a
// substring rather than a prefix.
export type ContainsCalc<S extends string> =
  S extends `${string}calc(${string}` ? true : false;

// Find the first `calc(` in `S`. Yields `[unknown, Rest]` where `Rest` is
// everything after the literal `calc(`; `null` when `S` has no `calc(`.
type SplitOnCalc<S extends string> =
  S extends `${string}calc(${infer Rest}` ? [unknown, Rest] : null;

// Given the text just after `calc(`, consume characters until the matching
// close parenthesis, threading depth. Returns `[Arguments, Remainder]` where
// `Remainder` starts just after the close paren, or a `CalcError` when the call
// is unclosed. Mirrors `ExtractVarCall`.
type ExtractCalcCall<
  Rest extends string,
  Depth extends readonly unknown[] = [],
  Acc extends string = "",
> = Rest extends `${infer C}${infer R}`
  ? C extends "("
    ? ExtractCalcCall<R, [...Depth, unknown], `${Acc}(`>
    : C extends ")"
      ? Depth extends readonly [unknown, ...infer Deeper]
        ? ExtractCalcCall<R, Deeper, `${Acc})`>
        : [Acc, R]
      : ExtractCalcCall<R, Depth, `${Acc}${C}`>
  : CalcError<typeof CALC_UNCLOSED_MESSAGE>;

// Whether a remainder begins with CSS whitespace. Used by the boundary rule.
type StartsWithWhitespace<S extends string> =
  S extends `${" " | "\t" | "\n" | "\r" | "\f"}${string}` ? true : false;

// The boundary rule, stated once: a value that begins with `calc(` is a
// composite only when the leading call is followed by whitespace. A whole-value
// call (nothing after the close) is fine too. Any other character means the
// value is malformed.
type CheckCalcBoundary<S extends string> =
  TrimCalc<S> extends `calc(${infer Rest}`
    ? ExtractCalcCall<Rest> extends infer Call
      ? Call extends readonly [
          infer _Args extends string,
          infer After extends string,
        ]
        ? TrimCalc<After> extends ""
          ? CalcOk
          : StartsWithWhitespace<After> extends true
            ? CalcOk
            : CalcError<typeof CALC_BOUNDARY_MESSAGE>
        : Call
      : never
    : CalcOk;

// Validate every call in `S`, left to right. A call is validated once and the
// scan resumes after its close, so a nested call is not validated twice (the
// deep parser already checks nested operands). Mirrors `ScanVars`.
type ScanCalcs<
  S extends string,
  Props extends BaseCSSPropertiesConfig,
  Keywords extends SupportedKeywordsConfig,
  Syntax extends Record<string, string>,
> = SplitOnCalc<S> extends infer Split
  ? Split extends readonly [unknown, infer Rest extends string]
    ? ExtractCalcCall<Rest> extends infer Call
      ? Call extends readonly [
          infer Args extends string,
          infer After extends string,
        ]
        ? ValidateCalcOuter<
            `calc(${Args})`,
            Props,
            Keywords,
            Syntax,
            "unknown"
          > extends infer Result
          ? [Result] extends [CalcOk]
            ? ScanCalcs<After, Props, Keywords, Syntax>
            : Result
          : never
        : Call
      : never
    : CalcOk
  : never;

// The deep entry point for an arbitrary written value. The slot check
// (`Expected`) applies only when one balanced call spans the whole trimmed
// value -- the only case with a dimension to check. An embedded call is
// grammar-checked with `Expected = "unknown"`.
export type ValidateCalcs<
  S extends string,
  Props extends BaseCSSPropertiesConfig = {},
  Keywords extends SupportedKeywordsConfig = {},
  Syntax extends Record<string, string> = {},
  Expected extends AtomSet = "unknown",
> = ContainsCalc<S> extends true
  ? IsCalcString<S> extends true
    ? ValidateCalcOuter<
        S,
        Props,
        Keywords,
        Syntax,
        Expected
      > extends infer Result
      ? [Result] extends [CalcOk]
        ? S
        : Result
      : never
    : CheckCalcBoundary<S> extends infer Boundary
      ? [Boundary] extends [CalcOk]
        ? ScanCalcs<TrimCalc<S>, Props, Keywords, Syntax> extends infer Result
          ? [Result] extends [CalcOk]
            ? S
            : Result
          : never
        : Boundary
      : never
  : S;

// Whether a written value is exactly one balanced `calc()` call -- the only
// shape that has a slot to check. A prefix test is not enough: the call's
// matching close must be the end of the trimmed value.
export type IsCalcString<S extends string> =
  TrimCalc<S> extends `calc(${infer Rest}`
    ? ExtractCalcCall<Rest> extends infer Call
      ? Call extends readonly [
          infer _Args extends string,
          infer After extends string,
        ]
        ? TrimCalc<After> extends ""
          ? true
          : false
        : false
      : never
    : false;

// ---------------------------------------------------------------------------
// Runtime wall.
// ---------------------------------------------------------------------------

const LENGTH_UNITS = new Set<string>([
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
  "q",
]);
const ANGLE_UNITS = new Set<string>(["deg", "rad", "turn", "grad"]);
const TIME_UNITS = new Set<string>(["s", "ms"]);
const FREQUENCY_UNITS = new Set<string>(["hz", "khz"]);

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

function isVarOperand(token: string): boolean {
  const match = /^var\((--[^()\s]+)\)$/.exec(token.trim());
  return match !== null;
}

function isCalcOperand(token: string): boolean {
  return token.trim().startsWith("calc(");
}

// The dimension a literal token carries, or `null` when it is not a recognised
// dimension. A plain number is handled before this is reached.
function literalDimension(token: string): CalcDimension | null {
  const t = token.trim();
  if (isPercentage(t)) return "percentage";
  const match = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?([a-z%]+)$/i.exec(t);
  if (match === null) return null;
  const unit = match[1]!.toLowerCase();
  if (unit === "%") return "percentage";
  if (LENGTH_UNITS.has(unit)) return "length";
  if (ANGLE_UNITS.has(unit)) return "angle";
  if (TIME_UNITS.has(unit)) return "time";
  if (FREQUENCY_UNITS.has(unit)) return "frequency";
  if (unit === "fr") return "flex";
  return null;
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

// The registry slice calc needs to classify a `var()` operand and the
// dimension(s) the slot accepts. `expected` is the runtime twin of the type
// wall's `CalcSlotAtoms`; `undefined` turns the slot check off.
export interface CalcVarContext {
  properties: Record<string, { syntax: string }>;
  expected?: readonly CalcDimension[] | undefined;
}

// The dimensions a slot's syntax token accepts, or `undefined` when the DSL is
// not a named numeric token. Must stay in step with the type-level `SlotAtom`.
const SLOT_DIMENSIONS: Record<string, readonly CalcDimension[]> = {
  "<number>": ["number"],
  "<integer>": ["number"],
  "<percentage>": ["percentage"],
  "<length>": ["length"],
  "<line-width>": ["length"],
  "<angle>": ["angle"],
  "<time>": ["time"],
  "<frequency>": ["frequency"],
  "<flex>": ["flex"],
  "<alpha-value>": ["number", "percentage"],
  "<length-percentage>": ["length", "percentage"],
  "<length> | <percentage>": ["length", "percentage"],
  "<angle-percentage>": ["angle", "percentage"],
  "<angle> | <percentage>": ["angle", "percentage"],
  "<time-percentage>": ["time", "percentage"],
  "<time> | <percentage>": ["time", "percentage"],
  "<frequency-percentage>": ["frequency", "percentage"],
  "<frequency> | <percentage>": ["frequency", "percentage"],
  "<track-breadth>": ["length", "percentage", "flex"],
  "<track-size>": ["length", "percentage", "flex"],
};

export function slotDimensionsOf(
  dsl: string,
): readonly CalcDimension[] | undefined {
  return SLOT_DIMENSIONS[dsl.trim()];
}

interface OperandDims {
  dims: Set<CalcDimension>;
  // Whether the operand carries a unit (the multiplication rule's input).
  unit: boolean;
  // Whether the dimension is genuinely unknown (nested calc, unregistered
  // var, or a registered syntax the classifier cannot place). Turns the slot
  // check and the additive/division dimension rules off.
  unknown: boolean;
}

function unknownDims(unit = false): OperandDims {
  return { dims: new Set(), unit, unknown: true };
}

// Validate one operand and classify its dimension(s). Throws on a malformed
// operand. A nested `calc()` is recursively parsed and treated as unknown.
function classifyCalcOperand(
  token: string,
  ctx?: CalcVarContext,
): OperandDims {
  const t = token.trim();
  if (isCalcOperand(t)) {
    // A nested calc is validated in full, but its slot is unknown to this
    // expression (the parser does not recompute its result), so the outer
    // slot must not leak into it -- the type wall does the same.
    parseCalc(
      t,
      ctx === undefined ? undefined : { properties: ctx.properties },
    );
    return unknownDims();
  }
  if (t.startsWith("var(")) {
    if (!isVarOperand(t)) {
      throw new CalcSyntaxError(`invalid var() operand '${t}'`);
    }
    if (ctx === undefined) return unknownDims();
    const name = t.slice("var(".length, -1).trim();
    const kind = varUnitKind(name, ctx.properties);
    if (kind === "invalid") return unknownDims();
    const dims = varDimensions(name, ctx.properties);
    return {
      dims: dims === undefined ? new Set() : dims,
      unit: kind !== "unitless",
      unknown: dims === undefined,
    };
  }
  if (isPlainNumber(t)) {
    return { dims: new Set(["number"]), unit: false, unknown: false };
  }
  const dimension = literalDimension(t);
  if (dimension !== null) {
    return { dims: new Set([dimension]), unit: true, unknown: false };
  }
  throw new CalcSyntaxError(`invalid operand '${t}'`);
}

function multiplyDims(a: OperandDims, b: OperandDims): OperandDims {
  const unit = a.unit || b.unit;
  if (a.unknown || b.unknown) return unknownDims(unit);
  const dims = new Set<CalcDimension>();
  for (const x of a.dims) {
    for (const y of b.dims) {
      if (x === "number") dims.add(y);
      else if (y === "number") dims.add(x);
      else {
        throw new CalcSyntaxError(
          "multiplication operands cannot both carry units; at least one must be unitless",
        );
      }
    }
  }
  return { dims, unit, unknown: false };
}

function sameSingleDimension(a: OperandDims, b: OperandDims): boolean {
  if (a.unknown || b.unknown || a.dims.size !== 1 || b.dims.size !== 1) {
    return false;
  }
  const [x] = a.dims;
  const [y] = b.dims;
  return x === y;
}

function addDims(
  a: OperandDims,
  b: OperandDims,
  aRep: string | null,
  bRep: string | null,
): OperandDims {
  if (a.unknown || b.unknown) return unknownDims();
  const dims = new Set<CalcDimension>();
  for (const x of a.dims) {
    for (const y of b.dims) {
      if (x === y) dims.add(x);
      else if (x === "percentage") {
        dims.add("percentage");
        dims.add(y);
      } else if (y === "percentage") {
        dims.add("percentage");
        dims.add(x);
      } else {
        throw new CalcSyntaxError(
          `addition operands '${aRep ?? "?"}' and '${bRep ?? "?"}' have incompatible types; both must have the same type, or one must be a percentage`,
        );
      }
    }
  }
  return { dims, unit: false, unknown: false };
}

// Fold the flat token list into the expression's dimension(s), enforcing the
// `+`/`-` and `/` rules. The multiplication rule is enforced while the term's
// unit is tracked, so its message can name the two conflicting operands.
function evaluateCalcTokens(
  tokens: readonly string[],
  ctx?: CalcVarContext,
): OperandDims {
  if (tokens.length === 0) {
    throw new CalcSyntaxError("empty calc() expression");
  }
  let term = classifyCalcOperand(tokens[0]!, ctx);
  let termUnitRep: string | null = term.unit ? tokens[0]!.trim() : null;
  let termRep = tokens[0]!.trim();
  let sum: OperandDims | null = null;
  let sumRep: string | null = null;

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]!;
    if (i + 1 >= tokens.length) {
      throw new CalcSyntaxError("trailing operator with no right operand");
    }
    const operand = tokens[i + 1]!;
    const rhs = classifyCalcOperand(operand, ctx);

    if (op === "*") {
      if (term.unit && rhs.unit) {
        throw new CalcSyntaxError(
          `multiplication operands '${termUnitRep ?? "?"}' and '${operand.trim()}' cannot both carry units; at least one must be unitless`,
        );
      }
      term = multiplyDims(term, rhs);
      if (term.unit && termUnitRep === null) termUnitRep = operand.trim();
    } else if (op === "/") {
      if (!rhs.unit) {
        // Dividing by a number keeps the left operand's dimension.
      } else if (term.unknown || rhs.unknown) {
        term = unknownDims();
        termUnitRep = null;
      } else if (sameSingleDimension(term, rhs)) {
        term = { dims: new Set(["number"]), unit: false, unknown: false };
        termUnitRep = null;
      } else {
        throw new CalcSyntaxError(
          `division right operand '${operand.trim()}' must be a number, or both operands must have the same type`,
        );
      }
    } else {
      if (sum === null) sum = term;
      else sum = addDims(sum, term, sumRep, termRep);
      sumRep = termRep;
      term = rhs;
      termUnitRep = rhs.unit ? operand.trim() : null;
      termRep = operand.trim();
    }
  }

  return sum === null ? term : addDims(sum, term, sumRep, termRep);
}

// The index of the matching close parenthesis for the `calc(` whose opening
// paren is at `start`, or a throw when the call never closes. Mirrors the
// type-level `ExtractCalcCall`.
function findCalcCallEnd(value: string, start: number): number {
  let depth = 1;
  for (let i = start + "calc(".length; i < value.length; i++) {
    const char = value[i]!;
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new CalcSyntaxError(CALC_UNCLOSED_MESSAGE);
}

// Whether the trimmed text is exactly one balanced `calc()` call. Mirrors the
// type-level `IsCalcString`; never throws (an unclosed call is simply not a
// whole-value call, and the scanner reports it).
function isWholeCalcString(trimmed: string): boolean {
  if (!trimmed.startsWith("calc(")) return false;
  try {
    const end = findCalcCallEnd(trimmed, 0);
    return trimmed.slice(end + 1) === "";
  } catch {
    return false;
  }
}

// Parse and validate one whole `calc()` value. Returns the value unchanged on
// success so it can be threaded straight into the render pipeline. `ctx`
// supplies the registry used to classify `var()` operands and the dimension(s)
// the slot accepts.
//
// The leading call's matching close is found by depth, not by slicing to the
// last character. A value whose first call does not span the whole text is
// rejected here: a non-whitespace remainder is the boundary error, and a
// whitespace remainder is a composite (which `validateCalcs` handles).
export function parseCalc(value: string, ctx?: CalcVarContext): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("calc(")) {
    throw new CalcSyntaxError(`'${value}' is not a calc() expression`);
  }
  const end = findCalcCallEnd(trimmed, 0);
  const after = trimmed.slice(end + 1);
  if (after !== "") {
    if (!/^\s/.test(after)) {
      throw new CalcSyntaxError(CALC_BOUNDARY_MESSAGE);
    }
    throw new CalcSyntaxError(`'${value}' is not a single calc() expression`);
  }
  const inner = trimmed.slice("calc(".length, end);
  const result = evaluateCalcTokens(tokenizeCalc(inner), ctx);
  if (ctx?.expected !== undefined && !result.unknown) {
    for (const dimension of result.dims) {
      if (!ctx.expected.includes(dimension)) {
        throw new CalcSyntaxError(
          `calc() result type '${dimension}' is not valid for this property`,
        );
      }
    }
  }
  return value;
}

// True when the value is a whole, balanced `calc()` call and therefore must
// clear the deep parser with its slot check. Mirrors the type-level
// `IsCalcString`. A composite that merely begins with `calc(` is not one.
export function isCalcString(value: unknown): value is string {
  return typeof value === "string" && isWholeCalcString(value.trim());
}

// Whether the value contains at least one `calc(` call anywhere. Mirrors the
// type-level `ContainsCalc` (and `containsVar`).
export function containsCalc(value: unknown): value is string {
  return typeof value === "string" && value.includes("calc(");
}

// Scan a value for every `calc()` call and validate it. The slot check applies
// only when one call spans the whole value; an embedded call is grammar-checked
// alone. A call is validated once and the scan resumes after its close, so a
// nested call is not validated twice. Mirrors `ScanVars` / `validateVars`.
export function validateCalcs(value: unknown, ctx: CalcVarContext): void {
  if (!containsCalc(value)) return;

  const trimmed = value.trim();
  const whole = isWholeCalcString(trimmed);

  // The boundary rule: a value beginning with `calc(` may continue only after
  // whitespace. A whole-value call has nothing after its close.
  if (trimmed.startsWith("calc(")) {
    const end = findCalcCallEnd(trimmed, 0);
    const after = trimmed.slice(end + 1);
    if (after !== "" && !/^\s/.test(after)) {
      throw new CalcSyntaxError(CALC_BOUNDARY_MESSAGE);
    }
  }

  let index = 0;
  while (index < trimmed.length) {
    const start = trimmed.indexOf("calc(", index);
    if (start === -1) return;
    const end = findCalcCallEnd(trimmed, start);
    const call = trimmed.slice(start, end + 1);
    parseCalc(call, whole ? ctx : { properties: ctx.properties });
    index = end + 1;
  }
}
