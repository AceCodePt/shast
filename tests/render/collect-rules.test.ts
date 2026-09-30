import test, { describe } from "node:test";
import assert from "node:assert";
import type { BaseComponentStructure } from "@/engine/types.ts";
import {
  collectRules,
  dedupeByScope,
  printStylesheet,
  scopeAttribute,
} from "@/engine/render/collect-rules.ts";

function node(css: Record<string, unknown>): BaseComponentStructure {
  return { tag: "div", css };
}

describe("scopeAttribute (cyrb53, 53-bit)", () => {
  test("pins the base36 hash of known css blocks at seed 0", () => {
    assert.strictEqual(
      scopeAttribute(node({ width: "300978px" })),
      "cid-ni3841x8ei",
    );
    assert.strictEqual(
      scopeAttribute(node({ width: "1428402px" })),
      "cid-e5mod9fxcs",
    );
    assert.strictEqual(
      scopeAttribute(node({ color: "red" })),
      "cid-21762ralqm3",
    );
  });

  test("the former FNV-1a/32 collision pair now maps to distinct scopes", () => {
    // Under FNV-1a/32 both of these hashed to `hsyt7c`; widening the hash is
    // what separates them.
    const a = node({ width: "300978px" });
    const b = node({ width: "1428402px" });
    assert.notStrictEqual(scopeAttribute(a), scopeAttribute(b));
  });

  test("identical css blocks still share one scope regardless of other data", () => {
    const a: BaseComponentStructure = { tag: "div", css: { width: "1px" } };
    const b: BaseComponentStructure = {
      tag: "section",
      attributes: { class: "other" },
      innerHTML: "text",
      css: { width: "1px" },
    };
    assert.strictEqual(scopeAttribute(a), scopeAttribute(b));
  });

  test("the stylesheet still keeps one copy of a shared block", () => {
    const shared: Record<string, unknown> = { width: "1px" };
    const { blocks } = collectRules({
      tag: "div",
      innerHTML: {
        a: { tag: "div", css: shared },
        b: { tag: "div", css: shared },
      },
    });
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(
      printStylesheet(blocks).split("width: 1px;").length - 1,
      1,
    );
  });

  test("a render with distinct css prints byte-for-byte as before", () => {
    const { blocks } = collectRules({
      tag: "div",
      innerHTML: {
        a: { tag: "div", css: { color: "red" } },
        b: { tag: "section", css: { width: "1px" } },
      },
    });
    assert.strictEqual(
      printStylesheet(blocks),
      [
        "[cid-21762ralqm3] {",
        "  color: red;",
        "}",
        "",
        "[cid-20qofv0dctg] {",
        "  width: 1px;",
        "}",
      ].join("\n"),
    );
  });
});

describe("dedupeByScope", () => {
  test("keeps the first value when a scope repeats with an equal fingerprint", () => {
    assert.deepStrictEqual(
      dedupeByScope([
        { scope: "cid-x", fingerprint: "a", value: 1 },
        { scope: "cid-x", fingerprint: "a", value: 2 },
      ]),
      [1],
    );
  });

  test("keeps first-seen order across distinct scopes", () => {
    assert.deepStrictEqual(
      dedupeByScope([
        { scope: "cid-b", fingerprint: "b", value: "b" },
        { scope: "cid-a", fingerprint: "a", value: "a" },
        { scope: "cid-b", fingerprint: "b", value: "ignored" },
      ]),
      ["b", "a"],
    );
  });

  test("throws when one scope carries two different fingerprints", () => {
    assert.throws(
      () =>
        dedupeByScope([
          { scope: "cid-x", fingerprint: "a", value: 1 },
          { scope: "cid-x", fingerprint: "b", value: 2 },
        ]),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        for (const part of ["cid-x", "a", "b"]) {
          assert.ok(
            error.message.includes(part),
            `expected ${JSON.stringify(error.message)} to name ${part}`,
          );
        }
        return true;
      },
    );
  });
});
