#!/usr/bin/env node
// Repo-local `shast` CLI. Today it has one subcommand, `add`, which vendors
// the engine and one config-variation tier into a consumer's tree, rewriting
// every import so the result is self-contained, and installs the `tsyntax`
// package the vendored tree imports. The chosen tier is selected with `--tier`
// (default `common`); only that tier's variation files are written. `add` also
// generates a `<dest>/index.ts` that wires the engine to the chosen tier; pass
// `--no-entry` to skip it and import the engine and family entry points
// directly.
//
// Run through the package script: `pnpm shast add [dest] [--tier <tier>]`.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** The config-variation tier `add` vendors. Exactly one is written. */
export type Tier = "minimal" | "common" | "full";

export interface AddOptions {
  /** Destination directory. Relative paths resolve against the cwd. */
  dest: string;
  /** Config-variation tier to vendor. Defaults to `"common"`. */
  tier?: Tier;
  /** Overwrite files that already exist in the destination. */
  force?: boolean;
  /**
   * Skip the generated `<dest>/index.ts`. Defaults to false, so `add` writes a
   * wiring entry unless this is set.
   */
  noEntry?: boolean;
  /** Repo root to copy `src/` from. Defaults to this worktree. */
  sourceRoot?: string;
}

export interface AddResult {
  dest: string;
  /** Destination-relative paths that were written, sorted. */
  written: string[];
  /**
   * Destination-relative paths that already existed and were overwritten
   * (`--force` only; empty otherwise), sorted.
   */
  replaced: string[];
  /**
   * The subset of {@link replaced} whose previous bytes differed from the bytes
   * written this run, sorted. This is a byte comparison, not attribution: with
   * no stored baseline shast cannot tell a local edit from an upstream change,
   * and on a second update it over-reports.
   */
  replacedDiffering: string[];
  /**
   * Destination-relative shast-owned paths pruned because they belong to a
   * different tier than the one being vendored (or to the old root barrel),
   * sorted. There is no byte-comparison guard: backwards compatibility is not
   * required, so a stale file is removed outright.
   */
  removed: string[];
}

/** Thrown when the destination already holds files and `force` is not set. */
export class ExistingDestinationError extends Error {
  readonly collisions: readonly string[];

  constructor(collisions: readonly string[]) {
    const shown = collisions.slice(0, MAX_LISTED_FILES);
    const rest = collisions.length - shown.length;
    super(
      `Destination already contains ${collisions.length} file(s). ` +
        `Nothing was written; pass --force to overwrite.\n` +
        shown.map((file) => `  ${file}`).join("\n") +
        (rest > 0 ? `\n  ... and ${rest} more` : ""),
    );
    this.name = "ExistingDestinationError";
    this.collisions = collisions;
  }
}

/** How many collision paths to list before summarising the remainder. */
const MAX_LISTED_FILES = 10;

// Printed last, after the file list, because that is the line a user reads when
// a runner (pnpm, npm) appends its own "Command failed with exit code 1".
const REFUSED_HINT =
  "shast: refused to overwrite — re-run with --force to replace those files.";

/**
 * The report `--force` prints after it replaces pre-existing files: how many
 * were replaced, and which of them differed byte-for-byte from the bytes just
 * written. The list is bounded like the refusal's, so a wholesale divergence
 * cannot bury the count.
 *
 * "Differed" is deliberately not attribution. With no stored baseline the
 * comparison is exact only on the first update (one add generation exists, so
 * any divergence is local - an edit or a consumer-added file). On later updates
 * it over-reports: a file where only upstream changed still differs from the
 * incoming bytes and is listed. That is why the output says nothing about who
 * changed what.
 */
function formatReplacedReport(
  replaced: number,
  differing: readonly string[],
): string {
  const head =
    `shast: --force replaced ${replaced} pre-existing file(s); ` +
    `${differing.length} differed from the incoming bytes.`;
  if (differing.length === 0) return head;

  const shown = differing.slice(0, MAX_LISTED_FILES);
  const rest = differing.length - shown.length;
  return (
    head +
    "\n" +
    shown.map((file) => `  ${file}`).join("\n") +
    (rest > 0 ? `\n  ... and ${rest} more` : "") +
    "\n" +
    `shast: "differed" only means the file on disk was not the bytes shast is\n` +
    `  writing now; it does not say who changed it. With no stored baseline shast\n` +
    `  cannot tell a local edit from an upstream change.`
  );
}

// The seven families that carry shipped variation files. `css properties` is
// absent because that registry is assembled per-consumer (it holds *custom*
// properties, which have no shipped minimal/common/full form); the vendored
// `css/properties-config/index.ts` exports the `cssPropertiesConfig` builder
// for exactly that.

// Directories under `src/` copied wholesale, except for the config variations,
// which are filtered to the chosen tier.
const COPY_DIRS = ["engine", "css", "html"] as const;
// Root-level `src/` files copied too. `src/index.ts` is deliberately absent: it
// is a barrel re-exporting every tier of every family, so vendoring it would
// drag the unchosen tiers back into the program. The vendored tree has no
// barrel; the consumer imports the engine and family entry points directly.
const COPY_FILES = ["types.ts"] as const;

const TIERS = ["minimal", "common", "full"] as const;
const TIER_SET: ReadonlySet<string> = new Set(TIERS);
const DEFAULT_TIER: Tier = "common";

/** A shipped variation file, capturing its tier name. */
const VARIATION_FILE = /(?:^|\/)variations\/([^/]+)\.ts$/;

/**
 * Whether `rel` (relative to a COPY_DIRS root) is a shipped variation file for
 * a tier other than `tier`. Only the three known tier names count as
 * variations, so a differently-named file under a `variations/` directory is
 * kept rather than silently dropped.
 */
