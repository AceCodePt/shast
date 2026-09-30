import test, { describe } from "node:test";
import assert from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScanner, LanguageVariant, SyntaxKind } from "typescript/unstable/ast";
import {
  add,
  CommonJSDestinationError,
  ExistingDestinationError,
  main,
  resolveTsyntaxSourceRoot,
  rewriteImports,
} from "../../scripts/cli.ts";

/** This repository's root, used to resolve the real vendored tsyntax source. */
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

interface ScannedToken {
  kind: SyntaxKind;
  /** The raw token text, quotes included for a string literal. */
  text: string;
  /** The literal's value, quotes removed and escapes resolved. */
  value: string;
  start: number;
}

/** Tokenize `source` with the TypeScript lexer (a devDependency, never shipped). */
function scanTokens(source: string, skipTrivia: boolean): ScannedToken[] {
  const scanner = createScanner(skipTrivia, LanguageVariant.Standard, source);
  const tokens: ScannedToken[] = [];
  for (;;) {
    const kind = scanner.scan();
    if (kind === SyntaxKind.EndOfFile) break;
    tokens.push({
      kind,
      text: scanner.getTokenText(),
      value: scanner.getTokenValue(),
      start: scanner.getTokenStart(),
    });
  }
  return tokens;
}

function isTrivia(kind: SyntaxKind): boolean {
  return kind >= SyntaxKind.FirstTriviaToken && kind <= SyntaxKind.LastTriviaToken;
}

/**
 * Whether the string literal at `index` sits in a module specifier position:
 * after `from` or `import` (static import/export, side-effect import), or as
 * the argument of a dynamic `import(...)`. Trivia between tokens is ignored.
 */
function isSpecifierPositionToken(
  tokens: readonly ScannedToken[],
  index: number,
): boolean {
  let previous = index - 1;
  while (previous >= 0 && isTrivia(tokens[previous]!.kind)) previous -= 1;
  if (previous < 0) return false;
  const keyword = tokens[previous]!;
  if (
    keyword.kind === SyntaxKind.FromKeyword ||
    keyword.kind === SyntaxKind.ImportKeyword
  ) {
    return true;
  }
  if (keyword.kind !== SyntaxKind.OpenParenToken) return false;
  let beforeParen = previous - 1;
  while (beforeParen >= 0 && isTrivia(tokens[beforeParen]!.kind)) beforeParen -= 1;
  return (
    beforeParen >= 0 &&
    tokens[beforeParen]!.kind === SyntaxKind.ImportKeyword
  );
}

/**
 * Guard: every byte `rewriteImports` changes must lie inside a module specifier
 * string literal. Both sides are tokenized with the TypeScript lexer, so a
 * change inside a comment or a non-specifier string is reported instead of
 * passing silently.
 */
function assertRewritesOnlySpecifiers(before: string, after: string): void {
  const beforeTokens = scanTokens(before, false);
  const afterTokens = scanTokens(after, false);
  assert.strictEqual(
    afterTokens.length,
    beforeTokens.length,
    "rewriteImports changed the token stream length",
  );
  for (let index = 0; index < beforeTokens.length; index += 1) {
    const from = beforeTokens[index]!;
    const to = afterTokens[index]!;
    if (from.text === to.text) continue;
    assert.strictEqual(
      to.kind,
      from.kind,
      `rewriteImports changed a ${SyntaxKind[from.kind]} into a ${SyntaxKind[to.kind]}`,
    );
    assert.ok(
      from.kind === SyntaxKind.StringLiteral &&
        isSpecifierPositionToken(beforeTokens, index),
      `rewriteImports changed ${JSON.stringify(from.text)} at ${from.start}, which is not a module specifier`,
    );
  }
}

/**
 * Every string literal in the vendored `.ts` files that still holds a `@/` path
 * or the bare `tsyntax` package name. The lexer skips comments, so prose is not
 * mistaken for a specifier; a dynamic `import("@/...")` is a literal and is.
 */
