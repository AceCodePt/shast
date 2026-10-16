#!/usr/bin/env node
// shast type-check benchmark harness.
//
// This is the in-repo replacement for the out-of-tree harness the README and
// docs/performance.md describe as "indicative". It measures `tsc` cost against
// the *vendored consumer trees* `shast add` writes - not against the repo's
// own barrel, which pulls in all three tiers.
//
// The model is variant x tier x scenario:
//
//   - A *variant* is a copy of the project: the repository's own `src` is the
//     default variant, spelled `src`; every other variant lives under
//     `bench/variants/<name>/`. Each variant and tier is vendored once into
//     `bench/.generated/<variant>/<tier>/shast` through the real `add()` from
//     `scripts/cli.ts`.
//   - A *tier* selects which shipped tier files are vendored.
//   - A *scenario* is a TypeScript file in `bench/scenarios/` that imports the
//     `@tier` alias. The alias resolves to the vendored tree's entry for the
//     current (variant, tier), so one run measures exactly one scenario
//     against exactly one tree.
//
// Scenarios are tier-agnostic: their text never mentions a tier, and the only
// per-combo difference is the tsconfig `shast` generates for them. That
// tsconfig extends the root tsconfig, maps `@tier` at the vendored entry, and
// includes exactly one scenario file.
//
// Run:
//   pnpm bench                              measure every variant x tier x scenario
//   pnpm bench -- --variants src,scratch    add the `scratch` variant
//   pnpm bench -- --tiers common            measure only the `common` tier
//   pnpm bench -- --scenarios null          measure only the `null` scenario
//   pnpm bench -- --json -                  emit the result document to stdout
//   pnpm bench -- --save-baseline           record bench/baseline.json
//   pnpm bench -- --fail-on-drift           exit 1 when a run drifts from baseline
//   pnpm bench -- --report-only             re-render RESULTS.md without measuring
//
// Flags:
//   --variants a,b   the variants to measure (default: src)
//   --tiers a,b      the tiers to measure (default: minimal,common,full)
//   --scenarios a,b  the scenario set to measure; by default every file in
//                    bench/scenarios/ is measured
//   --repeats n      the mean of n runs per measurement (default: 3)
//   --json [path|-]  emit the result document as JSON; `-` writes it to
//                    stdout, which moves all human output to stderr so the
//                    pipe stays parseable; default is the tracked results file
//   --save-baseline  write bench/baseline.json (the same document without the
//                    deltaVsNull and deltaVsBaseline fields)
//   --fail-on-drift  exit 1 when any scenario's instantiations or types differ
//                    from the recorded baseline
//   --report-only    re-render RESULTS.md from bench/out/results.json without
//                    measuring
//
// Results are written to bench/out/results.json and bench/out/RESULTS.md. The
// baseline and the JSON result share one schema (see `ResultsDocument`): the
// baseline is that document for a given commit, and every scenario carries its
// delta against it, so drift is a field-for-field comparison rather than a
// second code path.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
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
/** Vendored variant/tier trees and generated per-scenario tsconfigs. Gitignored. */
const GENERATED = path.join(HERE, ".generated");
/** Results. Gitignored except the deliberately tracked bench/baseline.json. */
const OUT_DIR = path.join(HERE, "out");
const RESULTS_FILE = path.join(OUT_DIR, "results.json");
const REPORT_FILE = path.join(OUT_DIR, "RESULTS.md");
const BASELINE_FILE = path.join(HERE, "baseline.json");
/** The scenario corpus: tier-agnostic TypeScript files importing `@tier`. */
const SCENARIOS_DIR = path.join(HERE, "scenarios");
/** Identifies the producer of a document, so a foreign JSON is recognisable. */
const HARNESS_ID = "shast-bench";
/** The single compiler measured: the repository's own `typescript` package. */
const COMPILER_PACKAGE = "typescript";

/** The measured compiler: the version and binary of one `tsc`. */
interface Compiler {
  bin: string;
  version: string;
}

