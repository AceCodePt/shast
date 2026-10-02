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
//   pnpm bench                 full sweep, both compilers, results + baseline
//   pnpm bench -- --quick      fast smoke run (common, modest+rich, n=1,10)
//   pnpm bench -- --tiers common --sizes 1,10,50,100
//
// Results are written to bench/out/results.json and bench/out/RESULTS.md. With
// --save-baseline the same payload is written to bench/baseline.json, which the
// next run diffs against to report drift.

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
const BASELINE_FILE = path.join(HERE, "baseline.json");

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

interface Compiler {
  id: string;
  /** Package alias in node_modules. */
  pkg: string;
  version: string;
  bin: string;
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
  return { id, pkg, version, bin };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Read one tier's variation file for a registry family. */
function readTierVariation(tier: Tier, family: string): string {
  return readFileSync(
    path.join(REPO_ROOT, "src", family, "variations", `${tier}.ts`),
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
    readTierVariation(tier, "css/queries-config"),
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
    readTierVariation(tier, "css/keyframes-config"),
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
    const result = spawnSync(
      process.execPath,
      [compiler.bin, "--pretty", "false", "--extendedDiagnostics", "-p", tsconfig],
      { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
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
  errorSample: string | null;
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
}

function sweep(options: SweepOptions): Row[] {
  const rows: Row[] = [];
  for (const tier of options.tiers) {
    const treeDir = ensureTree(tier);
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
          errorSample: d.errorSample,
        });
      }
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function find(
  rows: readonly Row[],
  compiler: string,
  tier: Tier,
  shape: ShapeId | "baseline",
  n: number,
): Row | undefined {
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
  rows: readonly Row[],
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

function fixedCostTable(rows: readonly Row[], compilers: readonly Compiler[]): string[] {
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
  rows: readonly Row[],
  compilers: readonly Compiler[],
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

function rawTables(rows: readonly Row[], compilers: readonly Compiler[]): string[] {
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

function driftSection(rows: readonly Row[]): string[] {
  if (!existsSync(BASELINE_FILE)) return [];
  let baseline: { rows?: Row[]; generated?: string };
  try {
    baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as typeof baseline;
  } catch {
    return ["## Baseline drift", "", "_bench/baseline.json is unreadable._", ""];
  }
  const previous = baseline.rows ?? [];
  const lines = ["## Baseline drift", ""];
  if (previous.length === 0) {
    lines.push("_bench/baseline.json holds no rows._", "");
    return lines;
  }
  const compared: string[] = [];
  const changed: string[] = [];
  for (const row of rows) {
    const match = previous.find(
      (old) =>
        old.compiler === row.compiler &&
        old.tier === row.tier &&
        old.shape === row.shape &&
        old.n === row.n,
    );
    if (match === undefined) continue;
    compared.push(`${row.compiler}/${row.tier}/${row.shape}/n=${row.n}`);
    if (match.instantiations !== row.instantiations) {
      const delta = row.instantiations - match.instantiations;
      const pct = match.instantiations === 0 ? "—" : `${((delta / match.instantiations) * 100).toFixed(1)}%`;
      changed.push(
        `- ${row.compiler}/${row.tier}/${row.shape}/n=${row.n}: ` +
          `${fmt(match.instantiations)} -> ${fmt(row.instantiations)} ` +
          `(${delta >= 0 ? "+" : ""}${fmt(delta)}, ${pct})`,
      );
    }
  }
  lines.push(
    `Compared ${compared.length} row(s) against baseline generated ${baseline.generated ?? "unknown"}.`,
  );
  lines.push("");
  if (changed.length === 0) {
    lines.push("No instantiation drift.");
  } else {
    lines.push("Instantiation drift:");
    lines.push("");
    lines.push(...changed);
  }
  lines.push("");
  return lines;
}

function markdown(
  rows: readonly Row[],
  compilers: readonly Compiler[],
  tiers: readonly Tier[],
  shapes: readonly ShapeId[],
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
  lines.push(...rawTables(rows, compilers));

  const errorRows = rows.filter((row) => row.errors > 0);
  if (errorRows.length > 0) {
    lines.push("## Fixtures that did not compile");
    lines.push("");
    for (const row of errorRows) {
      lines.push(
        `- ${row.tier}/${row.shape}/n=${row.n}: ${row.errors} error(s) — ${row.errorSample}`,
      );
    }
    lines.push("");
  }
  lines.push(...driftSection(rows));
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
  reportOnly: boolean;
  quick: boolean;
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
    reportOnly: false,
    quick: false,
  };
  const list = (value: string | undefined, label: string): string[] => {
    if (value === undefined) throw new Error(`Option '${label}' requires a value`);
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
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
        parsed.repeats = Number(argv[++i]);
        break;
      case "--save-baseline":
        parsed.saveBaseline = true;
        break;
      case "--fail-on-error":
        parsed.failOnError = true;
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
  return parsed;
}

function main(argv: readonly string[]): number {
  const args = parseArgs(argv);

  // Regenerate the report from a previous run without re-measuring. Useful when
  // only the presentation changed; the raw counters are untouched.
  if (args.reportOnly) {
    const payload = JSON.parse(
      readFileSync(path.join(OUT_DIR, "results.json"), "utf8"),
    ) as {
      generated: string;
      gitHead: string;
      repeats: number;
      compilers: Compiler[];
      tiers: Tier[];
      shapes: ShapeId[];
      rows: Row[];
    };
    const report = markdown(
      payload.rows,
      payload.compilers,
      payload.tiers,
      payload.shapes,
      {
        generated: payload.generated,
        gitHead: payload.gitHead,
        repeats: payload.repeats,
      },
    );
    writeFileSync(path.join(OUT_DIR, "RESULTS.md"), `${report}\n`);
    process.stdout.write(report + "\n");
    return 0;
  }

  const compilers = args.compilers.map(loadCompiler);
  if (compilers.length === 0) throw new Error("No compilers selected");

  process.stderr.write(
    `shast bench: ${compilers.map((c) => `${c.id}=TS ${c.version}`).join(", ")}\n` +
      `  tiers=${args.tiers.join(",")} shapes=${args.shapes.join(",")} ` +
      `sizes=${args.sizes.join(",")} repeats=${args.repeats}\n`,
  );

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const started = Date.now();
  const rows = sweep({
    compilers,
    tiers: args.tiers,
    shapes: args.shapes,
    sizes: args.sizes,
    repeats: args.repeats,
  });

  const meta = {
    generated: new Date().toISOString(),
    gitHead: spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).stdout.trim(),
    repeats: args.repeats,
  };
  const payload = {
    ...meta,
    compilers: compilers.map(({ id, pkg, version, bin }) => ({
      id,
      pkg,
      version,
      bin,
    })),
    compilerOptions: MEASURE_COMPILER_OPTIONS,
    tiers: args.tiers,
    shapes: args.shapes,
    sizes: args.sizes,
    rows,
  };
  writeFileSync(
    path.join(OUT_DIR, "results.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  const report = markdown(rows, compilers, args.tiers, args.shapes, meta);
  writeFileSync(path.join(OUT_DIR, "RESULTS.md"), `${report}\n`);

  if (args.saveBaseline) {
    // The baseline is a portable reference, not a machine record: keep the
    // deterministic counters and the averaged time, drop absolute binary paths
    // and the raw timing samples.
    const baseline = {
      generated: meta.generated,
      gitHead: meta.gitHead,
      compilers: payload.compilers.map(({ id, version }) => ({ id, version })),
      compilerOptions: payload.compilerOptions,
      tiers: args.tiers,
      shapes: args.shapes,
      sizes: args.sizes,
      repeats: args.repeats,
      rows: rows.map(
        ({ compiler, tier, shape, n, instantiations, types, checkTimeMs, errors }) => ({
          compiler,
          tier,
          shape,
          n,
          instantiations,
          types,
          checkTimeMs,
          errors,
        }),
      ),
    };
    writeFileSync(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
    process.stderr.write(`shast bench: wrote ${path.relative(REPO_ROOT, BASELINE_FILE)}\n`);
  }

  process.stdout.write(report + "\n");
  process.stderr.write(
    `\nshast bench: ${rows.length} measurements in ` +
      `${((Date.now() - started) / 1000).toFixed(1)}s ` +
      `-> ${path.relative(REPO_ROOT, OUT_DIR)}/\n`,
  );

  // Fixtures that do not compile are a *result* (a tier whose vocabulary does
  // not cover a shape, or one that exceeds the instantiation depth limit), not
  // a harness failure. `--fail-on-error` turns them into a non-zero exit for a
  // caller that wants the harness to gate.
  const failed = rows.filter((row) => row.errors > 0);
  if (failed.length > 0) {
    process.stderr.write(
      `shast bench: ${failed.length} fixture(s) did not compile; see RESULTS.md.\n`,
    );
  }
  return args.failOnError && failed.length > 0 ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(
    `shast bench: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 2;
}
