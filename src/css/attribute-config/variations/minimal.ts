import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import minimalCSSSyntax from "@/css/syntax-config/variations/minimal.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

export default cssAttributeConfig(SUPPORTED_KEYWORDS, minimalCSSSyntax, {
  // ── Box Model ──────────────────────────────────────────────────────────────
  margin: "<length>",
  padding: "<length>",

  // ── Layout ─────────────────────────────────────────────────────────────────
  display: {
    block: {
      self: {
        width: "<length>",
        height: "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },
    inline: {
      self: { "vertical-align": "'baseline' | 'top' | 'middle' | 'bottom'" },
      children: {},
    },
    "inline-block": {
      self: {
        width: "<length>",
        height: "<length>",
        "vertical-align": "'baseline' | 'top' | 'middle' | 'bottom'",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },
    none: {
      self: {
        width: "<length>",
        height: "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },
    "list-item": {
      self: {
        width: "<length>",
        height: "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },

    flex: {
      self: {
        width: "<length>",
        height: "<length>",
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        gap: "<length>",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },

    grid: {
      self: {
        width: "<length>",
        height: "<length>",
        gap: "<length>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        "text-align": "'left' | 'right' | 'center' | 'justify'",
      },
      children: {},
    },
  },
  position: {
    static: { self: {}, children: {} },
    relative: {
      self: {
        top: "<length>",
        right: "<length>",
        bottom: "<length>",
        left: "<length>",
        "z-index": "<integer>",
      },
      children: {},
    },
    absolute: {
      self: {
        top: "<length>",
        right: "<length>",
        bottom: "<length>",
        left: "<length>",
        "z-index": "<integer>",
      },
      children: {},
    },
    fixed: {
      self: {
        top: "<length>",
        right: "<length>",
        bottom: "<length>",
        left: "<length>",
        "z-index": "<integer>",
      },
      children: {},
    },
    sticky: {
      self: {
        top: "<length>",
        right: "<length>",
        bottom: "<length>",
        left: "<length>",
        "z-index": "<integer>",
      },
      children: {},
    },
  },
  overflow: "'visible' | 'hidden' | 'scroll' | 'auto'",

  // ── Flexbox ────────────────────────────────────────────────────────────────

  // ── Colors & Background ────────────────────────────────────────────────────
  color: "<color>",
  "background-color": "<color>",

  // ── Border ─────────────────────────────────────────────────────────────────
  "border-radius": "<length>",
  "border-width": "<line-width>",
  "border-style": "<line-style>",
  "border-color": "<color>",

  // ── Typography ─────────────────────────────────────────────────────────────
  "font-size": "<length>",
  "font-weight": "<font-weight>",
  "line-height": "<number>",
  "text-transform": "'none' | 'uppercase' | 'lowercase' | 'capitalize'",

  // ── Visibility & Interaction ───────────────────────────────────────────────
  visibility: "'visible' | 'hidden'",
  "pointer-events": "'auto' | 'none'",
  cursor: "'auto' | 'default' | 'pointer' | 'text' | 'not-allowed' | 'none'",

  // ── Transitions ────────────────────────────────────────────────────────────
  "transition-duration": "<time>",
  "transition-timing-function": "<easing-function>",
});
