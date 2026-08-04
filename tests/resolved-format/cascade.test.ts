import test, { describe } from "node:test";
import assert from "node:assert";
import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import {
  collectRules,
  compareSpecificity,
  flattenSelector,
  specificityOf,
} from "@/engine/render/collect-rules.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import { resolveCascade } from "../../resolved-format/cascade.ts";

const tagConfig: BaseHTMLTagConfig = {
  div: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [":hover"],
    cssPseudoElement: ["::before"],
  },
  section: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [":hover"],
    cssPseudoElement: [],
  },
};

const at = (node: BaseComponentStructure, path: string) => {
  const resolved = resolveCascade(node).byPath.get(path);
  assert.ok(resolved, `no resolved node at '${path}'`);
  return resolved;
};

const values = (node: BaseComponentStructure, path: string) =>
  Object.fromEntries(
    Object.entries(at(node, path).style).map(([key, resolved]) => [
      key,
      resolved.value,
    ]),
  );

describe("emitted rules are the single source of truth", () => {
  test("the stylesheet is printed from the collected rules", () => {
    // Not a tautology: it is the guarantee that a resolver reading
    // `collectRules` cannot disagree with the CSS the browser receives.
    const node: BaseComponentStructure = {
      tag: "div",
      css: {
        color: "red",
        "> inner": { width: "10px", ":hover": { width: "20px" } },
      },
      innerHTML: { inner: { tag: "div", innerHTML: "hi" } },
    };
    const { css } = renderComponent(tagConfig, node);
    const { rules } = collectRules(node);

    for (const rule of rules) {
      for (const [property, value] of rule.declarations) {
        assert.ok(
          css.includes(`${property}: ${value};`),
          `rule ${rule.selector} declares ${property} but the stylesheet does not`,
        );
      }
    }
    assert.strictEqual(rules.length, 3);
  });

  test("a rule records the flattened selector a browser would resolve", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> inner": { ":hover": { color: "red" } } },
      innerHTML: { inner: { tag: "div" } },
    };
    const { rules } = collectRules(node);
    const rule = rules[0]!;
    assert.match(rule.selector, /^\[cid-[a-z0-9]+\] > \[cid-inner\]:hover$/u);
    assert.deepStrictEqual([...rule.specificity], [0, 3, 0]);
  });

  test("a pseudo-element counts in the third column, not the second", () => {
    assert.deepStrictEqual(
      [
        ...specificityOf([
          { kind: "scope", attribute: "cid-x" },
          { kind: "state", key: "::before", state: "pseudo-element" },
        ]),
      ],
      [0, 1, 1],
    );
    assert.ok(
      compareSpecificity([0, 2, 0], [0, 1, 1]) > 0,
      "an attribute must outrank a pseudo-element",
    );
  });

  test("flattening substitutes & for the whole parent selector", () => {
    assert.strictEqual(
      flattenSelector([
        { kind: "scope", attribute: "cid-a" },
        { kind: "child", name: "b" },
        { kind: "state", key: ":hover", state: "pseudo-class" },
      ]),
      "[cid-a] > [cid-b]:hover",
    );
  });
});

describe("precedence", () => {
  // Each expectation here is also asserted against Chromium by the
  // `cascade-*` fixtures in tests/resolved-format/conformance.test.ts.
  test("an ancestor's > child block beats the child's own declaration", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> child": { width: "100px" } },
      innerHTML: { child: { tag: "div", css: { width: "300px" } } },
    };
    assert.strictEqual(values(node, "root>child")["width"], "100px");
  });

  test("the more distant ancestor wins, having more selector segments", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> mid": { "> child": { width: "500px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          css: { "> child": { width: "200px" } },
          innerHTML: { child: { tag: "div", css: { width: "300px" } } },
        },
      },
    };
    assert.strictEqual(values(node, "root>mid>child")["width"], "500px");
  });

  test("union is per-property: a parent adding padding leaves colour alone", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> child": { padding: "8px" } },
      innerHTML: { child: { tag: "div", css: { color: "red" } } },
    };
    assert.deepStrictEqual(values(node, "root>child"), {
      color: "red",
      padding: "8px",
    });
  });

  test("equal specificity is broken by source order", () => {
    // `[cid-root] > [cid-mid] > [cid-child]` and `[cid-mid].on > [cid-child]`
    // are both (0,3,0); `mid`'s block prints second.
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> mid": { "> child": { width: "500px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          attributes: { class: "on" },
          css: { "&.on": { "> child": { width: "250px" } } },
          innerHTML: { child: { tag: "div" } },
        },
      },
    };
    assert.strictEqual(values(node, "root>mid>child")["width"], "250px");
  });
});

