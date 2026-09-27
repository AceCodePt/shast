import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, createMockComponent } from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("Baseline Structural Checks", () => {
    test("should fail if node is null or not an object", () => {
      assert.throws(
        () =>
          createMockComponent(
            //@ts-expect-error
            null,
          ),
        /Validation Error: Provided node is not a valid component object/,
      );
    });

    test("should fail if tag is missing or is not a string", () => {
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            innerHTML: "text",
          }),
        /Validation Error: Component node is missing a valid string 'tag' property/,
      );
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            tag: 123,
          }),
        /Validation Error: Component node is missing a valid string 'tag' property/,
      );
    });

    test("should fail if tag is not recognized in the registry", () => {
      assert.throws(
        () =>
          createMockComponent({
            // @ts-expect-error
            tag: "section",
          }),
        /Structural Error: '<section>' is not a recognized configuration tag in your registry/,
      );
    });
  });

  describe("Attribute Validation Firewall", () => {
    test("accepts valid explicit tag attributes and optional global attributes", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: {
          src: "logo.jpg",
          alt: "My Logo",
          id: "main-logo",
        },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: {
          src: "logo.jpg",
          alt: "My Logo",
          id: "main-logo",
        },
      });
    });

    test("should fail when encountering undocumented attributes", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "p",
            attributes: {
              //@ts-expect-error
              href: "https://google.com",
            },
          }),
        /Attribute Error: Property 'href' is not a valid attribute for <p> or the Global configuration registry/,
      );
    });
  });

  describe("Required Attribute Validation", () => {
    test("should fail when a required tag attribute is missing", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: { src: "pic.png" },
          }),
        /Attribute Error: Required attribute 'alt' is missing on <img>/,
      );
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: { alt: "desc" },
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("should fail when all required attributes are missing", () => {
      assert.throws(
        () =>
          // @ts-expect-error - testing runtime validation
          createMockComponent({
            tag: "img",
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("should fail when required attributes are missing and attributes is empty", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            // @ts-expect-error - testing runtime validation
            attributes: {},
          }),
        /Attribute Error: Required attribute 'src' is missing on <img>/,
      );
    });

    test("passes when all required attributes are present", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: { src: "pic.png", alt: "desc" },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: { src: "pic.png", alt: "desc" },
      });
    });

    test("passes when the tag has no required attributes", () => {
      const config = createMockComponent({
        tag: "div",
      });
      assert.deepStrictEqual(config, { tag: "div" });
    });

    test("should fail with the real config when <a> is missing href", () => {
      assert.throws(
        () =>
          // @ts-expect-error - testing runtime validation
          createComponent({
            tag: "a",
          }),
        /Attribute Error: Required attribute 'href' is missing on <a>/,
      );
    });

    test("passes with the real config when <a> provides href", () => {
      const config = createComponent({
        tag: "a",
        attributes: { href: "https://example.com" },
      });
      assert.deepStrictEqual(config, {
        tag: "a",
        attributes: { href: "https://example.com" },
      });
    });
  });

  describe("Void Element Controls", () => {
    test("accepts void elements when innerHTML is absent", () => {
      const config = createMockComponent({
        tag: "img",
        attributes: {
          src: "pic.png",
          alt: "Image text",
        },
      });
      assert.deepStrictEqual(config, {
        tag: "img",
        attributes: {
          src: "pic.png",
          alt: "Image text",
        },
      });
    });

    test("should fail void elements if string content is passed", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "img",
            attributes: {
              src: "pic.png",
              alt: "Image text",
            },
            //@ts-expect-error
            innerHTML: {
              text: "Illegal Text Inside Void Element",
            },
          }),
        /Validation Error: Tag '<img>' is configured as a void element and must not contain any innerHTML or children/,
      );
    });
  });

  describe("Text Content Controls", () => {
    test("accepts string content when the element accepts text nodes", () => {
      const config = createMockComponent({
        tag: "p",
        innerHTML: "Clean inline content",
      });
      assert.deepStrictEqual(config, {
        tag: "p",
        innerHTML: "Clean inline content",
      });
    });

    test("should fail element with string content if it explicitly bars text nodes", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            // @ts-expect-error
            innerHTML: { text: "Illegal Direct Text Node Element" },
          }),
        /Validation Error: Tag '<ul>' innerHTML cannot contain a string without the #text/,
      );
    });
  });

  describe("Structural Hierarchy Arrays", () => {
    test("accepts valid nested configurations matching allowed child arrays", () => {
      const config = createMockComponent({
        tag: "ul",
        innerHTML: {
          child1: {
            tag: "li",
            innerHTML: "text",
          },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "ul",
        innerHTML: {
          child1: {
            tag: "li",
            innerHTML: "text",
          },
        },
      });
    });

    test("rejects a direct child whose tag is not in the parent's innerHTML whitelist", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            innerHTML: {
              badChild: {
                // @ts-expect-error
                tag: "p",
                innerHTML: "Bad nested block",
              },
            },
          }),
        /Structural Error: '<p>' is not a permitted child of <ul>/,
      );
    });

    test("gates a grandchild by its immediate parent, not the outer ancestor", () => {
      assert.throws(
        () =>
          createMockComponent({
            tag: "ul",
            innerHTML: {
              item: {
                tag: "li",
                innerHTML: {
                  invalidGrandchild: {
                    // @ts-expect-error
                    tag: "p",
                  },
                },
              },
            },
          }),
        /Structural Error: '<p>' is not a permitted child of <li>/,
      );
    });
  });
});
