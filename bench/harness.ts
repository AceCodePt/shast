#!/usr/bin/env node
// shast type-check benchmark harness.
//
// This is the in-repo replacement for the out-of-tree harness the README and
// docs/performance.md describe as "indicative". It measures `tsc` cost against
// the *vendored single-tier consumer tree* `shast add` writes - not against the
// repo's own barrel, which pulls in all three tiers.
//
// It exists to answer three questions:
//
//   1. What is the fixed cost of loading one tier before any component is
//      checked?
//   2. What does each additional component cost, per shape?
//   3. How do those numbers differ between TypeScript 7 (the development
//      target) and TypeScript 5 (what most consumers run today)?
//
// It sweeps the cartesian product of tiers x component shapes x component
// counts, invokes a pinned `tsc` binary for each combination, and averages the
// wall-clock time over `--repeats` runs. Instantiations are deterministic, so
// they are read from a single run and used as the machine-stable measure.
//
// The two compilers are installed side by side under distinct package aliases
// (`typescript` = 7.x, `typescript-5` = 5.9.3), so every result is labelled with
// the exact version that produced it and the two can never be confused.
//
// Run:
//   pnpm bench                     full sweep, both compilers, results + baseline
//   pnpm bench -- --quick          fast smoke run (common, modest+rich, n=1,10)
//   pnpm bench -- --tiers common --sizes 1,10,50,100
//   pnpm bench -- --json -         emit the result document to stdout
//   pnpm bench -- --wall           add the break-point sweep
//
// Flags:
//   --compilers a,b   --tiers a,b   --shapes a,b   --sizes a,b   --repeats n
//   --save-baseline   write bench/baseline.json (the same document --json emits)
//   --json [path|-]   emit the result document as JSON; default is the tracked
//                     bench/out/results.json, `-` writes to stdout (which moves
//                     all human output to stderr so the pipe stays parseable)
//   --wall            run the break-point sweep (opt-in: it is many extra
//                     compiles). Finds the largest component count that still
//                     compiles per tier/shape - the TS2589 headroom.
//   --wall-max n      largest component count the wall sweep probes (default 256)
//   --fail-on-error   exit 1 if any fixture fails to compile
//   --fail-on-drift   exit 1 if any row drifts from bench/baseline.json
//   --report-only     re-render RESULTS.md from bench/out/results.json
//
// Results are written to bench/out/results.json and bench/out/RESULTS.md. The
// baseline and the JSON result share one schema (see `BenchmarkDocument`): the
// baseline is that document for a given commit, and every result row carries a
// `deltaVsBaseline`, so drift is a field-for-field comparison rather than a
// second code path. Runs pass `--singleThreaded` where the compiler supports it:
// TypeScript 7 (tsgo) parallelises by default, and the thread scheduling makes
// whole-program counters jitter run to run.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { add, type Tier } from "../scripts/cli.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
/** Vendored trees and generated fixtures. Gitignored; rebuilt on every run. */
const GENERATED = path.join(HERE, ".generated");
/** Results. Gitignored except the deliberately tracked bench/baseline.json. */
const OUT_DIR = path.join(HERE, "out");
const RESULTS_FILE = path.join(OUT_DIR, "results.json");
const REPORT_FILE = path.join(OUT_DIR, "RESULTS.md");
const BASELINE_FILE = path.join(HERE, "baseline.json");
/** Identifies the producer of a document, so a foreign JSON is recognisable. */
const HARNESS_ID = "shast-bench";
/**
 * What is under measurement: the engine source `shast add` vendors from. The
 * harness never measures the repo's own barrel (which pulls in all three tiers),
 * so this is the stable provenance label for every row.
 */
const IMPL = "src";
/** Default ceiling for the break-point sweep's component count. */
const DEFAULT_WALL_MAX = 256;

const ALL_TIERS: readonly Tier[] = ["minimal", "common", "full"];

type ShapeId = "flat" | "modest" | "hover" | "media" | "rich" | "keyframes";
const ALL_SHAPES: readonly ShapeId[] = [
  "flat",
  "modest",
  "hover",
  "media",
  "rich",
  "keyframes",
];

/**
 * The compiler options every measurement runs under. This mirrors the repo's
 * own `tsconfig.json` strictness (minus the `@/*` path alias, which the
 * vendored tree does not use) so the numbers describe the same type-checking
 * workload the project holds itself to. `types: []` keeps `@types/node` out of
 * the program: under `skipLibCheck` nothing references it, so it is not loaded
 * either way, but pinning the list keeps the program closed.
 */
const MEASURE_COMPILER_OPTIONS: Readonly<Record<string, unknown>> = {
  target: "esnext",
  module: "nodenext",
  moduleResolution: "nodenext",
  strict: true,
  strictBindCallApply: true,
  erasableSyntaxOnly: true,
  noImplicitAny: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  noImplicitReturns: true,
  noImplicitOverride: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noFallthroughCasesInSwitch: true,
  noPropertyAccessFromIndexSignature: true,
  verbatimModuleSyntax: true,
  isolatedModules: true,
  noUncheckedSideEffectImports: true,
  moduleDetection: "force",
  skipLibCheck: true,
  allowImportingTsExtensions: true,
  noEmit: true,
  types: [],
};

// ---------------------------------------------------------------------------
// Compilers
// ---------------------------------------------------------------------------

/** The provenance slice of a compiler that a document persists and reports on. */
interface CompilerInfo {
  id: string;
  version: string;
}

