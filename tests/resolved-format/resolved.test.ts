import test, { after, before, describe } from "node:test";
import assert from "node:assert";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import type { BaseComponentStructure } from "@/engine/types.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import { measureBoxes } from "../../resolved-format/measured.ts";
import { unionCoveredArea } from "../../resolved-format/occlusion.ts";
import { printResolved } from "../../resolved-format/print-resolved.ts";
import { resolveDocument } from "../../resolved-format/resolved.ts";
import type { NodeRecord } from "../../resolved-format/resolved.ts";

/**
 * The resolved document, end to end.
 *
 * Geometry now *is* the browser's — `measured.ts` reads every box back with
 * `getBoundingClientRect` — so these tests launch Chromium and assert what a
 * real render produces. That makes the geometry assertions stronger than the
 * old model-based ones (the browser is the oracle) and it makes the provenance,
 * state and print assertions cheap once the browser is up.
 *
 * Gated behind CONFORMANCE=1 so `pnpm test` stays fast and does not need a
 * 115MB browser download. Run with `pnpm test:conformance`.
 */
const ENABLED = process.env["CONFORMANCE"] === "1";

const viewport = { width: 400, height: 300 };

const doc = async (
  browser: Browser,
  node: BaseComponentStructure,
  size: { width: number; height: number } = viewport,
) => {
  const measured = await measureBoxes(browser, HTML_TAGS_CONFIG, node, size);
  return resolveDocument(node, { viewport: size, measured });
};

const nodeAt = async (
  browser: Browser,
  node: BaseComponentStructure,
  path: string,
  size?: { width: number; height: number },
): Promise<NodeRecord> => {
  const record = (await doc(browser, node, size)).nodes.find(
    (entry) => entry.path === path,
  );
  assert.ok(record, `no record at '${path}'`);
  return record;
};

describe("the document", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  test("records the viewport, because a box is only true at one width", async () => {
    assert.deepStrictEqual((await doc(browser, { tag: "div" })).viewport, {
      w: 400,
      h: 300,
      dpr: 1,
    });
  });

  test("says so when the content is a stand-in", async () => {
    const measured = await measureBoxes(browser, HTML_TAGS_CONFIG, { tag: "div" }, viewport);
    const document = resolveDocument(
      { tag: "div" },
      { viewport, content: "placeholder", measured },
    );
    assert.strictEqual(document.content, "placeholder");
    assert.match(printResolved(document), /content placeholder/u);
  });

  test("every node has a box; there is no unknown geometry", async () => {
    const document = await doc(browser, {
      tag: "div",
      innerHTML: { a: { tag: "div" }, b: { tag: "div", innerHTML: "x" } },
    });
    for (const record of document.nodes) {
      assert.strictEqual(record.box.length, 4);
      for (const value of record.box) assert.ok(Number.isFinite(value));
    }
  });

  test("text is reported as rendered, not as written", async () => {
    // Printing the source string under an inherited `text-transform` would
    // describe a page that does not exist.
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { "text-transform": "uppercase" },
        innerHTML: { t: { tag: "div", innerHTML: "Annual review" } },
      },
      "root>t",
    );
    assert.strictEqual(record.text, "ANNUAL REVIEW");
    assert.strictEqual(record.textSource, "Annual review");
  });

  test("the source string is only carried when the transform changed it", async () => {
    const record = await nodeAt(browser, { tag: "div", innerHTML: "plain" }, "root");
    assert.strictEqual(record.text, "plain");
    assert.strictEqual(record.textSource, null);
  });

  test("an inherited font size is stated on the node that renders at it", async () => {
    // `style` holds declarations only, so without this a 30px heading whose
    // size came from its parent shows no size at all and two nodes cannot be
    // compared for emphasis without walking the tree.
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "font-size": "30px" },
      innerHTML: { h: { tag: "div", innerHTML: "big" } },
    };
    const record = await nodeAt(browser, node, "root>h");
    assert.strictEqual(record.fontSize, 30);
    assert.strictEqual(record.fontSizeInherited, true);
    assert.match(printResolved(await doc(browser, node)), /font-size: 30px \(inherited\)/u);
  });

  test("a declared font size is not labelled inherited", async () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: { h: { tag: "div", css: { "font-size": "22px" }, innerHTML: "x" } },
    };
    assert.strictEqual((await nodeAt(browser, node, "root>h")).fontSizeInherited, false);
    assert.ok(!(await printResolved(await doc(browser, node))).includes("22px (inherited)"));
  });

  test("a replaced element is marked, and nothing is said about its content", async () => {
    const record = await nodeAt(
      browser,
      { tag: "div", innerHTML: { pic: { tag: "img" } } },
      "root>pic",
    );
    assert.strictEqual(record.replaced, true);
    assert.strictEqual(record.text, null);
  });

  test("a display:none node is hidden, not zero", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        innerHTML: { gone: { tag: "div", css: { display: "none" }, innerHTML: "x" } },
      },
      "root>gone",
    );
    assert.deepStrictEqual(record.flags, ["hidden"]);
  });
});