function isNonChosenVariation(rel: string, tier: Tier): boolean {
  const match = VARIATION_FILE.exec(rel);
  if (match === null) return false;
  const name = match[1]!;
  return TIER_SET.has(name) && name !== tier;
}

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * A file `add` writes. Either a copy of a source file (`source` set) or a
 * generated file with no source (`content` set). The two are mutually exclusive.
 */
type PlannedFile =
  | { source: string; destRel: string; content?: undefined }
  | { source?: undefined; destRel: string; content: string };

/**
 * The generated `<dest>/index.ts`: wires the engine to the chosen tier's
 * variation files and runs a minimal component. Every specifier is relative to
 * the destination root, so the file is self-contained and needs no rewriting.
 * The bare `tsyntax` specifier is left as-is; the package is installed on the
 * consumer side.
 */
export function generateEntry(tier: Tier): string {
  return `import engine from "./engine/index.ts";
import { cssPropertiesConfig } from "./css/properties-config/index.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import htmlTagConfig from "./html/tag-config/variations/${tier}.ts";
import htmlAttributesConfig from "./html/attribute-config/variations/${tier}.ts";
import cssSyntaxConfig from "./css/syntax-config/variations/${tier}.ts";
import cssAttributesConfig from "./css/attribute-config/variations/${tier}.ts";
import cssPseudoClassConfig from "./css/pseudo-class-config/variations/${tier}.ts";
import cssQueriesConfig from "./css/queries-config/variations/${tier}.ts";
import cssKeyframesConfig from "./css/keyframes-config/variations/${tier}.ts";

export const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig,
  htmlTagConfig,
  cssSyntaxConfig,
  cssAttributesConfig,
  cssPseudoClassConfig,
  cssPropertiesConfig: cssPropertiesConfig(
    SUPPORTED_KEYWORDS,
    cssSyntaxConfig,
    {},
  ),
  cssQueriesConfig,
  cssKeyframesConfig,
});

const comp = createComponent({
  tag: "div",
});

renderComponent(comp);
`;
}

/** Thrown when the destination would be resolved as CommonJS. */
export class CommonJSDestinationError extends Error {
  readonly dest: string;
  readonly nearestPackageJson: string | null;

  constructor(dest: string, nearestPackageJson: string | null) {
    super(
      `The vendored tree is ESM, but ${dest} would be resolved as CommonJS.\n` +
        (nearestPackageJson === null
          ? `  No package.json was found above ${dest}.\n`
          : `  The nearest package.json is ${nearestPackageJson}, which has no "type": "module".\n`) +
        `  Vendoring there gives every vendored file a TS1295 "cannot be written in\n` +
        `  a CommonJS file under 'verbatimModuleSyntax'" error when you run tsc.\n` +
        `\n` +
        `  Either vendor into an ESM subtree, or add {\n` +
        `    "type": "module"\n` +
        `  } to that package.json yourself.`,
    );
    this.name = "CommonJSDestinationError";
    this.dest = dest;
    this.nearestPackageJson = nearestPackageJson;
  }
}

/** The nearest `package.json` at or above `dir`, if any. */
function nearestPackageJson(dir: string): string | null {
  let current = path.resolve(dir);
  for (;;) {
    const candidate = path.join(current, "package.json");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Whether `dir` is resolved as ESM by the nearest `package.json`. */
export function resolvesAsESM(dir: string): boolean {
  const nearest = nearestPackageJson(dir);
  if (nearest === null) return false;
  try {
    const parsed: unknown = JSON.parse(readFileSync(nearest, "utf8"));
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { type?: unknown }).type === "module"
    );
  } catch {
    return false;
  }
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

/**
 * Every file `add` writes, destination-relative and sorted. Pure: it reads the
 * source directories but writes nothing.
 */
export function planVendor(options: AddOptions): PlannedFile[] {
  const sourceRoot = options.sourceRoot ?? REPO_ROOT;
  const srcRoot = path.join(sourceRoot, "src");
  const tier = options.tier ?? DEFAULT_TIER;

  const planned: PlannedFile[] = [];

  for (const dir of COPY_DIRS) {
    const absDir = path.join(srcRoot, dir);
    for (const entry of readdirSync(absDir, {
      recursive: true,
      encoding: "utf8",
    })) {
      const rel = toPosix(entry);
      if (!rel.endsWith(".ts")) continue;
      if (isNonChosenVariation(rel, tier)) continue;
      const destRel = `${dir}/${rel}`;
      planned.push({
        source: path.join(absDir, entry),
        destRel,
      });
    }
  }

  for (const file of COPY_FILES) {
    planned.push({
      source: path.join(srcRoot, file),
      destRel: file,
    });
  }

  // The generated entry joins the plan like any copied file, so an existing
  // consumer index.ts is a collision that only --force replaces.
  if (!(options.noEntry ?? false)) {
    planned.push({
      content: generateEntry(tier),
      destRel: "index.ts",
    });
  }

  return planned.sort((a, b) => (a.destRel < b.destRel ? -1 : 1));
}

/**
 * Destination-relative shast-owned paths a previous `add` may have left behind
 * and this run must prune: the two non-chosen tier files in every variation
 * directory the source walk visits. The root `index.ts` is pruned only under
 * `--no-entry`: with entry generation on it is a planned file, so an existing
 * `index.ts` is a collision the `--force` path reports and replaces instead.
 * Pure: it reads the source directories but writes nothing.
 */
export function planStale(options: AddOptions): string[] {
  const sourceRoot = options.sourceRoot ?? REPO_ROOT;
  const srcRoot = path.join(sourceRoot, "src");
  const tier = options.tier ?? DEFAULT_TIER;

  const variationDirs = new Set<string>();
  for (const dir of COPY_DIRS) {
    const absDir = path.join(srcRoot, dir);
    for (const entry of readdirSync(absDir, {
      recursive: true,
      encoding: "utf8",
    })) {
      const rel = toPosix(entry);
      if (!rel.endsWith(".ts")) continue;
      const match = VARIATION_FILE.exec(rel);
      if (match === null || !TIER_SET.has(match[1]!)) continue;
      variationDirs.add(`${dir}/${path.posix.dirname(rel)}`);
    }
  }

  const stale: string[] = [];
  // With entry generation on, index.ts is planned and handled by the collision
  // path; only `--no-entry` leaves an old barrel to prune.
  if (options.noEntry ?? false) stale.push("index.ts");
  for (const dir of variationDirs) {
    for (const candidate of TIERS) {
      if (candidate !== tier) stale.push(`${dir}/${candidate}.ts`);
    }
  }
  return stale.sort((a, b) => (a < b ? -1 : 1));
}

function relativeSpecifier(fromDestRel: string, toDestRel: string): string {
  let rel = path.posix.relative(path.posix.dirname(fromDestRel), toDestRel);
  if (rel === "") rel = path.posix.basename(toDestRel);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function rewriteSpecifier(specifier: string, fromDestRel: string): string {
  if (specifier.startsWith("@/")) {
    let targetRel = specifier.slice(2);
    if (path.posix.extname(targetRel) === "") targetRel += ".ts";
    return relativeSpecifier(fromDestRel, targetRel);
  }
  // A bare `tsyntax` specifier is left untouched: the package is installed on
  // the consumer side, so it resolves from node_modules like any dependency.
  return specifier;
}

/** Characters that make up an identifier-like token (`from`, `import`, ...). */
const WORD_CHAR = /[A-Za-z0-9_$]/;

/**
 * Whether the string literal the scanner is about to read sits in specifier
 * position. `lastWord` is the identifier most recently read in *code* position,
 * so a word inside a skipped comment or literal can never count. Only
 * whitespace may separate the keyword from the quote, matching the regex this
 * scan replaced.
 */
function isSpecifierPosition(lastWord: string): boolean {
  return lastWord === "from" || lastWord === "import";
}

/**
 * The index just past the string literal starting at `start` (a quote).
 * Backslash escapes are honoured, so `"a\"b"` is one literal. An unterminated
 * literal stops at the newline or end of input rather than swallowing the rest
 * of the file.
 */
function scanStringLiteral(source: string, start: number): number {
  const quote = source[start]!;
  if (quote === "`") return scanTemplateLiteral(source, start);
  let i = start + 1;
  while (i < source.length) {
    const char = source[i]!;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === quote) return i + 1;
    if (char === "\n") return i;
    i += 1;
  }
  return source.length;
}

/** The index just past the template literal starting at `start` (a backtick). */
function scanTemplateLiteral(source: string, start: number): number {
  let i = start + 1;
  while (i < source.length) {
    const char = source[i]!;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === "`") return i + 1;
    if (char === "$" && source[i + 1] === "{") {
      i = scanTemplateExpression(source, i + 2);
      continue;
    }
    i += 1;
  }
  return source.length;
}

