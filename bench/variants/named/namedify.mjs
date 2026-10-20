// Refresh the `named` variant from the repository's src.
//
// The variant differs from `src` in exactly one file (engine/types.ts), so a
// refresh keeps that file and copies everything else. Re-derive engine/types.ts
// by hand when the engine changes; this script only keeps it while syncing the
// other files.
//
// Usage, from the repository root:
//   node bench/variants/named/namedify.mjs
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const NAMED = "bench/variants/named/src";
const TYPES = `${NAMED}/engine/types.ts`;

const namedTypes = readFileSync(TYPES);
rmSync(NAMED, { recursive: true, force: true });
cpSync("src", NAMED, { recursive: true });
writeFileSync(TYPES, namedTypes);

console.log(`refreshed ${NAMED} from src, kept engine/types.ts`);
