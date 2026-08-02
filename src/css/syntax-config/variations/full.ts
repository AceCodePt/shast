import { SUPPORTED_KEYWORDS } from "@/dsl/index.ts";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";

export default cssSyntaxConfig(SUPPORTED_KEYWORDS, {
  // ── Numeric / dimension types ──────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/integer
  "<integer>": "`${bigint}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/number
  "<number>": "`${number}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/percentage
  "<percentage>": "`${number}%`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length
  "<length>":
    "`${number}${'px' | 'rem' | 'em' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'ch' | 'lh' | 'rlh' | 'ex' | 'rex' | 'cap' | 'rcap' | 'ic' | 'ric' | 'dvh' | 'dvw' | 'dvmin' | 'dvmax' | 'svh' | 'svw' | 'svmin' | 'svmax' | 'lvh' | 'lvw' | 'lvmin' | 'lvmax' | 'cqw' | 'cqh' | 'cqi' | 'cqb' | 'cqmin' | 'cqmax' | 'in' | 'pt' | 'pc' | 'cm' | 'mm' | 'Q'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/length-percentage
  "<length-percentage>": "<length> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/angle
  "<angle>": "`${number}${'deg' | 'rad' | 'turn' | 'grad'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/angle-percentage
  "<angle-percentage>": "<angle> | <percentage>",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/time
  "<time>": "`${number}${'s' | 'ms'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/frequency
  "<frequency>": "`${number}${'Hz' | 'kHz'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/resolution
  "<resolution>": "`${number}${'dpi' | 'dpcm' | 'dppx' | 'x'}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/ratio
  "<ratio>": "`${number} / ${number}`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex_value
  "<flex>": "`${number}${'fr'}`",

  // ── Textual types ──────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/string
  "<string>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/url_value
  "<url>": "`url(${string})`",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
  "<custom-ident>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/dashed-ident
  "<dashed-ident>": "`--${string}`",

  // ── Color types ────────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
  "<color>":
    "`#${string}` | `rgb(${number} ${number} ${number})` | `rgb(${number} ${number} ${number} / ${number})` | `rgba(${number}, ${number}, ${number}, ${number})` | `hsl(${number} ${number}% ${number}%)` | `hsl(${number} ${number}% ${number}% / ${number})` | `hsla(${number}, ${number}%, ${number}%, ${number})` | `hwb(${number} ${number}% ${number}%)` | `hwb(${number} ${number}% ${number}% / ${number})` | `lab(${number} ${number} ${number})` | `lab(${number} ${number} ${number} / ${number})` | `lch(${number} ${number} ${number})` | `lch(${number} ${number} ${number} / ${number})` | `oklch(${number} ${number} ${number})` | `oklch(${number} ${number} ${number} / ${number})` | `oklab(${number} ${number} ${number})` | `oklab(${number} ${number} ${number} / ${number})` | `color(display-p3 ${number} ${number} ${number})` | `color(srgb ${number} ${number} ${number})` | `color(a98-rgb ${number} ${number} ${number})` | `color(prophoto-rgb ${number} ${number} ${number})` | `color(rec2020 ${number} ${number} ${number})` | 'transparent' | 'currentColor' | 'inherit' | 'initial' | 'unset'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/alpha-value
  "<alpha-value>": "`${number}` | `${number}%`",

  // ── Image types ────────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/image
  "<image>":
    "`url(${string})` | `linear-gradient(${string})` | `radial-gradient(${string})` | `conic-gradient(${string})` | `repeating-linear-gradient(${string})` | `repeating-radial-gradient(${string})` | `repeating-conic-gradient(${string})`",

  // ── Position / geometry types ──────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/position_value
  "<position>":
    "'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top center' | 'top right' | 'center left' | 'center center' | 'center right' | 'bottom left' | 'bottom center' | 'bottom right'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/basic-shape
  "<basic-shape>": "string",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function
  "<transform-function>":
    "`translate(${string})` | `translateX(${string})` | `translateY(${string})` | `translateZ(${string})` | `translate3d(${string})` | `scale(${string})` | `scaleX(${string})` | `scaleY(${string})` | `rotate(${string})` | `rotateX(${string})` | `rotateY(${string})` | `rotateZ(${string})` | `rotate3d(${string})` | `skew(${string})` | `skewX(${string})` | `skewY(${string})` | `matrix(${string})` | `matrix3d(${string})` | `perspective(${string})`",

  // ── Easing / animation types ───────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
  "<easing-function>":
    "'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | `cubic-bezier(${number}, ${number}, ${number}, ${number})` | `steps(${number})` | `steps(${number}, ${'start' | 'end' | 'jump-start' | 'jump-end' | 'jump-none' | 'jump-both'})`",

  // ── Border types ───────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/line-style
  "<line-style>":
    "'none' | 'hidden' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/line-width
  "<line-width>": "<length> | 'thin' | 'medium' | 'thick'",

  // ── Grid / layout types ────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex_value
  "<track-breadth>":
    "<length-percentage> | <flex> | 'min-content' | 'max-content' | 'auto'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/fit-content
  "<track-size>":
    "<track-breadth> | `minmax(${string}, ${string})` | `fit-content(${string})`",

  // ── Typography types ───────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
  "<font-weight>":
    "'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
  "<generic-family>":
    "'serif' | 'sans-serif' | 'monospace' | 'cursive' | 'fantasy' | 'system-ui' | 'ui-serif' | 'ui-sans-serif' | 'ui-monospace' | 'ui-rounded' | 'emoji' | 'math' | 'fangsong'",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font-style
  "<font-style>": "'normal' | 'italic' | 'oblique' | `oblique ${string}`",

  // ── Overflow / visibility keywords ────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
  "<overflow>": "'visible' | 'hidden' | 'clip' | 'scroll' | 'auto'",

  // ── Sizing keywords ────────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/width
  "<sizing-keyword>":
    "'auto' | 'min-content' | 'max-content' | 'fit-content' | 'stretch' | 'none'",

  // ── Global CSS keywords ────────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units#css-wide_keywords
  "<css-wide-keyword>": "'initial' | 'inherit' | 'unset' | 'revert' | 'revert-layer'",

  // ── Filter / effect types ──────────────────────────────────────────────────
  // https://developer.mozilla.org/en-US/docs/Web/CSS/filter
  "<filter-function>":
    "`blur(${string})` | `brightness(${string})` | `contrast(${string})` | `drop-shadow(${string})` | `grayscale(${string})` | `hue-rotate(${string})` | `invert(${string})` | `opacity(${string})` | `saturate(${string})` | `sepia(${string})`",
});
