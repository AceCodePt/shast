import type { BaseComponentStructure } from "@/engine/types.ts";

export type Fixture = {
  name: string;
  viewport: { width: number; height: number };
  node: BaseComponentStructure;
};

/**
 * Shared between the grid renderer and the browser conformance harness, so
 * both are always measuring the identical tree.
 */
export const FIXTURES: Fixture[] = [
  {
    name: "empty-block",
    viewport: { width: 400, height: 200 },
    node: { tag: "div" },
  },
  {
    name: "single-line",
    viewport: { width: 400, height: 200 },
    node: { tag: "div", innerHTML: "hello" },
  },
  {
    name: "explicit-size",
    viewport: { width: 400, height: 200 },
    node: { tag: "div", css: { width: "200px", height: "100px" } },
  },
  {
    name: "border-box-padding",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: {
        width: "200px",
        padding: "10px",
        "border-width": "2px",
        "border-style": "solid",
      },
      innerHTML: { inner: { tag: "div" } },
    },
  },
  {
    name: "stacked-children",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      innerHTML: {
        a: { tag: "div", innerHTML: "one" },
        b: { tag: "div", innerHTML: "two" },
        c: { tag: "div", innerHTML: "three" },
      },
    },
  },
  {
    name: "display-none",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      innerHTML: {
        gone: { tag: "div", css: { display: "none" }, innerHTML: "x" },
        shown: { tag: "div", innerHTML: "y" },
      },
    },
  },
  {
    name: "child-selector",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "> inner": { width: "120px", height: "40px" } },
      innerHTML: { inner: { tag: "div" } },
    },
  },
  {
    name: "text-wrapping",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "160px" },
      innerHTML: "the quick brown fox jumps over the lazy dog",
    },
  },
  // Wrap boundaries. Content width is an exact multiple of the assumed 9.6px
  // advance, and the text is built so that one column either way changes the
  // line count - the only way block layout's height becomes sensitive to the
  // advance ratio at all.
  {
    name: "wrap-boundary-20col-fits",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "192px" },
      innerHTML: "aaaaaaaaaa bbbbbbbbb",
    },
  },
  {
    name: "wrap-boundary-20col-breaks",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "192px" },
      innerHTML: "aaaaaaaaaa bbbbbbbbbb",
    },
  },
  {
    name: "wrap-boundary-10col",
    viewport: { width: 400, height: 200 },
    node: { tag: "div", css: { width: "96px" }, innerHTML: "aaaa bbbb cccc" },
  },
  {
    name: "wrap-boundary-33col",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "316.8px" },
      innerHTML:
        "aaaaaaaa bbbbbbbb cccccccc dddddddd eeeeeeee ffffffff gggggggg",
    },
  },
  {
    name: "long-word-overflows-not-broken",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "96px" },
      innerHTML: "supercalifragilistic x",
    },
  },
  {
    name: "many-lines-accumulate",
    viewport: { width: 400, height: 300 },
    node: {
      tag: "div",
      css: { width: "192px" },
      innerHTML:
        "one two three four five six seven eight nine ten eleven twelve " +
        "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty",
    },
  },
  {
    name: "font-size-inheritance",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "font-size": "32px" },
      innerHTML: { child: { tag: "div", innerHTML: "inherits?" } },
    },
  },
  {
    name: "em-padding",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "font-size": "20px", padding: "1em" },
      innerHTML: { inner: { tag: "div", innerHTML: "x" } },
    },
  },
  {
    name: "percentage-width",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { width: "50%" },
      innerHTML: { half: { tag: "div", css: { width: "50%" } } },
    },
  },
  {
    // `height: 100%` inside an auto-height parent. The containing block's height
    // is indefinite, so CSS 2.1 §10.5 makes the percentage behave as `auto` and
    // the child is sized by its own content. Regression guard: the basis is
    // signalled as `NaN`, which used to reach the box and emit `NaN` as a
    // measured height.
    name: "percentage-height-indefinite-parent",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      innerHTML: {
        outer: {
          tag: "div",
          innerHTML: {
            filler: { tag: "div", css: { height: "60px" }, innerHTML: "a" },
            tall: { tag: "div", css: { height: "100%" }, innerHTML: "b" },
          },
        },
      },
    },
  },
  {
    // `display: none` generates no box: the browser reports `0,0,0,0`, and the
    // following sibling closes up over the space. Regression guard for a hidden
    // box that used to report the flow position it would have occupied.
    name: "display-none-generates-no-box",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      innerHTML: {
        first: { tag: "div", css: { height: "40px" }, innerHTML: "first" },
        gone: { tag: "div", css: { display: "none", height: "40px" }, innerHTML: "gone" },
        third: { tag: "div", css: { height: "40px" }, innerHTML: "third" },
      },
    },
  },
  {
    // The same percentage against a *definite* parent, so the pair distinguishes
    // "indefinite basis" from "percentages are broken".
    name: "percentage-height-definite-parent",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { height: "150px" },
      innerHTML: { half: { tag: "div", css: { height: "50%" }, innerHTML: "b" } },
    },
  },
  // ---- v1.5: positioned layout ----
  {
    name: "relative-offset-keeps-flow",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      innerHTML: {
        a: { tag: "div", innerHTML: "first" },
        b: {
          tag: "div",
          css: { position: "relative", top: "10px", left: "20px" },
          innerHTML: "shifted",
        },
        c: { tag: "div", innerHTML: "third" },
      },
    },
  },
  {
    name: "absolute-both-offsets",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px" },
      innerHTML: {
        box: {
          tag: "div",
          css: { position: "absolute", left: "20px", right: "40px", top: "10px", bottom: "30px" },
        },
      },
    },
  },
  {
    name: "absolute-explicit-size",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px" },
      innerHTML: {
        box: {
          tag: "div",
          css: {
            position: "absolute",
            right: "10px",
            bottom: "10px",
            width: "80px",
            height: "40px",
          },
        },
      },
    },
  },
  {
    name: "absolute-shrink-to-fit",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px" },
      innerHTML: {
        badge: {
          tag: "div",
          css: { position: "absolute", top: "0px", left: "0px" },
          innerHTML: "NEW",
        },
      },
    },
  },
  {
    name: "absolute-static-position",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px" },
      innerHTML: {
        before: { tag: "div", innerHTML: "one" },
        floating: {
          tag: "div",
          css: { position: "absolute", width: "60px", height: "20px" },
        },
        after: { tag: "div", innerHTML: "two" },
      },
    },
  },
  {
    name: "absolute-containing-block-is-padding-box",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: {
        position: "relative",
        width: "300px",
        height: "150px",
        padding: "20px",
        "border-width": "5px",
        "border-style": "solid",
      },
      innerHTML: {
        box: {
          tag: "div",
          css: { position: "absolute", top: "0px", left: "0px", width: "50px", height: "25px" },
        },
      },
    },
  },
  {
    name: "absolute-skips-static-ancestor",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px" },
      innerHTML: {
        mid: {
          tag: "div",
          css: { padding: "20px" },
          innerHTML: {
            box: {
              tag: "div",
              css: { position: "absolute", top: "5px", left: "5px", width: "40px", height: "20px" },
            },
          },
        },
      },
    },
  },
  {
    name: "absolute-percentage-offsets",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "200px", height: "100px" },
      innerHTML: {
        box: {
          tag: "div",
          css: { position: "absolute", top: "50%", left: "25%", width: "50%", height: "20%" },
        },
      },
    },
  },
  {
    name: "fixed-to-viewport",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px", padding: "20px" },
      innerHTML: {
        bar: {
          tag: "div",
          css: { position: "fixed", top: "0px", left: "0px", right: "0px", height: "24px" },
          innerHTML: "fixed bar",
        },
      },
    },
  },
  {
    name: "absolute-removed-from-flow",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px" },
      innerHTML: {
        a: { tag: "div", innerHTML: "one" },
        gone: {
          tag: "div",
          css: { position: "absolute", top: "0px", height: "500px" },
          innerHTML: "tall",
        },
        b: { tag: "div", innerHTML: "two" },
      },
    },
  },
  {
    name: "z-index-stacking",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { position: "relative", width: "300px", height: "150px" },
      innerHTML: {
        under: {
          tag: "div",
          css: {
            position: "absolute",
            top: "10px",
            left: "10px",
            width: "120px",
            height: "60px",
            "z-index": "1",
            "border-width": "1px",
            "border-style": "solid",
          },
          innerHTML: "under",
        },
        over: {
          tag: "div",
          css: {
            position: "absolute",
            top: "30px",
            left: "50px",
            width: "120px",
            height: "60px",
            "z-index": "2",
            "border-width": "1px",
            "border-style": "solid",
          },
          innerHTML: "over",
        },
      },
    },
  },
  {
    name: "invoice",
    viewport: { width: 720, height: 400 },
    node: {
      tag: "div",
      css: { padding: "16px", "border-width": "1px", "border-style": "solid" },
      innerHTML: {
        header: {
          tag: "header",
          css: {
            padding: "20px",
            "border-width": "1px",
            "border-style": "solid",
            "text-transform": "uppercase",
          },
          innerHTML: "Invoice 2024-018",
        },
        intro: {
          tag: "p",
          css: { "padding-block": "20px" },
          innerHTML:
            "Block layout only. Text wraps at the content box width and the " +
            "box grows to fit the wrapped lines.",
        },
        panel: {
          tag: "section",
          css: {
            "border-width": "1px",
            "border-style": "solid",
            "border-radius": "4px",
            padding: "20px",
            "> label": { "border-width": "1px", "border-style": "dashed" },
          },
          innerHTML: {
            label: {
              tag: "div",
              css: { padding: "20px" },
              innerHTML: "Amount due",
            },
            amount: {
              tag: "div",
              css: { "font-size": "32px", "padding-block": "20px" },
              innerHTML: "1,240.00",
            },
          },
        },
         narrow: {
          tag: "div",
          css: {
            width: "160px",
            height: "60px",
            padding: "8px",
            "border-width": "1px",
            "border-style": "solid",
          },
          innerHTML: "A fixed box whose text overflows its explicit height.",
        },
      },
    },
  },

  // --- cascade collisions -------------------------------------------------
  //
  // Every fixture below has two or more declarations of the same property
  // reaching one node. They exist so the browser, not an argument about
  // specificity, decides what the resolver reports. Each is annotated with
  // the emitted selectors and the width that must win.
  {
    // `[cid-parent] > [cid-child]` is (0,2,0); `[cid-child]` is (0,1,0).
    // The ancestor wins, which is the opposite of "own overrides inherited".
    name: "cascade-own-vs-parent",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "> child": { width: "100px" } },
      innerHTML: {
        child: { tag: "div", css: { width: "300px", height: "10px" } },
      },
    },
  },
  {
    // (0,3,0) from the grandparent beats (0,2,0) from the parent beats
    // (0,1,0) from the node: the *most distant* contributor wins.
    name: "cascade-three-way",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "> mid": { "> child": { width: "500px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          css: { "> child": { width: "200px" } },
          innerHTML: {
            child: { tag: "div", css: { width: "300px", height: "10px" } },
          },
        },
      },
    },
  },
  {
    // `[cid-root] > [cid-mid] > [cid-child]` and
    // `[cid-mid]:not(#x) > [cid-child]` would both be (0,3,0) but for the
    // `:not(#x)`; using a plain class keeps them equal so the tie is broken by
    // source order, and `mid`'s block is printed after `root`'s.
    name: "cascade-source-order-tie",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "> mid": { "> child": { width: "500px" } } },
      innerHTML: {
        mid: {
          tag: "div",
          attributes: { class: "on" },
          css: { "&.on": { "> child": { width: "250px" } } },
          innerHTML: {
            child: { tag: "div", css: { height: "10px" } },
          },
        },
      },
    },
  },
  {
    // A `"> name"` block can take a child out of flow, so `position` has to be
    // read from the cascade rather than from the child's own `css`.
    name: "cascade-parent-positions-child",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: {
        position: "relative",
        height: "150px",
        "> child": {
          position: "absolute",
          top: "20px",
          left: "30px",
          width: "80px",
          height: "40px",
        },
      },
      innerHTML: { child: { tag: "div" } },
    },
  },
  {
    // Nested two deep past an intermediate that declares nothing, so the
    // grandparent's block is the only contributor and must still arrive.
    name: "cascade-grandparent-only",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: {
        "> mid": { "> child": { width: "140px", height: "30px" } },
      },
      innerHTML: {
        mid: { tag: "div", innerHTML: { child: { tag: "div" } } },
      },
    },
  },
  {
    // Array children all carry the same `cid-<name>`, so one emitted rule
    // styles every entry.
    name: "cascade-array-children",
    viewport: { width: 400, height: 200 },
    node: {
      tag: "div",
      css: { "> item": { width: "90px", height: "20px" } },
      innerHTML: {
        item: [{ tag: "div" }, { tag: "div" }, { tag: "div" }],
      },
    },
  },
];
