import test, { after, before, describe } from "node:test";
import assert from "node:assert";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import { CASES } from "../../evals/cases.ts";
import { resolveCascade } from "../../resolved-format/cascade.ts";
import { measureHover, type HoverProbe } from "../../resolved-format/conformance.ts";
import { measureBoxes } from "../../resolved-format/measured.ts";

/**
 * Are the state deltas — and the dead states — right?
 *
 * The format claims some `:hover` blocks change nothing, because an ancestor's
 * `"> a > b"` selector emits three attribute selectors and outranks the state's
 * two. That is a claim about the browser's cascade, and reasoning about
 * specificity is exactly the kind of confident argument that turns out to be
 * backwards. So the element is hovered and the computed value is read.
 *
 * A dead state is the more important half. A `:hover` delta that is missing
 * reads as "this node has no hover behaviour"; if the truth is "its hover
 * behaviour is overruled", the report has quietly hidden a bug.
 */
const ENABLED = process.env["CONFORMANCE"] === "1";

/**
 * `#0022cc` and `rgb(0, 34, 204)` are the same colour. The format reports the
 * declared value; `getComputedStyle` reports the serialised one.
 */
function normalise(value: string): string {
  const hex = /^#([0-9a-f]{6})$/iu.exec(value.trim());
  if (hex === null) return value.trim();
  const n = Number.parseInt(hex[1]!, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function sameValue(a: string, b: string): boolean {
  return normalise(a) === normalise(b);
}

describe("hover conformance", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  const subjects = CASES.filter((testCase) => {
    const cascade = resolveCascade(testCase.node);
    return cascade.nodes.some(
      (node) =>
        Object.keys(node.states).length > 0 ||
        Object.keys(node.deadStates).length > 0,
    );
  });

  test("there is something to check", () => {
    assert.ok(subjects.length >= 3, `only ${subjects.length} hover subjects`);
  });

  for (const testCase of subjects) {
    test(testCase.name, async () => {
      const cascade = resolveCascade(testCase.node);
      const boxes = await measureBoxes(
        browser,
        HTML_TAGS_CONFIG,
        testCase.node,
        testCase.viewport,
      );

      const probes: HoverProbe[] = [];
      boxes.forEach((box, index) => {
        const resolved = cascade.byPath.get(box.path);
        if (resolved === undefined) return;
        const properties: HoverProbe["properties"] = [
          ...Object.entries(resolved.states[":hover"] ?? {}).map(
            ([property, value]) => ({ property, onHover: value.value }),
          ),
          ...(resolved.deadStates[":hover"] ?? []).map((entry) => ({
            property: entry.property,
            onHover: "unchanged" as const,
          })),
        ];
        if (properties.length > 0) {
          probes.push({ index, path: box.path, properties });
        }
      });

      if (probes.length === 0) return;

      const results = await measureHover(
        browser,
        HTML_TAGS_CONFIG,
        testCase.node,
        testCase.viewport,
        probes,
      );

      assert.deepStrictEqual(
        results
          .filter((result) =>
            result.predicted === "unchanged"
              ? result.onHover !== result.atRest
              : !sameValue(result.onHover, result.predicted),
          )
          .map(
            (result) =>
              `${result.path} ${result.property}: predicted ${result.predicted}, ` +
              `browser went ${result.atRest} -> ${result.onHover}`,
          ),
        [],
      );
    });
  }
});
