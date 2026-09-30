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
  readSync,
  realpathSync,
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

// The seven families that carry shipped variation files. `css properties` is
// absent because that registry is assembled per-consumer (it holds *custom*
// properties, which have no shipped minimal/common/full form); the copied
// entry exports the `cssPropertiesConfig` builder for exactly that.

// Directories under `src/` copied wholesale.
const COPY_DIRS = ["engine", "css", "html"] as const;
// Root-level `src/` files copied too. `index.ts` is the package's public entry
// point (a side-effect-free barrel) and becomes the vendored tree's entry.
const COPY_FILES = ["types.ts", "index.ts"] as const;
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
        destRel: sourceRel,
        sourceRel,
      });
    }
  }

  for (const file of COPY_FILES) {
    planned.push({
      source: path.join(srcRoot, file),
      destRel: file,
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

function rewriteSpecifier(specifier: string, fromDestRel: string): string {
  if (specifier === "tsyntax") {
    return relativeSpecifier(fromDestRel, "tsyntax/index.ts");
  }
  if (specifier.startsWith("@/")) {
    let targetRel = specifier.slice(2);
    if (path.posix.extname(targetRel) === "") targetRel += ".ts";
    return relativeSpecifier(fromDestRel, targetRel);
  }
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
 * Rewrite `@/...` and bare `tsyntax` specifiers in `source` to paths relative
 * to that file's mirrored destination location. Other specifiers (already
 * relative, or external packages such as `@total-typescript/ts-reset`) are
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

/**
 * Vendor the engine, every config variation and tsyntax into `dest`.
 *
 * Throws {@link CommonJSDestinationError} when `dest` would be resolved as
 * CommonJS, and {@link ExistingDestinationError} when any planned file already
 * exists and `force` is not set. Returns the sorted list of written files.
 */
export function add(options: AddOptions): AddResult {
  const force = options.force ?? false;
  const dest = path.resolve(options.dest);
  const planned = planVendor(options);

  if (!resolvesAsESM(dest)) {
    throw new CommonJSDestinationError(dest, nearestPackageJson(dest));
  }

  const copiedRels = planned.map((file) => file.destRel);

  const collisions = copiedRels.filter((rel) =>
    existsSync(path.join(dest, rel)),
  );

  if (collisions.length > 0 && !force) {
    throw new ExistingDestinationError(collisions);
  }

  for (const file of planned) {
    const content = rewriteImports(
      readFileSync(file.source, "utf8"),
      file.destRel,
    );
    const target = path.join(dest, file.destRel);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }

  return {
    dest,
    written: copiedRels.sort((a, b) => (a < b ? -1 : 1)),
  };
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

/** Consent to the tsconfig edit for a run. */
export interface CliOptions {
  /** Ask the user to consent; defaults to a synchronous stdin prompt. */
  confirm?: (question: string) => boolean;
  /** Whether stdin can be prompted; defaults to `process.stdin.isTTY === true`. */
  interactive?: boolean;
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

const USAGE = `Usage: shast add [dest] [--force] [--yes]

Vendor shast's engine, config variations and tsyntax into a consumer tree.

  dest      destination directory (default: src/shast)
  --force   overwrite files that already exist in the destination
  --yes     consent to adding "allowImportingTsExtensions" to the nearest
            tsconfig.json without prompting (for CI)

The destination must resolve as ESM (its nearest package.json needs
"type": "module"); vendoring into a CommonJS subtree is rejected.

The vendored tree imports .ts-extension TypeScript sources, so shast also
reconciles "allowImportingTsExtensions" in your tsconfig. It never edits the
config without consent and never changes your emit settings.`;

interface ParsedArgs {
  dest: string;
  force: boolean;
  yes: boolean;
}

function parseAddArgs(args: readonly string[]): ParsedArgs {
  let dest = "src/shast";
  let force = false;
  let yes = false;
  let destSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === undefined) continue;
    if (token === "--force") {
      force = true;
    } else if (token === "--yes") {
      yes = true;
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown option '${token}'`);
    } else if (destSeen) {
      throw new Error(`Unexpected extra argument '${token}'`);
    } else {
      dest = token;
      destSeen = true;
    }
  }

  return { dest, force, yes };
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
    const result = add(parsed);
    console.log(
      `Vendored shast into ${result.dest} — ${result.written.length} files.`,
    );
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
