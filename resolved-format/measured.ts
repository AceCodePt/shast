import type { Browser, Page } from "playwright";
import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import { resolveCascade, type Cascade } from "./cascade.ts";
import { htmlDocument } from "./html-document.ts";
import { normaliseBackground } from "./style.ts";
import { ancestorPath, childPath, flowItems, ROOT_PATH } from "./tree.ts";
import type { Box, ComputedStyle, LineStyle, TextRun } from "./types.ts";/**
 * Browser measurement.
 *
 * The resolved document's geometry used to come from a layout engine that
 * reimplemented block layout and threw `UnsupportedError` on anything it did
 * not model. It now comes from Chromium itself: the component is rendered into
 * a real page and every box is read back with `getBoundingClientRect`,
 * `getComputedStyle` and the scroll geometry. That is what made `flex`, `grid`
 * and `sticky` just work instead of throwing, and it means the format can never
 * disagree with the renderer about a number the browser itself produced.
 *
 * The result is a flat, JSON-serialisable list in walk order, with children
 * stored as indices — `MeasuredBox` — so a case's measurement can be cached on
 * disk and fed to the synchronous `resolveDocument` without re-opening a
 * browser. `materializeBoxes` turns it back into a box tree with references.
 */

/** The serialisable form of a box: children are indices into the flat list. */
export type MeasuredBox = Omit<Box, "children"> & {
  readonly children: readonly number[];
};

type RawBox = {
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: Record<string, string>;
  lines: { x: number; y: number; width: number; height: number }[];
};

const STYLE_NAMES = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "width",
  "height",
  "font-size",
  "line-height",
  "text-transform",
  "background-color",
  "border-style",
] as const;

/**
 * One element's box, computed style, scroll geometry and text line boxes.
 *
 * The DOM walk and the AST walk produce the same sequence because
 * `Object.values(innerHTML)` is insertion-ordered and the HTML renderer emits
 * children in that order (see `render-component.ts`) - so no debug attributes
 * are needed and paths can be zipped onto the raw boxes.
 *
 * Line boxes come from a `Range` over each direct text node:
 * `getClientRects()` returns one rectangle per visual line, which is how the
 * format learns how many lines a node's text actually wrapped into.
 *
 * A `display: none` subtree is reported as one box and then skipped. Its
 * children do not render at all, so reporting them as zero-size boxes would be
 * a lie the format's own `zero` flag would then repeat.
 */
const COLLECT = `(() => {
  const names = ${JSON.stringify(STYLE_NAMES)};
  const out = [];
  const visit = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const style = {};
    for (const name of names) style[name] = cs.getPropertyValue(name);
    style["padding"] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(" ");
    style["border-width"] = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(" ");
    const lines = [];
    for (const child of el.childNodes) {
      if (child.nodeType !== 3) continue;
      const data = child.textContent ?? "";
      if (data.trim() === "") continue;
      const range = document.createRange();
      range.selectNodeContents(child);
      for (const rect of range.getClientRects()) {
        lines.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
      range.detach();
    }
    out.push({
      tag: el.tagName.toLowerCase(),
      x: r.x, y: r.y, width: r.width, height: r.height,
      style,
      lines,
    });
    if (cs.display === "none") return;
    for (const child of el.children) visit(child);
  };
  visit(document.body.firstElementChild);
  return out;
})()`;

/** `"auto"` (and garbage) mean the offset or size is not fixed. */
function length(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && value.trim() !== "auto" ? parsed : null;
}

function integer(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "auto") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `"0px 0px 0px 0px"` in top-right-bottom-left order. */
function edges(value: string | undefined): ComputedStyle["padding"] {
  if (value === undefined) return { top: 0, right: 0, bottom: 0, left: 0 };
  const [top, right, bottom, left] = value.split(/\s+/u).map(Number.parseFloat);
  return {
    top: top ?? 0,
    right: right ?? 0,
    bottom: bottom ?? 0,
    left: left ?? 0,
  };
}

function computedStyle(style: Record<string, string>): ComputedStyle {
  const fontSize = Number.parseFloat(style["font-size"] ?? "16") || 16;
  const lineHeight = Number.parseFloat(style["line-height"] ?? "");
  return {
    display: style["display"] ?? "block",
    position: style["position"] ?? "static",
    top: length(style["top"]),
    right: length(style["right"]),
    bottom: length(style["bottom"]),
    left: length(style["left"]),
    "z-index": integer(style["z-index"]),
    width: length(style["width"]),
    height: length(style["height"]),
    padding: edges(style["padding"]),
    "border-width": edges(style["border-width"]),
    "border-style": (style["border-style"] ?? "solid") as LineStyle,
    "font-size": fontSize,
    // A `line-height: normal` falls back to the browser's usual 1.2.
    "line-height": Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.2,
    "text-transform": (style["text-transform"] ??
      "none") as ComputedStyle["text-transform"],
    "background-color": normaliseBackground(style["background-color"] ?? null),
  };
}

/**
 * The rendered subtree, mirroring the browser's walk: a node whose computed
 * display is `none` is included, but its descendants are not.
 */
function renderedNodes(
  root: BaseComponentStructure,
  cascade: Cascade,
): { path: string; tag: string }[] {
  const out: { path: string; tag: string }[] = [];
  const visit = (node: BaseComponentStructure, path: string): void => {
    const tag = typeof node["tag"] === "string" ? node["tag"] : "div";
    out.push({ path, tag });
    const resolved = cascade.byPath.get(path);
    if (resolved?.style["display"]?.value === "none") return;
    for (const item of flowItems(node)) {
      if (item.kind === "element") visit(item.node, childPath(path, item.segment));
    }
  };
  visit(root, ROOT_PATH);
  return out;
}