describe("flags", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  test("wrapped counts the lines it took", async () => {
    const record = await nodeAt(
      browser,
      { tag: "div", css: { width: "60px" }, innerHTML: "one two three four" },
      "root",
    );
    assert.ok(record.flags.includes("wrapped"));
    assert.ok(record.lines > 1);
  });

  test("overflows says the content is painted outside, not cut off", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { width: "60px", height: "10px" },
        innerHTML: "one two three four",
      },
      "root",
    );
    assert.ok(record.flags.includes("overflows"));
    const finding = record.findings.find((f) => f.flag === "overflows");
    assert.match(finding!.detail, /painted outside the box rather than cut off/u);
    assert.ok(
      !record.flags.some((flag) => String(flag) === "clipped"),
      "nothing is clipped while overflow is visible",
    );
  });

  test("zero fires for a box with no area", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        innerHTML: { g: { tag: "div", css: { width: "0px", height: "0px" }, innerHTML: "x" } },
      },
      "root>g",
    );
    assert.ok(record.flags.includes("zero"));
  });

  test("a box below the fold is flagged but not reported as a finding", async () => {
    // Measured: on a 14,000px page one `offscreen` finding fired on 863 of 922
    // nodes and its detail lines were 31% of the document. A third of the report
    // saying that a scrollable page scrolls buries the problems that matter.
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { position: "relative", height: "800px" },
        innerHTML: {
          far: {
            tag: "div",
            css: { position: "absolute", top: "700px", left: "0px", width: "60px", height: "20px" },
            innerHTML: "footer",
          },
        },
      },
      "root>far",
    );
    assert.ok(record.flags.includes("below-fold"));
    assert.ok(!record.flags.includes("offscreen"));
    assert.deepStrictEqual(record.findings, []);
  });

  test("offscreen fires only where scrolling cannot reach", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { position: "relative" },
        innerHTML: {
          wide: {
            tag: "div",
            css: { position: "absolute", top: "0px", left: "0px", width: "900px", height: "20px" },
          },
        },
      },
      "root>wide",
    );
    assert.ok(record.flags.includes("offscreen"));
    assert.match(
      record.findings.find((f) => f.flag === "offscreen")!.detail,
      /past the right edge/u,
    );
  });

  test("a tall box that merely extends past the fold is not flagged", async () => {
    // It starts on screen; its lower part is reached by scrolling, like any page.
    const record = await nodeAt(browser, { tag: "div", css: { height: "900px" } }, "root");
    assert.ok(!record.flags.includes("offscreen"));
    assert.ok(!record.flags.includes("below-fold"));
  });
});

describe("occlusion", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  const page = (background: string | null): BaseComponentStructure => ({
    tag: "div",
    css: { position: "relative", height: "200px" },
    innerHTML: {
      text: { tag: "p", innerHTML: "hello" },
      cover: {
        tag: "div",
        css: {
          position: "absolute",
          top: "0px",
          left: "0px",
          width: "400px",
          height: "40px",
          ...(background === null ? {} : { "background-color": background }),
        },
      },
    },
  });

  test("an opaque coverer hides the text under it", async () => {
    const record = await nodeAt(browser, page("#000"), "root>text");
    assert.ok(record.flags.includes("covered"));
    assert.strictEqual(record.occlusion.textFullyHidden, true);
  });

  test("a transparent coverer hides nothing", async () => {
    // The distinction the whole channel exists for: paint order alone would
    // report both of these identically.
    const record = await nodeAt(browser, page(null), "root>text");
    assert.ok(record.flags.includes("covered"));
    assert.strictEqual(record.occlusion.textFullyHidden, false);
    assert.match(
      record.findings.find((f) => f.flag === "covered")!.detail,
      /has no background/u,
    );
  });

  test("a coverer that misses the glyphs hides nothing", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { position: "relative", height: "200px" },
        innerHTML: {
          text: { tag: "p", css: { height: "100px" }, innerHTML: "hi" },
          chip: {
            tag: "div",
            css: {
              position: "absolute",
              top: "60px",
              left: "300px",
              width: "80px",
              height: "20px",
              "background-color": "#ff0",
            },
          },
        },
      },
      "root>text",
    );
    assert.strictEqual(record.occlusion.textFullyHidden, false);
    assert.strictEqual(record.occlusion.linesHidden, 0);
  });

  test("nesting is not occlusion", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        css: { "background-color": "#fff" },
        innerHTML: { inner: { tag: "div", innerHTML: "x" } },
      },
      "root",
    );
    assert.ok(!record.flags.includes("covered"));
  });

  test("coverage is measured against the union of coverers", () => {
    // Two coverers hiding half a line each hide the line; summing pairwise
    // intersections would double-count and report 200%.
    const target = { x: 0, y: 0, width: 100, height: 10 };
    assert.strictEqual(
      unionCoveredArea(target, [
        { x: 0, y: 0, width: 60, height: 10 },
        { x: 40, y: 0, width: 60, height: 10 },
      ]),
      1000,
    );
  });
});

