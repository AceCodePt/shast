import { SUPPORTED_KEYWORDS } from "tsyntax";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";

export default cssSyntaxConfig(SUPPORTED_KEYWORDS, {
  // https://developer.mozilla.org/en-US/docs/Web/CSS/integer
  "<integer>": "`${bigint}` | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/number
  "<number>": "`${number}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/percentage
  "<percentage>": "`${number}%` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length
  "<length>": "`${number}${'px' | 'rem' | 'em' | 'vw' | 'vh'}` | '0' | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length-percentage
  "<length-percentage>": "<length> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/calc
  // Shallow at the DSL level; `CalcConstraint` in the engine parses the
  // written value against the real grammar (src/css/calc.ts).
  "<calc>": "`calc(${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/var
  // Shallow at the DSL level; `VarConstraint` in the engine resolves the
  // reference against the CSS Properties registry (src/css/var.ts).
  "<var>": "`var(${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
  "<color>":
    "`#${string}` | `rgb(${number} ${number} ${number})` | `rgb(${number}, ${number}, ${number})` | 'transparent' | 'currentColor' | 'inherit' | 'black' | 'white' | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/string
  "<string>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/url_value
  "<url>": "`url(https://${string})` | `url(http://${string})` | `url(./${string})` | `url(/${string})`",

  "<line-style>":
    "'none' | 'hidden' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset' | <var>",

  "<line-width>": "<length> | 'thin' | 'medium' | 'thick'",

  "<font-weight>":
    "'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time
  "<time>": "`${number}${'s' | 'ms'}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time-percentage
  "<time-percentage>": "<time> | <percentage>",

  "<easing-function>":
    "'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | `cubic-bezier(${number}, ${number}, ${number}, ${number})` | `steps(${number})` | `steps(${number}, ${'start' | 'end' | 'jump-start' | 'jump-end' | 'jump-none' | 'jump-both'})`",
});
