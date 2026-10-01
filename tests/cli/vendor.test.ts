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
import { createScanner, LanguageVariant, SyntaxKind } from "typescript/unstable/ast";
import {
  add,
  CommonJSDestinationError,
  detectPackageManager,
  ExistingDestinationError,
  installCommand,
  main,
  rewriteImports,
  tsyntaxRange,
  type RunResult,
} from "../../scripts/cli.ts";

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
 * Every string literal in the vendored `.ts` files that still holds an
 * unresolved `@/` path. A bare `tsyntax` specifier is expected and resolves
 * from node_modules, so it is not an offender. The lexer skips comments, so
 * prose is not mistaken for a specifier; a dynamic `import("@/...")` is a
 * literal and is.
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
        if (token.value.includes("@/")) {
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
  test("copies engine, css, html and types, but not tsyntax", () => {
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
      "index.ts",
    ]) {
      assert.ok(existsSync(path.join(dest, rel)), `expected ${rel} to exist`);
    }

    // tsyntax is installed as a package now, never copied into the tree.
    assert.ok(!existsSync(path.join(dest, "tsyntax")), "expected no tsyntax/");

    // The tree carries no generated package.json: the module format is the
    // consumer's to declare, and `add` refuses a CommonJS destination outright.
    assert.ok(!existsSync(path.join(dest, "package.json")));
    assert.ok(!existsSync(path.join(dest, "env.d.ts")));

    // No docs, tests, evals or resolved-format leakage.
    for (const absent of ["docs", "tests", "evals", "resolved-format", "examples"]) {
      assert.ok(!existsSync(path.join(dest, absent)), `expected no ${absent}/`);
    }
  });
});

describe("shast add: tier selection", () => {
  for (const tier of VARIANTS) {
    test(`--tier ${tier} vendors only ${tier}.ts for every variation family`, () => {
      const dest = tempDest();
      add({ dest, tier });

      for (const dir of VARIATION_DIRS) {
        for (const variant of VARIANTS) {
          const rel = `${dir}/${variant}.ts`;
          if (variant === tier) {
            assert.ok(existsSync(path.join(dest, rel)), `expected ${rel}`);
          } else {
            assert.ok(!existsSync(path.join(dest, rel)), `expected no ${rel}`);
          }
        }
      }

      // The generated entry imports only the chosen tier's variation files.
      const entry = read(dest, "index.ts");
      for (const dir of VARIATION_DIRS) {
        assert.ok(
          entry.includes(`"./${dir}/${tier}.ts"`),
          `entry should import ${dir}/${tier}.ts`,
        );
        for (const other of VARIANTS) {
          if (other === tier) continue;
          assert.ok(
            !entry.includes(`"./${dir}/${other}.ts"`),
            `entry should not import ${dir}/${other}.ts`,
          );
        }
      }
    });
  }

  test("omitting --tier vendors common only", () => {
    const dest = tempDest();
    add({ dest });

    for (const dir of VARIATION_DIRS) {
      assert.ok(existsSync(path.join(dest, `${dir}/common.ts`)));
      assert.ok(!existsSync(path.join(dest, `${dir}/minimal.ts`)));
      assert.ok(!existsSync(path.join(dest, `${dir}/full.ts`)));
    }
    assert.ok(
      read(dest, "index.ts").includes('"./html/tag-config/variations/common.ts"'),
    );
  });

  test("switching tiers prunes the stale tier and regenerates the entry", () => {
    const dest = tempDest();
    add({ dest, tier: "full" });
    // Simulate a tree vendored before tiers existed: the old barrel sat at the
    // root. The generated entry now replaces it, rather than being pruned.
    writeFileSync(path.join(dest, "index.ts"), "// old vendored barrel\n");

    const result = add({ dest, tier: "common", force: true });

    for (const dir of VARIATION_DIRS) {
      assert.ok(
        existsSync(path.join(dest, `${dir}/common.ts`)),
        `expected ${dir}/common.ts`,
      );
      assert.ok(
        !existsSync(path.join(dest, `${dir}/full.ts`)),
        `expected no ${dir}/full.ts`,
      );
      assert.ok(
        !existsSync(path.join(dest, `${dir}/minimal.ts`)),
        `expected no ${dir}/minimal.ts`,
      );
      assert.ok(
        result.removed.includes(`${dir}/full.ts`),
        `removed should name ${dir}/full.ts`,
      );
    }
    assert.ok(existsSync(path.join(dest, "index.ts")));
    assert.ok(
      read(dest, "index.ts").includes('"./html/tag-config/variations/common.ts"'),
    );
    assert.ok(!result.removed.includes("index.ts"));
  });

  test("--no-entry omits the entry and prunes an old root barrel", () => {
    const dest = tempDest();
    add({ dest, tier: "full" });
    writeFileSync(path.join(dest, "index.ts"), "// old vendored barrel\n");

    const result = add({ dest, tier: "full", noEntry: true, force: true });

    assert.ok(!existsSync(path.join(dest, "index.ts")));
    assert.ok(result.removed.includes("index.ts"));
    assert.ok(!result.written.includes("index.ts"));
  });
});