describe("text collision", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  test("in-flow siblings whose glyphs overlap are both reported", async () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: {
        ghost: { tag: "div", css: { height: "0px" }, innerHTML: "warning" },
        after: { tag: "div", innerHTML: "everything fine" },
      },
    };
    const ghost = await nodeAt(browser, node, "root>ghost");
    const after = await nodeAt(browser, node, "root>after");
    assert.ok(ghost.flags.includes("collides"));
    assert.ok(after.flags.includes("collides"));
    assert.match(
      ghost.findings.find((f) => f.flag === "collides")!.detail,
      /root>after/u,
    );
  });

  test("stacked siblings do not collide", async () => {
    const record = await nodeAt(
      browser,
      {
        tag: "div",
        innerHTML: {
          a: { tag: "div", innerHTML: "a" },
          b: { tag: "div", innerHTML: "b" },
        },
      },
      "root>a",
    );
    assert.ok(!record.flags.includes("collides"));
  });
});

describe("the text projection", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  const sample: BaseComponentStructure = {
    tag: "div",
    css: { "> body": { "> panel": { padding: "4px" } } },
    innerHTML: {
      body: {
        tag: "div",
        innerHTML: {
          panel: { tag: "div", css: { padding: "32px" }, innerHTML: "Panel" },
        },
      },
    },
  };

  test("@ precedes = for every node", async () => {
    const lines = printResolved(await doc(browser, sample)).split("\n");
    const boxLine = lines.findIndex((line) => line.startsWith("  @ "));
    const styleLine = lines.findIndex((line) => line.startsWith("  = "));
    assert.ok(boxLine !== -1 && styleLine !== -1);
    assert.ok(boxLine < styleLine);
  });

  test("the = line is complete without reading any ← line", async () => {
    const out = printResolved(await doc(browser, sample));
    const styleLine = out
      .split("\n")
      .find((line) => line.startsWith("  = ") && line.includes("padding"))!;
    assert.match(styleLine, /padding: 4px/u);
  });

  test("a contested property is marked shadows, an added one (adds)", async () => {
    const out = printResolved(await doc(browser, sample));
    assert.match(
      out,
      /← padding: 4px\s+declared by root, inside its "> body > panel" block\s+— shadows padding: 32px declared by root>body>panel itself/u,
    );
    assert.ok(!/padding: 4px\s+\(adds\)/u.test(out));
  });

  test("the declaring node is named apart from the key that matched", async () => {
    // `root "> body > panel"` on one line reads as a single path and gets
    // answered as `root>body>panel`. The two facts have to be separable.
    const out = printResolved(await doc(browser, sample));
    assert.ok(!out.includes('root "> body > panel"'));
    assert.match(out, /declared by root,/u);
  });

  test("a node whose declarations are all its own gets no ← line", async () => {
    const out = printResolved(await doc(browser, { tag: "div", css: { padding: "1px" } }));
    assert.ok(!out.includes("←"));
  });

  test("every line stands alone: no indentation encodes the tree", async () => {
    const out = printResolved(
      await doc(browser, {
        tag: "div",
        innerHTML: { a: { tag: "div", innerHTML: { b: { tag: "div" } } } },
      }),
    );
    for (const line of out.split("\n")) {
      if (line === "" || line.startsWith("viewport")) continue;
      assert.ok(
        /^\S/u.test(line) || /^ {2}[@=!←:.]/u.test(line),
        `unexpected line shape: ${JSON.stringify(line)}`,
      );
    }
    assert.match(out, /^root>a>b\b/mu);
  });

  test("long text is elided with its true length, never silently cut", async () => {
    const long = "word ".repeat(40).trim();
    const out = printResolved(await doc(browser, { tag: "div", innerHTML: long }));
    assert.match(out, /…" \(199 chars\)/u);
  });

  test("a state is printed under its own selector suffix", async () => {
    const out = printResolved(
      await doc(browser, {
        tag: "div",
        css: { "background-color": "#111", ":hover": { "background-color": "#222" } },
      }),
    );
    assert.match(out, /^ {2}:hover {2}background-color: #222$/mu);
    assert.match(out, /^ {2}= background-color: #111$/mu);
  });

  test("skipInert drops nodes that carry nothing", async () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: { wrap: { tag: "div", innerHTML: { leaf: { tag: "div", innerHTML: "x" } } } },
    };
    const out = printResolved(await doc(browser, node), { skipInert: true });
    assert.ok(!out.includes("root>wrap\n"));
    assert.match(out, /root>wrap>leaf/u);
  });
});