function loadCompiler(): Compiler {
  const require = createRequire(import.meta.url);
  let pkgJson: string;
  try {
    pkgJson = require.resolve(`${COMPILER_PACKAGE}/package.json`);
  } catch {
    throw new Error(
      `Compiler '${COMPILER_PACKAGE}' is not installed. Run pnpm install.`,
    );
  }
  const bin = path.join(path.dirname(pkgJson), "bin", "tsc");
  const version = spawnSync(process.execPath, [bin, "--version"], {
    encoding: "utf8",
  }).stdout.trim().replace(/^Version\s+/, "");
  return { bin, version };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/** Every `*.ts` in the scenario corpus, sorted, with the extension stripped. */
function listScenarios(): string[] {
  if (!existsSync(SCENARIOS_DIR)) return [];
  return readdirSync(SCENARIOS_DIR)
    .filter((entry) => entry.endsWith(".ts"))
    .map((entry) => entry.slice(0, -".ts".length))
    .sort();
}

// ---------------------------------------------------------------------------
// Vendored trees
// ---------------------------------------------------------------------------

/**
 * Vendor the (variant, tier) tree with the real `add()` and return the directory
 * holding the tree's entry point. The destination `add` writes into is the
 * `shast` directory inside the tree root, so `<root>/shast/index.ts` is the
 * entry a scenario imports through `@tier`.
 */
function ensureTree(variant: string, tier: Tier): string {
  const root = path.join(GENERATED, variant, tier);
  rmSync(root, { recursive: true, force: true });
  const sourceRoot =
    variant === "src"
      ? REPO_ROOT
      : path.join(REPO_ROOT, "bench", "variants", variant);
  add({ sourceRoot, dest: path.join(root, "shast"), tier, force: true });
  return root;
}

/**
 * Write the tsconfig one scenario runs under. It extends the root tsconfig for
 * the strictness the project holds itself to, keeps `@types/node` out, maps
 * `@tier` at this tree's entry, and includes exactly this one scenario file, so
 * no run can be helped by another's cache.
 */
function writeScenarioConfig(treeRoot: string, scenario: string): string {
  const config = {
    extends: path.relative(treeRoot, path.join(REPO_ROOT, "tsconfig.json")),
    compilerOptions: {
      types: [],
      paths: { "@tier": ["./shast/index.ts"] },
    },
    exclude: ["node_modules", "dist"],
    include: [
      path.relative(treeRoot, path.join(SCENARIOS_DIR, `${scenario}.ts`)),
    ],
  };
  const file = path.join(treeRoot, `tsconfig.${scenario}.json`);
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  return file;
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

/** The error codes the compiler reported, deduplicated in order of appearance. */
function errorCodes(output: string): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const match of output.matchAll(/error (TS\d+)/g)) {
    const code = match[1]!;
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

interface RunCounters {
  instantiations: number;
  types: number;
  /** Check time in milliseconds (a single run; `measure` averages it). */
  checkMs: number;
  /** Total time in milliseconds (a single run; `measure` averages it). */
  totalMs: number;
  codes: string[];
}

function parseRun(output: string): Omit<RunCounters, "checkMs" | "totalMs"> {
  const count = (label: string): number => {
    const match = new RegExp(`^${label}:\\s+([\\d,]+)`, "m").exec(output);
    return match === null ? 0 : Number(match[1]!.replaceAll(",", ""));
  };
  return {
    instantiations: count("Instantiations"),
    types: count("Types"),
    codes: errorCodes(output),
  };
}

/** Measure one scenario once; instantiations and types come from this run. */
function measureOnce(compiler: Compiler, tsconfig: string): RunCounters {
  const result = spawnSync(
    process.execPath,
    [compiler.bin, "--pretty", "false", "--extendedDiagnostics", "-p", tsconfig],
    { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const run = parseRun(output);
  const checkMs = secondsOf(output, "Check time");
  const totalMs = secondsOf(output, "Total time");
  return {
    ...run,
    checkMs,
    totalMs,
  };
}

function secondsOf(output: string, label: string): number {
  const match = new RegExp(`^${label}:\\s+([\\d.]+)s`, "m").exec(output);
  return match === null ? 0 : Number(match[1]) * 1000;
}

/** Measure one scenario `repeats` times and average the wall-clock figures. */
function measure(
  compiler: Compiler,
  tsconfig: string,
  repeats: number,
): RunCounters {
  let first: RunCounters | null = null;
  let checkSum = 0;
  let totalSum = 0;
  for (let run = 0; run < repeats; run += 1) {
    const measurement = measureOnce(compiler, tsconfig);
    if (first === null) first = measurement;
    checkSum += measurement.checkMs;
    totalSum += measurement.totalMs;
  }
  const counters = first!;
  return {
    instantiations: counters.instantiations,
    types: counters.types,
    checkMs: checkSum / repeats,
    totalMs: totalSum / repeats,
    codes: counters.codes,
  };
}

// ---------------------------------------------------------------------------
// Results document
// ---------------------------------------------------------------------------

interface RecordedScenario {
  instantiations: number;
  types: number;
}

/** The per-scenario measurement as persisted, with the deltas filled in. */
interface ScenarioResult {
  instantiations: number;
  types: number;
  /** Mean check time over the repeats, as a `0.27s` string. */
  check: string;
  /** Mean total time over the repeats, as a `1.40s` string. */
  total: string;
  /** Whether the scenario's program compiled. */
  ok: boolean;
  /** The error codes the compiler reported, if any. */
  codes: string[];
  /** Change in instantiations since the null scenario, or null. */
  deltaVsNull: number | null;
  /** Change in instantiations since the baseline, or null. */
  deltaVsBaseline: number | null;
}

interface NearWallProblem {
  scenario: string;
  codes: string[];
}

interface VariantTierResult {
  impl: string;
  implLabel: string;
  variant: string;
  tier: Tier;
  scenarios: Record<string, ScenarioResult>;
  nearWallProblems: NearWallProblem[];
}

/** The result document and the baseline share this shape. */
interface ResultsDocument {
  harness: string;
  /** The version of the measured compiler. */
  tsc: string;
  /** When this document was produced. */
  generatedAt: string;
  /** The baseline this document was diffed against, if any. */
  baseline: string | null;
  results: Record<string, VariantTierResult>;
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * The recorded baseline is the result document without any comparison fields:
 * `baseline` is null and every scenario's `deltaVsNull`/`deltaVsBaseline` are
 * nulled, so a baseline is a reference rather than a diff of another baseline.
 */
function baselineDocument(document: ResultsDocument): ResultsDocument {
  const results: Record<string, VariantTierResult> = {};
  for (const [key, result] of Object.entries(document.results)) {
    const scenarios: Record<string, ScenarioResult> = {};
    for (const [name, scenario] of Object.entries(result.scenarios)) {
      scenarios[name] = {
        ...scenario,
        deltaVsNull: null,
        deltaVsBaseline: null,
      };
    }
    results[key] = { ...result, scenarios };
  }
  return {
    harness: document.harness,
    tsc: document.tsc,
    generatedAt: document.generatedAt,
    baseline: null,
    results,
  };
}

function nearWallCodes(codes: readonly string[]): boolean {
  return codes.some((code) => code === "TS2589" || code === "TS2590");
}

function implLabelOf(variant: string): string {
  return variant === "src"
    ? "the repository's own src"
    : `the ${variant} variant`;
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

function loadBaseline(): ResultsDocument | null {
  if (!existsSync(BASELINE_FILE)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
    // A foreign or older-schema document (for example the pre-variant `rows`
    // baseline) is not a compatible reference, so it is treated as absent.
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record["results"] !== "object" || record["results"] === null) {
      return null;
    }
    return parsed as ResultsDocument;
  } catch {
    return null;
  }
}

function recordedVariantTier(
  entry: unknown,
): Record<string, RecordedScenario> | null {
  if (typeof entry !== "object" || entry === null) return null;
  const record = entry as Record<string, unknown>;
  const scenarios = record["scenarios"];
  if (typeof scenarios !== "object" || scenarios === null) return null;
  const measured: Record<string, RecordedScenario> = {};
  for (const [name, value] of Object.entries(scenarios)) {
    const fields = value as Record<string, unknown>;
    const instantiations = fields["instantiations"];
    const types = fields["types"];
    if (
      typeof instantiations !== "number" ||
      typeof types !== "number"
    ) {
      continue;
    }
    measured[name] = { instantiations, types };
  }
  return measured;
}

/**
 * Fill each scenario's `deltaVsBaseline` from the recorded baseline: the change
 * in instantiations since the baseline measured the same scenario, or null
 * when the baseline has no matching row.
 */
function attachBaselineDeltas(
  results: Record<string, VariantTierResult>,
  baseline: ResultsDocument | null,
): void {
  if (baseline === null) return;
  for (const result of Object.values(results)) {
    const recorded = recordedVariantTier(
      (baseline.results as unknown as Record<string, unknown>)[
        `${result.variant}/${result.tier}`
      ],
    );
    if (recorded === null) continue;
    for (const [name, scenario] of Object.entries(result.scenarios)) {
      const previous = recorded[name];
      if (previous === undefined) continue;
      scenario.deltaVsBaseline =
        scenario.instantiations - previous.instantiations;
    }
  }
}

/** Every scenario whose instantiations or types differ from the recorded baseline. */
function driftEntries(
  results: Record<string, VariantTierResult>,
  baseline: ResultsDocument | null,
): string[] {
  const entries: string[] = [];
  if (baseline === null) return entries;
  for (const result of Object.values(results)) {
    const recorded = recordedVariantTier(
      (baseline.results as unknown as Record<string, unknown>)[
        `${result.variant}/${result.tier}`
      ],
    );
    if (recorded === null) continue;
    for (const [name, scenario] of Object.entries(result.scenarios)) {
      const previous = recorded[name];
      if (previous === undefined) continue;
      if (
        scenario.instantiations !== previous.instantiations ||
        scenario.types !== previous.types
      ) {
        entries.push(
          `${result.variant}/${result.tier}/${name}: instantiations ` +
            `${scenario.instantiations} (was ${previous.instantiations}), ` +
            `types ${scenario.types} (was ${previous.types})`,
        );
      }
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function renderReport(
  document: ResultsDocument,
  drift: readonly string[],
): string {
  const lines: string[] = [];
  lines.push("# shast type-check benchmark");
  lines.push("");
  lines.push(
    `Measured with ${document.tsc} against vendored variant x tier x scenario ` +
      `trees. Instantiations and types come from a single run; check and total ` +
      `are means over repeats.`,
  );
  lines.push("");
  if (document.baseline === null) {
    lines.push("_No baseline was recorded for this document._");
  } else {
    lines.push(`Baseline: ${document.baseline}`);
  }
  if (drift.length > 0) {
    lines.push("");
    lines.push("Drift against the baseline:", "");
    for (const entry of drift) lines.push(`- ${entry}`);
  }
  lines.push("");
  for (const [key, result] of Object.entries(document.results)) {
    lines.push(`## ${key}`);
    lines.push("");
    lines.push("| scenario | instantiations | types | check | total | ok |");
    lines.push("| --- | ---: | ---: | ---: | ---: | --- |");
    for (const [name, scenario] of Object.entries(result.scenarios)) {
      lines.push(
        `| ${name} | ${scenario.instantiations} | ${scenario.types} | ` +
          `${scenario.check} | ${scenario.total} | ${scenario.ok ? "yes" : "no"} |`,
      );
    }
    if (result.nearWallProblems.length > 0) {
      lines.push("");
      lines.push("Near the wall:");
      for (const problem of result.nearWallProblems) {
        lines.push(`- ${problem.scenario}: ${problem.codes.join(", ")}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Parsed {
  variants: string[];
  tiers: Tier[];
  scenarios: string[] | null;
  repeats: number;
  jsonPath: string | null;
  saveBaseline: boolean;
  failOnDrift: boolean;
  reportOnly: boolean;
}

function parseArgs(argv: readonly string[]): Parsed {
  const parsed: Parsed = {
    variants: ["src"],
    tiers: ["minimal", "common", "full"],
    scenarios: null,
    repeats: 3,
    jsonPath: null,
    saveBaseline: false,
    failOnDrift: false,
    reportOnly: false,
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
    // `pnpm run bench -- --json -` forwards the separator as a literal token.
    if (token === "--") continue;
    switch (token) {
      case "--variants":
        parsed.variants = list(argv[++i], token);
        break;
      case "--tiers":
        parsed.tiers = list(argv[++i], token) as Tier[];
        break;
      case "--scenarios":
        parsed.scenarios = list(argv[++i], token);
        break;
      case "--repeats":
        parsed.repeats = number(argv[++i], token);
        if (parsed.repeats < 1) throw new Error("--repeats must be >= 1");
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
      case "--fail-on-drift":
        parsed.failOnDrift = true;
        break;
      case "--report-only":
        parsed.reportOnly = true;
        break;
      default:
        throw new Error(`Unknown option '${token}'`);
    }
  }
  return parsed;
}

function measureVariantTier(
  compiler: Compiler,
  variant: string,
  tier: Tier,
  scenarios: readonly string[],
  repeats: number,
): VariantTierResult {
  const treeRoot = ensureTree(variant, tier);
  const measured = new Map<string, RunCounters>();
  for (const scenario of scenarios) {
    const tsconfig = writeScenarioConfig(treeRoot, scenario);
    const run = measure(compiler, tsconfig, repeats);
    measured.set(scenario, run);
    process.stderr.write(
      `  ${variant}/${tier} ${scenario}: ` +
        `${run.instantiations.toLocaleString("en-US")} inst, ` +
        `${formatSeconds(run.checkMs)}` +
        (run.codes.length === 0 ? "" : ` (${run.codes.join(", ")})`) +
        `\n`,
    );
  }
  const nullScenario = scenarios.includes("null") ? "null" : undefined;
  const results: Record<string, ScenarioResult> = {};
  for (const scenario of scenarios) {
    const run = measured.get(scenario)!;
    const nullRun = nullScenario === undefined
      ? undefined
      : measured.get(nullScenario);
    results[scenario] = {
      instantiations: run.instantiations,
      types: run.types,
      check: formatSeconds(run.checkMs),
      total: formatSeconds(run.totalMs),
      ok: run.codes.length === 0,
      codes: run.codes,
      deltaVsNull:
        nullRun === undefined
          ? null
          : run.instantiations - nullRun.instantiations,
      deltaVsBaseline: null,
    };
  }
  return {
    impl: variant,
    implLabel: implLabelOf(variant),
    variant,
    tier,
    scenarios: results,
    nearWallProblems: scenarios
      .filter((scenario) =>
        nearWallCodes(measured.get(scenario)!.codes),
      )
      .map((scenario) => ({
        scenario,
        codes: measured.get(scenario)!.codes,
      })),
  };
}

function main(argv: readonly string[]): number {
  const args = parseArgs(argv);
  const compiler = loadCompiler();

  // Regenerate the report from a previous run without re-measuring. Useful when
  // only the presentation changed; the raw counters are untouched.
  if (args.reportOnly) {
    const document = JSON.parse(
      readFileSync(RESULTS_FILE, "utf8"),
    ) as ResultsDocument;
    const report = renderReport(document, []);
    writeReportFile(report);
    process.stdout.write(`${report}\n`);
    return 0;
  }

  const allScenarios = listScenarios();
  const scenarios =
    args.scenarios === null
      ? allScenarios
      : args.scenarios.filter((scenario) => allScenarios.includes(scenario));

  const baseline = args.saveBaseline ? null : loadBaseline();
  let baselineField: string | null = null;
  if (baseline !== null) {
    baselineField = path.relative(REPO_ROOT, BASELINE_FILE);
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const results: Record<string, VariantTierResult> = {};
  for (const variant of args.variants) {
    for (const tier of args.tiers) {
      const result = measureVariantTier(
        compiler,
        variant,
        tier,
        scenarios,
        args.repeats,
      );
      results[`${variant}/${tier}`] = result;
    }
  }

  const document: ResultsDocument = {
    harness: HARNESS_ID,
    tsc: compiler.version,
    generatedAt: new Date().toISOString(),
    baseline: args.saveBaseline ? null : baselineField,
    results,
  };
  attachBaselineDeltas(document.results, baseline);
  const drift = driftEntries(document.results, baseline);

  const report = renderReport(document, drift);
  writeReportFile(report);
  writeFileSync(
    RESULTS_FILE,
    `${JSON.stringify(document, null, 2)}\n`,
  );

  if (args.saveBaseline) {
    writeFileSync(
      BASELINE_FILE,
      `${JSON.stringify(baselineDocument(document), null, 2)}\n`,
    );
    process.stderr.write(
      `shast bench: wrote ${path.relative(REPO_ROOT, BASELINE_FILE)}\n`,
    );
  }

  if (
    args.jsonPath !== null &&
    args.jsonPath !== "-" &&
    path.resolve(args.jsonPath) !== path.resolve(RESULTS_FILE)
  ) {
    writeFileSync(
      args.jsonPath,
      `${JSON.stringify(document, null, 2)}\n`,
    );
    process.stderr.write(
      `shast bench: wrote ${path.relative(REPO_ROOT, args.jsonPath)}\n`,
    );
  }

  if (args.jsonPath === "-") {
    // Machine output owns stdout; the report is already in bench/out/RESULTS.md.
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  } else {
    process.stdout.write(`${report}\n`);
  }

  if (args.failOnDrift && drift.length > 0) {
    return 1;
  }
  return 0;
}

function writeReportFile(report: string): void {
  writeFileSync(REPORT_FILE, `${report}\n`);
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(
    `shast bench: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 2;
}
