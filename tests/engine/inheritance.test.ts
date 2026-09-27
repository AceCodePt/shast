import test, { describe } from "node:test";
import assert from "node:assert";
import { createInheritComponent } from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("innerHTML Structural Inheritance", () => {
    test("conjunctive intersection: a > h1 > span is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          heading: {
            tag: "h1",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          heading: {
            tag: "h1",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("conjunctive intersection rejects a tag the outer ancestor forbids: a > h1 > b", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              heading: {
                tag: "h1",
                innerHTML: {
                  label: {
                    // @ts-expect-error
                    tag: "b",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("nested `*` accepts a tag in the inherited ancestral set: a > div > span", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          wrapper: {
            tag: "div",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          wrapper: {
            tag: "div",
            innerHTML: {
              label: {
                tag: "span",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("nested `*` is restricted to the inherited set: a > div > b is rejected", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              wrapper: {
                tag: "div",
                innerHTML: {
                  label: {
                    // @ts-expect-error
                    tag: "b",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("reset structural tag: a > ul > li is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: "hi",
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: "hi",
              },
            },
          },
        },
      });
    });

    test("reset structural tag ignores the ancestral set: a > ul > span is rejected", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              list: {
                tag: "ul",
                innerHTML: {
                  item: {
                    // @ts-expect-error
                    tag: "span",
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("ancestral set re-emerges below a reset tag: a > ul > li > div is accepted", () => {
      const config = createInheritComponent({
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  box: {
                    tag: "div",
                  },
                },
              },
            },
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        innerHTML: {
          list: {
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  box: {
                    tag: "div",
                  },
                },
              },
            },
          },
        },
      });
    });

    test("re-emerged ancestral set rejects a tag only the immediate parent allows: a > ul > li > b", () => {
      assert.throws(
        () =>
          createInheritComponent({
            tag: "a",
            innerHTML: {
              list: {
                tag: "ul",
                innerHTML: {
                  item: {
                    tag: "li",
                    innerHTML: {
                      emphasis: {
                        // @ts-expect-error
                        tag: "b",
                      },
                    },
                  },
                },
              },
            },
          }),
        /Structural Error/,
      );
    });

    test("root `*` accepts any tag: div > b is accepted", () => {
      const config = createInheritComponent({
        tag: "div",
        innerHTML: {
          emphasis: {
            tag: "b",
            innerHTML: "hi",
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: {
          emphasis: {
            tag: "b",
            innerHTML: "hi",
          },
        },
      });
    });
  });
});