describe("shast add: generated entry", () => {
  test("wires the engine to the chosen tier's variation files", () => {
    const dest = tempDest();
    add({ dest, tier: "minimal" });

    const entry = read(dest, "index.ts");
    assert.ok(entry.includes('import engine from "./engine/index.ts"'));
    assert.ok(
      entry.includes(
        'import { cssPropertiesConfig } from "./css/properties-config/index.ts"',
      ),
    );
    assert.ok(entry.includes('import { SUPPORTED_KEYWORDS } from "tsyntax"'));
    for (const dir of VARIATION_DIRS) {
      assert.ok(entry.includes(`"./${dir}/minimal.ts"`), dir);
    }
    assert.ok(
      entry.includes("const { createComponent, renderComponent } = engine({"),
    );
    assert.ok(entry.includes('renderComponent(comp)'));
    // The generated file authors relative specifiers; it never needs rewriting.
    assert.ok(!entry.includes("@/"));
  });

  test("--no-entry writes no index.ts", () => {
    const dest = tempDest();
    add({ dest, noEntry: true });

    assert.ok(!existsSync(path.join(dest, "index.ts")));
    assert.ok(!read(dest, "types.ts").includes("index.ts"));
  });
});

describe("shast add: import rewriting", () => {
  test("no vendored file keeps a @/ string literal", () => {
    const dest = tempDest();
    add({ dest });

    // Anchored on every string literal rather than a `from "..."` grep: the
    // grep's shape is a blind spot for `import("@/...")`, which shares no
    // `from` and would ship an unresolvable specifier unnoticed.
    assert.deepStrictEqual(survivingSpecifierStrings(dest), []);
  });

  test("rewrites @/ specifiers and keeps bare tsyntax untouched", () => {
    const dest = tempDest();
    add({ dest });

    const engineIndex = read(dest, "engine/index.ts");
    assert.ok(
      engineIndex.includes('from "tsyntax"'),
      "engine keeps the bare tsyntax specifier",
    );
    assert.ok(
      engineIndex.includes('from "../css/attribute-config/types.ts"'),
      "engine imports a mirrored @/ target",
    );

    const types = read(dest, "types.ts");
    assert.ok(types.includes('from "./css/syntax-config/types.ts"'));
    assert.ok(types.includes('from "tsyntax"'));

    // A deeply nested file resolves up to the root, and leaves tsyntax bare.
    const calC = read(dest, "css/calc.ts");
    assert.ok(calC.includes('from "./properties-config/types.ts"'));
    assert.ok(calC.includes('from "tsyntax"'));
    assert.ok(!calC.includes('from "../tsyntax/index.ts"'));
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

    test("a side-effect import of tsyntax is left bare", () => {
      const source = `import "tsyntax";\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
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

    test("a dynamic import of tsyntax is left bare", () => {
      const source = `import("tsyntax");\n`;
      assert.strictEqual(rewriteImports(source, FROM), source);
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
    write(
      "src/engine/render/escape.ts",
      `export const escape = 1;\n` +
        `export const load = async (): Promise<unknown> =>\n` +
        `  await import("@/engine/render/render-component");\n`,
    );
    write("src/types.ts", `export type Placeholder = 1;\n`);
    // planVendor walks every copy directory; they are allowed to be empty.
    write("src/css/.keep", "");
    write("src/html/.keep", "");

    add({ dest, sourceRoot: fixture });

    const escape = read(dest, "engine/render/escape.ts");
    assert.ok(
      escape.includes('import("./render-component.ts")'),
      `expected the dynamic specifier to be rewritten, got: ${escape}`,
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
    assert.ok(!existsSync(path.join(dest, "types.ts")));
  });

  test("an unknown --tier value is rejected before anything is written", () => {
    const dest = tempDest();
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.strictEqual(main(["add", dest, "--tier", "bogus"]), 2);
    } finally {
      console.error = originalError;
    }
    assert.ok(!existsSync(path.join(dest, "types.ts")));
    assert.ok(!existsSync(path.join(dest, "engine")));
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
    assert.ok(!existsSync(path.join(dest, "types.ts")));
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
    assert.ok(result.written.includes("types.ts"));
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
        assert.ok(error.collisions.includes("types.ts"));
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
    assert.ok(result.written.includes("types.ts"));
    // The rewrite still applies on overwrite.
    assert.ok(!read(dest, "engine/index.ts").includes('"@/'));
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
  // tsyntax is declared so these tests exercise the tsconfig reconciliation,
  // not the tsyntax install (which `main` runs first).
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ type: "module", dependencies: { tsyntax: "^1.0.1" } }),
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

/** A package-manager runner that records calls and succeeds. */
function recordingRunner(result: RunResult = { status: 0 }): {
  run: (command: string, args: readonly string[], cwd: string) => RunResult;
  calls: { command: string; args: readonly string[]; cwd: string }[];
} {
  const calls: { command: string; args: readonly string[]; cwd: string }[] = [];
  return {
    calls,
    run: (command, args, cwd) => {
      calls.push({ command, args, cwd });
      return result;
    },
  };
}

/**
 * Run `main` with console output captured, so silence can be asserted. The
 * defaults consent to installing tsyntax and stub the runner, so a test that
 * only cares about vendoring never prompts or shells out; tests that exercise
 * the install override `run`/`confirm`/`interactive` explicitly.
 */
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
  const resolved = {
    interactive: true,
    confirm: () => true,
    run: () => ({ status: 0 }),
    ...options,
  };
  try {
    return { code: main(argv, resolved), stdout, stderr };
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

describe("shast add: --force replacement report", () => {
  const EDITED = "html/tag-config/variations/common.ts";

  test("names a replaced file whose bytes differ", () => {
    const dest = tempDest();
    add({ dest });
    writeFileSync(
      path.join(dest, EDITED),
      `${read(dest, EDITED)}\n// local tweak\n`,
    );

    const run = runMain(["add", dest, "--force"]);
    const text = runText(run);

    assert.strictEqual(run.code, 0);
    assert.match(
      text,
      /--force replaced \d+ pre-existing file\(s\); 1 differed from the incoming bytes\./,
    );
    assert.ok(text.includes(EDITED), `expected ${EDITED} in:\n${text}`);
    // --force still overwrites: the tweak is gone.
    assert.ok(!read(dest, EDITED).includes("local tweak"));
  });

  test("reports zero differing over an identical tree", () => {
    const dest = tempDest();
    add({ dest });

    const run = runMain(["add", dest, "--force"]);

    assert.strictEqual(run.code, 0);
    assert.match(
      runText(run),
      /--force replaced \d+ pre-existing file\(s\); 0 differed from the incoming bytes\./,
    );
  });

  test("a first-time add prints no replacement report", () => {
    const dest = tempDest();

    const run = runMain(["add", dest]);

    assert.strictEqual(run.code, 0);
    const text = runText(run);
    assert.ok(!text.includes("--force replaced"));
    assert.ok(!text.includes("differed"));
  });

  test("the differing list is bounded and summarises the remainder", () => {
    const dest = tempDest();
    add({ dest });
    // Edit every vendored file so the whole tree diverges.
    for (const entry of readdirSync(dest, {
      recursive: true,
      encoding: "utf8",
    })) {
      if (!entry.endsWith(".ts")) continue;
      const file = path.join(dest, entry);
      writeFileSync(file, `${readFileSync(file, "utf8")}\n// tweak\n`);
    }

    const run = runMain(["add", dest, "--force"]);
    const text = runText(run);

    assert.strictEqual(run.code, 0);
    const listed = text.split("\n").filter((line) => /^ {2}\S+\.ts$/.test(line));
    assert.ok(listed.length <= 10, `listed ${listed.length} paths`);
    assert.match(text, /and \d+ more/);
  });

  test("without --force an edited tree still refuses and reports no differences", () => {
    const dest = tempDest();
    add({ dest });
    writeFileSync(path.join(dest, EDITED), "// edited\n");

    const run = runMain(["add", dest]);

    assert.strictEqual(run.code, 1);
    const text = runText(run);
    assert.match(text, /Destination already contains/);
    assert.match(text, /refused to overwrite/);
    assert.ok(!text.includes("differed"));
  });

  test("add() exposes the replaced and differing sets", () => {
    const dest = tempDest();
    add({ dest });
    writeFileSync(path.join(dest, EDITED), "// edited\n");

    const result = add({ dest, force: true });

    assert.deepStrictEqual(result.replacedDiffering, [EDITED]);
    assert.ok(result.replaced.length > 1);
    assert.ok(!result.replacedDiffering.includes("types.ts"));
  });
});

/** An empty scratch directory, for package-manager detection fixtures. */
function tempPackage(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "shast-pm-test-"));
  process.on("exit", () => rmSync(root, { recursive: true, force: true }));
  return root;
}

