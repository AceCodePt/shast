import type { Contribution, ResolvedStyle } from "./cascade.ts";
import type { NodeRecord, ResolvedDocument } from "./resolved.ts";

/**
 * The text projection of a {@link ResolvedDocument}.
 *
 * ```
 * viewport 1440x900
 *
 * <path>   <tag>   "<text>"
 *   @ [x, y, w, h]  <flags>
 *   = <every resolved property, comma separated>
 *   ! <why a flag fired>
 *   ← <contributor>  <props it won>  (adds) | shadows <losing value>
 *   : <state>  <what that state changes>
 * ```
 *
 * Three rules hold it together:
 *
 * - **`@` and `=` are complete.** Never require reading `←` to know how a node
 *   looks or where it sits. Provenance is supplementary, never load-bearing.
 * - **`@` precedes `=`.** Position is what a reader needs first; the properties
 *   explain it.
 * - **Path, not indentation.** Every line stands alone under sorting, grepping
 *   or truncation, which is what makes the format safe to filter.
 */

export type PrintOptions = {
  /**
   * Longest text kept verbatim on the header line. Text is load-bearing —
   * boxes are sized by it — but a paragraph would bury the geometry, so past
   * this length it is elided and its true length stated.
   */
  maxText?: number;
  /**
   * Drop nodes with no resolved declarations, no text and no flags. They are
   * pure structure; their geometry is still implied by their children's boxes.
   */
  skipInert?: boolean;
  /**
   * Emit only the node header lines — path, tag, text — and drop `@`, `=`, `!`,
   * `←` and the state lines.
   *
   * This exists for the comparative eval, where a screenshot or a devtools dump
   * has to be given node *names* or it cannot express an answer at all. Deriving
   * that name list from this printer rather than writing a second one is the
   * whole point: every arm then spells paths, tags and rendered text
   * identically, so a difference in accuracy is attributable to the lines
   * removed here and to nothing else.
   */
  skeleton?: boolean;
  /**
   * How the geometry line is rendered.
   *
   * - `axes` (default): `@ x=10 y=10 width=80 height=20` — names every quantity
   *   on the line itself, so no reader has to carry a legend into each node.
   *   This is how `dom` spells its rects, and the comparative eval showed it is
   *   what makes the numbers legible: `@ [x, y, w, h]` and `@ measured [...]`
   *   were ignored or re-derived by models whose own CSS reasoning disagreed
   *   with them, while `@ x=10 y=10` was read as ground truth.
   * - `compact`: `@ [x, y, w, h]` plus a legend naming the space.
   * - `measured`: `@ measured [x, y, w, h]` — adds a source word to the line.
   *   Tested experimentally; it moved no answer the noise floor did not.
   */
  geometry?: "compact" | "measured" | "axes";
};

const DEFAULT_MAX_TEXT = 60;

