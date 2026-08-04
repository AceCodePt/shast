import type { BaseComponentStructure } from "@/engine/types.ts";
import {
  resolveCascade,
  type Cascade,
  type ResolvedNode,
  type ResolvedStyle,
} from "./cascade.ts";
import {
  occlusionOf,
  textCollisions,
  type Collision,
  type Occlusion,
} from "./occlusion.ts";
import { applyTextTransform } from "./style.ts";
import { belowFold, offscreenReasons } from "./predicates.ts";
import { materializeBoxes, type MeasuredBox } from "./measured.ts";
import type { Box } from "./types.ts";

/**
 * The resolved-node document: one flat record per rendered node, in which the
 * style is fully resolved, the geometry is measured, and every contested
 * property carries its provenance.
 *
 * Two consumers, one artifact. `box` + `style` answer "what does this look
 * like" and are complete on their own. `style[...].shadows` answers "who else
 * had an opinion" and is only present when something was contested. Nothing in
 * the second group is needed to read the first.
 */

/** Facts a single rectangle cannot carry. */
export type Flag =
  /** Text broke onto more than one line. */
  | "wrapped"
  /**
   * Content is larger than the content box, so it is drawn *outside* the box.
   *
   * Deliberately not called `clipped`. The registry has no supported `overflow`
   * value, so overflow is always `visible`: the content still paints, in full,
   * spilling over whatever sits beyond the box's edge. Calling it clipped would
   * say the opposite of what happens and would make a reader look for missing
   * content instead of for a collision.
   */
  | "overflows"
  /**
   * The box begins at or below the viewport's bottom edge: the viewer has to
   * scroll to it, which is what a page does.
   *
   * Split out of `offscreen` after measuring. On a 14,000px page in a 900px
   * viewport, a single `offscreen` flag fires on 863 of 922 nodes and its detail
   * lines were 31% of the whole document — a third of the report spent saying
   * that a scrollable page scrolls. That is not a finding, it is a fact about
   * pages, and burying eleven real problems under it makes the channel useless.
   * So this one carries no `!` line: the `@` box already gives `y`, and the flag
   * names the conclusion.
   */
  | "below-fold"
  /**
   * Part of the box is somewhere scrolling will not reach: above the top edge,
   * left of the left edge, or past the right edge — pages do not scroll
   * horizontally by default. Unlike `below-fold`, this is a defect.
   */
  | "offscreen"
  /** Rendered at no size while carrying content — usually a bug. */
  | "zero"
  /** `display: none`. Deliberately absent, as opposed to accidentally zero. */
  | "hidden"
  /** A displaced box paints over part of it. */
  | "covered"
  /** Another node's glyphs are drawn on top of this node's. */
  | "collides"
  /** A state block declares something that is overruled, so it never applies. */
  | "dead-state";

export type Finding = {
  readonly flag: Flag;
  readonly detail: string;
};

export type NodeRecord = {
  /** `>`-joined `innerHTML` keys from the root. Identifies exactly one node. */
  readonly path: string;
  readonly tag: string;
  /**
   * Text this node owns directly, **as rendered** — `text-transform` applied.
   * `null` when it owns none.
   *
   * The source string would be a quiet lie: a node under an inherited
   * `text-transform: uppercase` renders `TOTAL DUE` and a report that printed
   * `Total due` would be describing a page that does not exist.
   */
  readonly text: string | null;
  /** The source string, present only when the transform changed it. */
  readonly textSource: string | null;
  /**
   * Effective text metrics, whether declared here or inherited.
   *
   * Carried because `style` holds only what was *declared*, and the `=` line
   * promises to be complete: a heading that renders at 28px because its parent
   * said so would otherwise show no size at all, and two nodes could not be
   * compared for emphasis without walking the tree — which is exactly the work
   * the format exists to have already done.
   */
  readonly fontSize: number;
  readonly fontSizeInherited: boolean;
  readonly lineHeight: number;
  /**
   * A replaced element (`img`, `svg`, `canvas`, `video`): it has a box, and the
   * format says nothing whatsoever about what it depicts.
   */
  readonly replaced: boolean;
  /** `x, y, w, h` of the border box in CSS px. Never absent. */
  readonly box: readonly [number, number, number, number];
  readonly flags: readonly Flag[];
  readonly style: ResolvedStyle;
  readonly states: Readonly<Record<string, ResolvedStyle>>;
  /** State declarations that are overruled and therefore never apply. */
  readonly deadStates: ResolvedNode["deadStates"];
  /** Why each flag fired, in the flags' order. */
  readonly findings: readonly Finding[];
  readonly occlusion: Occlusion;
  /** Text lines after wrapping. 0 when the node owns no text. */
  readonly lines: number;
};