/** Skip a `${ ... }` interpolation body; returns the index past its closing `}`. */
function scanTemplateExpression(source: string, start: number): number {
  let depth = 1;
  let i = start;
  while (i < source.length) {
    const char = source[i]!;
    if (char === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      i += 1;
      if (depth === 0) return i;
      continue;
    }
    if (char === "/" && source[i + 1] === "/") {
      const newline = source.indexOf("\n", i);
      i = newline === -1 ? source.length : newline;
      continue;
    }
    if (char === "/" && source[i + 1] === "*") {
      const close = source.indexOf("*/", i + 2);
      i = close === -1 ? source.length : close + 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      i = scanStringLiteral(source, i);
      continue;
    }
    i += 1;
  }
  return source.length;
}

/**
 * Rewrite `@/...` specifiers in `source` to paths relative to that file's
 * mirrored destination location. Other specifiers (already relative, bare
 * `tsyntax`, or external packages such as `@total-typescript/ts-reset`) are
 * left untouched.
 *
 * A hand-rolled scan - no parser, no dependency - so a specifier is rewritten
 * only in code position: line comments, block comments and string literals are
 * copied verbatim, and text inside them can never be mistaken for an import.
 * This replaces two global regexes that matched raw text and silently rewrote
 * prose shaped like `from "@/..."`.
 *
 * Static imports and exports (`from "..."`, side-effect `import "..."`) and the
 * argument of a dynamic `import("...")` call (including the `import("...", {
 * with: ... })` form) share the same mapping. A dynamic import is recognised by
 * the `import` keyword immediately before the argument list, so `import.meta`
 * and a call to some function named `import` are not candidates.
 */
export function rewriteImports(source: string, fromDestRel: string): string {
  const rewrite = (specifier: string): string =>
    rewriteSpecifier(specifier, fromDestRel);

  let result = "";
  let i = 0;
  // The identifier most recently read in code position, and whether the
  // character just read continued it. Comments and literals reset the word so
  // skipped text cannot masquerade as an import keyword.
  let lastWord = "";
  let inWord = false;
  // Set when the last significant code character was `(` and the word before it
  // was `import`, so the next string is a dynamic import's specifier argument.
  let dynamicImportParen = false;

  while (i < source.length) {
    const char = source[i]!;

    if (char === "/" && source[i + 1] === "/") {
      const newline = source.indexOf("\n", i);
      const stop = newline === -1 ? source.length : newline;
      result += source.slice(i, stop);
      i = stop;
      lastWord = "";
      inWord = false;
      dynamicImportParen = false;
      continue;
    }

    if (char === "/" && source[i + 1] === "*") {
      const close = source.indexOf("*/", i + 2);
      const stop = close === -1 ? source.length : close + 2;
      result += source.slice(i, stop);
      i = stop;
      lastWord = "";
      inWord = false;
      dynamicImportParen = false;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const end = scanStringLiteral(source, i);
      const closed = end > i + 1 && source[end - 1] === char;
      const literal = source.slice(i, end);
      // Only plain "..." / '...' specifiers were ever rewritten; a backtick is
      // not a module specifier, so its contents stay untouched.
      const specifierPosition =
        isSpecifierPosition(lastWord) || dynamicImportParen;
      if (char !== "`" && closed && specifierPosition) {
        const specifier = literal.slice(1, -1);
        const rewritten = rewrite(specifier);
        result +=
          rewritten === specifier ? literal : `${char}${rewritten}${char}`;
      } else {
        result += literal;
      }
      i = end;
      lastWord = "";
      inWord = false;
      dynamicImportParen = false;
      continue;
    }

    if (WORD_CHAR.test(char)) {
      lastWord = inWord ? lastWord + char : char;
      inWord = true;
      dynamicImportParen = false;
      result += char;
      i += 1;
      continue;
    }

    // Any other character ends a word; whitespace keeps it across the gap so
    // `from   "..."` still counts, and a `(` right after `import` opens a
    // dynamic import's argument list.
    if (char === "(" && lastWord === "import") dynamicImportParen = true;
    else if (!/\s/.test(char)) dynamicImportParen = false;
    if (!/\s/.test(char)) lastWord = "";
    inWord = false;
    result += char;
    i += 1;
  }

  return result;
}