describe("shast add: package manager detection", () => {
  test("an explicit override wins over every signal", () => {
    const dir = tempPackage();
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@9.0.0" }),
    );
    writeFileSync(path.join(dir, "yarn.lock"), "");
    assert.strictEqual(detectPackageManager(dir, "bun"), "bun");
  });

  test("the packageManager field is read", () => {
    const dir = tempPackage();
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ packageManager: "yarn@4.0.0" }),
    );
    assert.strictEqual(detectPackageManager(dir), "yarn");
  });

  test("each lockfile maps to its manager", () => {
    for (const [file, expected] of [
      ["pnpm-lock.yaml", "pnpm"],
      ["yarn.lock", "yarn"],
      ["bun.lockb", "bun"],
      ["bun.lock", "bun"],
      ["package-lock.json", "npm"],
      ["npm-shrinkwrap.json", "npm"],
    ] as const) {
      const dir = tempPackage();
      writeFileSync(path.join(dir, file), "");
      assert.strictEqual(detectPackageManager(dir), expected, file);
    }
  });

  test("the packageManager field beats a lockfile", () => {
    const dir = tempPackage();
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@9.0.0" }),
    );
    writeFileSync(path.join(dir, "yarn.lock"), "");
    assert.strictEqual(detectPackageManager(dir), "pnpm");
  });

  test("npm_config_user_agent is the last resort before npm", () => {
    const dir = tempPackage();
    const saved = process.env["npm_config_user_agent"];
    try {
      process.env["npm_config_user_agent"] = "bun/1.0.0 npm/? node/v20.0.0";
      assert.strictEqual(detectPackageManager(dir), "bun");
      delete process.env["npm_config_user_agent"];
      assert.strictEqual(detectPackageManager(dir), "npm");
    } finally {
      if (saved === undefined) delete process.env["npm_config_user_agent"];
      else process.env["npm_config_user_agent"] = saved;
    }
  });
});

