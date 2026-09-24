import { createsStackingContext, isOutOfFlow } from "./style.ts";
import { walk } from "./measured.ts";
import { paintOrder } from "./paint-order.ts";
import type { Box } from "./types.ts";

/**
 * Who paints over whom, and whether that actually hides anything.
 *
 * `predicates.ts` answers "do these two boxes overlap in paint order". That is
 * not the same question as "can I still read this", and the difference is why
 * this file exists:
 *
 * - a coverer with no `background-color` is transparent, so the content behind
 *   it is still legible even though it paints later;
 * - a coverer that clips one corner of a box hides nothing readable if the text
 *   sits in the other corner;
 * - two coverers that each hide half a line hide the line between them, so
 *   coverage has to be measured against their *union*.
 *
 * Occlusion is therefore reported against the text lines a box owns, not
 * against its border box, and only opaque coverers count.
 *
 * The claim this file makes is checked against Chromium pixel-for-pixel by
 * `tests/resolved-format/occlusion-conformance.test.ts`: the page is screenshotted
 * with the node's text painted and again with it transparent, and the two must
 * be byte-identical exactly when this file says the text is fully hidden.
 */

const EPSILON = 0.01;

/** Fraction of a line's area that must be covered to call it unreadable. */
const HIDDEN_THRESHOLD = 0.99;

export type Rect = { x: number; y: number; width: number; height: number };

export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right - x <= EPSILON || bottom - y <= EPSILON) return null;
  return { x, y, width: right - x, height: bottom - y };
}

function area(rect: Rect): number {
  return rect.width * rect.height;
}

/**
 * Area of `target` covered by the union of `covers`.
 *
 * Summing pairwise intersections would double-count overlapping coverers, so
 * the target is split on every coverer edge and each resulting cell is counted
 * once. Exact, and the cell count stays trivial at these sizes.
 */
export function unionCoveredArea(target: Rect, covers: readonly Rect[]): number {
  const clipped = covers
    .map((cover) => intersect(target, cover))
    .filter((rect): rect is Rect => rect !== null);
  if (clipped.length === 0) return 0;

  const xs = [...new Set(clipped.flatMap((r) => [r.x, r.x + r.width]))].sort(
    (a, b) => a - b,
  );
  const ys = [...new Set(clipped.flatMap((r) => [r.y, r.y + r.height]))].sort(
    (a, b) => a - b,
  );

  let covered = 0;
  for (let i = 0; i + 1 < xs.length; i += 1) {
    for (let j = 0; j + 1 < ys.length; j += 1) {
      const cell: Rect = {
        x: xs[i]!,
        y: ys[j]!,
        width: xs[i + 1]! - xs[i]!,
        height: ys[j + 1]! - ys[j]!,
      };
      if (cell.width <= EPSILON || cell.height <= EPSILON) continue;
      const midpoint = {
        x: cell.x + cell.width / 2,
        y: cell.y + cell.height / 2,
        width: 0,
        height: 0,
      };
      const inside = clipped.some(
        (r) =>
          midpoint.x > r.x &&
          midpoint.x < r.x + r.width &&
          midpoint.y > r.y &&
          midpoint.y < r.y + r.height,
      );
      if (inside) covered += area(cell);
    }
  }
  return covered;
}

/** The rectangle a text run's glyphs occupy. */
export function runRect(_box: Box, run: Box["runs"][number]): Rect {
  return {
    x: run.x,
    y: run.y,
    width: run.width,
    height: run.height,
  };
}

export type Occluder = {
  readonly path: string;
  readonly tag: string;
  readonly position: Box["style"]["position"];
  readonly zIndex: number | null;
  /** The coverer paints a background, so it genuinely hides what is behind. */
  readonly opaque: boolean;
  /** Share of the covered box's border box this coverer sits on, 0..1. */
  readonly boxFraction: number;
  /**
   * Path of the stacking context each box belongs to.
   *
   * Carried because it is the only thing that makes the verdict checkable when
   * the numbers appear to contradict it. `z-index` is scoped to its stacking
   * context, so a descendant with `z-index: 999` inside a context with
   * `z-index: 1` still paints below a sibling context with `z-index: 2` — and a
   * reader who trusts the larger number over the stated paint order will get it
   * backwards unless the scoping is on the page.
   */
  readonly context: string;
  readonly targetContext: string;
  /** The coverer's `z-index` is the smaller number, yet it paints later. */
  readonly zIndexLooksBackwards: boolean;
};

export type LineCoverage = {
  readonly index: number;
  /** Share of the line's glyph rectangle under the union of opaque coverers. */
  readonly covered: number;
};

export type Occlusion = {
  /** Displaced boxes painting over this one, in paint order. */
  readonly occluders: readonly Occluder[];
  readonly lines: readonly LineCoverage[];
  /** Lines at least 99% covered by opaque paint: unreadable. */
  readonly linesHidden: number;
  /** Lines partly covered: readable in part, which is still a defect. */
  readonly linesClipped: number;
  /**
   * The node owns text and none of it can be read. The property the browser
   * oracle checks.
   */
  readonly textFullyHidden: boolean;
};

const NONE: Occlusion = {
  occluders: [],
  lines: [],
  linesHidden: 0,
  linesClipped: 0,
  textFullyHidden: false,
};

function isAncestorOf(ancestor: Box, box: Box): boolean {
  return ancestor !== box && walk(ancestor).includes(box);
}