function survivingSpecifierStrings(dest: string): string[] {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.name.endsWith(".ts")) continue;
      const source = readFileSync(abs, "utf8");
      for (const token of scanTokens(source, true)) {
        if (token.kind !== SyntaxKind.StringLiteral) continue;
        if (token.value.includes("@/") || token.value === "tsyntax") {
          offenders.push(`${path.relative(dest, abs)}: ${JSON.stringify(token.value)}`);
        }
      }
    }
  };
  walk(dest);
  return offenders;
}

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
  test("no vendored file keeps a @/ or bare tsyntax string literal", () => {
    const dest = tempDest();
    add({ dest });

    // Anchored on every string literal rather than a `from "..."` grep: the
    // grep's shape is a blind spot for `import("@/...")`, which shares no
    // `from` and would ship an unresolvable specifier unnoticed.
    assert.deepStrictEqual(survivingSpecifierStrings(dest), []);
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

  // The two regexes this replaced matched raw text, so prose shaped like
  // `from "@/..."` inside a comment or literal was silently rewritten.
  describe("rewriteImports distinguishes code from text", () => {
    const FROM = "engine/render/render-component.ts";

    test("a line comment containing a specifier shape is byte-identical", () => {
      const source = `// see from "@/engine/types"\nconst x = 1;\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
    });

    test("a block comment containing a specifier shape is byte-identical", () => {
      const source = `/* from "@/engine/types" */\nconst x = 1;\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
    });

    test("string literals containing specifier shapes are byte-identical", () => {
      const source =
        `const a = "from '@/engine/types'";\n` +
        `const b = 'import "tsyntax"';\n` +
        "const c = `from \"@/engine/types\"`;\n";
      assert.strictEqual(rewriteImports(source, FROM), source);
    });

    test("a real static import still rewrites", () => {
      const out = rewriteImports(
        `import { engine } from "@/engine/index";\n`,
        FROM,
      );
      assert.strictEqual(out, `import { engine } from "../index.ts";\n`);
    });

    test("a real side-effect import of tsyntax still rewrites", () => {
      const out = rewriteImports(`import "tsyntax";\n`, FROM);
      assert.strictEqual(out, `import "../../tsyntax/index.ts";\n`);
    });

    test("a multi-line named import still rewrites", () => {
      const source = `import {\n  a,\n  b,\n} from "@/engine/types";\n`;
      const out = rewriteImports(source, FROM);
      assert.strictEqual(
        out,
        `import {\n  a,\n  b,\n} from "../types.ts";\n`,
      );
    });

    test("an export ... from still rewrites", () => {
      const out = rewriteImports(`export { x } from "@/engine/types";\n`, FROM);
      assert.strictEqual(out, `export { x } from "../types.ts";\n`);
    });

    test("a non-specifier string keeps its contents untouched", () => {
      const source = `const label = "@/engine/types";\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
    });

    test("a dynamic import specifier rewrites to the mirrored relative path", () => {
      const out = rewriteImports(
        `export const load = () => import("@/engine/render/escape");\n`,
        FROM,
      );
      assert.strictEqual(
        out,
        `export const load = () => import("./escape.ts");\n`,
      );
    });

    test("a dynamic import with attributes rewrites only the specifier", () => {
      const out = rewriteImports(
        `await import("@/engine/render/escape", { with: { type: "json" } });\n`,
        FROM,
      );
      assert.strictEqual(
        out,
        `await import("./escape.ts", { with: { type: "json" } });\n`,
      );
    });

    test("a dynamic import of tsyntax rewrites too", () => {
      const out = rewriteImports(`import("tsyntax");\n`, FROM);
      assert.strictEqual(out, `import("../../tsyntax/index.ts");\n`);
    });

    test("import.meta is not a dynamic import", () => {
      const source = `const url = import.meta.url;\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
    });

    test("a call to a function whose name is a keyword is left alone", () => {
      const source = `const x = foo("@/engine/types");\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
    });
  });

  // The rewriter's contract, checked against the TypeScript lexer rather than
  // against the rewriter itself: a change is legal only inside a module
  // specifier string literal.
  describe("rewriteImports changes only specifier bytes", () => {
    const FROM = "engine/render/render-component.ts";

    test("a real rewrite touches only specifier positions", () => {
      const before =
        `// from "@/engine/types" stays prose\n` +
        `import { a } from "@/engine/types";\n` +
        `export const label = "from '@/engine/types'";\n` +
        `export const load = () => import("@/engine/render/escape");\n` +
        `await import("@/engine/render/escape", { with: { type: "json" } });\n`;
      const after = rewriteImports(before, FROM);
      assert.notStrictEqual(after, before);
      assertRewritesOnlySpecifiers(before, after);
    });

    test("the guard fails when a comment is rewritten", () => {
      assert.throws(
        () =>
          assertRewritesOnlySpecifiers(
            `// from "@/engine/types"\n`,
            `// from "../types.ts"\n`,
          ),
        /not a module specifier/,
      );
    });

    test("the guard fails when a non-specifier string is rewritten", () => {
      assert.throws(
        () =>
          assertRewritesOnlySpecifiers(
            `const label = "from '@/engine/types'";\n`,
            `const label = "from '../types.ts'";\n`,
          ),
        /not a module specifier/,
      );
    });
  });
});

