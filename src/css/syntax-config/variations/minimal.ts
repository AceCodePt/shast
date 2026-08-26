import { SUPPORTED_KEYWORDS } from "tsyntax";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";

export default cssSyntaxConfig(SUPPORTED_KEYWORDS, {
  // https://developer.mozilla.org/en-US/docs/Web/CSS/integer
  "<integer>": "`${bigint}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/number
  "<number>": "`${number}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/percentage
  "<percentage>": "`${number}%`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length
  "<length>": "`${number}${'px' | 'rem' | 'em' | 'vw' | 'vh'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
  "<color>":
    "`#${string}` | `rgb(${number} ${number} ${number})` | 'transparent' | 'currentColor' | 'inherit'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/string
  "<string>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/url_value
  "<url>": "`url(${string})`",

  "<line-style>":
    "'none' | 'hidden' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'",

  "<line-width>": "<length> | 'thin' | 'medium' | 'thick'",

  "<font-weight>":
    "'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time
  "<time>": "`${number}${'s' | 'ms'}`",

  "<easing-function>":
    "'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | `cubic-bezier(${number}, ${number}, ${number}, ${number})` | `steps(${number})` | `steps(${number}, ${'start' | 'end' | 'jump-start' | 'jump-end' | 'jump-none' | 'jump-both'})`",
});
