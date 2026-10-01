import { SUPPORTED_KEYWORDS } from "tsyntax";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";

export default cssSyntaxConfig(SUPPORTED_KEYWORDS, {
  // ── MDN numeric / dimension types ─────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/integer
  "<integer>": "`${bigint}` | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/number
  "<number>": "`${number}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/percentage
  "<percentage>": "`${number}%` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length
  "<length>":
    "`${number}${'px' | 'rem' | 'em' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'ch' | 'lh' | 'dvh' | 'dvw' | 'svh' | 'svw' | 'in' | 'pt' | 'pc' | 'cm' | 'mm'}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/calc
  // The token resolves to a shallow `calc(${string})` at the DSL level so the
  // registry surface stays a plain union; the engine's `CalcConstraint` then
  // parses the written value against the real calc grammar (src/css/calc.ts).
  "<calc>": "`calc(${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/var
  // Shallow at the DSL level, like <calc>; the engine's `VarConstraint` then
  // resolves the reference against the CSS Properties registry
  // (src/css/var.ts).
  "<var>": "`var(${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length-percentage
  // Cross-reference — cannot be expressed in the DSL without token references
  "<length-percentage>": "<length> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/resolution
  "<resolution>": "`${number}${'dpi' | 'dpcm' | 'dppx' | 'x'}` | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/angle
  "<angle>": "`${number}${'deg' | 'rad' | 'turn' | 'grad'}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/angle-percentage
  "<angle-percentage>": "<angle> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time
  "<time>": "`${number}${'s' | 'ms'}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time-percentage
  "<time-percentage>": "<time> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/frequency
  "<frequency>": "`${number}${'Hz' | 'kHz'}` | <calc> | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/frequency-percentage
  "<frequency-percentage>": "<frequency> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/ratio
  "<ratio>": "`${number} / ${number}` | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex_value  (the fr unit)
  "<flex>": "`${number}${'fr'}` | <var>",

  // ── MDN textual types ──────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/string
  "<string>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/url_value
  "<url>": "`url(https://${string})` | `url(http://${string})` | `url(./${string})` | `url(/${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
  "<custom-ident>": "string",

  // ── MDN color types ────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
  "<color>":
    "`#${string}` | `rgb(${number} ${number} ${number})` | `rgb(${number} ${number} ${number} / ${number})` | `rgb(${number}, ${number}, ${number})` | `rgba(${number}, ${number}, ${number}, ${number})` | `hsl(${number} ${number}% ${number}%)` | `hsl(${number} ${number}% ${number}% / ${number})` | `hsl(${number}, ${number}%, ${number}%)` | `hsla(${number}, ${number}%, ${number}%, ${number})` | `oklch(${number} ${number} ${number})` | `oklch(${number} ${number} ${number} / ${number})` | `color(display-p3 ${number} ${number} ${number})` | 'transparent' | 'currentColor' | 'inherit' | <var>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/alpha-value
  "<alpha-value>": "`${number}` | `${number}%` | <calc> | <var>",

  // ── MDN image type ─────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/image
  // Covers url(), linear-gradient(), etc. — kept as url() for the common case;
  // gradient functions are compound shorthands typed as <string> at usage sites.
  "<image>":
    "<url> | `linear-gradient(${string})` | `radial-gradient(${string})` | <var>",

  // ── MDN 2D position type ───────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/position_value
  // Used by background-position, transform-origin, object-position, etc.
  // Note: <length-percentage> cross-reference dropped — cannot express in DSL
  "<position>":
    "'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top center' | 'top right' | 'center left' | 'center center' | 'center right' | 'bottom left' | 'bottom center' | 'bottom right' | <var>",

  // ── MDN easing-function type ───────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
  "<easing-function>":
    "'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | `cubic-bezier(${number}, ${number}, ${number}, ${number})` | `steps(${number})` | `steps(${number}, ${'start' | 'end' | 'jump-start' | 'jump-end' | 'jump-none' | 'jump-both'})`",

  // ── MDN line-style type ────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/line-style
  "<line-style>":
    "'none' | 'hidden' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset' | <var>",

  // ── MDN line-width type ────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/line-width
  "<line-width>": "<length> | 'thin' | 'medium' | 'thick'",

  // ── MDN basic-shape type ───────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/basic-shape
  // Kept as string — compound function syntax (inset, circle, polygon, path…)
  "<basic-shape>": "string",

  // ── Grid-specific types (defined in CSS Grid spec, referenced by MDN) ──────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex_value
  // Cross-reference — cannot be expressed in the DSL without token references
  "<track-breadth>":
    "<length-percentage> | <flex> | 'min-content' | 'max-content' | 'auto'",

  // ── font-weight numeric values (MDN lists 100–900 as valid <number> inputs) ─
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
  "<font-weight>":
    "'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'",
});