function boxOf(raw: RawBox, path: string): Box {
  const style = computedStyle(raw.style);
  // The browser's line boxes (from `Range.getClientRects`) hang half-leading
  // above and below the glyphs, so they reach ~1px outside the box and would
  // read as overflowing — or as colliding with the next sibling's line. The
  // format stacks lines at the LayoutUnit-floored line height from the content
  // top, which is where Chromium actually places them, so x and width stay
  // measured while y and height are snapped to the box's own geometry.
  const lineHeight = Math.floor(style["line-height"] * 64) / 64;
  const contentTop = raw.y + style["border-width"].top + style.padding.top;
  const runs: TextRun[] = raw.lines.map((line, index) => ({
    text: "",
    x: line.x,
    y: contentTop + index * lineHeight,
    width: line.width,
    height: lineHeight,
  }));
  return {
    tag: raw.tag,
    path,
    style,
    x: raw.x,
    y: raw.y,
    width: raw.width,
    height: raw.height,
    runs,
    children: [],
    // Filled in by `measureBoxesOnPage` once children exist: the content extent
    // is the format's own geometry (snapped runs plus children), not the raw
    // scroll size — Chromium's scroll area counts the font's half-leading as
    // overflow, which would flag every text-carrying box.
    contentWidth: 0,
    contentHeight: 0,
  };
}

/** Measures a component into a flat, serialisable box list. */
export async function measureBoxesOnPage(
  page: Page,
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
): Promise<MeasuredBox[]> {
  const { document } = htmlDocument(tagConfig, node);
  await page.setContent(document, { waitUntil: "load" });
  const raw = (await page.evaluate(COLLECT)) as RawBox[];
  const cascade = resolveCascade(node);
  const paths = renderedNodes(node, cascade);

  if (raw.length !== paths.length) {
    throw new Error(
      `measure: the DOM walk found ${raw.length} boxes but the AST walk has ` +
        `${paths.length} nodes. The renderer and the resolver disagree about ` +
        `which elements exist, so paths cannot be zipped onto geometry.`,
    );
  }
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index]!.tag !== paths[index]!.tag) {
      throw new Error(
        `measure: the DOM walk and the AST walk diverge at ${index} ` +
          `(dom <${raw[index]!.tag}>, ast <${paths[index]!.tag}> ` +
          `${paths[index]!.path}).`,
      );
    }
  }

  // Rebuild the tree by path, then flatten. Paths are in preorder, so every
  // node's parent precedes it and the flat list preserves walk order.
  const byPath = new Map(raw.map((value, index) => [paths[index]!.path, value]));
  const childrenByPath = new Map<string, string[]>();
  for (const entry of paths) {
    // The root's `ancestorPath(path, 1)` is `path` itself; skip it so the root
    // does not become its own child.
    const parent = ancestorPath(entry.path, 1);
    if (parent === entry.path) continue;
    const list = childrenByPath.get(parent) ?? [];
    list.push(entry.path);
    childrenByPath.set(parent, list);
  }

  const build = (path: string): Box => {
    const rawBox = byPath.get(path);
    if (rawBox === undefined) throw new Error(`measure: no box at '${path}'`);
    const box = boxOf(rawBox, path);
    for (const child of childrenByPath.get(path) ?? []) {
      box.children.push(build(child));
    }

    // Content extent: the format's own geometry. Runs are already snapped to
    // the content box; children extend it. The bottom of the last snapped line
    // is what the box's height should cover, so a text box whose height came
    // from its line does not flag `overflows` the way the raw scroll area
    // would.
    const contentLeft = box.x + box.style["border-width"].left + box.style.padding.left;
    const contentTop = box.y + box.style["border-width"].top + box.style.padding.top;
    let right = contentLeft;
    let bottom = contentTop;
    for (const run of box.runs) {
      right = Math.max(right, run.x + run.width);
      bottom = Math.max(bottom, run.y + run.height);
    }
    for (const child of box.children) {
      if (child.style.display === "none") continue;
      right = Math.max(right, child.x + child.width);
      bottom = Math.max(bottom, child.y + child.height);
    }
    box.contentWidth = Math.max(0, right - contentLeft);
    box.contentHeight = Math.max(0, bottom - contentTop);
    return box;
  };
  const root = build(ROOT_PATH);
  const flat = walk(root);
  const indexOf = new Map(flat.map((box, index) => [box, index]));
  return flat.map((box) => ({
    ...box,
    children: box.children.map((child) => indexOf.get(child)!),
  }));
}

/** Opens a page for the measurement and closes it afterwards. */
export async function measureBoxes(
  browser: Browser,
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  viewport: { width: number; height: number },
): Promise<MeasuredBox[]> {
  const page = await browser.newPage({ viewport });
  try {
    return await measureBoxesOnPage(page, tagConfig, node);
  } finally {
    await page.close();
  }
}

/** Depth-first walk in tree order. */
export function walk(box: Box): Box[] {
  const out: Box[] = [box];
  for (const child of box.children) out.push(...walk(child));
  return out;
}

/** Reattaches child references (indices -> pointers), preserving walk order. */
export function materializeBoxes(measured: readonly MeasuredBox[]): Box[] {
  const boxes: Box[] = measured.map((entry) => ({
    ...entry,
    children: [],
  }));
  boxes.forEach((box, index) => {
    for (const child of measured[index]!.children) {
      box.children.push(boxes[child]!);
    }
  });
  return boxes;
}