/**
 * Out of flow, or relatively offset off its normal-flow slot.
 *
 * A plain in-flow box painting inside its parent's padding is nesting, not
 * occlusion, and an ancestor/descendant pair always overlaps by construction.
 * Only a *displaced* box can land somewhere it was not allotted.
 */
function isDisplaced(box: Box): boolean {
  if (isOutOfFlow(box.style)) return true;
  if (box.style.position !== "relative") return false;
  return (
    (box.style.top ?? 0) !== 0 ||
    (box.style.left ?? 0) !== 0 ||
    (box.style.right ?? 0) !== 0 ||
    (box.style.bottom ?? 0) !== 0
  );
}

/** The stacking context a box's `z-index` is measured within. */
function contextOf(box: Box, parents: ReadonlyMap<Box, Box>): Box {
  let current = parents.get(box);
  while (current !== undefined) {
    if (createsStackingContext(current.style)) return current;
    current = parents.get(current);
  }
  return box;
}

function parentMap(root: Box): Map<Box, Box> {
  const parents = new Map<Box, Box>();
  for (const box of walk(root)) {
    for (const child of box.children) parents.set(child, box);
  }
  return parents;
}

export function occlusionOf(target: Box, root: Box): Occlusion {
  const order = paintOrder(root);
  const index = order.indexOf(target);
  if (index === -1 || target.style.display === "none") return NONE;
  const parents = parentMap(root);
  const targetContext = contextOf(target, parents);

  const targetRect: Rect = {
    x: target.x,
    y: target.y,
    width: target.width,
    height: target.height,
  };

  const occluders: Occluder[] = [];
  const opaqueRects: Rect[] = [];
  for (const other of order.slice(index + 1)) {
    if (other.style.display === "none") continue;
    if (!isDisplaced(other)) continue;
    if (isAncestorOf(target, other) || isAncestorOf(other, target)) continue;
    const overlap = intersect(targetRect, other);
    if (overlap === null) continue;

    const opaque = other.style["background-color"] !== null;
    if (opaque) {
      opaqueRects.push({
        x: other.x,
        y: other.y,
        width: other.width,
        height: other.height,
      });
    }
    const otherZ = other.style["z-index"];
    const targetZ = target.style["z-index"];
    occluders.push({
      path: other.path,
      tag: other.tag,
      position: other.style.position,
      zIndex: otherZ,
      opaque,
      boxFraction:
        area(targetRect) === 0 ? 0 : area(overlap) / area(targetRect),
      context: contextOf(other, parents).path,
      targetContext: targetContext.path,
      zIndexLooksBackwards:
        otherZ !== null && targetZ !== null && otherZ < targetZ,
    });
  }

  if (occluders.length === 0) return NONE;

  const lines: LineCoverage[] = target.runs.map((run, lineIndex) => {
    const rect = runRect(target, run);
    const total = area(rect);
    return {
      index: lineIndex,
      covered: total === 0 ? 0 : unionCoveredArea(rect, opaqueRects) / total,
    };
  });

  const linesHidden = lines.filter(
    (line) => line.covered >= HIDDEN_THRESHOLD,
  ).length;
  const linesClipped = lines.filter(
    (line) => line.covered > 0 && line.covered < HIDDEN_THRESHOLD,
  ).length;

  return {
    occluders,
    lines,
    linesHidden,
    linesClipped,
    textFullyHidden: lines.length > 0 && linesHidden === lines.length,
  };
}

export type Collision = {
  /** The other node whose glyphs land on this one's. */
  readonly path: string;
  readonly tag: string;
  /** Share of this node's glyph area the other node's glyphs sit on. */
  readonly fraction: number;
};

/**
 * Nodes whose glyphs are drawn on top of each other.
 *
 * This is a separate question from occlusion and neither subsumes the other.
 * Occlusion needs a coverer with a background; two text runs with no background
 * between them simply interleave, and both become unreadable without anything
 * being "covered". It also needs a *displaced* coverer, and this does not: a
 * zero-height box in normal flow whose text overflows lands on the next
 * sibling's text while both are perfectly in flow.
 *
 * Only a measurement is reported — that two glyph rectangles intersect, and by
 * how much. Whether the result is legible is not something geometry can settle,
 * so no such claim is made.
 */
export function textCollisions(root: Box): Map<string, Collision[]> {
  const runs: { path: string; tag: string; rect: Rect }[] = [];
  for (const box of walk(root)) {
    if (box.style.display === "none") continue;
    for (const run of box.runs) {
      runs.push({ path: box.path, tag: box.tag, rect: runRect(box, run) });
    }
  }

  const byPath = new Map<string, Collision[]>();
  const totals = new Map<string, number>();
  for (const entry of runs) {
    totals.set(entry.path, (totals.get(entry.path) ?? 0) + area(entry.rect));
  }

  for (const a of runs) {
    for (const b of runs) {
      if (a.path === b.path) continue;
      const overlap = intersect(a.rect, b.rect);
      if (overlap === null) continue;
      const total = totals.get(a.path) ?? 0;
      const list = byPath.get(a.path) ?? [];
      const existing = list.find((entry) => entry.path === b.path);
      const fraction = total === 0 ? 1 : area(overlap) / total;
      if (existing === undefined) {
        list.push({ path: b.path, tag: b.tag, fraction });
      } else {
        list[list.indexOf(existing)] = {
          ...existing,
          fraction: Math.min(1, existing.fraction + fraction),
        };
      }
      byPath.set(a.path, list);
    }
  }
  return byPath;
}
