#!/usr/bin/env node
// Repo-local `shast` CLI. Today it has one subcommand, `add`, which vendors
// the engine, its config variations and the local tsyntax source into a
// consumer's tree, rewriting every import so the result is self-contained.
// The package's public entry point (`src/index.ts`) is copied as the tree's own
// `index.ts`; there is no generated entry.
//
// Run through the package script: `pnpm shast add [dest]`.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export interface AddOptions {
  /** Destination directory. Relative paths resolve against the cwd. */
  dest: string;
  /** Overwrite files that already exist in the destination. */
  force?: boolean;
  /** Repo root to copy `src/` from. Defaults to this worktree. */
  sourceRoot?: string;
  /** Directory holding tsyntax's `index.ts` and `types.ts`. Defaults to the resolved package. */
  tsyntaxSourceRoot?: string;
}

export interface AddResult {
  dest: string;
  /** Destination-relative paths that were written, sorted. */
  written: string[];
}

/** Thrown when the destination already holds files and `force` is not set. */
export class ExistingDestinationError extends Error {
  readonly collisions: readonly string[];

  constructor(collisions: readonly string[]) {
    super(
      `Destination already contains ${collisions.length} file(s); pass --force to overwrite:\n` +
        collisions.map((file) => `  ${file}`).join("\n"),
    );
    this.name = "ExistingDestinationError";
    this.collisions = collisions;
  }
}

// The seven families that carry shipped variation files. `css properties` is
// absent because that registry is assembled per-consumer (it holds *custom*
// properties, which have no shipped minimal/common/full form); the copied
// entry exports the `cssPropertiesConfig` builder for exactly that.

// `css/pseudo-class-config/variations/mimimal.ts` is a typo in the source tree.
// Vendoring normalizes it so the consumer gets a clean `minimal.ts`. Nothing in
// the engine imports it, but the copied `index.ts` does, so its import path
// changes with the rename.
const DEST_RENAMES: Readonly<Record<string, string>> = {
  "css/pseudo-class-config/variations/mimimal.ts":
    "css/pseudo-class-config/variations/minimal.ts",
};

// Directories under `src/` copied wholesale.
const COPY_DIRS = ["engine", "css", "html"] as const;
// Root-level `src/` files copied too. `index.ts` is the package's public entry
// point (a side-effect-free barrel) and becomes the vendored tree's entry.
const COPY_FILES = ["types.ts", "env.d.ts", "index.ts"] as const;
// tsyntax files vendored under `<dest>/tsyntax/`.
const TSYNTAX_FILES = ["index.ts", "types.ts"] as const;

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