export type ResolvedDocument = {
  /**
   * A box is true at one width. Recording the viewport is not optional: a
   * document with ambiguous geometry invites a reader to describe a layout that
   * was never measured. Render one document per breakpoint instead.
   */
  readonly viewport: { readonly w: number; readonly h: number; readonly dpr: number };
  /**
   * What the boxes were measured against. Boxes are sized by the text actually
   * present, so a node sized by a three-word label is not the same node with a
   * sentence in it. Say so when the content is a stand-in.
   */
  readonly content: "actual" | "placeholder";
  readonly nodes: readonly NodeRecord[];
};

export type ResolveOptions = {
  viewport: { width: number; height: number };
  dpr?: number;
  content?: "actual" | "placeholder";
  /**
   * Browser-measured boxes for this tree, produced by `measureBoxes` /
   * `measureBoxesOnPage` and typically cached on disk so the document can be
   * rebuilt without a browser. Must cover the same subtree in the same walk
   * order as the cascade.
   */
  measured: readonly MeasuredBox[];
};

const REPLACED = new Set(["img", "svg", "canvas", "video", "iframe", "object"]);

const EPSILON = 0.01;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function contentBox(box: Box): { width: number; height: number } {
  const padding = box.style.padding;
  const border = box.style["border-width"];
  return {
    width: Math.max(
      0,
      box.width - border.left - border.right - padding.left - padding.right,
    ),
    height: Math.max(
      0,
      box.height - border.top - border.bottom - padding.top - padding.bottom,
    ),
  };
}

function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function describeOccluder(
  occluder: Occlusion["occluders"][number],
  target: Box,
): string {
  const z = occluder.zIndex === null ? "" : `, z-index ${occluder.zIndex}`;
  const who = `${occluder.path} <${occluder.tag}> (${occluder.position}${z})`;
  const extent = `over ${percent(occluder.boxFraction)} of the box`;
  const what = occluder.opaque
    ? `paints later than this node, with an opaque background, ${extent}`
    : `paints later than this node ${extent}, but has no background, so what is behind it still shows through`;

  // Without this the report states a conclusion that the two z-index numbers
  // appear to contradict, and a reader who trusts the larger number overrules
  // the measurement. Naming the scope makes the verdict checkable instead.
  const caveat = occluder.zIndexLooksBackwards
    ? ` — the smaller z-index still wins here because this node's ` +
      `z-index ${target.style["z-index"]} is scoped to the stacking context of ` +
      `${occluder.targetContext}, and that whole context paints below ` +
      `${occluder.path}`
    : "";

  return `${who} ${what}${caveat}`;
}

/**
 * What the coverage adds up to for the text this node owns.
 *
 * Reported separately from the per-coverer lines because it is the union that
 * decides readability: two coverers hiding half a line each hide the line.
 */
function describeTextCoverage(occlusion: Occlusion): string | null {
  const total = occlusion.lines.length;
  if (total === 0) return null;
  if (occlusion.linesHidden === 0 && occlusion.linesClipped === 0) {
    return `this node's ${total} text line(s) stay fully visible`;
  }
  const parts: string[] = [];
  if (occlusion.linesHidden > 0) {
    parts.push(
      `${occlusion.linesHidden} of ${total} text line(s) completely hidden`,
    );
  }
  if (occlusion.linesClipped > 0) {
    const worst = Math.max(
      ...occlusion.lines
        .filter((line) => line.covered < 0.99)
        .map((line) => line.covered),
    );
    parts.push(
      `${occlusion.linesClipped} partly hidden (up to ${percent(worst)} of a line)`,
    );
  }
  return parts.join(", ");
}

