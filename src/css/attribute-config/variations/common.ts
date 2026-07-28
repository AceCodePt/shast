import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import commonCSSSyntax from "@/css/syntax-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "@/dsl/index.ts";

export default cssAttributeConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  perspective: {
    none: { self: {}, children: {} },
    "<length>": {
      self: { "perspective-origin": "<position>" },
      children: {},
    },
  },

  // ── Box Model ──────────────────────────────────────────────────────────────
  "min-width": "<length> | <percentage>",
  "max-width": "<length> | <percentage>",
  "min-height": "<length> | <percentage>",
  "max-height": "<length> | <percentage>",

  margin: "<length>",
  "margin-right": "<length>",
  "margin-left": "<length>",
  "margin-block": "<length>",
  "margin-inline": "<length>",

  padding: "<length>",
  "padding-top": "<length>",
  "padding-right": "<length>",
  "padding-bottom": "<length>",
  "padding-left": "<length>",
  "padding-block": "<length>",
  "padding-inline": "<length>",

  "box-sizing": "'content-box' | 'border-box'",
  "box-shadow": "<string>",

  // ── Layout ─────────────────────────────────────────────────────────────────
  display: {
    block: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    inline: {
      self: {
        "vertical-align":
          "'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'sub' | 'super' | <length-percentage>",
      },
      children: {},
    },
    "inline-block": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        "vertical-align":
          "'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'sub' | 'super' | <length-percentage>",
      },
      children: {},
    },
    "list-item": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    none: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    contents: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    table: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        "border-spacing": "<length>",
        "table-layout": "'auto' | 'fixed'",
        "border-collapse": "'collapse' | 'separate'",
        "caption-side": "'top' | 'bottom'",
      },
      children: {},
    },
    "table-header-group": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    "table-cell": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        "empty-cells": "'show' | 'hide'",
        "vertical-align":
          "'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'sub' | 'super' | <length-percentage>",
      },
      children: {},
    },
    "table-row": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },
    "table-row-group": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
      },
      children: {},
    },

    flex: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "flex-wrap": "'nowrap' | 'wrap' | 'wrap-reverse'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "align-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch'",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        order: "<integer>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-basis": "<length-percentage>",
        flex: "<string>",
      },
    },

    "inline-flex": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "flex-wrap": "'nowrap' | 'wrap' | 'wrap-reverse'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "align-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch'",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        order: "<integer>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-basis": "<length-percentage>",
        flex: "<string>",
      },
    },

    grid: {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "justify-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "grid-template-columns": "<track-breadth>",
        "grid-template-rows": "<track-breadth>",
        "grid-template-areas": "<string>",
        "grid-auto-columns": "<track-breadth>",
        "grid-auto-rows": "<track-breadth>",
        "grid-auto-flow":
          "'row' | 'column' | 'dense' | 'row dense' | 'column dense'",
        "place-content": "<string>",
        "place-items": "<string>",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        "justify-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        order: "<integer>",
        "grid-column": "<string>",
        "grid-column-start": "<integer>",
        "grid-column-end": "<integer>",
        "grid-row": "<string>",
        "grid-row-start": "<integer>",
        "grid-row-end": "<integer>",
        "grid-area": "<custom-ident>",
        "place-self": "<string>",
      },
    },

    "inline-grid": {
      self: {
        width: "<length-percentage>",
        height: "<length-percentage>",
        "margin-top": "<length>",
        "margin-bottom": "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "justify-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end'",
        "grid-template-columns": "<track-breadth>",
        "grid-template-rows": "<track-breadth>",
        "grid-template-areas": "<string>",
        "grid-auto-columns": "<track-breadth>",
        "grid-auto-rows": "<track-breadth>",
        "grid-auto-flow":
          "'row' | 'column' | 'dense' | 'row dense' | 'column dense'",
        "place-content": "<string>",
        "place-items": "<string>",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        "justify-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        order: "<integer>",
        "grid-column": "<string>",
        "grid-column-start": "<integer>",
        "grid-column-end": "<integer>",
        "grid-row": "<string>",
        "grid-row-start": "<integer>",
        "grid-row-end": "<integer>",
        "grid-area": "<custom-ident>",
        "place-self": "<string>",
      },
    },
  },
  position: {
    static: { self: {}, children: {} },
    relative: {
      self: {
        top: "<length-percentage>",
        right: "<length-percentage>",
        bottom: "<length-percentage>",
        left: "<length-percentage>",
        inset: "<length-percentage>",
        "inset-block": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "z-index": "<integer>",
      },
      children: {},
    },
    absolute: {
      self: {
        top: "<length-percentage>",
        right: "<length-percentage>",
        bottom: "<length-percentage>",
        left: "<length-percentage>",
        inset: "<length-percentage>",
        "inset-block": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "z-index": "<integer>",
      },
      children: {},
    },
    fixed: {
      self: {
        top: "<length-percentage>",
        right: "<length-percentage>",
        bottom: "<length-percentage>",
        left: "<length-percentage>",
        inset: "<length-percentage>",
        "inset-block": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "z-index": "<integer>",
      },
      children: {},
    },
    sticky: {
      self: {
        top: "<length-percentage>",
        right: "<length-percentage>",
        bottom: "<length-percentage>",
        left: "<length-percentage>",
        inset: "<length-percentage>",
        "inset-block": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "z-index": "<integer>",
      },
      children: {},
    },
  },
  float: "'left' | 'right' | 'none' | 'inline-start' | 'inline-end'",
  clear: "'left' | 'right' | 'both' | 'none' | 'inline-start' | 'inline-end'",

  overflow: {
    visible: { self: {}, children: {} },
    hidden: { self: {}, children: {} },
    scroll: { self: {}, children: {} },
    auto: { self: {}, children: {} },
    clip: { self: { "overflow-clip-margin": "<length>" }, children: {} },
  },
  "overflow-x": {
    visible: { self: {}, children: {} },
    hidden: { self: {}, children: {} },
    scroll: { self: {}, children: {} },
    auto: { self: {}, children: {} },
    clip: { self: { "overflow-clip-margin": "<length>" }, children: {} },
  },
  "overflow-y": {
    visible: { self: {}, children: {} },
    hidden: { self: {}, children: {} },
    scroll: { self: {}, children: {} },
    auto: { self: {}, children: {} },
    clip: { self: { "overflow-clip-margin": "<length>" }, children: {} },
  },

  // ── Flexbox ────────────────────────────────────────────────────────────────
  "flex-flow": "<string>",

  // ── Grid ───────────────────────────────────────────────────────────────────
  "grid-template": "<string>",
  grid: "<string>",

  // ── Colors & Background ────────────────────────────────────────────────────
  color: "<color>",
  opacity: {
    "<alpha-value>": {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  "background-color": "<color>",
  "background-image": "<image>",
  "background-position": "<position>",
  "background-repeat":
    "'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | 'space' | 'round'",
  "background-size": "'auto' | 'cover' | 'contain' | <length-percentage>",
  "background-attachment": "'scroll' | 'fixed' | 'local'",
  "background-origin": "'border-box' | 'padding-box' | 'content-box'",
  "background-clip": "'border-box' | 'padding-box' | 'content-box' | 'text'",
  background: "<string>",

  // ── Border ─────────────────────────────────────────────────────────────────
  border: "<string>",
  "border-top": "<string>",
  "border-right": "<string>",
  "border-bottom": "<string>",
  "border-left": "<string>",
  "border-width": "<line-width>",
  "border-style": "<line-style>",
  "border-color": "<color>",
  "border-radius": "<length-percentage>",
  "border-top-left-radius": "<length-percentage>",
  "border-top-right-radius": "<length-percentage>",
  "border-bottom-left-radius": "<length-percentage>",
  "border-bottom-right-radius": "<length-percentage>",
  "border-block": "<string>",
  "border-inline": "<string>",
  outline: "<string>",
  "outline-width": "<line-width>",
  "outline-style": "<line-style>",
  "outline-color": "<color>",
  "outline-offset": "<length>",

  // ── Typography ─────────────────────────────────────────────────────────────
  "font-family": "<string>",
  "font-size": "<length-percentage>",
  "font-weight": "<font-weight>",
  "font-style": "'normal' | 'italic' | 'oblique'",
  "font-variant": "'normal' | 'small-caps'",
  "font-stretch":
    "'normal' | 'condensed' | 'expanded' | 'ultra-condensed' | 'extra-condensed' | 'semi-condensed' | 'semi-expanded' | 'extra-expanded' | 'ultra-expanded' | <percentage>",
  font: "<string>",
  "line-height": "<number> | <length-percentage>",
  "letter-spacing": "'normal' | <length>",
  "word-spacing": "'normal' | <length>",
  "text-align-last":
    "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'auto'",
  "text-decoration": "<string>",
  "text-decoration-color": "<color>",
  "text-decoration-style": "<line-style>",
  "text-decoration-thickness": "'auto' | 'from-font' | <length-percentage>",
  "text-transform": "'none' | 'uppercase' | 'lowercase' | 'capitalize'",
  "text-shadow": "<string>",
  "text-wrap": "'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable'",
  "white-space":
    "'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'",
  "word-break": "'normal' | 'break-all' | 'keep-all' | 'break-word'",
  "overflow-wrap": "'normal' | 'break-word' | 'anywhere'",

  hyphens: "'none' | 'manual' | 'auto'",
  "-webkit-font-smoothing":
    "'auto' | 'none' | 'antialiased' | 'subpixel-antialiased'",
  "-moz-osx-font-smoothing": "'auto' | 'grayscale'",

  // ── Lists ──────────────────────────────────────────────────────────────────
  "list-style": "<string>",
  "list-style-type":
    "'none' | 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman'",
  "list-style-position": "'inside' | 'outside'",
  "list-style-image": "<image>",

  // ── Tables ─────────────────────────────────────────────────────────────────
  // ── Images & Media ─────────────────────────────────────────────────────────
  "object-fit": "'fill' | 'contain' | 'cover' | 'none' | 'scale-down'",
  "object-position": "<position>",
  "aspect-ratio": "'auto' | <ratio>",
  "image-rendering": "'auto' | 'crisp-edges' | 'pixelated' | 'smooth'",

  // ── Visibility & Interaction ───────────────────────────────────────────────
  visibility: "'visible' | 'hidden' | 'collapse'",
  "pointer-events": "'auto' | 'none'",
  "user-select": "'auto' | 'none' | 'text' | 'all'",
  "touch-action":
    "'auto' | 'none' | 'pan-x' | 'pan-y' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down' | 'pinch-zoom' | 'manipulation'",
  cursor:
    "'auto' | 'default' | 'pointer' | 'move' | 'text' | 'wait' | 'help' | 'not-allowed' | 'grab' | 'grabbing' | 'crosshair' | 'zoom-in' | 'zoom-out' | 'none'",
  "scroll-behavior": "'auto' | 'smooth'",
  "scroll-snap-type":
    "'none' | 'x' | 'y' | 'block' | 'inline' | 'both' | 'x mandatory' | 'x proximity' | 'y mandatory' | 'y proximity' | 'both mandatory' | 'both proximity'",
  "scroll-snap-align": "'none' | 'start' | 'end' | 'center'",
  "overscroll-behavior": "'auto' | 'contain' | 'none'",
  "-webkit-overflow-scrolling": "'auto' | 'touch'",

  // ── Transforms & Perspective ───────────────────────────────────────────────
  transform: {
    "<string>": {
      self: {
        "transform-origin": "<position>",
        "transform-style": "'flat' | 'preserve-3d'",
        "backface-visibility": "'visible' | 'hidden'",
        "z-index": "<integer>",
      },
      children: {},
    },
  },
  translate: "<length-percentage>",
  rotate: "<angle>",
  scale: "<number>",

  // ── Transitions ────────────────────────────────────────────────────────────
  transition: "<string>",
  "transition-property": "'none' | 'all' | <custom-ident>",
  "transition-duration": "<time>",
  "transition-timing-function": "<easing-function>",
  "transition-delay": "<time>",

  // ── Animations ─────────────────────────────────────────────────────────────
  animation: "<string>",
  "animation-name": "'none' | <custom-ident>",
  "animation-duration": "<time>",
  "animation-timing-function": "<easing-function>",
  "animation-delay": "<time>",
  "animation-iteration-count": "'infinite' | <number>",
  "animation-direction":
    "'normal' | 'reverse' | 'alternate' | 'alternate-reverse'",
  "animation-fill-mode": "'none' | 'forwards' | 'backwards' | 'both'",
  "animation-play-state": "'running' | 'paused'",

  // ── Filters & Blending ─────────────────────────────────────────────────────
  filter: {
    "<string>": {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  "backdrop-filter": {
    "<string>": {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  "mix-blend-mode": {
    normal: { self: {}, children: {} },
    multiply: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    screen: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    overlay: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    darken: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    lighten: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    "color-dodge": {
      self: { "z-index": "<integer>" },
      children: {},
    },
    "color-burn": {
      self: { "z-index": "<integer>" },
      children: {},
    },
    "hard-light": {
      self: { "z-index": "<integer>" },
      children: {},
    },
    "soft-light": {
      self: { "z-index": "<integer>" },
      children: {},
    },
    difference: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    exclusion: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    hue: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    saturation: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    color: {
      self: { "z-index": "<integer>" },
      children: {},
    },
    luminosity: {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  "background-blend-mode":
    "'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'",
  "clip-path": "'none' | <basic-shape>",
  mask: "<string>",
  "mask-image": "<image>",

  // ── Generated Content ──────────────────────────────────────────────────────
  content: "'normal' | 'none' | <string> | <url> | <custom-ident>",
  "counter-reset": "'none' | <custom-ident>",
  "counter-increment": "'none' | <custom-ident>",
  quotes: "'none' | 'auto' | <string>",

  // ── Performance & Rendering ────────────────────────────────────────────────
  "will-change":
    "'auto' | 'scroll-position' | 'contents' | 'transform' | 'opacity'",
  contain:
    "'none' | 'strict' | 'content' | 'size' | 'layout' | 'style' | 'paint'",
  isolation: {
    auto: { self: {}, children: {} },
    isolate: {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  appearance: "'none' | 'auto'",

  // ── Multi-column ───────────────────────────────────────────────────────────
  "column-count": {
    auto: { self: {}, children: {} },
    "<integer>": {
      self: {
        "column-rule": "<string>",
        "column-fill": "'auto' | 'balance' | 'balance-all'",
        "column-span": "'none' | 'all'",
      },
      children: {},
    },
  },
  "column-width": {
    auto: { self: {}, children: {} },
    "<length>": {
      self: {
        "column-rule": "<string>",
        "column-fill": "'auto' | 'balance' | 'balance-all'",
        "column-span": "'none' | 'all'",
      },
      children: {},
    },
  },
  columns: {
    "<string>": {
      self: {
        "column-rule": "<string>",
        "column-fill": "'auto' | 'balance' | 'balance-all'",
        "column-span": "'none' | 'all'",
      },
      children: {},
    },
  },

  // ── Writing Modes & Internationalization ───────────────────────────────────
  "writing-mode": "'horizontal-tb' | 'vertical-rl' | 'vertical-lr'",
  direction: "'ltr' | 'rtl'",
  "unicode-bidi":
    "'normal' | 'embed' | 'isolate' | 'bidi-override' | 'isolate-override' | 'plaintext'",

  // ── Page / Print ───────────────────────────────────────────────────────────
  "break-before":
    "'auto' | 'avoid' | 'always' | 'all' | 'avoid-page' | 'page' | 'column' | 'avoid-column'",
  "break-after":
    "'auto' | 'avoid' | 'always' | 'all' | 'avoid-page' | 'page' | 'column' | 'avoid-column'",
  "break-inside": "'auto' | 'avoid' | 'avoid-page' | 'avoid-column'",
  "page-break-before": "'auto' | 'avoid' | 'always' | 'left' | 'right'",
  "page-break-after": "'auto' | 'avoid' | 'always' | 'left' | 'right'",
  "page-break-inside": "'auto' | 'avoid'",
});
