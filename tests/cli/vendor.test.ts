import test, { describe } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  add,
  CommonJSDestinationError,
  ExistingDestinationError,
  main,
} from "../../scripts/cli.ts";

const VARIANTS = ["minimal", "common", "full"] as const;

const VARIATION_DIRS = [
  "html/attribute-config/variations",
  "html/tag-config/variations",
  "css/syntax-config/variations",
  "css/attribute-config/variations",
  "css/pseudo-class-config/variations",
  "css/queries-config/variations",
  "css/keyframes-config/variations",
] as const;

/**
 * A scratch destination under an ESM package root, mirroring a real consumer
 * (`shast add` refuses to vendor into a CommonJS subtree).
 */
function tempDest(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "shast-vendor-test-"));
  process.on("exit", () => rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, "shast");
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ type: "module" }),
  );
  return dest;
}

function read(dest: string, rel: string): string {
  return readFileSync(path.join(dest, rel), "utf8");
}

describe("shast add: copy set", () => {
  test("copies engine, css, html, types and tsyntax, including the entry", () => {
    const dest = tempDest();
    add({ dest });

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
      "tsyntax/index.ts",
      "tsyntax/types.ts",
      "index.ts",
    ]) {
      assert.ok(existsSync(path.join(dest, rel)), `expected ${rel} to exist`);
    }

    // The tree carries no generated package.json: the module format is the
    // consumer's to declare, and `add` refuses a CommonJS destination outright.
    assert.ok(!existsSync(path.join(dest, "package.json")));
    assert.ok(!existsSync(path.join(dest, "env.d.ts")));

    // No docs, tests, evals or resolved-format leakage.
    for (const absent of ["docs", "tests", "evals", "resolved-format", "examples"]) {
      assert.ok(!existsSync(path.join(dest, absent)), `expected no ${absent}/`);
    }
  });

  test("the vendored entry is the package's public entry, not a demo", () => {
    const dest = tempDest();
    add({ dest });
    const entry = read(dest, "index.ts");

    assert.ok(entry.includes('export { default as engine } from "./engine/index.ts"'));
    assert.ok(entry.includes('from "./engine/render/render-component.ts"'));
    // No triple-slash reference to a ts-reset shim: the query vocabularies are
    // compared through `isMemberOf` instead of a global `includes` widening.
    assert.ok(!entry.includes("env.d.ts"));
    assert.ok(!entry.includes("ts-reset"));
    // Side-effect free: no engine wiring, no demo component, no logging.
    assert.ok(!entry.includes("engine({"));
    assert.ok(!entry.includes("const list = createComponent"));
    assert.ok(!entry.includes("console.log"));
  });

  test("copies every variation for every family that ships them", () => {
    const dest = tempDest();
    add({ dest });

    for (const dir of VARIATION_DIRS) {
      for (const variant of VARIANTS) {
        const rel = `${dir}/${variant}.ts`;
        assert.ok(existsSync(path.join(dest, rel)), `expected ${rel}`);
      }
    }

    // The source tree spells the pseudo-class variant `minimal`; the vendored
    // tree must carry that exact name (the copied entry imports it by name).
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

    // The entry imports the variant by name, so a rename on either side would
    // be a broken vendored tree rather than a missing file.
    assert.ok(
      read(dest, "index.ts").includes(
        'from "./css/pseudo-class-config/variations/minimal.ts"',
      ),
    );
  });
});

describe("shast add: import rewriting", () => {
  test("no vendored file keeps a @/ or bare tsyntax specifier", () => {
    const dest = tempDest();
    add({ dest });

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
    add({ dest });

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

    // The entry's exported variations resolve relative to the root.
    const entry = read(dest, "index.ts");
    assert.ok(entry.includes('from "./html/tag-config/variations/common.ts"'));
    assert.ok(entry.includes('from "./css/pseudo-class-config/variations/minimal.ts"'));
  });
});

describe("shast add: usage", () => {
  test("an unknown option is rejected before anything is written", () => {
    const dest = tempDest();
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.strictEqual(main(["add", dest, "--bogus"]), 2);
    } finally {
      console.error = originalError;
    }
    assert.ok(!existsSync(path.join(dest, "index.ts")));
  });
});

describe("shast add: CommonJS destination", () => {
  test("a destination with no package.json above it is rejected, nothing written", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-cjs-test-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    const dest = path.join(root, "shast");

    assert.throws(
      () => add({ dest }),
      (error: unknown) => {
        assert.ok(error instanceof CommonJSDestinationError);
        assert.strictEqual(error.dest, dest);
        assert.strictEqual(error.nearestPackageJson, null);
        assert.ok(error.message.includes('"type": "module"'));
        return true;
      },
    );
    assert.ok(!existsSync(path.join(dest, "index.ts")));
  });

  test("a CommonJS package.json above the destination is rejected", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-cjs-test-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    const pkg = path.join(root, "package.json");
    writeFileSync(pkg, JSON.stringify({ name: "app" }));
    const dest = path.join(root, "src", "shast");

    assert.throws(
      () => add({ dest }),
      (error: unknown) => {
        assert.ok(error instanceof CommonJSDestinationError);
        assert.strictEqual(error.nearestPackageJson, pkg);
        return true;
      },
    );
  });

  test("an ESM package.json above the destination is accepted", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-esm-test-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "app", type: "module" }),
    );
    const dest = path.join(root, "src", "shast");

    const result = add({ dest });
    assert.ok(result.written.includes("index.ts"));
  });

  test("main reports the CommonJS destination and exits 1", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-cjs-test-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    const originalError = console.error;
    let message = "";
    console.error = (value: unknown) => {
      message = String(value);
    };
    try {
      assert.strictEqual(main(["add", path.join(root, "shast")]), 1);
    } finally {
      console.error = originalError;
    }
    assert.ok(message.includes("CommonJS"));
  });
});

describe("shast add: no clobber without --force", () => {
  test("second run without --force reports the existing files", () => {
    const dest = tempDest();
    add({ dest });

    assert.throws(
      () => add({ dest }),
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

  test("the message is actionable and does not dump every path", () => {
    const dest = tempDest();
    add({ dest });

    let message = "";
    try {
      add({ dest });
    } catch (error) {
      assert.ok(error instanceof ExistingDestinationError);
      message = error.message;
    }

    // The reason must survive a runner appending its own "command failed" line,
    // so the count and the --force hint belong at the top, not the bottom.
    assert.match(message.split("\n")[0]!, /pass --force to overwrite/i);
    assert.match(message.split("\n")[0]!, /Nothing was written/);
    // A 55-file dump pushes the reason off screen; summarise the tail instead.
    const listed = message.split("\n").slice(1, -1);
    assert.ok(listed.length <= 11, `listed ${listed.length} paths`);
    assert.match(message, /and \d+ more/);
  });

  test("main prints the refusal hint last, after the file list", () => {
    const dest = tempDest();
    add({ dest });

    const lines: string[] = [];
    const originalError = console.error;
    console.error = (value: unknown) => {
      lines.push(String(value));
    };
    try {
      assert.strictEqual(main(["add", dest]), 1);
    } finally {
      console.error = originalError;
    }

    assert.match(lines[0]!, /Destination already contains/);
    assert.match(lines[lines.length - 1]!, /refused to overwrite/);
    assert.match(lines[lines.length - 1]!, /--force/);
  });

  test("--force overwrites and succeeds", () => {
    const dest = tempDest();
    add({ dest });
    const result = add({ dest, force: true });
    assert.ok(result.written.includes("index.ts"));
    // The rewrite still applies on overwrite.
    assert.ok(!read(dest, "index.ts").includes('"@/'));
  });
});
