#!/usr/bin/env node
// Language-service completion probe.
//
// The bench harness measures whole-program `tsc`, which says nothing about the
// editor's completion latency: a completion request resolves one contextual
// type and enumerates its properties, rather than checking every scenario. This
// probe drives the native API the language server exposes
// (`typescript/unstable/sync`) against a tree the harness generated, so a
// completion at a position can be timed cold (the first request after the
// snapshot loads) and warm (the same request repeated).
//
// Usage, after a bench run has produced bench/.generated:
//   node bench/lsp-probe.mjs --scenario mixed-big --at "css: {"
//
// Flags:
//   --variant   src (default) or a variant under bench/variants/
//   --tier      minimal | common | full (default: full)
//   --scenario  a name from bench/scenarios/ (default: mixed-big)
//   --at        text whose end marks the completion position (default: "css: {")
//   --runs      warm samples to take (default: 15)
//
// The generated tsconfig for a scenario must exist; run
// `pnpm bench -- --variants <variant> --tiers <tier> --scenarios <scenario>`
// first. The output is one JSON object: the entry count, cold and warm
// latencies, the server-side median, and the entry names joined into a hash so
// two runs (or two variants) can be compared.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { API } from "typescript/unstable/sync";

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
}

const variant = option("variant", "src");
const tier = option("tier", "full");
const scenario = option("scenario", "mixed-big");
const marker = option("at", "css: {");
const runs = Number(option("runs", "15"));

const repoRoot = path.resolve(import.meta.dirname, "..");
const config = path.join(
  repoRoot,
  "bench",
  ".generated",
  variant,
  tier,
  `tsconfig.${scenario}.json`,
);
const scenarioFile = path.join(repoRoot, "bench", "scenarios", `${scenario}.ts`);

if (!existsSync(config)) {
  throw new Error(
    `No generated config at ${path.relative(repoRoot, config)}. Run ` +
      `\`pnpm bench -- --variants ${variant} --tiers ${tier} ` +
      `--scenarios ${scenario}\` first.`,
  );
}

const text = readFileSync(scenarioFile, "utf8");
const at = text.indexOf(marker);
if (at < 0) {
  throw new Error(`Marker ${JSON.stringify(marker)} not found in ${scenarioFile}`);
}
const position = at + marker.length;

const api = new API({ collectTiming: true, cwd: repoRoot });
api.parseConfigFile(config);
const snapshot = api.updateSnapshot({ openProjects: [config] });
const project = snapshot.getProject(config);
if (!project) throw new Error(`Project ${config} was not loaded`);
const checker = project.checker;

// Cold: includes resolving the contextual type for the first time.
let started = performance.now();
let info = checker.getCompletionsAtPosition(scenarioFile, position);
const coldMs = performance.now() - started;
const names = (info?.entries ?? []).map((entry) => entry.name);

const samples = [];
for (let run = 0; run < runs; run += 1) {
  started = performance.now();
  info = checker.getCompletionsAtPosition(scenarioFile, position);
  samples.push(performance.now() - started);
}
samples.sort((a, b) => a - b);

const serverTimes = api
  .getTimingInfo()
  .recentRequests.filter((request) => request.method === "getCompletionsAtPosition")
  .map((request) => request.serverTimeMs)
  .filter((value) => value !== undefined && value !== null)
  .sort((a, b) => a - b);

const median = (values) => values[Math.floor(values.length / 2)];

process.stdout.write(
  `${JSON.stringify(
    {
      variant,
      tier,
      scenario,
      at: marker,
      position,
      files: project.program.getSourceFileNames().length,
      entries: names.length,
      isIncomplete: info?.isIncomplete ?? null,
      coldMs: Number(coldMs.toFixed(1)),
      warmMedianMs: Number(median(samples).toFixed(1)),
      warmMinMs: Number(samples[0].toFixed(1)),
      warmMaxMs: Number(samples[samples.length - 1].toFixed(1)),
      serverMedianMs: serverTimes.length ? Number(median(serverTimes).toFixed(1)) : null,
      namesHash: names.join("|"),
    },
    null,
    2,
  )}\n`,
);
api.close();
