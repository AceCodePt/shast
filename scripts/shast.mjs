#!/usr/bin/env node
// npm-installed entry for the `shast` CLI.
//
// The CLI itself is TypeScript (`scripts/cli.ts`) because the package ships raw
// TypeScript as its distribution format. Node refuses to strip types for files
// under `node_modules`, so this launcher re-execs Node with tsx's loader rather
// than letting npm shim the `.ts` file directly. `tsx` is a runtime dependency
// for exactly this reason.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./cli.ts", import.meta.url));

const child = spawn(
  process.execPath,
  ["--import", "tsx", cli, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