describe("provenance", () => {
  test("an uncontested own declaration is attributed to own", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { color: "red" },
    };
    assert.deepStrictEqual(at(node, "root").style["color"], {
      value: "red",
      from: "own",
      declaredBy: "root",
      viaKey: null,
    });
  });

  test("an ancestor is named by its path plus the selector key chain", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> body": { "> panel": { padding: "4px" } } },
      innerHTML: {
        body: { tag: "div", innerHTML: { panel: { tag: "section" } } },
      },
    };
    assert.strictEqual(
      at(node, "root>body>panel").style["padding"]!.from,
      'root "> body > panel"',
    );
  });

  test("a losing declaration is recorded rather than dropped", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> child": { padding: "4px" } },
      innerHTML: { child: { tag: "div", css: { padding: "32px" } } },
    };
    const padding = at(node, "root>child").style["padding"]!;
    assert.strictEqual(padding.value, "4px");
    assert.deepStrictEqual(
      padding.shadows?.map((loser) => `${loser.from} ${loser.value}`),
      ["own 32px"],
    );
  });

  test("shadows is absent, not empty, when nothing was contested", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> child": { padding: "4px" } },
      innerHTML: { child: { tag: "div" } },
    };
    assert.ok(!("shadows" in at(node, "root>child").style["padding"]!));
  });

  test("shadows are listed in descending precedence", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> mid": { "> child": { width: "1px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          css: { "> child": { width: "2px" } },
          innerHTML: { child: { tag: "div", css: { width: "3px" } } },
        },
      },
    };
    const width = at(node, "root>mid>child").style["width"]!;
    assert.strictEqual(width.value, "1px");
    assert.deepStrictEqual(
      width.shadows?.map((loser) => loser.value),
      ["2px", "3px"],
    );
  });
});

describe("states", () => {
  test("a pseudo-class block is a state delta, not part of the resting style", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { color: "red", ":hover": { color: "blue" } },
    };
    const resolved = at(node, "root");
    assert.strictEqual(resolved.style["color"]!.value, "red");
    assert.strictEqual(resolved.states[":hover"]?.["color"]?.value, "blue");
  });

  test("a state reports only what it changes", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { color: "red", padding: "4px", ":hover": { color: "blue" } },
    };
    assert.deepStrictEqual(Object.keys(at(node, "root").states[":hover"] ?? {}), [
      "color",
    ]);
  });

  test("a class already on the element is resting style, not a state", () => {
    // The element renders with `class="on"`, so `&.on` always matches. Filing
    // it under a state would make the resting style incomplete.
    const node: BaseComponentStructure = {
      tag: "div",
      attributes: { class: "on" },
      css: { color: "red", "&.on": { color: "green" } },
    };
    const resolved = at(node, "root");
    assert.strictEqual(resolved.style["color"]!.value, "green");
    assert.deepStrictEqual(resolved.states, {});
  });

  test("a class not on the element is a state", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { color: "red", "&.on": { color: "green" } },
    };
    const resolved = at(node, "root");
    assert.strictEqual(resolved.style["color"]!.value, "red");
    assert.strictEqual(resolved.states[".on"]?.["color"]?.value, "green");
  });

  test("a compound state builds on the states it contains", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: {
        color: "red",
        ":hover": { padding: "8px", "&.on": { color: "blue" } },
      },
    };
    const states = at(node, "root").states;
    assert.deepStrictEqual(states[":hover"], {
      padding: {
        value: "8px",
        from: 'own ":hover"',
        declaredBy: "root",
        viaKey: ":hover",
      },
    });
    // `:hover.on` matches the `:hover` rule too, so padding travels with it.
    assert.deepStrictEqual(Object.keys(states[":hover.on"] ?? {}).sort(), [
      "color",
      "padding",
    ]);
  });
});

