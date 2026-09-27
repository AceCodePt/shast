import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

export interface BaseCSSPropertiesConfig {
  [attribute: string]: {
    syntax: string;
    inherits: boolean;
    "initial-value": string;
  };
}

// Options for `cssPropertiesConfig`.
//
// `allowUnions` is off by default: a registered property's `syntax` may not
// contain a `|`. A union operand cannot be classified, which defeats any rule
// that needs to know whether a `var()` reference is dimensional or unitless.
// The flag is the escape hatch for the rare genuine union (e.g. a line-height
// token declared `<number> | <length-percentage>`).
//
// The flag is a type parameter as well as a runtime option so the type wall
// and the runtime wall make the same decision. `const AllowUnions extends
// boolean` in `cssPropertiesConfig` keeps `true` literal under inference.
export interface CSSPropertiesConfigOptions<
  AllowUnions extends boolean = boolean,
> {
  allowUnions?: AllowUnions;
}

// A diagnostic that no config object can be assignable to. It mirrors
// `CalcError` (src/css/calc.ts) and `VarError` (src/css/var.ts): a branded
// object, not a string, with a `unique symbol` key so even an object literal
// cannot satisfy it. The message rides on the brand, so it shows up in the
// type name TypeScript prints.
declare const PROPERTY_SYNTAX_UNION_ERROR: unique symbol;

export interface PropertySyntaxUnionError<Message extends string> {
  readonly [PROPERTY_SYNTAX_UNION_ERROR]: Message;
}

// A registered property's `syntax` admits no string interpolation -- no quoted
// literals, no backtick templates -- so a `|` can only ever be a union
// separator. That makes the check a presence test for the character, not a
// parse: no splitting, no depth tracking, nothing to drift out of step with
// tsyntax. Every other syntax slot in shast keeps unions, unchanged.
type ValidatePropertySyntax<
  Keywords extends SupportedKeywordsConfig,
  Property extends string,
  Syntax extends string,
  AllowUnions extends boolean,
> = AllowUnions extends true
  ? DSLValidate<Keywords, Syntax>
  : Syntax extends `${string}|${string}`
    ? PropertySyntaxUnionError<`Property "${Property}" declares syntax "${Syntax}" with a union ("|"). A union operand cannot be classified; register two properties, or pass { allowUnions: true } to cssPropertiesConfig to permit it.`>
    : DSLValidate<Keywords, Syntax>;

export type ValidateCSSPropertiesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  P extends BaseCSSPropertiesConfig,
  AllowUnions extends boolean = false,
> = keyof P extends string
  ? {
      [K in keyof P]: K extends string
        ? K extends `--${string}`
          ? {
              syntax: ValidatePropertySyntax<
                Keywords & S,
                K & string,
                P[K]["syntax"],
                AllowUnions
              >;
              inherits: boolean;
              "initial-value": DSLInfer<Keywords & S, P[K]["syntax"]>;
            }
          : P[K] &
              `You must have the property start with -- instead like --${K}`
        : P[K];
    }
  : P;