describe("shast add: install command", () => {
  test("maps each manager to its add command", () => {
    assert.deepStrictEqual(installCommand("npm", "^1.0.1"), {
      command: "npm",
      args: ["install", "tsyntax@^1.0.1"],
    });
    assert.deepStrictEqual(installCommand("pnpm", "^1.0.1"), {
      command: "pnpm",
      args: ["add", "tsyntax@^1.0.1"],
    });
    assert.deepStrictEqual(installCommand("yarn", "^1.0.1"), {
      command: "yarn",
      args: ["add", "tsyntax@^1.0.1"],
    });
    assert.deepStrictEqual(installCommand("bun", "^1.0.1"), {
      command: "bun",
      args: ["add", "tsyntax@^1.0.1"],
    });
  });

  test("the installed range is shast's own tsyntax dependency", () => {
    assert.match(tsyntaxRange(), /^\^?\d/);
  });
});

describe("shast add: tsyntax install", () => {
  test("--yes installs before writing the tree", () => {
    const dest = tempDest();
    const { run, calls } = recordingRunner();

    const result = runMain(
      ["add", dest, "--yes", "--package-manager", "npm"],
      { run },
    );

    assert.strictEqual(result.code, 0);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0]!.command, "npm");
    assert.deepStrictEqual(calls[0]!.args, [
      "install",
      `tsyntax@${tsyntaxRange()}`,
    ]);
    assert.strictEqual(calls[0]!.cwd, path.dirname(dest));
    assert.ok(existsSync(path.join(dest, "types.ts")));
  });

  test("detection feeds the install command", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-detect-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ type: "module", packageManager: "pnpm@9.0.0" }),
    );
    const dest = path.join(root, "shast");
    const { run, calls } = recordingRunner();

    const result = runMain(["add", dest, "--yes"], { run });

    assert.strictEqual(result.code, 0);
    assert.strictEqual(calls[0]!.command, "pnpm");
  });

  test("an interactive decline writes nothing", () => {
    const dest = tempDest();
    const { run, calls } = recordingRunner();

    const result = runMain(["add", dest], {
      run,
      interactive: true,
      confirm: () => false,
    });

    assert.strictEqual(result.code, 1);
    assert.strictEqual(calls.length, 0);
    assert.ok(!existsSync(path.join(dest, "types.ts")));
    assert.match(runText(result), /not installing tsyntax/);
  });

  test("non-interactive without --yes writes nothing", () => {
    const dest = tempDest();
    const { run, calls } = recordingRunner();

    const result = runMain(["add", dest], { run, interactive: false });

    assert.strictEqual(result.code, 1);
    assert.strictEqual(calls.length, 0);
    assert.ok(!existsSync(path.join(dest, "types.ts")));
    assert.match(runText(result), /--yes/);
  });

  test("--no-install skips the install and still writes", () => {
    const dest = tempDest();
    const { run, calls } = recordingRunner();

    const result = runMain(["add", dest, "--no-install"], { run });

    assert.strictEqual(result.code, 0);
    assert.strictEqual(calls.length, 0);
    assert.ok(existsSync(path.join(dest, "types.ts")));
    assert.match(runText(result), /tsyntax/);
  });

  test("a failing install writes nothing", () => {
    const dest = tempDest();
    const { run } = recordingRunner({ status: 1 });

    const result = runMain(["add", dest, "--yes"], { run });

    assert.strictEqual(result.code, 1);
    assert.ok(!existsSync(path.join(dest, "types.ts")));
    assert.ok(!existsSync(path.join(dest, "engine")));
  });

  test("a missing manager binary writes nothing", () => {
    const dest = tempDest();
    const { run } = recordingRunner({
      status: null,
      error: new Error("spawn npm ENOENT"),
    });

    const result = runMain(["add", dest, "--yes"], { run });

    assert.strictEqual(result.code, 1);
    assert.ok(!existsSync(path.join(dest, "types.ts")));
    assert.match(runText(result), /ENOENT/);
  });

  test("an already-declared tsyntax is not installed again", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "shast-declared-"));
    process.on("exit", () => rmSync(root, { recursive: true, force: true }));
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        type: "module",
        dependencies: { tsyntax: "^1.0.1" },
      }),
    );
    const dest = path.join(root, "shast");
    const { run, calls } = recordingRunner();

    const result = runMain(["add", dest], { run });

    assert.strictEqual(result.code, 0);
    assert.strictEqual(calls.length, 0);
    assert.ok(existsSync(path.join(dest, "types.ts")));
  });
});