interface PlannedFile {
  /** Absolute source path. */
  source: string;
  /** Destination-relative, posix path. */
  destRel: string;
  /** `src/`-relative source path used by `@/` rewriting, or null for tsyntax. */
  sourceRel: string | null;
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function destRelOf(sourceRel: string): string {
  return DEST_RENAMES[sourceRel] ?? sourceRel;
}

/**
 * Every file `add` writes, destination-relative and sorted. Pure: it reads the
 * source directories but writes nothing.
 */
export function planVendor(options: AddOptions): PlannedFile[] {
  const sourceRoot = options.sourceRoot ?? REPO_ROOT;
  const tsyntaxRoot =
    options.tsyntaxSourceRoot ?? resolveTsyntaxSourceRoot(sourceRoot);
  const srcRoot = path.join(sourceRoot, "src");

  const planned: PlannedFile[] = [];

  for (const dir of COPY_DIRS) {
    const absDir = path.join(srcRoot, dir);
    for (const entry of readdirSync(absDir, {
      recursive: true,
      encoding: "utf8",
    })) {
      const rel = toPosix(entry);
      if (!rel.endsWith(".ts")) continue;
      const sourceRel = `${dir}/${rel}`;
      planned.push({
        source: path.join(absDir, entry),
        destRel: destRelOf(sourceRel),
        sourceRel,
      });
    }
  }

  for (const file of COPY_FILES) {
    planned.push({
      source: path.join(srcRoot, file),
      destRel: destRelOf(file),
      sourceRel: file,
    });
  }

  for (const file of TSYNTAX_FILES) {
    planned.push({
      source: path.join(tsyntaxRoot, file),
      destRel: `tsyntax/${file}`,
      sourceRel: null,
    });
  }

  return planned.sort((a, b) => (a.destRel < b.destRel ? -1 : 1));
}

/** Resolve the installed `tsyntax` package to its source directory. */
export function resolveTsyntaxSourceRoot(sourceRoot: string): string {
  const require = createRequire(path.join(sourceRoot, "package.json"));
  const resolved = require.resolve("tsyntax");
  return path.dirname(resolved);
}

function relativeSpecifier(fromDestRel: string, toDestRel: string): string {
  let rel = path.posix.relative(path.posix.dirname(fromDestRel), toDestRel);
  if (rel === "") rel = path.posix.basename(toDestRel);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function rewriteSpecifier(
  specifier: string,
  fromDestRel: string,
  destRelOfTarget: (sourceRel: string) => string,
): string {
  if (specifier === "tsyntax") {
    return relativeSpecifier(fromDestRel, "tsyntax/index.ts");
  }
  if (specifier.startsWith("@/")) {
    let targetRel = destRelOfTarget(specifier.slice(2));
    if (path.posix.extname(targetRel) === "") targetRel += ".ts";
    return relativeSpecifier(fromDestRel, targetRel);
  }
  return specifier;
}

/**
 * Rewrite `@/...` and bare `tsyntax` specifiers in `source` to paths relative
 * to that file's mirrored destination location. Other specifiers (already
 * relative, or external packages such as `@total-typescript/ts-reset`) are
 * left untouched.
 */
export function rewriteImports(
  source: string,
  fromDestRel: string,
  destRelOfTarget: (sourceRel: string) => string = destRelOf,
): string {
  const rewrite = (specifier: string): string =>
    rewriteSpecifier(specifier, fromDestRel, destRelOfTarget);

  return source
    .replace(
      /(\bfrom\s*)(["'])([^"']+)\2/g,
      (_match, prefix: string, quote: string, specifier: string) =>
        `${prefix}${quote}${rewrite(specifier)}${quote}`,
    )
    .replace(
      /(\bimport\s*)(["'])([^"']+)\2/g,
      (_match, prefix: string, quote: string, specifier: string) =>
        `${prefix}${quote}${rewrite(specifier)}${quote}`,
    );
}

/**
 * Vendor the engine, every config variation and tsyntax into `dest`.
 *
 * Throws {@link ExistingDestinationError} when any planned file already exists
 * and `force` is not set. Returns the sorted list of written files.
 */
export function add(options: AddOptions): AddResult {
  const force = options.force ?? false;
  const dest = path.resolve(options.dest);
  const planned = planVendor(options);

  const collisions = planned
    .filter((file) => existsSync(path.join(dest, file.destRel)))
    .map((file) => file.destRel);

  if (collisions.length > 0 && !force) {
    throw new ExistingDestinationError(collisions);
  }

  for (const file of planned) {
    const content = rewriteImports(
      readFileSync(file.source, "utf8"),
      file.destRel,
      destRelOf,
    );
    const target = path.join(dest, file.destRel);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }

  return {
    dest,
    written: planned.map((file) => file.destRel),
  };
}

const USAGE = `Usage: pnpm shast add [dest] [--force]

Vendor shast's engine, config variations and tsyntax into a consumer tree.

  dest      destination directory (default: src/shast)
  --force   overwrite files that already exist in the destination`;

interface ParsedArgs {
  dest: string;
  force: boolean;
}

function parseAddArgs(args: readonly string[]): ParsedArgs {
  let dest = "src/shast";
  let force = false;
  let destSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === undefined) continue;
    if (token === "--force") {
      force = true;
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown option '${token}'`);
    } else if (destSeen) {
      throw new Error(`Unexpected extra argument '${token}'`);
    } else {
      dest = token;
      destSeen = true;
    }
  }

  return { dest, force };
}

export function main(argv: readonly string[]): number {
  const [subcommand, ...rest] = argv;

  if (subcommand === undefined || subcommand === "--help" || subcommand === "-h") {
    console.log(USAGE);
    return subcommand === undefined ? 2 : 0;
  }

  if (subcommand !== "add") {
    console.error(`shast: unknown subcommand '${subcommand}'\n\n${USAGE}`);
    return 2;
  }

  let parsed: ParsedArgs;
  try {
    parsed = parseAddArgs(rest);
  } catch (error) {
    console.error(`shast: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }

  try {
    const result = add(parsed);
    console.log(
      `Vendored shast into ${result.dest} — ${result.written.length} files.`,
    );
    return 0;
  } catch (error) {
    if (error instanceof ExistingDestinationError) {
      console.error(error.message);
      return 1;
    }
    console.error(
      `shast: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

const entrypoint =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (entrypoint) {
  process.exit(main(process.argv.slice(2)));
}
