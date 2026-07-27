import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import minimalCSSSyntax from "@/css/syntax-config/variations/minimal.ts";
import { SUPPORTED_KEYWORDS } from "@/dsl/index.ts";

export default cssAttributeConfig(SUPPORTED_KEYWORDS, minimalCSSSyntax, {
  // ── Box Model ──────────────────────────────────────────────────────────────
  width: "<length>",
  height: "<length>",
  margin: "<length>",
  padding: "<length>",

  // ── Layout ─────────────────────────────────────────────────────────────────
  display: {
    block: { self: {}, children: {} },
    inline: { self: {}, children: {} },
    "inline-block": { self: {}, children: {} },
    none: { self: {}, children: {} },
    "list-item": { self: {}, children: {} },

    flex: {
      self: {
        "flex-direction": "'row' | 'row-reverse' | 'column' | 'column-reverse'",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
        gap: "<length>",
      },
      children: {},
    },

    grid: {
      self: {
        gap: "<length>",
        "justify-content":
          "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'",
        "align-items":
          "'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'",
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
  "text-align": "'left' | 'right' | 'center' | 'justify'",
  "text-transform": "'none' | 'uppercase' | 'lowercase' | 'capitalize'",

  // ── Visibility & Interaction ───────────────────────────────────────────────
  visibility: "'visible' | 'hidden'",
  "pointer-events": "'auto' | 'none'",
  cursor: "'auto' | 'default' | 'pointer' | 'text' | 'not-allowed' | 'none'",

  // ── Transitions ────────────────────────────────────────────────────────────
  "transition-duration": "<time>",
  "transition-timing-function": "<easing-function>",
});
