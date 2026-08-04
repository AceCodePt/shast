import assert from "node:assert/strict";
import test, { after, before, describe } from "node:test";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import { resolveDocument } from "../../resolved-format/resolved.ts";
import { measureBoxes } from "../../resolved-format/measured.ts";
import { CASES, type Case } from "../../evals/cases.ts";

/**
 * The counterfactual cases have answer keys nothing else can check.
 *
 * For every other case the key is geometry, and the geometry now *is* the
 * browser's — `measured.ts` reads every box back with `getBoundingClientRect`.
 * A counterfactual's key is about a page that is never rendered for a model, so
 * a wrong one would sit in the benchmark indefinitely, scoring every arm against
 * a fiction. These assert the two things that make such a case meaningful:
 *
 * 1. the edit actually changes the thing being asked about — otherwise the case
 *    is answerable by reading the current geometry and is not a prediction;
 * 2. the stated answer is what the edited tree really produces in the browser.
 *
 * Gated behind CONFORMANCE=1 like the other browser-dependent checks.
 */
const ENABLED = process.env["CONFORMANCE"] === "1";

function caseNamed(name: string): Case {
  const found = CASES.find((testCase) => testCase.name === name);
  assert.ok(found !== undefined, `case ${name} is missing`);
  return found;
}

async function boxOf(
  browser: Browser,
  testCase: Case,
  node: Case["node"],
  path: string,
) {
  const measured = await measureBoxes(
    browser,
    HTML_TAGS_CONFIG,
    node,
    testCase.viewport,
  );
  const document = resolveDocument(node, { viewport: testCase.viewport, measured });
  const record = document.nodes.find((entry) => entry.path === path);
  assert.ok(record !== undefined, `no node at ${path}`);
  const [x, y] = record.box;
  return { x, y };
}

describe("counterfactual answer keys", { skip: !ENABLED }, () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  test("every counterfactual is graded by its own accept()", () => {
    for (const testCase of CASES) {
      if (testCase.counterfactual === undefined) continue;
      assert.ok(
        testCase.accept(testCase.token),
        `${testCase.name}: accept() rejects its own token ${testCase.token}`,
      );
    }
  });

  test("predict-containing-block-change: the edit moves the box, and moves it there", async () => {
    const testCase = caseNamed("predict-containing-block-change");
    const after = testCase.counterfactual?.node;
    assert.ok(after !== undefined, "the case must carry an edited tree");

    const before = await boxOf(browser, testCase, testCase.node, "root>plain>pin");
    const moved = await boxOf(browser, testCase, after, "root>plain>pin");

    // Without this the question could be answered off the current geometry.
    assert.notDeepEqual(
      [before.x, before.y],
      [moved.x, moved.y],
      "the edit must change the answer, or the case is not a prediction",
    );

    assert.deepEqual([moved.x, moved.y], [30, 30]);
    assert.ok(
      testCase.accept("30,30"),
      "the stated answer must be the one the edited tree produces",
    );
    assert.ok(
      !testCase.accept(`${before.x},${before.y}`),
      "the pre-edit position must be graded wrong",
    );
  });

  test("repair-shadowed-padding: root>body really is the block that wins", async () => {
    const testCase = caseNamed("repair-shadowed-padding");
    const measured = await measureBoxes(
      browser,
      HTML_TAGS_CONFIG,
      testCase.node,
      testCase.viewport,
    );
    const document = resolveDocument(testCase.node, {
      viewport: testCase.viewport,
      measured,
    });
    const panel = document.nodes.find((entry) => entry.path === "root>body>panel");
    assert.ok(panel !== undefined);

    const padding = panel.style["padding"];
    assert.ok(padding !== undefined, "panel must resolve a padding");
    assert.equal(padding.value, "4px", "the ancestor's 4px must be the winner");
    assert.equal(
      padding.declaredBy,
      "root>body",
      "the answer key names the block that must be edited",
    );
    assert.ok(
      (padding.shadows ?? []).some((lost) => lost.value === "32px"),
      "the panel's own 32px must be recorded as shadowed",
    );
  });

  test("repair-dead-hover: the hover is dead, and root is what kills it", async () => {
    const testCase = caseNamed("repair-dead-hover");
    const measured = await measureBoxes(
      browser,
      HTML_TAGS_CONFIG,
      testCase.node,
      testCase.viewport,
    );
    const document = resolveDocument(testCase.node, {
      viewport: testCase.viewport,
      measured,
    });
    const leaf = document.nodes.find((entry) => entry.path === "root>mid>leaf");
    assert.ok(leaf !== undefined);

    assert.deepEqual(
      leaf.states,
      {},
      "a dead hover must leave no live state delta",
    );
    assert.ok(
      Object.keys(leaf.deadStates).length > 0,
      "the overruled :hover must be recorded as a dead state",
    );
    assert.equal(
      leaf.style["padding"]?.declaredBy,
      "root",
      "the answer key names the block that outranks the hover",
    );
  });
});