/** What `preflight` resolves before any file is written. */
export interface AddPreflight {
  /** Absolute destination directory. */
  dest: string;
  /** Directory holding the consumer's nearest `package.json`. */
  packageDir: string;
  /** The consumer's nearest `package.json`. */
  packageJsonPath: string;
  /** Every file `add` would write. */
  planned: PlannedFile[];
  /** Planned files that already exist in the destination. */
  collisions: string[];
}

/**
 * Validate a destination without writing anything: `dest` must resolve as ESM,
 * and no planned file may already exist unless `force` is set. `main` runs this
 * before installing tsyntax, so a destination that would be refused never
 * mutates the consumer's dependencies.
 *
 * Throws {@link CommonJSDestinationError} when `dest` would be resolved as
 * CommonJS, and {@link ExistingDestinationError} when any planned file already
 * exists and `force` is not set.
 */
export function preflight(options: AddOptions): AddPreflight {
  const dest = path.resolve(options.dest);
  const packageJsonPath = nearestPackageJson(dest);

  if (!resolvesAsESM(dest)) {
    throw new CommonJSDestinationError(dest, packageJsonPath);
  }

  const planned = planVendor(options);
  const collisions = planned
    .map((file) => file.destRel)
    .filter((rel) => existsSync(path.join(dest, rel)));

  if (collisions.length > 0 && !(options.force ?? false)) {
    throw new ExistingDestinationError(collisions);
  }

  // resolvesAsESM returned true, so a package.json exists above `dest`.
  return {
    dest,
    packageDir: path.dirname(packageJsonPath!),
    packageJsonPath: packageJsonPath!,
    planned,
    collisions,
  };
}

/**
 * Vendor the engine and exactly one config-variation tier into `dest`, plus a
 * generated `<dest>/index.ts` entry unless `noEntry` is set.
 *
 * Throws {@link CommonJSDestinationError} when `dest` would be resolved as
 * CommonJS, and {@link ExistingDestinationError} when any planned file already
 * exists and `force` is not set. Returns the sorted list of written files, the
 * pre-existing files that were replaced and which of those differed, and the
 * stale shast-owned paths that were pruned.
 */
export function add(options: AddOptions): AddResult {
  const { dest, planned, collisions } = preflight(options);
  const copiedRels = planned.map((file) => file.destRel);

  // Reuse the refusal path's enumeration: the collisions are exactly the
  // pre-existing files `--force` is about to replace, so annotate them with
  // whether their bytes match what is being written.
  const collisionSet = new Set(collisions);
  const replaced: string[] = [];
  const replacedDiffering: string[] = [];

  for (const file of planned) {
    const content =
      file.content !== undefined
        ? file.content
        : rewriteImports(readFileSync(file.source, "utf8"), file.destRel);
    const target = path.join(dest, file.destRel);
    if (collisionSet.has(file.destRel)) {
      replaced.push(file.destRel);
      if (!readFileSync(target).equals(Buffer.from(content))) {
        replacedDiffering.push(file.destRel);
      }
    }
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }

  // Prune stale shast-owned paths after the collision check. There is no
  // byte-comparison guard: backwards compatibility is explicitly not required,
  // so the non-chosen tiers (and, under --no-entry, an old root barrel) are
  // removed outright.
  const removed: string[] = [];
  for (const rel of planStale(options)) {
    const target = path.join(dest, rel);
    if (existsSync(target)) {
      rmSync(target);
      removed.push(rel);
    }
  }

  return {
    dest,
    written: copiedRels.sort((a, b) => (a < b ? -1 : 1)),
    replaced,
    replacedDiffering,
    removed,
  };
}

// ---------------------------------------------------------------------------
// tsyntax installation
//
// The vendored tree imports `tsyntax` as a bare specifier, so the consumer must
// have the package installed. `add` does not copy tsyntax's source any more: it
// detects the consumer's package manager and runs that manager's add command.
// `main` runs the install before `add` writes anything, so a failed install
// leaves the destination untouched. Installing mutates the consumer's
// package.json, lockfile and node_modules, so it needs consent like the
// tsconfig edit: `--yes` consents, `--no-install` skips and prints the command,
// and an interactive run prompts.

/** The package managers `add` can install tsyntax with. */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const PACKAGE_MANAGERS: ReadonlySet<string> = new Set([
  "npm",
  "pnpm",
  "yarn",
  "bun",
]);

function isPackageManager(value: string): value is PackageManager {
  return PACKAGE_MANAGERS.has(value);
}

/** Read and parse a JSON object, or null when missing or unparsable. */
function readJsonObject(file: string): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  return isRecord(parsed) ? parsed : null;
}

