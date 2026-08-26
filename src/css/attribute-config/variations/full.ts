import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import fullCSSSyntax from "@/css/syntax-config/variations/full.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

export default cssAttributeConfig(SUPPORTED_KEYWORDS, fullCSSSyntax, {
  // ── Box Model ──────────────────────────────────────────────────────────────
  "min-width": "<length-percentage> | <sizing-keyword>",
  "max-width": "<length-percentage> | <sizing-keyword>",
  "min-height": "<length-percentage> | <sizing-keyword>",
  "max-height": "<length-percentage> | <sizing-keyword>",

  margin: "<length-percentage>",
  "margin-right": "<length-percentage>",
  "margin-left": "<length-percentage>",
  "margin-block": "<length-percentage>",
  "margin-block-start": "<length-percentage>",
  "margin-block-end": "<length-percentage>",
  "margin-inline": "<length-percentage>",
  "margin-inline-start": "<length-percentage>",
  "margin-inline-end": "<length-percentage>",

  padding: "<length-percentage>",
  "padding-top": "<length-percentage>",
  "padding-right": "<length-percentage>",
  "padding-bottom": "<length-percentage>",
  "padding-left": "<length-percentage>",
  "padding-block": "<length-percentage>",
  "padding-block-start": "<length-percentage>",
  "padding-block-end": "<length-percentage>",
  "padding-inline": "<length-percentage>",
  "padding-inline-start": "<length-percentage>",
  "padding-inline-end": "<length-percentage>",

  "box-sizing": "'content-box' | 'border-box'",
  "box-shadow": "<string>",

  // ── Layout ─────────────────────────────────────────────────────────────────
  display: {
    block: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
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
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        "vertical-align":
          "'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'sub' | 'super' | <length-percentage>",
      },
      children: {},
    },
    none: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    contents: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "flow-root": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    table: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        "border-spacing": "<length>",
        "table-layout": "'auto' | 'fixed'",
        "border-collapse": "'collapse' | 'separate'",
        "caption-side": "'top' | 'bottom' | 'inline-start' | 'inline-end'",
      },
      children: {},
    },
    "table-column": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-cell": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        "empty-cells": "'show' | 'hide'",
        "vertical-align":
          "'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'sub' | 'super' | <length-percentage>",
      },
      children: {},
    },
    "table-header-group": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-row-group": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-column-group": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-row": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-caption": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "table-footer-group": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },
    "list-item": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
      },
      children: {},
    },

    flex: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "flex-wrap": "'nowrap' | 'wrap' | 'wrap-reverse'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch' | 'normal'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "align-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch' | 'normal'",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        order: "<integer>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-basis": "<length-percentage> | <sizing-keyword>",
        flex: "<string>",
      },
    },

    "inline-flex": {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "flex-wrap": "'nowrap' | 'wrap' | 'wrap-reverse'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch' | 'normal'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "align-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch' | 'normal'",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        order: "<integer>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-basis": "<length-percentage> | <sizing-keyword>",
        flex: "<string>",
      },
    },

    grid: {
      self: {
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch' | 'normal'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "justify-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'legacy' | 'normal'",
        "grid-template-columns": "<track-size>",
        "grid-template-rows": "<track-size>",
        "grid-template-areas": "<string>",
        "grid-auto-columns": "<track-size>",
        "grid-auto-rows": "<track-size>",
        "grid-auto-flow":
          "'row' | 'column' | 'dense' | 'row dense' | 'column dense'",
        "place-content": "<string>",
        "place-items": "<string>",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "justify-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
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
        width: "<length-percentage> | <sizing-keyword>",
        height: "<length-percentage> | <sizing-keyword>",
        "margin-top": "<length-percentage>",
        "margin-bottom": "<length-percentage>",
        "text-align": "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'match-parent'",
        "text-indent": "<length-percentage>",
        "text-overflow": "'clip' | 'ellipsis'",
        resize: "'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'",
        gap: "<length-percentage>",
        "row-gap": "<length-percentage>",
        "column-gap": "<length-percentage>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'start' | 'end' | 'stretch' | 'normal'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "justify-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'legacy' | 'normal'",
        "grid-template-columns": "<track-size>",
        "grid-template-rows": "<track-size>",
        "grid-template-areas": "<string>",
        "grid-auto-columns": "<track-size>",
        "grid-auto-rows": "<track-size>",
        "grid-auto-flow":
          "'row' | 'column' | 'dense' | 'row dense' | 'column dense'",
        "place-content": "<string>",
        "place-items": "<string>",
      },
      children: {
        "align-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
        "justify-self":
          "'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'start' | 'end' | 'normal'",
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
        "inset-block-start": "<length-percentage>",
        "inset-block-end": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "inset-inline-start": "<length-percentage>",
        "inset-inline-end": "<length-percentage>",
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
        "inset-block-start": "<length-percentage>",
        "inset-block-end": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "inset-inline-start": "<length-percentage>",
        "inset-inline-end": "<length-percentage>",
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
        "inset-block-start": "<length-percentage>",
        "inset-block-end": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "inset-inline-start": "<length-percentage>",
        "inset-inline-end": "<length-percentage>",
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
        "inset-block-start": "<length-percentage>",
        "inset-block-end": "<length-percentage>",
        "inset-inline": "<length-percentage>",
        "inset-inline-start": "<length-percentage>",
        "inset-inline-end": "<length-percentage>",
        "z-index": "<integer>",
      },
      children: {},
    },
  },

  float: "'left' | 'right' | 'none' | 'inline-start' | 'inline-end'",
  clear: "'left' | 'right' | 'both' | 'none' | 'inline-start' | 'inline-end'",

  overflow: "<overflow>",
  "overflow-x": "<overflow>",
  "overflow-y": "<overflow>",
  "overflow-clip-margin": "<length>",
  "overflow-block": "<overflow>",
  "overflow-inline": "<overflow>",
  "overscroll-behavior": "'auto' | 'contain' | 'none'",
  "overscroll-behavior-x": "'auto' | 'contain' | 'none'",
  "overscroll-behavior-y": "'auto' | 'contain' | 'none'",
  "overscroll-behavior-block": "'auto' | 'contain' | 'none'",
  "overscroll-behavior-inline": "'auto' | 'contain' | 'none'",

  perspective: {
    none: { self: {}, children: {} },
    "<length>": {
      self: { "perspective-origin": "<position>" },
      children: {},
    },
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
  "color-scheme":
    "'normal' | 'light' | 'dark' | 'light dark' | 'only light' | 'only dark'",
  "forced-color-adjust": "'auto' | 'none'",
  "accent-color": "'auto' | <color>",
  "caret-color": "'auto' | <color>",
  "background-color": "<color>",
  "background-image": {
    none: { self: {}, children: {} },
    "<image>": {
      self: {
        "background-position": "<position>",
        "background-position-x": "<position>",
        "background-position-y": "<position>",
        "background-repeat":
          "'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | 'space' | 'round'",
        "background-size": "'auto' | 'cover' | 'contain' | <length-percentage>",
        "background-attachment": "'scroll' | 'fixed' | 'local'",
        "background-origin": "'border-box' | 'padding-box' | 'content-box'",
        "background-clip": "'border-box' | 'padding-box' | 'content-box' | 'text'",
      },
      children: {},
    },
  },
  background: "<string>",

  // ── Border ─────────────────────────────────────────────────────────────────
  border: "<string>",
  "border-top": "<string>",
  "border-right": "<string>",
  "border-bottom": "<string>",
  "border-left": "<string>",
  "border-block": "<string>",
  "border-block-start": "<string>",
  "border-block-end": "<string>",
  "border-inline": "<string>",
  "border-inline-start": "<string>",
  "border-inline-end": "<string>",
  "border-width": "<line-width>",
  "border-top-width": "<line-width>",
  "border-right-width": "<line-width>",
  "border-bottom-width": "<line-width>",
  "border-left-width": "<line-width>",
  "border-block-width": "<line-width>",
  "border-inline-width": "<line-width>",
  "border-style": "<line-style>",
  "border-top-style": "<line-style>",
  "border-right-style": "<line-style>",
  "border-bottom-style": "<line-style>",
  "border-left-style": "<line-style>",
  "border-color": "<color>",
  "border-top-color": "<color>",
  "border-right-color": "<color>",
  "border-bottom-color": "<color>",
  "border-left-color": "<color>",
  "border-radius": "<length-percentage>",
  "border-top-left-radius": "<length-percentage>",
  "border-top-right-radius": "<length-percentage>",
  "border-bottom-left-radius": "<length-percentage>",
  "border-bottom-right-radius": "<length-percentage>",
  "border-start-start-radius": "<length-percentage>",
  "border-start-end-radius": "<length-percentage>",
  "border-end-start-radius": "<length-percentage>",
  "border-end-end-radius": "<length-percentage>",
  outline: "<string>",
  "outline-width": "<line-width>",
  "outline-style": "<line-style>",
  "outline-color": "<color>",
  "outline-offset": "<length>",

  // ── Typography ─────────────────────────────────────────────────────────────
  "font-family": "<string>",
  "font-size": "<length-percentage>",
  "font-weight": "<font-weight>",
  "font-style": "<font-style>",
  "font-variant": "'normal' | 'small-caps'",
  "font-variant-numeric":
    "'normal' | 'ordinal' | 'slashed-zero' | 'lining-nums' | 'oldstyle-nums' | 'proportional-nums' | 'tabular-nums' | 'diagonal-fractions' | 'stacked-fractions'",
  "font-variant-caps":
    "'normal' | 'small-caps' | 'all-small-caps' | 'petite-caps' | 'all-petite-caps' | 'unicase' | 'titling-caps'",
  "font-variant-ligatures":
    "'normal' | 'none' | 'common-ligatures' | 'no-common-ligatures' | 'discretionary-ligatures' | 'no-discretionary-ligatures' | 'historical-ligatures' | 'no-historical-ligatures' | 'contextual' | 'no-contextual'",
  "font-stretch":
    "'normal' | 'condensed' | 'expanded' | 'ultra-condensed' | 'extra-condensed' | 'semi-condensed' | 'semi-expanded' | 'extra-expanded' | 'ultra-expanded' | <percentage>",
  "font-size-adjust": "'none' | <number>",
  "font-kerning": "'auto' | 'normal' | 'none'",
  "font-optical-sizing": "'auto' | 'none'",
  "font-synthesis": "'none' | 'weight' | 'style' | 'small-caps'",
  font: "<string>",
  "line-height": "<number> | <length-percentage>",
  "letter-spacing": "'normal' | <length>",
  "word-spacing": "'normal' | <length>",
  "text-align-last":
    "'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'auto'",
  "text-decoration": "<string>",
  "text-decoration-line":
    "'none' | 'underline' | 'overline' | 'line-through' | 'blink'",
  "text-decoration-color": "<color>",
  "text-decoration-style": "<line-style>",
  "text-decoration-thickness": "'auto' | 'from-font' | <length-percentage>",
  "text-decoration-skip-ink": "'auto' | 'none' | 'all'",
  "text-underline-offset": "'auto' | <length-percentage>",
  "text-underline-position":
    "'auto' | 'from-font' | 'under' | 'left' | 'right'",
  "text-transform":
    "'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'full-width' | 'full-size-kana'",

  "text-shadow": "<string>",
  "text-wrap": "'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable'",
  "text-wrap-mode": "'wrap' | 'nowrap'",
  "text-wrap-style": "'auto' | 'balance' | 'pretty' | 'stable'",
  "white-space":
    "'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'",
  "white-space-collapse":
    "'collapse' | 'preserve' | 'preserve-breaks' | 'preserve-spaces' | 'break-spaces'",
  "word-break": "'normal' | 'break-all' | 'keep-all' | 'break-word'",
  "overflow-wrap": "'normal' | 'break-word' | 'anywhere'",
  "line-break": "'auto' | 'loose' | 'normal' | 'strict' | 'anywhere'",

  hyphens: "'none' | 'manual' | 'auto'",
  "hanging-punctuation":
    "'none' | 'first' | 'last' | 'force-end' | 'allow-end'",
  "tab-size": "<integer> | <length>",
  "ruby-align": "'start' | 'center' | 'space-between' | 'space-around'",
  "ruby-position": "'over' | 'under' | 'inter-character' | 'alternate'",
  "-webkit-font-smoothing":
    "'auto' | 'none' | 'antialiased' | 'subpixel-antialiased'",
  "-moz-osx-font-smoothing": "'auto' | 'grayscale'",

  // ── Lists ──────────────────────────────────────────────────────────────────
  "list-style": "<string>",
  "list-style-type":
    "'none' | 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman' | 'lower-greek' | 'disclosure-open' | 'disclosure-closed'",
  "list-style-position": "'inside' | 'outside'",
  "list-style-image": "<image>",

  // ── Tables ─────────────────────────────────────────────────────────────────
  // ── Images & Media ─────────────────────────────────────────────────────────
  "object-fit": "'fill' | 'contain' | 'cover' | 'none' | 'scale-down'",
  "object-position": "<position>",
  "aspect-ratio": "'auto' | <ratio>",
  "image-rendering": "'auto' | 'crisp-edges' | 'pixelated' | 'smooth'",
  "image-orientation": "'from-image' | 'none'",

  // ── Visibility & Interaction ───────────────────────────────────────────────
  visibility: "'visible' | 'hidden' | 'collapse'",
  "pointer-events": "'auto' | 'none'",
  "user-select": "'auto' | 'none' | 'text' | 'all' | 'contain'",
  "-webkit-user-select": "'auto' | 'none' | 'text' | 'all'",
  "touch-action":
    "'auto' | 'none' | 'pan-x' | 'pan-y' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down' | 'pinch-zoom' | 'manipulation'",
  cursor:
    "'auto' | 'default' | 'pointer' | 'move' | 'text' | 'wait' | 'help' | 'not-allowed' | 'grab' | 'grabbing' | 'crosshair' | 'zoom-in' | 'zoom-out' | 'none' | 'progress' | 'cell' | 'copy' | 'alias' | 'context-menu' | 'col-resize' | 'row-resize' | 'n-resize' | 's-resize' | 'e-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize' | 'nesw-resize' | 'nwse-resize' | 'all-scroll' | 'no-drop' | 'vertical-text'",
  // ── Scroll ─────────────────────────────────────────────────────────────────
  "scroll-behavior": "'auto' | 'smooth'",
  "scroll-snap-type":
    "'none' | 'x' | 'y' | 'block' | 'inline' | 'both' | 'x mandatory' | 'x proximity' | 'y mandatory' | 'y proximity' | 'both mandatory' | 'both proximity'",
  "scroll-snap-align": "'none' | 'start' | 'end' | 'center'",
  "scroll-snap-stop": "'normal' | 'always'",
  "scroll-padding": "<length-percentage>",
  "scroll-padding-top": "<length-percentage>",
  "scroll-padding-right": "<length-percentage>",
  "scroll-padding-bottom": "<length-percentage>",
  "scroll-padding-left": "<length-percentage>",
  "scroll-padding-block": "<length-percentage>",
  "scroll-padding-inline": "<length-percentage>",
  "scroll-margin": "<length>",
  "scroll-margin-top": "<length>",
  "scroll-margin-right": "<length>",
  "scroll-margin-bottom": "<length>",
  "scroll-margin-left": "<length>",
  "scroll-margin-block": "<length>",
  "scroll-margin-inline": "<length>",
  "-webkit-overflow-scrolling": "'auto' | 'touch'",

  // ── Transforms ────────────────────────────────────────────────────────────
  transform: {
    "<string>": {
      self: {
        "transform-origin": "<position>",
        "transform-style": "'flat' | 'preserve-3d'",
        "perspective-origin": "<position>",
        "backface-visibility": "'visible' | 'hidden'",
        "z-index": "<integer>",
      },
      children: {},
    },
  },
  "transform-box":
    "'content-box' | 'border-box' | 'fill-box' | 'stroke-box' | 'view-box'",
  translate: "<length-percentage>",
  rotate: "<angle>",
  scale: "<number>",

  // ── Transitions ────────────────────────────────────────────────────────────
  transition: "<string>",
  "transition-property": "'none' | 'all' | <custom-ident>",
  "transition-duration": "<time>",
  "transition-timing-function": "<easing-function>",
  "transition-delay": "<time>",
  "transition-behavior": "'normal' | 'allow-discrete'",

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
  "animation-composition": "'replace' | 'add' | 'accumulate'",
  "animation-timeline": "'none' | 'auto' | <custom-ident>",

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
    "plus-darker": {
      self: { "z-index": "<integer>" },
      children: {},
    },
    "plus-lighter": {
      self: { "z-index": "<integer>" },
      children: {},
    },
  },
  "background-blend-mode":
    "'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'",
  "clip-path": "'none' | <basic-shape>",
  mask: "<string>",
  "mask-image": {
    none: { self: {}, children: {} },
    "<image>": {
      self: {
        "mask-mode": "'alpha' | 'luminance' | 'match-source'",
        "mask-repeat":
          "'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | 'space' | 'round'",
        "mask-position": "<position>",
        "mask-size": "'auto' | 'cover' | 'contain' | <length-percentage>",
        "mask-origin":
          "'border-box' | 'padding-box' | 'content-box' | 'fill-box' | 'stroke-box' | 'view-box'",
        "mask-clip":
          "'border-box' | 'padding-box' | 'content-box' | 'fill-box' | 'stroke-box' | 'view-box' | 'no-clip'",
        "mask-composite": "'add' | 'subtract' | 'intersect' | 'exclude'",
      },
      children: {},
    },
  },

  // ── Generated Content ──────────────────────────────────────────────────────
  content: "'normal' | 'none' | <string> | <url> | <custom-ident>",
  "counter-reset": "'none' | <custom-ident>",
  "counter-increment": "'none' | <custom-ident>",
  "counter-set": "'none' | <custom-ident>",
  quotes: "'none' | 'auto' | <string>",

  // ── Performance & Rendering ────────────────────────────────────────────────
  "will-change":
    "'auto' | 'scroll-position' | 'contents' | 'transform' | 'opacity'",
  contain: {
    none: { self: {}, children: {} },
    strict: { self: {}, children: {} },
    content: { self: {}, children: {} },
    size: {
      self: {
        "contain-intrinsic-size": "'none' | 'auto' | <length>",
        "contain-intrinsic-width": "'none' | 'auto' | <length>",
        "contain-intrinsic-height": "'none' | 'auto' | <length>",
      },
      children: {},
    },
    layout: { self: {}, children: {} },
    style: { self: {}, children: {} },
    paint: { self: {}, children: {} },
    "inline-size": { self: {}, children: {} },
  },
  "contain-intrinsic-size": "'none' | 'auto' | <length>",
  "contain-intrinsic-width": "'none' | 'auto' | <length>",
  "contain-intrinsic-height": "'none' | 'auto' | <length>",
  "container-type": {
    normal: { self: {}, children: {} },
    size: {
      self: { "container-name": "'none' | <custom-ident>" },
      children: {},
    },
    "inline-size": {
      self: { "container-name": "'none' | <custom-ident>" },
      children: {},
    },
  },
  container: "<string>",
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
        "column-rule-width": "<line-width>",
        "column-rule-style": "<line-style>",
        "column-rule-color": "<color>",
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
        "column-rule-width": "<line-width>",
        "column-rule-style": "<line-style>",
        "column-rule-color": "<color>",
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
        "column-rule-width": "<line-width>",
        "column-rule-style": "<line-style>",
        "column-rule-color": "<color>",
        "column-fill": "'auto' | 'balance' | 'balance-all'",
        "column-span": "'none' | 'all'",
      },
      children: {},
    },
  },
  "column-rule": "<string>",
  "column-rule-width": "<line-width>",
  "column-rule-style": "<line-style>",
  "column-rule-color": "<color>",
  "column-fill": "'auto' | 'balance' | 'balance-all'",
  "column-span": "'none' | 'all'",
  orphans: "<integer>",
  widows: "<integer>",

  // ── Writing Modes & Internationalization ───────────────────────────────────
  "writing-mode":
    "'horizontal-tb' | 'vertical-rl' | 'vertical-lr' | 'sideways-rl' | 'sideways-lr'",
  direction: "'ltr' | 'rtl'",
  "unicode-bidi":
    "'normal' | 'embed' | 'isolate' | 'bidi-override' | 'isolate-override' | 'plaintext'",
  "text-orientation": "'mixed' | 'upright' | 'sideways'",
  "text-combine-upright": "'none' | 'all'",

  // ── Page / Print ───────────────────────────────────────────────────────────
  "break-before":
    "'auto' | 'avoid' | 'always' | 'all' | 'avoid-page' | 'page' | 'column' | 'avoid-column'",
  "break-after":
    "'auto' | 'avoid' | 'always' | 'all' | 'avoid-page' | 'page' | 'column' | 'avoid-column'",
  "break-inside": "'auto' | 'avoid' | 'avoid-page' | 'avoid-column'",
  "page-break-before": "'auto' | 'avoid' | 'always' | 'left' | 'right'",
  "page-break-after": "'auto' | 'avoid' | 'always' | 'left' | 'right'",
  "page-break-inside": "'auto' | 'avoid'",

  // ── SVG / Presentation ────────────────────────────────────────────────────
  fill: "<color>",
  "fill-opacity": "<alpha-value>",
  "fill-rule": "'nonzero' | 'evenodd'",
  stroke: "<color>",
  "stroke-width": "<length-percentage>",
  "stroke-opacity": "<alpha-value>",
  "stroke-linecap": "'butt' | 'round' | 'square'",
  "stroke-linejoin": "'miter' | 'miter-clip' | 'round' | 'bevel' | 'arcs'",
  "stroke-dasharray": "'none' | <string>",
  "stroke-dashoffset": "<length-percentage>",
  "paint-order": "'normal' | 'fill' | 'stroke' | 'markers'",
  "shape-rendering":
    "'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision'",
  "color-interpolation": "'auto' | 'sRGB' | 'linearRGB'",
  "color-interpolation-filters": "'auto' | 'sRGB' | 'linearRGB'",
  "vector-effect":
    "'none' | 'non-scaling-stroke' | 'non-scaling-size' | 'non-rotation' | 'fixed-position'",
});

// lsp-touch
