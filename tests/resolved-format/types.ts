/** Physical edge values, in CSS px. */
export type Edges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const ZERO_EDGES: Edges = { top: 0, right: 0, bottom: 0, left: 0 };

export type LineStyle = "none" | "solid" | "dashed" | "dotted" | "double";

/**
 * The subset of computed style the format's predicates reason about, as read
 * from the browser.
 *
 * Every value here is the browser's computed value, already resolved to px
 * where the property is a length. Keys keep their CSS spelling, exactly as they
 * are written in a `css` block.
 *
 * `display` and `position` are plain strings: Chromium can produce `flex`,
 * `grid`, `sticky` and so on, and the predicates only special-case the ones
 * they special-case.
 */
export type ComputedStyle = {
  display: string;
  position: string;
  /** Box offsets. `null` means `auto`. */
  top: number | null;
  right: number | null;
  bottom: number | null;
  left: number | null;
  /** `null` means `auto`. */
  "z-index": number | null;
  /** `null` means `auto`. */
  width: number | null;
  /** `null` means `auto`. */
  height: number | null;
  padding: Edges;
  "border-width": Edges;
  "border-style": LineStyle;
  "font-size": number;
  /** Resolved to px by the browser. */
  "line-height": number;
  "text-transform": "none" | "uppercase" | "lowercase" | "capitalize";
  /**
   * Only used to decide occlusion. `null` means the box is transparent and
   * whatever is behind it shows through, which is the default and is *not*
   * changed by `position`.
   */
  "background-color": string | null;
};

/** A run of text placed on one line, positioned in page px. */
export type TextRun = {
  /**
   * The text of the line. Not populated from the browser — line splitting is
   * measured, not derived — so consumers must use `width`/`height`.
   */
  text: string;
  x: number;
  y: number;
  /** Measured width of the line's glyph box, in px. */
  width: number;
  /** Measured height of the line box, in px. */
  height: number;
};

/**
 * A measured box, in absolute page coordinates. `x`/`y`/`width`/`height`
 * describe the *border box*, matching `box-sizing: border-box`, exactly as
 * `getBoundingClientRect()` reports it.
 */
export type Box = {
  tag: string;
  /** Path from the root, e.g. `root.header.title`. Stable node identity. */
  path: string;
  style: ComputedStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Text directly owned by this box (not by its children). */
  runs: TextRun[];
  children: Box[];
  /**
   * Content extent actually required by children and text, in px. Used by the
   * `overflows` predicate; may exceed the content box when `height` or
   * `width` is explicit.
   */
  contentWidth: number;
  contentHeight: number;
};