/**
 * Detect the consumer's package manager. Precedence: an explicit override, the
 * `packageManager` field (Corepack), a lockfile in `packageDir`, the
 * `npm_config_user_agent` set by `npx`/`pnpm dlx`/`yarn dlx`/`bunx`, then npm.
 * Single package only: workspace roots are not considered.
 */
export function detectPackageManager(
  packageDir: string,
  explicit?: PackageManager,
): PackageManager {
  if (explicit !== undefined) return explicit;

  const declared = readJsonObject(path.join(packageDir, "package.json"))?.[
    "packageManager"
  ];
  if (typeof declared === "string") {
    const name = declared.split("@")[0] ?? "";
    if (isPackageManager(name)) return name;
  }

  if (existsSync(path.join(packageDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(packageDir, "yarn.lock"))) return "yarn";
  if (
    existsSync(path.join(packageDir, "bun.lockb")) ||
    existsSync(path.join(packageDir, "bun.lock"))
  ) {
    return "bun";
  }
  if (
    existsSync(path.join(packageDir, "package-lock.json")) ||
    existsSync(path.join(packageDir, "npm-shrinkwrap.json"))
  ) {
    return "npm";
  }

  const agent = process.env["npm_config_user_agent"];
  if (typeof agent === "string") {
    const name = agent.split("/")[0] ?? "";
    if (isPackageManager(name)) return name;
  }

  return "npm";
}

/** The manager's add command for `tsyntax@<range>`. */
export function installCommand(
  manager: PackageManager,
  range: string,
): { command: string; args: string[] } {
  const spec = `tsyntax@${range}`;
  switch (manager) {
    case "npm":
      return { command: "npm", args: ["install", spec] };
    case "pnpm":
      return { command: "pnpm", args: ["add", spec] };
    case "yarn":
      return { command: "yarn", args: ["add", spec] };
    case "bun":
      return { command: "bun", args: ["add", spec] };
  }
}

/**
 * The `tsyntax` range `add` installs, read from shast's own package.json so the
 * consumer gets exactly the version the vendored engine was built against.
 * Falls back to `latest` only if that dependency is somehow absent.
 */
export function tsyntaxRange(packageRoot: string = REPO_ROOT): string {
  const deps = readJsonObject(path.join(packageRoot, "package.json"))?.[
    "dependencies"
  ];
  const range = isRecord(deps) ? deps["tsyntax"] : undefined;
  return typeof range === "string" ? range : "latest";
}

/** The first version number in a range like `^1.0.1`, or null if there is none. */
function rangeMajor(range: string): string | null {
  return /(\d+)/.exec(range)?.[1] ?? null;
}

/** The range `packageJsonPath` declares for `name` under `dependencies`, if any. */
function declaredDependency(
  packageJsonPath: string,
  name: string,
): string | undefined {
  const deps = readJsonObject(packageJsonPath)?.["dependencies"];
  const value = isRecord(deps) ? deps[name] : undefined;
  return typeof value === "string" ? value : undefined;
}

/** The outcome of running a package-manager command. */
export interface RunResult {
  /** Exit status, or null when the process could not be spawned. */
  status: number | null;
  /** The spawn error, if any (e.g. the manager binary is missing). */
  error?: Error;
}

/** Runs a package-manager command. Injectable for tests. */
export type RunFunction = (
  command: string,
  args: readonly string[],
  cwd: string,
) => RunResult;

function defaultRun(
  command: string,
  args: readonly string[],
  cwd: string,
): RunResult {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  const outcome: RunResult = { status: result.status };
  if (result.error !== undefined) outcome.error = result.error;
  return outcome;
}

// ---------------------------------------------------------------------------
// tsconfig reconciliation
//
// The vendored tree is raw TypeScript source whose imports carry `.ts`
// extensions, so it only compiles when the consumer's tsconfig sets
// `allowImportingTsExtensions: true` - which TypeScript permits only alongside
// `noEmit: true` or `emitDeclarationOnly: true`. `add` writes into the
// consumer's project, so it is the right place to notice a config that would
// reject the tree. It must not edit one without consent, must never touch the
// consumer's emit settings, and must stay silent when the config is correct.
//
// Everything here is pure or reads files; the consent-gated write lives in
// `main`, because `add()` stays non-interactive.

/** The tsconfig state that decides what `shast add` reports after vendoring. */
export type TsconfigState =
  | { readonly kind: "none" }
  | { readonly kind: "ok"; readonly path: string }
  | { readonly kind: "fixable"; readonly path: string }
  | { readonly kind: "incompatible"; readonly path: string };

/** The nearest `tsconfig.json` at or above `dir`, if any. */
export function nearestTsconfig(dir: string): string | null {
  let current = path.resolve(dir);
  for (;;) {
    const candidate = path.join(current, "tsconfig.json");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Replace every comment character with a space, preserving both string contents
 * and the length of the input, so offsets into the result still address the
 * original text. Comment-aware: a `//` inside a string is not a comment.
 */
function maskJsonComments(text: string): string {
  const masked = text.split("");
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const char = text[i]!;
    if (inString) {
      if (char === "\\") {
        i += 2;
        continue;
      }
      if (char === '"') inString = false;
      i += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      i += 1;
      continue;
    }
    if (char === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") {
        masked[i] = " ";
        i += 1;
      }
      continue;
    }
    if (char === "/" && text[i + 1] === "*") {
      masked[i] = " ";
      masked[i + 1] = " ";
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] !== "\n") masked[i] = " ";
        i += 1;
      }
      if (i < text.length) {
        masked[i] = " ";
        masked[i + 1] = " ";
        i += 2;
      }
      continue;
    }
    i += 1;
  }
  return masked.join("");
}