describe("dead states", () => {
  // Checked against a real hover in tests/resolved-format/hover-conformance.test.ts.
  test("an ancestor outranks a state, and that is reported not hidden", () => {
    // `[cid-leaf]:hover` is (0,2,0); `[cid-root] > [cid-mid] > [cid-leaf]` is
    // (0,3,0). The hover never applies.
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> mid": { "> leaf": { padding: "2px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          innerHTML: {
            leaf: { tag: "div", css: { ":hover": { padding: "40px" } } },
          },
        },
      },
    };
    const resolved = at(node, "root>mid>leaf");
    assert.deepStrictEqual(resolved.states, {});
    assert.deepStrictEqual(
      resolved.deadStates[":hover"]?.map(
        (entry) => `${entry.property} ${entry.value} beaten by ${entry.beatenBy.value}`,
      ),
      ["padding 40px beaten by 2px"],
    );
  });

  test("a live state is not reported as dead", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { padding: "2px", ":hover": { padding: "40px" } },
    };
    const resolved = at(node, "root");
    assert.strictEqual(resolved.states[":hover"]?.["padding"]?.value, "40px");
    assert.deepStrictEqual(resolved.deadStates, {});
  });

  test("a parent ties with a state, and the state wins on source order", () => {
    // `[cid-root] > [cid-leaf]` and `[cid-leaf]:hover` are both (0,2,0), and the
    // leaf's block prints second. It takes a *grandparent* to kill a hover.
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> leaf": { padding: "2px" } },
      innerHTML: {
        leaf: { tag: "div", css: { ":hover": { padding: "40px" } } },
      },
    };
    const resolved = at(node, "root>leaf");
    assert.strictEqual(resolved.states[":hover"]?.["padding"]?.value, "40px");
    assert.deepStrictEqual(resolved.deadStates, {});
  });

  test("a state can be half dead", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> mid": { "> leaf": { padding: "2px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          innerHTML: {
            leaf: {
              tag: "div",
              css: { ":hover": { padding: "40px", color: "red" } },
            },
          },
        },
      },
    };
    const resolved = at(node, "root>mid>leaf");
    assert.deepStrictEqual(Object.keys(resolved.states[":hover"] ?? {}), ["color"]);
    assert.deepStrictEqual(
      resolved.deadStates[":hover"]?.map((entry) => entry.property),
      ["padding"],
    );
  });
});

describe("node identity", () => {
  test("array children get distinct paths", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: { item: [{ tag: "div" }, { tag: "div" }] },
    };
    assert.deepStrictEqual(
      resolveCascade(node).nodes.map((resolved) => resolved.path),
      ["root", "root>item[0]", "root>item[1]"],
    );
  });

  test("one rule styles every entry of an array child", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      css: { "> item": { width: "9px" } },
      innerHTML: { item: [{ tag: "div" }, { tag: "div" }] },
    };
    assert.strictEqual(values(node, "root>item[0]")["width"], "9px");
    assert.strictEqual(values(node, "root>item[1]")["width"], "9px");
  });

  test("a lone array entry is not indexed", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: { item: [{ tag: "div" }] },
    };
    assert.deepStrictEqual(
      resolveCascade(node).nodes.map((resolved) => resolved.path),
      ["root", "root>item"],
    );
  });

  test("text owned directly by a node is recorded on it", () => {
    const node: BaseComponentStructure = {
      tag: "div",
      innerHTML: { label: "hello", child: { tag: "div", innerHTML: "world" } },
    };
    const cascade = resolveCascade(node);
    assert.strictEqual(cascade.byPath.get("root")!.text, "hello");
    assert.strictEqual(cascade.byPath.get("root>child")!.text, "world");
  });
});