interface Compiler {
  id: string;
  /** Package alias in node_modules. */
  pkg: string;
  version: string;
  bin: string;
  /**
   * Whether `--singleThreaded` is passed. TypeScript 7 (tsgo) is parallel by
   * default and its whole-program counters jitter with thread scheduling;
   * classic tsc (5.x) is already single-threaded and has no such flag, so this
   * is gated on the major version rather than assumed.
   */
  singleThreaded: boolean;
}

/**
 * The two compilers, installed side by side under distinct aliases. `ts7` is
 * the package named `typescript` (the development target); `ts5` is the
 * `typescript-5` alias pinned to 5.9.3.
 */
const COMPILER_PACKAGES: Readonly<Record<string, string>> = {
  ts7: "typescript",
  ts5: "typescript-5",
};

function loadCompiler(id: string): Compiler {
  const pkg = COMPILER_PACKAGES[id];
  if (pkg === undefined) {
    throw new Error(
      `Unknown compiler '${id}'; expected one of ${Object.keys(COMPILER_PACKAGES).join(", ")}`,
    );
  }
  const require = createRequire(import.meta.url);
  let pkgJson: string;
  try {
    pkgJson = require.resolve(`${pkg}/package.json`);
  } catch {
    throw new Error(
      `Compiler '${id}' is not installed (package '${pkg}'). Run pnpm install.`,
    );
  }
  const bin = path.join(path.dirname(pkgJson), "bin", "tsc");
  const version = spawnSync(process.execPath, [bin, "--version"], {
    encoding: "utf8",
  }).stdout.trim().replace(/^Version\s+/, "");
  const major = Number.parseInt(version.split(".")[0] ?? "", 10);
  return {
    id,
    pkg,
    version,
    bin,
    singleThreaded: Number.isFinite(major) && major >= 7,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Read one tier's config file for a registry family. */
function readTierConfig(tier: Tier, family: string): string {
  return readFileSync(
    path.join(REPO_ROOT, "src", family, "tiers", `${tier}.ts`),
    "utf8",
  );
}

const TIER_MEDIA_CACHE = new Map<Tier, string>();
const TIER_KEYFRAME_CACHE = new Map<Tier, string>();

/** The first `@media ...` query a tier registers, so the media shape compiles. */
function tierMediaQuery(tier: Tier): string {
  const cached = TIER_MEDIA_CACHE.get(tier);
  if (cached !== undefined) return cached;
  const match = /"(@media [^"]+)"/.exec(
    readTierConfig(tier, "css/queries-config"),
  );
  const query = match?.[1] ?? "@media (width < 768px)";
  TIER_MEDIA_CACHE.set(tier, query);
  return query;
}