function analyse(
  box: Box,
  root: Box,
  viewport: { width: number; height: number },
  collisions: readonly Collision[],
  deadStates: ResolvedNode["deadStates"],
): { flags: Flag[]; findings: Finding[]; occlusion: Occlusion } {
  const flags: Flag[] = [];
  const findings: Finding[] = [];

  if (box.style.display === "none") {
    return {
      flags: ["hidden"],
      findings: [{ flag: "hidden", detail: "display: none" }],
      occlusion: occlusionOf(box, root),
    };
  }

  const occlusion = occlusionOf(box, root);
  const content = contentBox(box);

  if (box.runs.length > 1) {
    flags.push("wrapped");
    findings.push({
      flag: "wrapped",
      detail:
        `text broke onto ${box.runs.length} lines at ${round(content.width)}px ` +
        `content width`,
    });
  }

  if (
    box.contentWidth > content.width + EPSILON ||
    box.contentHeight > content.height + EPSILON
  ) {
    flags.push("overflows");
    findings.push({
      flag: "overflows",
      detail:
        `content is ${round(box.contentWidth)}x${round(box.contentHeight)}px ` +
        `inside a ${round(content.width)}x${round(content.height)}px content box, ` +
        `so it is painted outside the box rather than cut off ` +
        `(overflow is visible)`,
    });
  }

  // Shared with `predicates.audit()` so the two findings channels cannot give
  // the same tree two different verdicts. See `offscreenReasons`.
  const unreachable = offscreenReasons(box, viewport).map(({ edge, px }) => {
    if (edge === "top") return `${round(px)}px above the top edge`;
    if (edge === "left") return `${round(px)}px left of the left edge`;
    return `${round(px)}px past the right edge (pages do not scroll horizontally)`;
  });
  if (unreachable.length > 0) {
    flags.push("offscreen");
    findings.push({
      flag: "offscreen",
      detail: `${unreachable.join(", ")}; viewport is ${viewport.width}x${viewport.height}`,
    });
  }

  // Flag only, no detail: see the note on `below-fold`.
  if (belowFold(box, viewport)) flags.push("below-fold");

  if (box.width <= EPSILON || box.height <= EPSILON) {
    flags.push("zero");
    findings.push({
      flag: "zero",
      detail: `${round(box.width)}x${round(box.height)}px`,
    });
  }

  if (occlusion.occluders.length > 0) {
    flags.push("covered");
    for (const occluder of occlusion.occluders) {
      findings.push({
        flag: "covered",
        detail: describeOccluder(occluder, box),
      });
    }
    const coverage = describeTextCoverage(occlusion);
    if (coverage !== null) {
      findings.push({ flag: "covered", detail: coverage });
    }
  }

  if (Object.keys(deadStates).length > 0) {
    flags.push("dead-state");
    for (const [state, lost] of Object.entries(deadStates)) {
      for (const entry of lost) {
        findings.push({
          flag: "dead-state",
          detail:
            `\`${state}\` sets ${entry.property}: ${entry.value}, but ` +
            `${entry.property}: ${entry.beatenBy.value} ` +
            `${entry.beatenBy.viaKey === null ? `declared by ${entry.beatenBy.declaredBy} itself` : `declared by ${entry.beatenBy.declaredBy} inside its "${entry.beatenBy.viaKey}" block`} ` +
            `outranks it — entering \`${state}\` does not change ${entry.property}`,
        });
      }
    }
  }

  if (collisions.length > 0) {
    flags.push("collides");
    for (const collision of collisions) {
      findings.push({
        flag: "collides",
        detail:
          `${collision.path} <${collision.tag}> draws its text on the same ` +
          `pixels, over ${percent(collision.fraction)} of this node's glyphs`,
      });
    }
  }

  return { flags, findings, occlusion };
}

/**
 * Resolves a component into the flat per-node document.
 *
 * Geometry comes from Chromium via `measured.ts`: the tree is rendered into a
 * real page and every box is read back with `getBoundingClientRect`. It is not
 * a static approximation of a render pass, it *is* the render pass. A node
 * without a measured box would be a failed extraction rather than a node of
 * unknown geometry, so `box` is never absent.
 */
export function resolveDocument(
  node: BaseComponentStructure,
  options: ResolveOptions,
): ResolvedDocument {
  const cascade: Cascade = resolveCascade(node);
  const boxes = materializeBoxes(options.measured);
  const root = boxes[0]!;

  const collisions = textCollisions(root);
  const nodes: NodeRecord[] = boxes.map((box) => {
    const resolved = cascade.byPath.get(box.path);
    if (resolved === undefined) {
      throw new Error(
        `resolveDocument: no resolved style for '${box.path}'. The measurement ` +
          `walk and the cascade walk disagree about the tree, which would let a ` +
          `record carry another node's style.`,
      );
    }
    const { flags, findings, occlusion } = analyse(
      box,
      root,
      options.viewport,
      collisions.get(box.path) ?? [],
      resolved.deadStates,
    );
    const rendered =
      resolved.text === null
        ? null
        : applyTextTransform(resolved.text, box.style["text-transform"]);
    return {
      path: box.path,
      tag: box.tag,
      text: rendered,
      textSource:
        resolved.text !== null && rendered !== resolved.text
          ? resolved.text
          : null,
      fontSize: round(box.style["font-size"]),
      fontSizeInherited: !("font-size" in resolved.style),
      lineHeight: round(box.style["line-height"]),
      replaced: REPLACED.has(box.tag),
      box: [round(box.x), round(box.y), round(box.width), round(box.height)],
      flags,
      style: resolved.style,
      states: resolved.states,
      deadStates: resolved.deadStates,
      findings,
      occlusion,
      lines: box.runs.length,
    };
  });

  return {
    viewport: {
      w: options.viewport.width,
      h: options.viewport.height,
      dpr: options.dpr ?? 1,
    },
    content: options.content ?? "actual",
    nodes,
  };
}