function quoteText(text: string, max: number): string {
  const flat = text.replace(/\s+/gu, " ").trim();
  if (flat.length <= max) return `"${flat}"`;
  return `"${flat.slice(0, max - 1)}…" (${flat.length} chars)`;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function declarationList(style: ResolvedStyle): string {
  return Object.entries(style)
    .map(([property, resolved]) => `${property}: ${resolved.value}`)
    .join(", ");
}

/**
 * The `=` line: everything that applies at rest.
 *
 * A node that owns text always states its `font-size`, marked `(inherited)`
 * when it was not declared here. Without that, a 28px heading whose size came
 * from its parent shows nothing on its `=` line, and comparing two nodes for
 * emphasis means walking the tree — the one thing the format promises is
 * already done.
 */
function styleLine(record: NodeRecord): string {
  const declared = declarationList(record.style);
  if (record.text === null || !record.fontSizeInherited) return declared;
  const size = `font-size: ${record.fontSize}px (inherited)`;
  return declared === "" ? size : `${size}, ${declared}`;
}

/**
 * Where a declaration came from, in words.
 *
 * Deliberately not the compact `root "> body > panel"` of the JSON. Asked which
 * node declared that, four of six models answered `root>body>panel`: the quoted
 * key reads as part of the path, and a path is what the question wants. Naming
 * the node and its key as two separate things costs a few characters and stops
 * the format from being confidently misread.
 */
function credit(
  record: NodeRecord,
  declaredBy: string,
  viaKey: string | null,
): string {
  const who = declaredBy === record.path ? `${declaredBy} itself` : declaredBy;
  return viaKey === null
    ? `declared by ${who}, at the top of its css block`
    : `declared by ${who}, inside its "${viaKey}" block`;
}

/**
 * One `←` line per contested property, plus one grouped line per contributor
 * for the properties it merely added.
 *
 * The distinction is the point of the channel. `(adds)` is composition working
 * as designed; `shadows` means two places both had an opinion, which is where
 * refactoring bugs live — a node whose own declaration never survives is either
 * a leftover or a sign the style belongs in the parent.
 */
function provenanceLines(record: NodeRecord): string[] {
  const adds = new Map<string, string[]>();
  const contested: string[] = [];

  for (const [property, resolved] of Object.entries(record.style)) {
    const shadows = resolved.shadows;
    if (shadows === undefined || shadows.length === 0) {
      if (resolved.declaredBy === record.path) continue;
      const key = credit(record, resolved.declaredBy, resolved.viaKey);
      const list = adds.get(key) ?? [];
      list.push(`${property}: ${resolved.value}`);
      adds.set(key, list);
      continue;
    }
    contested.push(
      `  ← ${property}: ${resolved.value}   ` +
        `${credit(record, resolved.declaredBy, resolved.viaKey)}   ` +
        `— shadows ` +
        shadows
          .map(
            (loser: Contribution) =>
              `${property}: ${loser.value} ${credit(record, loser.declaredBy, loser.viaKey)}`,
          )
          .join("; also "),
    );
  }

  const lines: string[] = [...contested];
  for (const [key, properties] of adds) {
    lines.push(`  ← ${properties.join(", ")}   ${key}   (adds)`);
  }
  return lines;
}

function isInert(record: NodeRecord): boolean {
  return (
    record.text === null &&
    record.flags.length === 0 &&
    Object.keys(record.style).length === 0 &&
    Object.keys(record.states).length === 0
  );
}

export function printResolved(
  document: ResolvedDocument,
  options: PrintOptions = {},
): string {
  const maxText = options.maxText ?? DEFAULT_MAX_TEXT;
  const geometry = options.geometry ?? "axes";
  const records = options.skipInert
    ? document.nodes.filter((record) => !isInert(record))
    : document.nodes;

  const pathWidth = Math.max(4, ...records.map((record) => record.path.length));
  const tagWidth = Math.max(3, ...records.map((record) => record.tag.length));

  // The `@` line needs to say what space it is in.
  //
  // Without this the document was ambiguous in a way the comparative eval caught
  // and quantified: asked where an absolutely positioned box lands, four of eight
  // models ignored the `@ [10, 10, ...]` that stated the answer and re-derived it
  // from `position`, `top` and `left` — landing on the containing block's *content*
  // edge instead of its padding edge. The `dom` arm, whose numbers are identical,
  // was right five times out of six, because `getBoundingClientRect` names its own
  // coordinate space and `@ [x, y, w, h]` did not. A format whose central claim is
  // "the arithmetic is already done" has to say so on the artifact, not only in its
  // documentation. One line, paid once per document rather than per node.
  const header =
    `viewport ${document.viewport.w}x${document.viewport.h}` +
    (document.viewport.dpr === 1 ? "" : ` dpr ${document.viewport.dpr}`) +
    // Skeleton mode emits no `@` lines, so a legend for them would be noise
    // charged to the three arms that are supposed to be reading their own
    // evidence.
    (options.skeleton === true
      ? ""
      : geometry === "measured"
        ? "\n@ measured = border box [x, y, width, height] in CSS px, absolute from the " +
          "top-left of the page — measured by the browser as it rendered, not relative " +
          "to the parent"
        : geometry === "axes"
          ? "\n@ = border box [x, y, width, height], in CSS px — x and y are absolute from " +
            "the top-left of the page, already resolved, not relative to the parent"
          : "\n@ = border box [x, y, width, height] in CSS px, absolute from the top-left " +
            "of the page — already resolved, not relative to the parent") +
    (document.content === "placeholder"
      ? "\ncontent placeholder — boxes are sized by stand-in text, not the real thing"
      : "");

  const blocks = records.map((record) => {
    const lines: string[] = [];
    // Skeleton mode shows the text as *authored*, never as rendered. Rendered
    // text is a computed result — `text-transform: uppercase` is resolved into
    // it — so printing it would hand the arms that are supposed to derive it
    // from a screenshot or a computed-style dump the answer for free. The
    // skeleton is the authored tree; everything computed must be earned from the
    // arm's own evidence.
    const shown =
      options.skeleton === true ? (record.textSource ?? record.text) : record.text;
    const text =
      shown === null
        ? ""
        : `  ${quoteText(shown, maxText)}` +
          (options.skeleton === true || record.textSource === null
            ? ""
            : `  (written ${quoteText(record.textSource, maxText)})`);
    lines.push(
      `${pad(record.path, pathWidth)}  ${pad(record.tag, tagWidth)}${text}`.trimEnd(),
    );

    if (options.skeleton === true) return lines.join("\n");

    const [x, y, w, h] = record.box;
    const flags = record.flags.length === 0 ? "" : `  ${record.flags.join(" ")}`;
    const line =
      geometry === "axes"
        ? `  @ x=${x} y=${y} width=${w} height=${h}${flags}`
        : `  @ ${geometry === "measured" ? "measured " : ""}[${x}, ${y}, ${w}, ${h}]${flags}`;
    lines.push(line);

    const declarations = styleLine(record);
    if (declarations !== "") lines.push(`  = ${declarations}`);

    for (const finding of record.findings) {
      lines.push(`  ! ${finding.flag}: ${finding.detail}`);
    }

    lines.push(...provenanceLines(record));

    for (const [state, style] of Object.entries(record.states)) {
      lines.push(`  ${state}  ${declarationList(style)}`);
    }

    return lines.join("\n");
  });

  // One line per node in skeleton mode, so no blank separators.
  if (options.skeleton === true) return [header, "", ...blocks].join("\n");

  return [header, "", ...intersperse(blocks)].join("\n");
}

function intersperse(blocks: string[]): string[] {
  const out: string[] = [];
  blocks.forEach((block, index) => {
    if (index > 0) out.push("");
    out.push(block);
  });
  return out;
}