/** The first `@keyframes` name a tier registers, so the keyframes shape compiles. */
function tierKeyframe(tier: Tier): string {
  const cached = TIER_KEYFRAME_CACHE.get(tier);
  if (cached !== undefined) return cached;
  const match = /^\s{2}([A-Za-z_][\w-]*):\s*\{/m.exec(
    readTierConfig(tier, "css/keyframes-config"),
  );
  const name = match?.[1] ?? "fade";
  TIER_KEYFRAME_CACHE.set(tier, name);
  return name;
}

/**
 * One component of `shape`, made distinct by `index` so nothing TypeScript
 * caches by identity is reused between components. Every component is exported
 * so `noUnusedLocals` stays quiet. `media` and `keyframes` use the tier's own
 * registered query/keyframe name so the fixture exercises the tier rather than
 * a hard-coded name the tier may not declare.
 */
function componentSource(shape: ShapeId, index: number, tier: Tier): string {
  const n = `n${index}`;
  switch (shape) {
    case "flat":
      return `export const c${index} = createComponent({
  tag: "div",
  innerHTML: { child: { tag: "span", innerHTML: "${n}" } },
});`;
    case "modest":
      // The README's shape: ul > li > span, one :hover, one nested > child.
      return `export const c${index} = createComponent({
  tag: "ul",
  innerHTML: {
    item: {
      tag: "li",
      innerHTML: { label: { tag: "span", innerHTML: "${n}" } },
    },
  },
  css: {
    ":hover": { color: "#010101" },
    "> item": { "> label": { color: "#020202" } },
  },
});`;
    case "hover":
      return `export const c${index} = createComponent({
  tag: "div",
  innerHTML: { child: { tag: "span", innerHTML: "${n}" } },
  css: { ":hover": { color: "#010101" } },
});`;
    case "media":
      return `export const c${index} = createComponent({
  tag: "div",
  innerHTML: { child: { tag: "span", innerHTML: "${n}" } },
  css: { "${tierMediaQuery(tier)}": { color: "#010101" } },
});`;
    case "rich":
      // display: flex unlocks gap (self) through the same-element :hover and
      // @media blocks, and flex (children) on > child. A calc() width.
      return `export const c${index} = createComponent({
  tag: "div",
  innerHTML: { child: { tag: "span", innerHTML: "${n}" } },
  css: {
    display: "flex",
    width: "calc(100% - 10px)",
    ":hover": { gap: "1rem" },
    "@media (width < 768px)": { "justify-content": "center" },
    "> child": { flex: "1" },
  },
});`;
    case "keyframes":
      return `export const c${index} = createComponent({
  tag: "div",
  innerHTML: { child: { tag: "span", innerHTML: "${n}" } },
  css: { animation: "${tierKeyframe(tier)} 1s linear" },
});`;
  }
}

/** A fixture file with `n` distinct components of `shape`, importing the tree. */
function fixtureSource(shape: ShapeId, n: number, tier: Tier): string {
  const lines = [
    `import { createComponent } from "./shast/index.ts";`,
    ``,
  ];
  for (let index = 0; index < n; index += 1) {
    lines.push(componentSource(shape, index, tier), "");
  }
  return lines.join("\n");
}

/** The fixed-cost fixture: the tree loaded, no components defined. */
const BASELINE_SOURCE = `import "./shast/index.ts";\n`;

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

interface Diagnostics {
  instantiations: number;
  types: number;
  symbols: number;
  checkTimeMs: number;
  totalTimeMs: number;
  errors: number;
  /** The first `TS####` code in the output, or null when it compiled. */
  errorCode: string | null;
  errorSample: string | null;
}

function parseDiagnostics(output: string): Diagnostics {
  const num = (label: string): number => {
    const match = new RegExp(`^${label}:\\s+([\\d,]+)`, "m").exec(output);
    return match === null ? 0 : Number(match[1]!.replaceAll(",", ""));
  };
  const seconds = (label: string): number => {
    const match = new RegExp(`^${label}:\\s+([\\d.]+)s`, "m").exec(output);
    return match === null ? 0 : Number(match[1]) * 1000;
  };
  const errorMatches = output.match(/error TS\d+/g) ?? [];
  return {
    instantiations: num("Instantiations"),
    types: num("Types"),
    symbols: num("Symbols"),
    checkTimeMs: seconds("Check time"),
    totalTimeMs: seconds("Total time"),
    errors: errorMatches.length,
    errorCode: /error (TS\d+)/.exec(output)?.[1] ?? null,
    errorSample:
      errorMatches.length === 0
        ? null
        : (output.match(/^.*error TS\d+.*$/m)?.[0] ?? "unknown error"),
  };
}

interface Run {
  diagnostics: Diagnostics;
  /** Every check-time sample, in milliseconds. */
  checkSamples: number[];
}

function runTsc(compiler: Compiler, tsconfig: string, repeats: number): Run {
  let diagnostics: Diagnostics | null = null;
  const checkSamples: number[] = [];
  for (let run = 0; run < repeats; run += 1) {
    const args = [
      compiler.bin,
      "--pretty",
      "false",
      "--extendedDiagnostics",
    ];
    if (compiler.singleThreaded) args.push("--singleThreaded");
    args.push("-p", tsconfig);
    const result = spawnSync(process.execPath, args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const parsed = parseDiagnostics(output);
    if (diagnostics === null) diagnostics = parsed;
    checkSamples.push(parsed.checkTimeMs);
  }
  return { diagnostics: diagnostics!, checkSamples };
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

interface Row {
  compiler: string;
  compilerVersion: string;
  tier: Tier;
  shape: ShapeId | "baseline";
  n: number;
  instantiations: number;
  types: number;
  checkTimeMs: number;
  checkSamples: number[];
  errors: number;
  errorCode: string | null;
  errorSample: string | null;
  /**
   * Change in the deterministic counters since the loaded baseline, or null
   * when there is no matching baseline row. Filled in once, right after the
   * sweep, so both the report and `--fail-on-drift` read the same numbers.
   */
  deltaVsBaseline: { instantiations: number; types: number } | null;
}

/**
 * A row as persisted: the in-memory `Row` minus the raw timing samples and the
 * per-row compiler version (the document already lists versions once, in
 * `compilers`).
 */
interface DocumentRow {
  compiler: string;
  tier: Tier;
  shape: ShapeId | "baseline";
  n: number;
  instantiations: number;
  types: number;
  checkTimeMs: number;
  errors: number;
  errorCode: string | null;
  errorSample: string | null;
  deltaVsBaseline: { instantiations: number; types: number } | null;
}

/**
 * A break-point result: the largest component count of `shape` that still
 * compiles on a tier. `threshold` 0 means even a single component failed (the
 * `full` tier's `TS2589` on any non-flat shape), which is a result, not an
 * error. `open` marks a sweep that reached `--wall-max` without failing.
 */
interface WallResult {
  compiler: string;
  tier: Tier;
  shape: ShapeId;
  threshold: number;
  open: boolean;
  errorCode: string | null;
  errorSample: string | null;
}

/**
 * One schema for both the JSON result and `bench/baseline.json`. The baseline
 * is this document for a given commit; the result is this document with
 * `deltaVsBaseline` filled in per row. Field-for-field comparison, no second
 * shape to keep in sync.
 */
interface BenchmarkDocument {
  harness: string;
  generated: string;
  gitHead: string;
  /** The source under measurement (always the vendored engine, `IMPL`). */
  impl: string;
  compilers: { id: string; version: string }[];
  compilerOptions: Readonly<Record<string, unknown>>;
  tiers: Tier[];
  shapes: ShapeId[];
  sizes: number[];
  repeats: number;
  /** Path + commit of the baseline this document was diffed against. */
  baseline: string | null;
  baselineGitHead: string | null;
  rows: DocumentRow[];
  walls: WallResult[] | null;
}

function ensureTree(tier: Tier): string {
  const dest = path.join(GENERATED, tier, "shast");
  rmSync(path.join(GENERATED, tier), { recursive: true, force: true });
  add({ dest, tier, force: true });
  return path.join(GENERATED, tier);
}

/**
 * Write `source` to `<treeDir>/<name>.ts` plus a matching tsconfig that pins
 * the measurement options and includes only that file, so each run is isolated
 * from every other fixture.
 */
function writeFixture(treeDir: string, name: string, source: string): string {
  writeFileSync(path.join(treeDir, `${name}.ts`), source);
  const tsconfig = path.join(treeDir, `${name}.tsconfig.json`);
  writeFileSync(
    tsconfig,
    JSON.stringify(
      {
        compilerOptions: MEASURE_COMPILER_OPTIONS,
        files: [`./${name}.ts`],
      },
      null,
      2,
    ),
  );
  return tsconfig;
}

interface SweepOptions {
  compilers: Compiler[];
  tiers: readonly Tier[];
  shapes: readonly ShapeId[];
  sizes: readonly number[];
  repeats: number;
  /** Vendored tree per tier, built once in `main` and shared with the wall sweep. */
  trees: ReadonlyMap<Tier, string>;
}

function sweep(options: SweepOptions): Row[] {
  const rows: Row[] = [];
  for (const tier of options.tiers) {
    const treeDir = options.trees.get(tier);
    if (treeDir === undefined) throw new Error(`No vendored tree for tier '${tier}'`);
    const fixtures: {
      shape: ShapeId | "baseline";
      n: number;
      config: string;
    }[] = [
      {
        shape: "baseline",
        n: 0,
        config: writeFixture(treeDir, "baseline", BASELINE_SOURCE),
      },
    ];
    for (const shape of options.shapes) {
      for (const n of options.sizes) {
        fixtures.push({
          shape,
          n,
          config: writeFixture(
            treeDir,
            `${shape}-${n}`,
            fixtureSource(shape, n, tier),
          ),
        });
      }
    }

    for (const compiler of options.compilers) {
      for (const fixture of fixtures) {
        process.stderr.write(
          `  ${compiler.id} ${tier} ${fixture.shape} n=${fixture.n} ... `,
        );
        const run = runTsc(compiler, fixture.config, options.repeats);
        const d = run.diagnostics;
        process.stderr.write(
          `${d.instantiations.toLocaleString("en-US")} inst, ` +
            `${mean(run.checkSamples).toFixed(0)}ms` +
            (d.errors > 0 ? ` (${d.errors} ERRORS)` : "") +
            `\n`,
        );
        rows.push({
          compiler: compiler.id,
          compilerVersion: compiler.version,
          tier,
          shape: fixture.shape,
          n: fixture.n,
          instantiations: d.instantiations,
          types: d.types,
          checkTimeMs: mean(run.checkSamples),
          checkSamples: run.checkSamples,
          errors: d.errors,
          errorCode: d.errorCode,
          errorSample: d.errorSample,
          deltaVsBaseline: null,
        });
      }
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Baseline deltas
// ---------------------------------------------------------------------------

function rowKey(
  compiler: string,
  tier: Tier,
  shape: ShapeId | "baseline",
  n: number,
): string {
  return `${compiler}|${tier}|${shape}|${n}`;
}

/**
 * Fill each row's `deltaVsBaseline` from the loaded baseline. A row with no
 * matching baseline row (a tier/shape/size set the baseline did not measure)
 * gets null rather than a misleading zero.
 */
function attachDeltas(rows: readonly Row[], baseline: BenchmarkDocument | null): void {
  const previous = baseline?.rows;
  if (previous === undefined) {
    for (const row of rows) row.deltaVsBaseline = null;
    return;
  }
  const byKey = new Map(
    previous.map((row) => [rowKey(row.compiler, row.tier, row.shape, row.n), row]),
  );
  for (const row of rows) {
    const prev = byKey.get(rowKey(row.compiler, row.tier, row.shape, row.n));
    row.deltaVsBaseline =
      prev === undefined
        ? null
        : {
            instantiations: row.instantiations - prev.instantiations,
            types: row.types - prev.types,
          };
  }
}

/** Read the tracked baseline, or null when it is absent or unreadable. */
function loadBaseline(): BenchmarkDocument | null {
  if (!existsSync(BASELINE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as BenchmarkDocument;
  } catch {
    return null;
  }
}

/** Project an in-memory row to the persisted shape (drop the timing samples). */
function documentRows(rows: readonly Row[]): DocumentRow[] {
  return rows.map((row) => ({
    compiler: row.compiler,
    tier: row.tier,
    shape: row.shape,
    n: row.n,
    instantiations: row.instantiations,
    types: row.types,
    checkTimeMs: row.checkTimeMs,
    errors: row.errors,
    errorCode: row.errorCode,
    errorSample: row.errorSample,
    deltaVsBaseline: row.deltaVsBaseline,
  }));
}

// ---------------------------------------------------------------------------
// Break-point (wall) sweep
// ---------------------------------------------------------------------------

interface WallProbe {
  ok: boolean;
  errorCode: string | null;
  errorSample: string | null;
}

/**
 * Compile `n` components of `shape` on `tier` and report whether it compiled.
 * A single run: the pass/fail boundary is a deterministic property of the
 * program, not a timing, so it is not repeated.
 */
function wallProbe(
  treeDir: string,
  compiler: Compiler,
  tier: Tier,
  shape: ShapeId,
  n: number,
): WallProbe {
  const config = writeFixture(treeDir, "wall", fixtureSource(shape, n, tier));
  const run = runTsc(compiler, config, 1);
  const diagnostics = run.diagnostics;
  return {
    ok: diagnostics.errors === 0,
    errorCode: diagnostics.errorCode,
    errorSample: diagnostics.errorSample,
  };
}

/**
 * The largest component count of `shape` that still compiles on `tier`, found
 * by doubling from 1 then bisecting - the same search the tsyntax harness uses
 * for its DSL dimensions. The count is the input; the ceiling (`--wall-max`)
 * bounds the cost. `full` on any non-flat shape stops at 0 (`TS2589`), which is
 * the headroom figure the per-shape tables cannot show.
 */
function findWall(
  treeDir: string,
  compiler: Compiler,
  tier: Tier,
  shape: ShapeId,
  max: number,
): WallResult {
  const cache = new Map<number, WallProbe>();
  const at = (n: number): WallProbe => {
    const cached = cache.get(n);
    if (cached !== undefined) return cached;
    const probe = wallProbe(treeDir, compiler, tier, shape, n);
    cache.set(n, probe);
    return probe;
  };

  const first = at(1);
  if (!first.ok) {
    return {
      compiler: compiler.id,
      tier,
      shape,
      threshold: 0,
      open: false,
      errorCode: first.errorCode,
      errorSample: first.errorSample,
    };
  }
  let ok = 1;
  let failN: number | null = null;
  for (let n = 1; n < max; ) {
    n = Math.min(n * 2, max);
    if (!at(n).ok) {
      failN = n;
      break;
    }
    ok = n;
    if (n === max) break;
  }
  if (failN === null) {
    return {
      compiler: compiler.id,
      tier,
      shape,
      threshold: max,
      open: true,
      errorCode: null,
      errorSample: null,
    };
  }
  let lo = ok;
  let hi = failN;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (at(mid).ok) lo = mid;
    else hi = mid;
  }
  const fail = at(hi);
  return {
    compiler: compiler.id,
    tier,
    shape,
    threshold: lo,
    open: false,
    errorCode: fail.errorCode,
    errorSample: fail.errorSample,
  };
}

function runWalls(
  compilers: readonly Compiler[],
  tiers: readonly Tier[],
  shapes: readonly ShapeId[],
  trees: ReadonlyMap<Tier, string>,
  max: number,
): WallResult[] {
  const walls: WallResult[] = [];
  for (const tier of tiers) {
    const treeDir = trees.get(tier);
    if (treeDir === undefined) throw new Error(`No vendored tree for tier '${tier}'`);
    for (const compiler of compilers) {
      for (const shape of shapes) {
        process.stderr.write(`  wall ${compiler.id} ${tier} ${shape} ... `);
        const wall = findWall(treeDir, compiler, tier, shape, max);
        process.stderr.write(
          wall.open
            ? `>=${wall.threshold}\n`
            : `${wall.threshold} (${wall.errorCode ?? "clean"})\n`,
        );
        walls.push(wall);
      }
    }
  }
  return walls;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function find(
  rows: readonly DocumentRow[],
  compiler: string,
  tier: Tier,
  shape: ShapeId | "baseline",
  n: number,
): DocumentRow | undefined {
  return rows.find(
    (row) =>
      row.compiler === compiler &&
      row.tier === tier &&
      row.shape === shape &&
      row.n === n,
  );
}

/**
 * The asymptotic per-component cost, measured as the slope between the two
 * largest component counts for a shape - the documented method
 * `(I(n_max) - I(n_prev)) / (n_max - n_prev)`. This excludes the one-time cost
 * of the first component, which would otherwise inflate a `(I(n) - I(0)) / n`
 * figure.
 */
function slope(
  rows: readonly DocumentRow[],
  compiler: string,
  tier: Tier,
  shape: ShapeId,
): { inst: number; ms: number; n: number } | null {
  const samples = rows
    .filter(
      (row) =>
        row.compiler === compiler && row.tier === tier && row.shape === shape,
    )
    .sort((a, b) => a.n - b.n);
  if (samples.length < 2) return null;
  // A fixture that does not compile stops before the validation work is done,
  // so its slope measures an incomplete program. Report no slope rather than a
  // misleading one.
  if (samples.some((sample) => sample.errors > 0)) return null;
  const high = samples[samples.length - 1]!;
  const low = samples[samples.length - 2]!;
  const dn = high.n - low.n;
  if (dn <= 0) return null;
  return {
    inst: (high.instantiations - low.instantiations) / dn,
    ms: (high.checkTimeMs - low.checkTimeMs) / dn,
    n: high.n,
  };
}

function fmt(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fixedCostTable(
  rows: readonly DocumentRow[],
  compilers: readonly CompilerInfo[],
): string[] {
  const [a, b] = compilers;
  const lines: string[] = [];
  lines.push("## Fixed cost (tree loaded, no components)");
  lines.push("");
  const headers = ["tier", ...compilers.flatMap((c) => [`${c.id} inst`, `${c.id} check (ms)`])];
  if (a !== undefined && b !== undefined) headers.push("inst ratio", "time ratio");
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| --- |${headers.slice(1).map(() => " ---: |").join("")}`);
  for (const tier of ALL_TIERS) {
    const aRow = a === undefined ? undefined : find(rows, a.id, tier, "baseline", 0);
    const bRow = b === undefined ? undefined : find(rows, b.id, tier, "baseline", 0);
    if (aRow === undefined) continue;
    const cells = [tier, fmt(aRow.instantiations), fmt(aRow.checkTimeMs)];
    if (bRow !== undefined) cells.push(fmt(bRow.instantiations), fmt(bRow.checkTimeMs));
    if (aRow !== undefined && bRow !== undefined) {
      cells.push(
        aRow.instantiations === 0
          ? "—"
          : `${(bRow.instantiations / aRow.instantiations).toFixed(2)}×`,
        aRow.checkTimeMs === 0
          ? "—"
          : `${(bRow.checkTimeMs / aRow.checkTimeMs).toFixed(2)}×`,
      );
    }
    lines.push(`| ${cells.join(" | ")} |`);
  }
  lines.push("");
  return lines;
}

function slopeTable(
  rows: readonly DocumentRow[],
  compilers: readonly CompilerInfo[],
  tiers: readonly Tier[],
  shapes: readonly ShapeId[],
): string[] {
  const lines: string[] = [];
  lines.push("## Per-component cost (asymptotic slope at the two largest n)");
  lines.push("");
  lines.push(
    `| tier | shape | n | ${compilers.map((c) => `${c.id} inst/comp`).join(" | ")} | ` +
      `${compilers.map((c) => `${c.id} ms/comp`).join(" | ")} |`,
  );
  lines.push(
    `| --- | --- | ---: |${compilers.map(() => " ---: |").join("")}` +
      `${compilers.map(() => " ---: |").join("")}`,
  );
  for (const tier of tiers) {
    for (const shape of shapes) {
      const slopes = compilers.map((c) => slope(rows, c.id, tier, shape));
      const first = slopes[0];
      if (first === null || first === undefined) continue;
      lines.push(
        `| ${tier} | ${shape} | ${first.n} | ` +
          `${slopes.map((s) => (s === null ? "—" : fmt(s.inst))).join(" | ")} | ` +
          `${slopes.map((s) => (s === null ? "—" : fmt(s.ms, 1))).join(" | ")} |`,
      );
    }
  }
  lines.push("");
  return lines;
}

function rawTables(
  rows: readonly DocumentRow[],
  compilers: readonly CompilerInfo[],
): string[] {
  const lines: string[] = [];
  lines.push("## Raw measurements");
  lines.push("");
  for (const compiler of compilers) {
    lines.push(`### ${compiler.id} (TypeScript ${compiler.version})`);
    lines.push("");
    lines.push(
      "| tier | shape | n | instantiations | types | check (ms) | errors |",
    );
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: |");
    for (const row of rows.filter((r) => r.compiler === compiler.id)) {
      lines.push(
        `| ${row.tier} | ${row.shape} | ${row.n} | ` +
          `${fmt(row.instantiations)} | ${fmt(row.types)} | ` +
          `${fmt(row.checkTimeMs)} | ${row.errors} |`,
      );
    }
    lines.push("");
  }
  return lines;
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${fmt(value)}`;
}

/**
 * Drift reads the `deltaVsBaseline` already attached to each row, so the report
 * and the `--fail-on-drift` gate can never disagree about what moved.
 */
function driftSection(
  rows: readonly DocumentRow[],
  baseline: { file: string | null; gitHead: string | null } | null,
): string[] {
  const lines = ["## Baseline drift", ""];
  if (baseline === null) {
    lines.push("_No baseline loaded._", "");
    return lines;
  }
  const compared = rows.filter((row) => row.deltaVsBaseline !== null).length;
  if (compared === 0) {
    lines.push(
      `_No row in ${baseline.file ?? "the baseline"} matched this sweep._`,
      "",
    );
    return lines;
  }
  const changed = rows.filter(
    (row) =>
      row.deltaVsBaseline !== null &&
      (row.deltaVsBaseline.instantiations !== 0 || row.deltaVsBaseline.types !== 0),
  );
  const where =
    baseline.gitHead === null
      ? (baseline.file ?? "baseline")
      : `${baseline.file ?? "baseline"} @ ${baseline.gitHead.slice(0, 12)}`;
  lines.push(`Compared ${compared} row(s) against ${where}.`, "");
  if (changed.length === 0) {
    lines.push("No drift.", "");
    return lines;
  }
  lines.push(`Drift in ${changed.length} row(s):`, "");
  for (const row of changed) {
    const d = row.deltaVsBaseline!;
    lines.push(
      `- ${row.compiler}/${row.tier}/${row.shape}/n=${row.n}: ` +
        `instantiations ${signed(d.instantiations)}, types ${signed(d.types)}`,
    );
  }
  lines.push("");
  return lines;
}

function wallTable(
  walls: readonly WallResult[],
  compilers: readonly CompilerInfo[],
  tiers: readonly Tier[],
  shapes: readonly ShapeId[],
): string[] {
  const lines: string[] = [];
  lines.push("## Break points (largest component count that still compiles)");
  lines.push("");
  lines.push("| tier | shape | compiler | largest n | status |");
  lines.push("| --- | --- | --- | ---: | --- |");
  for (const tier of tiers) {
    for (const shape of shapes) {
      for (const compiler of compilers) {
        const wall = walls.find(
          (entry) =>
            entry.compiler === compiler.id &&
            entry.tier === tier &&
            entry.shape === shape,
        );
        if (wall === undefined) continue;
        const status = wall.open
          ? `>=${wall.threshold} (ceiling)`
          : (wall.errorCode ?? "compiles");
        lines.push(
          `| ${tier} | ${shape} | ${compiler.id} | ${wall.threshold} | ${status} |`,
        );
      }
    }
  }
  lines.push("");
  return lines;
}

function markdown(
  rows: readonly DocumentRow[],
  compilers: readonly CompilerInfo[],
  tiers: readonly Tier[],
  shapes: readonly ShapeId[],
  walls: readonly WallResult[] | null,
  baseline: { file: string | null; gitHead: string | null } | null,
  meta: { generated: string; gitHead: string; repeats: number },
): string {
  const lines: string[] = [];
  lines.push("# shast type-check benchmark");
  lines.push("");
  lines.push(`Generated ${meta.generated} at ${meta.gitHead.slice(0, 12)}.`);
  lines.push("");
  lines.push(
    `Compilers: ${compilers.map((c) => `${c.id} = TypeScript ${c.version}`).join(", ")}. ` +
      `Repeats: ${meta.repeats}. ` +
      "Instantiations are deterministic; check time is the mean over repeats.",
  );
  lines.push("");
  lines.push(
    "Measured against vendored single-tier trees (what `shast add` writes), " +
      "with `tsc --extendedDiagnostics`. `per-component` is the slope between " +
      "the two largest component counts.",
  );
  lines.push("");
  lines.push(...fixedCostTable(rows, compilers));
  lines.push(...slopeTable(rows, compilers, tiers, shapes));
  if (walls !== null) lines.push(...wallTable(walls, compilers, tiers, shapes));
  lines.push(...rawTables(rows, compilers));

  const errorRows = rows.filter((row) => row.errors > 0);
  if (errorRows.length > 0) {
    lines.push("## Fixtures that did not compile");
    lines.push("");
    for (const row of errorRows) {
      lines.push(
        `- ${row.tier}/${row.shape}/n=${row.n}: ` +
          `${row.errors} error(s) — ${row.errorSample ?? row.errorCode ?? "unknown"}`,
      );
    }
    lines.push("");
  }
  lines.push(...driftSection(rows, baseline));
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Parsed {
  compilers: string[];
  tiers: Tier[];
  shapes: ShapeId[];
  sizes: number[];
  repeats: number;
  saveBaseline: boolean;
  failOnError: boolean;
  failOnDrift: boolean;
  reportOnly: boolean;
  quick: boolean;
  /** JSON destination: an absolute path, `-` for stdout, or null when off. */
  jsonPath: string | null;
  wall: boolean;
  wallMax: number;
}

function parseArgs(argv: readonly string[]): Parsed {
  const parsed: Parsed = {
    compilers: Object.keys(COMPILER_PACKAGES),
    tiers: [...ALL_TIERS],
    shapes: [...ALL_SHAPES],
    sizes: [1, 10, 50, 100],
    repeats: 3,
    saveBaseline: false,
    failOnError: false,
    failOnDrift: false,
    reportOnly: false,
    quick: false,
    jsonPath: null,
    wall: false,
    wallMax: DEFAULT_WALL_MAX,
  };
  const list = (value: string | undefined, label: string): string[] => {
    if (value === undefined) throw new Error(`Option '${label}' requires a value`);
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  };
  const number = (value: string | undefined, label: string): number => {
    const parsedNumber = Number(value);
    if (value === undefined || !Number.isFinite(parsedNumber)) {
      throw new Error(`Option '${label}' requires a number`);
    }
    return parsedNumber;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!;
    // `pnpm run bench -- --quick` forwards the separator as a literal token.
    if (token === "--") continue;
    switch (token) {
      case "--compilers":
        parsed.compilers = list(argv[++i], token);
        break;
      case "--tiers":
        parsed.tiers = list(argv[++i], token) as Tier[];
        break;
      case "--shapes":
        parsed.shapes = list(argv[++i], token) as ShapeId[];
        break;
      case "--sizes":
        parsed.sizes = list(argv[++i], token).map(Number);
        break;
      case "--repeats":
        parsed.repeats = number(argv[++i], token);
        break;
      case "--wall-max":
        parsed.wallMax = number(argv[++i], token);
        break;
      case "--json": {
        const next = argv[i + 1];
        // The path is optional: bare `--json` means the tracked results file.
        if (next !== undefined && (next === "-" || !next.startsWith("--"))) {
          parsed.jsonPath = next;
          i += 1;
        } else {
          parsed.jsonPath = RESULTS_FILE;
        }
        break;
      }
      case "--save-baseline":
        parsed.saveBaseline = true;
        break;
      case "--fail-on-error":
        parsed.failOnError = true;
        break;
      case "--fail-on-drift":
        parsed.failOnDrift = true;
        break;
      case "--wall":
        parsed.wall = true;
        break;
      case "--report-only":
        parsed.reportOnly = true;
        break;
      case "--quick":
        parsed.quick = true;
        break;
      default:
        throw new Error(`Unknown option '${token}'`);
    }
  }
  if (parsed.quick) {
    parsed.tiers = ["common"];
    parsed.shapes = ["modest", "rich"];
    parsed.sizes = [1, 10];
    parsed.repeats = 1;
  }
  if (parsed.wallMax < 1) throw new Error("--wall-max must be >= 1");
  if (parsed.jsonPath !== null && parsed.jsonPath !== "-") {
    parsed.jsonPath = path.resolve(process.cwd(), parsed.jsonPath);
  }
  return parsed;
}

function main(argv: readonly string[]): number {
  const args = parseArgs(argv);

  // Regenerate the report from a previous run without re-measuring. Useful when
  // only the presentation changed; the raw counters are untouched.
  if (args.reportOnly) {
    const document = JSON.parse(
      readFileSync(RESULTS_FILE, "utf8"),
    ) as BenchmarkDocument;
    const baseline =
      document.baseline === null && document.baselineGitHead === null
        ? null
        : { file: document.baseline, gitHead: document.baselineGitHead };
    const report = markdown(
      document.rows,
      document.compilers,
      document.tiers,
      document.shapes,
      document.walls,
      baseline,
      {
        generated: document.generated,
        gitHead: document.gitHead,
        repeats: document.repeats,
      },
    );
    writeFileSync(REPORT_FILE, `${report}\n`);
    process.stdout.write(report + "\n");
    return 0;
  }

  const compilers = args.compilers.map(loadCompiler);
  if (compilers.length === 0) throw new Error("No compilers selected");

  // Saving the baseline means this run *is* the reference, so nothing is loaded
  // to diff against (matching the tsyntax harness's `--save`). Otherwise the
  // tracked baseline is read up front so every row can carry its delta.
  const baseline = args.saveBaseline ? null : loadBaseline();

  process.stderr.write(
    `shast bench: ${compilers.map((c) => `${c.id}=TS ${c.version}`).join(", ")}\n` +
      `  tiers=${args.tiers.join(",")} shapes=${args.shapes.join(",")} ` +
      `sizes=${args.sizes.join(",")} repeats=${args.repeats}` +
      `${args.wall ? ` wall<=${args.wallMax}` : ""}\n`,
  );

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  // Vendored trees, built once and shared by the per-component sweep and the
  // break-point sweep, so the wall sweep never re-vendors.
  const trees = new Map<Tier, string>();
  for (const tier of args.tiers) trees.set(tier, ensureTree(tier));

  const started = Date.now();
  const rows = sweep({
    compilers,
    tiers: args.tiers,
    shapes: args.shapes,
    sizes: args.sizes,
    repeats: args.repeats,
    trees,
  });
  attachDeltas(rows, baseline);

  const walls = args.wall
    ? runWalls(compilers, args.tiers, args.shapes, trees, args.wallMax)
    : null;

  const meta = {
    generated: new Date().toISOString(),
    gitHead: spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).stdout.trim(),
    repeats: args.repeats,
  };
  const baselineFile = path.relative(REPO_ROOT, BASELINE_FILE);
  const baselineMeta =
    baseline === null
      ? null
      : { file: baselineFile, gitHead: baseline.gitHead ?? null };

  // One document for both the JSON result and the baseline. The baseline is
  // this exact shape for a given commit; nothing is dropped from the result.
  const document: BenchmarkDocument = {
    harness: HARNESS_ID,
    ...meta,
    impl: IMPL,
    compilers: compilers.map(({ id, version }) => ({ id, version })),
    compilerOptions: MEASURE_COMPILER_OPTIONS,
    tiers: args.tiers,
    shapes: args.shapes,
    sizes: args.sizes,
    baseline: baselineMeta?.file ?? null,
    baselineGitHead: baselineMeta?.gitHead ?? null,
    rows: documentRows(rows),
    walls,
  };

  writeFileSync(RESULTS_FILE, `${JSON.stringify(document, null, 2)}\n`);
  const report = markdown(
    rows,
    compilers,
    args.tiers,
    args.shapes,
    walls,
    baselineMeta,
    meta,
  );
  writeFileSync(REPORT_FILE, `${report}\n`);

  if (args.saveBaseline) {
    writeFileSync(BASELINE_FILE, `${JSON.stringify(document, null, 2)}\n`);
    process.stderr.write(`shast bench: wrote ${baselineFile}\n`);
  }

  if (
    args.jsonPath !== null &&
    args.jsonPath !== "-" &&
    path.resolve(args.jsonPath) !== path.resolve(RESULTS_FILE)
  ) {
    writeFileSync(args.jsonPath, `${JSON.stringify(document, null, 2)}\n`);
    process.stderr.write(
      `shast bench: wrote ${path.relative(REPO_ROOT, args.jsonPath)}\n`,
    );
  }

  if (args.jsonPath === "-") {
    // Machine output owns stdout; the report is already in bench/out/RESULTS.md.
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  } else {
    process.stdout.write(report + "\n");
  }

  process.stderr.write(
    `\nshast bench: ${rows.length} measurements` +
      `${walls === null ? "" : ` + ${walls.length} break-points`} in ` +
      `${((Date.now() - started) / 1000).toFixed(1)}s ` +
      `-> ${path.relative(REPO_ROOT, OUT_DIR)}/\n`,
  );

  // Fixtures that do not compile are a *result* (a tier whose vocabulary does
  // not cover a shape, or one that exceeds the instantiation depth limit), not
  // a harness failure. `--fail-on-error` / `--fail-on-drift` turn them and any
  // counter drift into a non-zero exit for a caller that wants the harness to
  // gate.
  const failed = rows.filter((row) => row.errors > 0);
  if (failed.length > 0) {
    process.stderr.write(
      `shast bench: ${failed.length} fixture(s) did not compile; see RESULTS.md.\n`,
    );
  }
  const drifted = rows.filter(
    (row) =>
      row.deltaVsBaseline !== null &&
      (row.deltaVsBaseline.instantiations !== 0 || row.deltaVsBaseline.types !== 0),
  );
  if (drifted.length > 0) {
    process.stderr.write(
      `shast bench: ${drifted.length} row(s) drifted from ${baselineFile}; see RESULTS.md.\n`,
    );
  }

  if (args.failOnError && failed.length > 0) return 1;
  if (args.failOnDrift && drifted.length > 0) return 1;
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(
    `shast bench: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 2;
}
