import test, { after, before, describe } from "node:test";
import assert from "node:assert";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";
import { measureTextVisibility } from "../../resolved-format/conformance.ts";
import { CASES } from "../../evals/cases.ts";
import { FIXTURES } from "../../resolved-format/fixtures.ts";
import { measureBoxes, materializeBoxes } from "../../resolved-format/measured.ts";
import { occlusionOf, runRect } from "../../resolved-format/occlusion.ts";

/**
 * Does the format's readability claim survive contact with a renderer?
 *
 * `occlusion.ts` says whether a node's text can be read. Every other check in
 * this package compares numbers to numbers; this one compares the claim to
 * pixels, by painting the page with the node's glyphs and again without them.
 * If the format says the text is fully hidden, removing it must change nothing
 * on screen — and if the format says it is readable, removing it must change
 * something.
 *
 * The eval cases are checked here for the same reason a benchmark's answer key
 * is checked before the benchmark is trusted: a comprehension test whose own
 * expected answers are wrong measures nothing.
 */
const ENABLED = process.env["CONFORMANCE"] === "1";

type Subject = {
  name: string;
  viewport: { width: number; height: number };
  node: BaseComponentStructure;
};

const SUBJECTS: Subject[] = [
  ...CASES.map((testCase) => ({
    name: `case:${testCase.name}`,
    viewport: testCase.viewport,
    node: testCase.node,
  })),
  ...FIXTURES.map((fixture) => ({
    name: `fixture:${fixture.name}`,
    viewport: fixture.viewport,
    node: fixture.node,
  })),
];

describe("occlusion conformance", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  /**
   * Divergences the format is known to produce, asserted rather than skipped.
   *
   * Listing one here is not a way of passing the test — it is the test. The entry
   * is an exact expected string, so the case still fails if the divergence changes
   * shape or spreads to another node, and it fails again if the divergence is ever
   * *fixed*, which is the prompt to delete the entry.
   *
   * `dense-invisible-text` paints `#ffffff` text on a `#ffffff` background. Both
   * values reach the `=` lines, so the document is not missing the facts, but
   * `occlusionOf` answers a purely geometric question and no code joins a colour
   * to the colour behind it. The browser oracle found this independently of the
   * eval, which is the point of having it.
   */
  const KNOWN_DIVERGENCES: Record<string, readonly string[]> = {
    "case:dense-invisible-text": [
      "root>main>r21: format says text readable, browser says hidden",
    ],
  };

  for (const subject of SUBJECTS) {
    test(subject.name, async () => {
      const measured = await measureBoxes(
        browser,
        HTML_TAGS_CONFIG,
        subject.node,
        subject.viewport,
      );
      const boxes = materializeBoxes(measured);
      const root = boxes[0]!;

      const probes = boxes.flatMap((box, index) => {
        // `color` inherits, so a container's probe would blank its descendants'
        // text too and the diff would stop being about one node.
        if (box.children.length > 0) return [];
        if (box.runs.length === 0) return [];
        if (box.style.display === "none") return [];
        // Glyphs outside the viewport are absent from the screenshot for
        // reasons that have nothing to do with occlusion.
        const outside = box.runs.some((run) => {
          const rect = runRect(box, run);
          return (
            rect.x < 0 ||
            rect.y < 0 ||
            rect.x + rect.width > subject.viewport.width ||
            rect.y + rect.height > subject.viewport.height
          );
        });
        if (outside) return [];
        return [
          {
            index,
            path: box.path,
            claimHidden: occlusionOf(box, root).textFullyHidden,
          },
        ];
      });

      if (probes.length === 0) return;

      const results = await measureTextVisibility(
        browser,
        HTML_TAGS_CONFIG,
        subject.node,
        subject.viewport,
        probes,
      );

      const divergences = results
        .filter((result) => result.claimHidden !== result.actuallyHidden)
        .map(
          (result) =>
            `${result.path}: format says text ${result.claimHidden ? "hidden" : "readable"}, ` +
            `browser says ${result.actuallyHidden ? "hidden" : "readable"}`,
        );

      assert.deepStrictEqual(divergences, KNOWN_DIVERGENCES[subject.name] ?? []);
    });
  }
});