describe("shast add: dynamic import fixture", () => {
  test("await import(\"@/engine/render/escape\") vendors to a relative path with no surviving @/", () => {
    const dest = tempDest();
    const fixture = mkdtempSync(path.join(os.tmpdir(), "shast-dynamic-src-"));
    process.on("exit", () => rmSync(fixture, { recursive: true, force: true }));
    const write = (rel: string, content: string): void => {
      const abs = path.join(fixture, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    };
    write("src/engine/render/escape.ts", `export const escape = 1;\n`);
    write("src/types.ts", `export type Placeholder = 1;\n`);
    write(
      "src/index.ts",
      `export const load = async (): Promise<unknown> =>\n` +
        `  await import("@/engine/render/escape");\n`,
    );
    // planVendor walks every copy directory; they are allowed to be empty.
    write("src/css/.keep", "");
    write("src/html/.keep", "");

    add({
      dest,
      sourceRoot: fixture,
      tsyntaxSourceRoot: resolveTsyntaxSourceRoot(REPO_ROOT),
    });

    const entry = read(dest, "index.ts");
    assert.ok(
      entry.includes('import("./engine/render/escape.ts")'),
      `expected the dynamic specifier to be rewritten, got: ${entry}`,
    );
    assert.deepStrictEqual(survivingSpecifierStrings(dest), []);
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

/**
 * A scratch ESM project with an optional tsconfig, used to exercise the
 * tsconfig reconciliation `main` performs after vendoring.
 */
function tempProject(tsconfig?: string): {
  dest: string;
  tsconfigPath: string;
} {
  const root = mkdtempSync(path.join(os.tmpdir(), "shast-allow-imports-"));
  process.on("exit", () => rmSync(root, { recursive: true, force: true }));
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ type: "module" }),
  );
  const tsconfigPath = path.join(root, "tsconfig.json");
  if (tsconfig !== undefined) writeFileSync(tsconfigPath, tsconfig);
  return { dest: path.join(root, "shast"), tsconfigPath };
}

interface CapturedRun {
  code: number;
  stdout: string[];
  stderr: string[];
}

/** Run `main` with console output captured, so silence can be asserted. */
function runMain(
  argv: readonly string[],
  options?: Parameters<typeof main>[1],
): CapturedRun {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (value: unknown) => {
    stdout.push(String(value));
  };
  console.error = (value: unknown) => {
    stderr.push(String(value));
  };
  try {
    return { code: main(argv, options), stdout, stderr };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function runText(run: CapturedRun): string {
  return [...run.stdout, ...run.stderr].join("\n");
}

function readBytes(file: string): Buffer {
  return readFileSync(file);
}

describe("shast add: allowImportingTsExtensions reconciliation", () => {
  test("a correct config is left alone, silently", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "allowImportingTsExtensions": true, "noEmit": true } }\n`,
    );
    const before = readBytes(tsconfigPath);

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.ok(before.equals(readBytes(tsconfigPath)));
    assert.ok(!runText(run).includes("allowImportingTsExtensions"));
    assert.ok(!runText(run).includes("tsconfig"));
  });

  test("--yes adds the option and preserves comments and formatting", () => {
    const { dest, tsconfigPath } = tempProject(
      `{
  // keep this comment
  "compilerOptions": {
    // the consumer's emit decision
    "noEmit": true,
  },
}
`,
    );

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    const edited = readFileSync(tsconfigPath, "utf8");
    assert.match(edited, /"allowImportingTsExtensions": true/);
    assert.match(edited, /\/\/ keep this comment/);
    assert.match(edited, /\/\/ the consumer's emit decision/);
    assert.match(edited, /"noEmit": true/);
    // Exactly one insertion, not one per run.
    assert.strictEqual(edited.match(/"allowImportingTsExtensions"/g)?.length, 1);
  });

  test("a second run reports nothing about the config", () => {
    const { dest } = tempProject(`{ "compilerOptions": { "noEmit": true } }\n`);
    runMain(["add", dest, "--yes"]);

    const run = runMain(["add", dest, "--force", "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.ok(!runText(run).includes("allowImportingTsExtensions"));
    assert.ok(!runText(run).includes("tsconfig"));
  });

  test("an emitting config is reported and left byte-identical", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "outDir": "dist" } }\n`,
    );
    const before = readBytes(tsconfigPath);

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 1);
    assert.ok(before.equals(readBytes(tsconfigPath)));
    assert.match(runText(run), /emitDeclarationOnly/);
    assert.match(runText(run), /did not change it/);
  });

  test("noEmit: false is treated as emitting", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": false } }\n`,
    );
    const before = readBytes(tsconfigPath);

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 1);
    assert.ok(before.equals(readBytes(tsconfigPath)));
  });

  test("emitDeclarationOnly: true is fixable", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "emitDeclarationOnly": true } }\n`,
    );

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.match(
      readFileSync(tsconfigPath, "utf8"),
      /"allowImportingTsExtensions": true/,
    );
  });

  test("a relative extends chain is resolved", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "extends": "./tsconfig.base.json", "compilerOptions": { "strict": true } }\n`,
    );
    const basePath = path.join(path.dirname(tsconfigPath), "tsconfig.base.json");
    writeFileSync(basePath, `{ "compilerOptions": { "noEmit": true } }\n`);
    const baseBefore = readBytes(basePath);

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.match(
      readFileSync(tsconfigPath, "utf8"),
      /"allowImportingTsExtensions": true/,
    );
    // The extended config is read, never edited.
    assert.ok(baseBefore.equals(readBytes(basePath)));
  });

  test("an inline compilerOptions object is edited without reformatting", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": true } }\n`,
    );

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.strictEqual(
      readFileSync(tsconfigPath, "utf8"),
      `{ "compilerOptions": { "allowImportingTsExtensions": true, "noEmit": true } }\n`,
    );
  });

  test("an existing false value is replaced, not duplicated", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": true, "allowImportingTsExtensions": false } }\n`,
    );

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    const edited = readFileSync(tsconfigPath, "utf8");
    assert.strictEqual(edited.match(/"allowImportingTsExtensions"/g)?.length, 1);
    assert.match(edited, /"allowImportingTsExtensions": true/);
  });

  test("no tsconfig prints the required options and creates none", () => {
    const { dest, tsconfigPath } = tempProject();

    const run = runMain(["add", dest, "--yes"]);

    assert.strictEqual(run.code, 0);
    assert.ok(!existsSync(tsconfigPath));
    assert.match(runText(run), /allowImportingTsExtensions/);
    assert.match(runText(run), /noEmit/);
  });

  test("non-interactive without --yes edits nothing and exits 1", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": true } }\n`,
    );
    const before = readBytes(tsconfigPath);

    const run = runMain(["add", dest], { interactive: false });

    assert.strictEqual(run.code, 1);
    assert.ok(before.equals(readBytes(tsconfigPath)));
    assert.match(runText(run), /compilerOptions/);
    assert.match(runText(run), /left unchanged/);
  });

  test("interactive decline edits nothing and exits 1", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": true } }\n`,
    );
    const before = readBytes(tsconfigPath);

    const run = runMain(["add", dest], {
      interactive: true,
      confirm: () => false,
    });

    assert.strictEqual(run.code, 1);
    assert.ok(before.equals(readBytes(tsconfigPath)));
  });

  test("interactive consent edits and exits 0", () => {
    const { dest, tsconfigPath } = tempProject(
      `{ "compilerOptions": { "noEmit": true } }\n`,
    );

    const run = runMain(["add", dest], {
      interactive: true,
      confirm: () => true,
    });

    assert.strictEqual(run.code, 0);
    assert.match(
      readFileSync(tsconfigPath, "utf8"),
      /"allowImportingTsExtensions": true/,
    );
  });
});