/** Drop trailing commas before `}`/`]`, respecting strings. */
function stripTrailingCommas(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const char = text[i]!;
    if (inString) {
      result += char;
      if (char === "\\") {
        result += text[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (char === '"') inString = false;
      i += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      i += 1;
      continue;
    }
    if (char === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j]!)) j += 1;
      if (text[j] === "}" || text[j] === "]") {
        i += 1;
        continue;
      }
    }
    result += char;
    i += 1;
  }
  return result;
}

/**
 * Parse tsconfig-flavoured JSON: comments and trailing commas are tolerated.
 * No dependency is added - the masking and comma stripping are local, and the
 * result is handed to the built-in `JSON.parse`.
 */
function parseJsonc(text: string): unknown {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return JSON.parse(stripTrailingCommas(maskJsonComments(withoutBom))) as unknown;
}

/** Resolve a relative `extends` target to a readable file, or null. */
function resolveExtendedTsconfig(
  specifier: string,
  fromDir: string,
): string | null {
  // Only relative (and absolute) chains are resolved; a package specifier would
  // need node resolution, and the requirement is "where possible".
  if (!specifier.startsWith(".") && !path.isAbsolute(specifier)) return null;
  const base = path.resolve(fromDir, specifier);
  for (const candidate of [
    base,
    `${base}.json`,
    path.join(base, "tsconfig.json"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Merge the `compilerOptions` of a tsconfig with those it extends, parents
 * first so the nearest config wins. Unreadable or unparsable files contribute
 * nothing rather than failing the reconciliation.
 */
function resolveCompilerOptions(
  tsconfigPath: string,
  seen: Set<string>,
): Record<string, unknown> {
  let real: string;
  try {
    real = realpathSync(tsconfigPath);
  } catch {
    return {};
  }
  if (seen.has(real)) return {};
  seen.add(real);

  let parsed: unknown;
  try {
    parsed = parseJsonc(readFileSync(tsconfigPath, "utf8"));
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};

  let merged: Record<string, unknown> = {};
  const extended = parsed["extends"];
  const chain =
    typeof extended === "string"
      ? [extended]
      : Array.isArray(extended)
        ? extended.filter((entry): entry is string => typeof entry === "string")
        : [];
  for (const specifier of chain) {
    const resolved = resolveExtendedTsconfig(
      specifier,
      path.dirname(tsconfigPath),
    );
    if (resolved !== null) {
      merged = { ...merged, ...resolveCompilerOptions(resolved, seen) };
    }
  }

  const own = parsed["compilerOptions"];
  if (isRecord(own)) merged = { ...merged, ...own };
  return merged;
}

/**
 * Inspect the nearest tsconfig for `.ts`-extension import support. `undefined`
 * emit settings read as "emits JavaScript", which is TypeScript's default.
 */
export function inspectTsconfig(dir: string): TsconfigState {
  const found = nearestTsconfig(dir);
  if (found === null) return { kind: "none" };

  const options = resolveCompilerOptions(found, new Set());
  if (options["allowImportingTsExtensions"] === true) {
    return { kind: "ok", path: found };
  }
  const emitsDeclarationsOnly =
    options["noEmit"] === true || options["emitDeclarationOnly"] === true;
  return emitsDeclarationsOnly
    ? { kind: "fixable", path: found }
    : { kind: "incompatible", path: found };
}

const ALLOW_TS_EXTENSIONS_KEY = '"allowImportingTsExtensions"';

/** The `:`-value span of `key` at or after `from`, or null. */
function findValueSpan(
  masked: string,
  from: number,
  key: string,
): { start: number; end: number } | null {
  const keyIndex = masked.indexOf(key, from);
  if (keyIndex === -1) return null;
  const colon = masked.indexOf(":", keyIndex + key.length);
  if (colon === -1) return null;
  let start = colon + 1;
  while (start < masked.length && /\s/.test(masked[start]!)) start += 1;
  let end = start;
  while (end < masked.length && !/[},\]]/.test(masked[end]!)) end += 1;
  return { start, end };
}

/**
 * Add `"allowImportingTsExtensions": true` to `compilerOptions`, editing the
 * text in place so comments, indentation and member order survive. Throws when
 * there is no `compilerOptions` object to edit. Pure: the caller performs the
 * consent-gated write.
 */
export function addAllowImportingTsExtensions(source: string): string {
  const masked = maskJsonComments(source);
  const keyIndex = masked.indexOf('"compilerOptions"');
  const colon = keyIndex === -1 ? -1 : masked.indexOf(":", keyIndex);
  const open = colon === -1 ? -1 : masked.indexOf("{", colon);
  if (open === -1) {
    throw new Error('tsconfig has no "compilerOptions" object to edit');
  }

  // If the key already exists (but is not true) replace its value rather than
  // adding a duplicate, which JSON.parse would resolve to the later one.
  const existing = findValueSpan(masked, open, ALLOW_TS_EXTENSIONS_KEY);
  if (existing !== null) {
    return `${source.slice(0, existing.start)}true${source.slice(existing.end)}`;
  }

  const afterOpen = open + 1;
  const lead = /^[ \t\r\n]*/.exec(masked.slice(afterOpen))?.[0] ?? "";
  if (lead.includes("\n")) {
    const indent = lead.slice(lead.lastIndexOf("\n") + 1);
    return `${source.slice(0, afterOpen)}\n${indent}${ALLOW_TS_EXTENSIONS_KEY}: true,${source.slice(afterOpen)}`;
  }
  return `${source.slice(0, afterOpen)} ${ALLOW_TS_EXTENSIONS_KEY}: true,${source.slice(afterOpen)}`;
}

const REQUIRED_OPTIONS = `  "allowImportingTsExtensions": true
  "noEmit": true            (or "emitDeclarationOnly": true)`;

const MANUAL_CHANGE =
  'add "allowImportingTsExtensions": true to "compilerOptions"';

function noneMessage(dest: string): string {
  return (
    `shast: no tsconfig.json was found at or above ${dest}.\n` +
    `  The vendored tree is TypeScript source whose imports carry .ts extensions,\n` +
    `  which tsc rejects unless your tsconfig sets:\n` +
    `${REQUIRED_OPTIONS}\n` +
    `  No tsconfig was created - add the options to your own config.`
  );
}

function fixableMessage(tsconfigPath: string): string {
  return (
    `The vendored tree is TypeScript source whose imports carry .ts extensions\n` +
    `and is never emitted, so tsc needs "allowImportingTsExtensions": true.\n` +
    `${tsconfigPath} sets "noEmit"/"emitDeclarationOnly" but not that option, so\n` +
    `every vendored import fails to compile.`
  );
}

function incompatibleMessage(tsconfigPath: string): string {
  return (
    `shast: ${tsconfigPath} emits JavaScript (neither "noEmit": true nor\n` +
    `  "emitDeclarationOnly": true is set), which TypeScript refuses to combine\n` +
    `  with "allowImportingTsExtensions". The vendored tree is .ts-extension\n` +
    `  TypeScript source, so it cannot compile under that config.\n` +
    `  Turning emit off is your build decision, so shast did not change it.`
  );
}

/** Read a line from stdin, synchronously, for the interactive consent prompt. */
function defaultConfirm(question: string): boolean {
  process.stderr.write(question);
  const buffer = Buffer.alloc(1);
  let answer = "";
  for (;;) {
    let bytes: number;
    try {
      bytes = readSync(0, buffer, 0, 1, null);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EAGAIN") continue;
      return false;
    }
    if (bytes === 0) return false;
    const char = buffer.toString("utf8", 0, 1);
    if (char === "\n") break;
    if (char !== "\r") answer += char;
  }
  return /^y(es)?$/i.test(answer.trim());
}

/** Consent and injection points for a run. */
export interface CliOptions {
  /** Ask the user to consent; defaults to a synchronous stdin prompt. */
  confirm?: (question: string) => boolean;
  /** Whether stdin can be prompted; defaults to `process.stdin.isTTY === true`. */
  interactive?: boolean;
  /** Run a package-manager command; defaults to spawnSync with inherited stdio. */
  run?: RunFunction;
}

function applyFixable(
  tsconfigPath: string,
  yes: boolean,
  options: CliOptions,
): number {
  let edited: string;
  try {
    edited = addAllowImportingTsExtensions(readFileSync(tsconfigPath, "utf8"));
  } catch (error) {
    console.error(
      `shast: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }

  const apply = (): number => {
    writeFileSync(tsconfigPath, edited);
    console.log(
      `shast: added "allowImportingTsExtensions": true to ${tsconfigPath}.`,
    );
    return 0;
  };

  if (yes) return apply();

  const interactive = options.interactive ?? process.stdin.isTTY === true;
  const confirm = options.confirm ?? defaultConfirm;
  if (interactive) {
    if (confirm(`${fixableMessage(tsconfigPath)}\n\n${MANUAL_CHANGE}? [y/N] `)) {
      return apply();
    }
    console.error(
      `shast: ${MANUAL_CHANGE}, or re-run with --yes. ${tsconfigPath} was left unchanged.`,
    );
    return 1;
  }

  console.error(fixableMessage(tsconfigPath));
  console.error(
    `shast: no consent given (stdin is not a TTY) - ${MANUAL_CHANGE}, or re-run with --yes. ${tsconfigPath} was left unchanged.`,
  );
  return 1;
}

/** Report (and, with consent, reconcile) the tsconfig after a successful add. */
function reconcileTsconfig(
  dest: string,
  yes: boolean,
  options: CliOptions,
): number {
  const state = inspectTsconfig(dest);
  switch (state.kind) {
    case "none":
      console.error(noneMessage(dest));
      return 0;
    case "ok":
      return 0;
    case "incompatible":
      console.error(incompatibleMessage(state.path));
      return 1;
    case "fixable":
      return applyFixable(state.path, yes, options);
  }
}

const USAGE = `Usage: shast add [dest] [--tier minimal|common|full] [--force] [--yes]
                 [--no-install] [--no-entry] [--package-manager npm|pnpm|yarn|bun]

Vendor shast's engine and one config-variation tier into a consumer tree,
generate a <dest>/index.ts that wires them, and install the tsyntax package the
tree imports. Only the chosen tier's variation files are written.

  dest              destination directory (default: src/shast)
  --tier            config-variation tier to vendor (default: common). Stale
                    files from a different tier are removed
  --force           overwrite files that already exist in the destination,
                    reporting which replaced files differ from the bytes being
                    written
  --yes             consent to installing tsyntax and to adding
                    "allowImportingTsExtensions" to the nearest tsconfig.json
                    without prompting (for CI)
  --no-install      do not install tsyntax; print the command to run instead
  --no-entry        do not generate <dest>/index.ts; import the engine and
                    family entry points directly instead
  --package-manager force a package manager instead of detecting one

tsyntax is installed with your project's package manager, detected from its
packageManager field or lockfile (npm, pnpm, yarn or bun). The install runs
before any file is written, so a failed install leaves the destination
untouched. Single package only: workspace roots are not supported.

The destination must resolve as ESM (its nearest package.json needs
"type": "module"); vendoring into a CommonJS subtree is rejected.

The vendored tree imports .ts-extension TypeScript sources, so shast also
reconciles "allowImportingTsExtensions" in your tsconfig. It never edits the
config without consent and never changes your emit settings.`;

interface ParsedArgs {
  dest: string;
  tier: Tier;
  force: boolean;
  yes: boolean;
  noInstall: boolean;
  noEntry: boolean;
  packageManager?: PackageManager;
}

function parseAddArgs(args: readonly string[]): ParsedArgs {
  let dest = "src/shast";
  let tier: Tier = DEFAULT_TIER;
  let force = false;
  let yes = false;
  let noInstall = false;
  let noEntry = false;
  let packageManager: PackageManager | undefined;
  let destSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === undefined) continue;
    if (token === "--force") {
      force = true;
    } else if (token === "--yes") {
      yes = true;
    } else if (token === "--no-install") {
      noInstall = true;
    } else if (token === "--no-entry") {
      noEntry = true;
    } else if (token === "--tier") {
      const value = args[i + 1];
      if (value === undefined) {
        throw new Error("Option '--tier' requires a value");
      }
      if (!TIER_SET.has(value)) {
        throw new Error(
          `Unknown tier '${value}'; expected one of ${TIERS.join(", ")}`,
        );
      }
      tier = value as Tier;
      i += 1;
    } else if (token === "--package-manager") {
      const value = args[i + 1];
      if (value === undefined) {
        throw new Error("Option '--package-manager' requires a value");
      }
      if (!isPackageManager(value)) {
        throw new Error(
          `Unknown package manager '${value}'; expected one of npm, pnpm, yarn, bun`,
        );
      }
      packageManager = value;
      i += 1;
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown option '${token}'`);
    } else if (destSeen) {
      throw new Error(`Unexpected extra argument '${token}'`);
    } else {
      dest = token;
      destSeen = true;
    }
  }

  return packageManager === undefined
    ? { dest, tier, force, yes, noInstall, noEntry }
    : { dest, tier, force, yes, noInstall, noEntry, packageManager };
}

/**
 * Install tsyntax into the consumer's project before `add` writes the vendored
 * tree. Returns 0 to continue, or a non-zero exit code to stop (nothing is then
 * written). `--no-install` skips and prints the command; `--yes` installs
 * without prompting; an interactive run prompts for consent.
 */
function ensureTsyntax(
  pre: AddPreflight,
  parsed: ParsedArgs,
  options: CliOptions,
): number {
  const range = tsyntaxRange();

  if (parsed.noInstall) {
    const manager = parsed.packageManager ?? detectPackageManager(pre.packageDir);
    const { command, args } = installCommand(manager, range);
    console.error(
      `shast: --no-install set. The vendored tree imports "tsyntax", which is not\n` +
        `  installed; run this before compiling:\n` +
        `    ${command} ${args.join(" ")}\n` +
        `  (in ${pre.packageDir})`,
    );
    return 0;
  }

  const declared = declaredDependency(pre.packageJsonPath, "tsyntax");
  if (declared !== undefined) {
    if (rangeMajor(declared) !== rangeMajor(range)) {
      console.error(
        `shast: ${pre.packageJsonPath} lists tsyntax@${declared}, but this shast\n` +
          `  expects tsyntax@${range}. Leaving your version in place.`,
      );
    }
    return 0;
  }

  const manager = parsed.packageManager ?? detectPackageManager(pre.packageDir);
  const { command, args } = installCommand(manager, range);
  const manual = `${command} ${args.join(" ")}`;

  if (!parsed.yes) {
    const interactive = options.interactive ?? process.stdin.isTTY === true;
    const confirm = options.confirm ?? defaultConfirm;
    if (!interactive) {
      console.error(
        `shast: the vendored tree imports "tsyntax", which is not installed.\n` +
          `  Run \`${manual}\` in ${pre.packageDir}, or re-run with --yes.\n` +
          `  Nothing was written.`,
      );
      return 1;
    }
    if (
      !confirm(
        `shast add will install tsyntax@${range} into ${pre.packageDir} using ${manager}.\n` +
          `Run \`${manual}\`? [y/N] `,
      )
    ) {
      console.error(
        `shast: not installing tsyntax. Run \`${manual}\` in ${pre.packageDir},\n` +
          `  or re-run with --yes. Nothing was written.`,
      );
      return 1;
    }
  }

  console.log(`shast: installing tsyntax@${range} with ${manager}...`);
  const run = options.run ?? defaultRun;
  const result = run(command, args, pre.packageDir);
  if (result.error !== undefined) {
    console.error(
      `shast: could not run ${command}: ${result.error.message}\n` +
        `  Install tsyntax@${range} in ${pre.packageDir} manually. Nothing was written.`,
    );
    return 1;
  }
  if (result.status !== 0) {
    console.error(
      `shast: \`${manual}\` failed in ${pre.packageDir}.\n` +
        `  Nothing was written.`,
    );
    return 1;
  }
  console.log(`shast: installed tsyntax@${range} with ${manager}.`);
  return 0;
}

export function main(argv: readonly string[], options: CliOptions = {}): number {
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
    // Validate and install before writing: a destination that would be refused,
    // or an install that fails, must not leave a half-usable tree behind.
    const pre = preflight(parsed);
    const installCode = ensureTsyntax(pre, parsed, options);
    if (installCode !== 0) return installCode;

    const result = add(parsed);
    console.log(
      `Vendored shast into ${result.dest} — ${result.written.length} files.`,
    );
    if (result.replaced.length > 0) {
      console.log(
        formatReplacedReport(result.replaced.length, result.replacedDiffering),
      );
    }
    if (result.removed.length > 0) {
      console.log(
        `shast: removed ${result.removed.length} stale file(s) from a previous tier.`,
      );
    }
    return reconcileTsconfig(result.dest, parsed.yes, options);
  } catch (error) {
    if (error instanceof ExistingDestinationError) {
      console.error(error.message);
      console.error(REFUSED_HINT);
      return 1;
    }
    if (error instanceof CommonJSDestinationError) {
      console.error(error.message);
      return 1;
    }
    console.error(
      `shast: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

// npm links `bin` into node_modules/.bin, so argv[1] is a symlink while
// `import.meta.url` is the real file. Compare real paths so the CLI still runs
// when invoked through the link - a plain string compare silently does nothing.
const entrypoint =
  process.argv[1] !== undefined &&
  realpathSync(fileURLToPath(import.meta.url)) ===
    realpathSync(path.resolve(process.argv[1]));

if (entrypoint) {
  process.exit(main(process.argv.slice(2)));
}
