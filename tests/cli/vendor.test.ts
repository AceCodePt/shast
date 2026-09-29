import test, { describe } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  add,
  ExistingDestinationError,
  generateEntry,
  main,
  type ConfigVariant,
} from "../../scripts/cli.ts";

const VARIANTS: readonly ConfigVariant[] = ["minimal", "common", "full"];

const VARIATION_DIRS = [
  "html/attribute-config/variations",
  "html/tag-config/variations",
  "css/syntax-config/variations",
  "css/attribute-config/variations",
  "css/pseudo-class-config/variations",
  "css/queries-config/variations",
  "css/keyframes-config/variations",
] as const;

function tempDest(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "shast-vendor-test-"));
  process.on("exit", () => rmSync(root, { recursive: true, force: true }));
  return root;
}

function read(dest: string, rel: string): string {
  return readFileSync(path.join(dest, rel), "utf8");
}

describe("shast add: copy set", () => {
  test("copies engine, css, html, types, env and tsyntax, excluding the demo entry", () => {
    const dest = tempDest();
    add({ dest, config: "common" });

    for (const rel of [
      "engine/index.ts",
      "engine/types.ts",
      "engine/render/render-component.ts",
      "css/properties-config/index.ts",
      "css/properties-config/types.ts",
      "css/calc.ts",
      "css/var.ts",
      "html/attribute-config/index.ts",
      "html/tag-config/types.ts",
      "types.ts",
      "env.d.ts",
      "tsyntax/index.ts",
      "tsyntax/types.ts",
      "index.ts",
    ]) {
      assert.ok(existsSync(path.join(dest, rel)), `expected ${rel} to exist`);
    }

    // The demo entry is not copied verbatim anywhere.
    assert.ok(!read(dest, "index.ts").includes("const list = createComponent"));
    // No docs, tests, evals or resolved-format leakage.
    for (const absent of ["docs", "tests", "evals", "resolved-format"]) {
      assert.ok(!existsSync(path.join(dest, absent)), `expected no ${absent}/`);
    }
  });

  test("copies every variation for every family that ships them", () => {
    const dest = tempDest();
    add({ dest, config: "common" });

    for (const dir of VARIATION_DIRS) {
      for (const variant of VARIANTS) {
        const rel = `${dir}/${variant}.ts`;
        assert.ok(existsSync(path.join(dest, rel)), `expected ${rel}`);
      }
    }

    // The source typo is normalized on the way out.
    assert.ok(
      existsSync(
        path.join(dest, "css/pseudo-class-config/variations/minimal.ts"),
      ),
    );
    assert.ok(
      !existsSync(
        path.join(dest, "css/pseudo-class-config/variations/mimimal.ts"),
      ),
    );
  });
});

describe("shast add: import rewriting", () => {
  test("no vendored file keeps a @/ or bare tsyntax specifier", () => {
    const dest = tempDest();
    add({ dest, config: "common" });

    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(abs);
        } else if (entry.name.endsWith(".ts")) {
          const source = readFileSync(abs, "utf8");
          if (/from\s+"@\//.test(source) || /from\s+"tsyntax"/.test(source)) {
            offenders.push(path.relative(dest, abs));
          }
        }
      }
    };
    walk(dest);

    assert.deepStrictEqual(offenders, []);
  });

  test("rewrites @/ and tsyntax specifiers to mirrored relative paths", () => {
    const dest = tempDest();
    add({ dest, config: "common" });

    const engineIndex = read(dest, "engine/index.ts");
    assert.ok(
      engineIndex.includes('from "../tsyntax/index.ts"'),
      "engine imports vendored tsyntax",
    );
    assert.ok(
      engineIndex.includes('from "../css/attribute-config/types.ts"'),
      "engine imports a mirrored @/ target",
    );

    const types = read(dest, "types.ts");
    assert.ok(types.includes('from "./css/syntax-config/types.ts"'));
    assert.ok(types.includes('from "./tsyntax/index.ts"'));

    // A deeply nested file resolves up to the root and over to tsyntax.
    const calC = read(dest, "css/calc.ts");
    assert.ok(calC.includes('from "./properties-config/types.ts"'));
    assert.ok(calC.includes('from "../tsyntax/index.ts"'));
    assert.ok(!calC.includes('from "tsyntax"'));
  });
});

describe("shast add: generated entry", () => {
  for (const variant of VARIANTS) {
    test(`wires the ${variant} variation`, () => {
      const dest = tempDest();
      add({ dest, config: variant });
      const entry = read(dest, "index.ts");

      for (const dir of VARIATION_DIRS) {
        assert.ok(
          entry.includes(`from "./${dir}/${variant}.ts"`),
          `entry should import${variant} from ${dir}`,
        );
      }
      assert.ok(entry.includes("engine({"));
      assert.ok(entry.includes("cssPropertiesConfig("));
      assert.ok(entry.includes('/// <reference path="./env.d.ts" />'));
      assert.ok(!entry.includes('"@/'));
      assert.ok(!entry.includes('"tsyntax"'));
      assert.ok(!entry.includes("const list = createComponent"));
    });
  }

  test("the generator is deterministic", () => {
    assert.strictEqual(generateEntry("common"), generateEntry("common"));
    assert.ok(generateEntry("full").includes("/full.ts"));
  });

  test("an unknown --config is rejected before anything is written", () => {
    const dest = tempDest();
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.strictEqual(main(["add", dest, "--config", "bogus"]), 2);
    } finally {
      console.error = originalError;
    }
    assert.ok(!existsSync(path.join(dest, "index.ts")));
  });
});

describe("shast add: no clobber without --force", () => {
  test("second run without --force reports the existing files", () => {
    const dest = tempDest();
    add({ dest, config: "common" });

    assert.throws(
      () => add({ dest, config: "common" }),
      (error: unknown) => {
        assert.ok(error instanceof ExistingDestinationError);
        assert.ok(error.collisions.includes("index.ts"));
        assert.ok(error.collisions.includes("engine/index.ts"));
        assert.ok(
          error.collisions.includes("css/pseudo-class-config/variations/common.ts"),
        );
        return true;
      },
    );
  });

  test("--force overwrites and succeeds", () => {
    const dest = tempDest();
    add({ dest, config: "common" });
    const result = add({ dest, config: "full", force: true });
    assert.strictEqual(result.config, "full");
    assert.ok(read(dest, "index.ts").includes("/full.ts"));
  });
});
