// Data step for the `piped` variant: convert shast attribute-arm arrays
// ("a", "b") into a single piped DSL string ("a | b"), anywhere in a tier file.
//
// Only arrays whose sole content is double-quoted string literals are touched,
// so structural arrays holding other values are left alone; include /
// cssPseudoClass / cssPseudoElement are skipped explicitly. The syntax-config
// and keyframes-config token arms are not passed in - they stay arrays.
//
// The type and runtime edits that make the result compile are described in
// README.md; the committed src/ is the source of truth.
//
// Usage, from the repository root:
//   node bench/variants/piped/pipedify.mjs \
//     src/css/attribute-config/tiers/*.ts \
//     src/html/attribute-config/tiers/*.ts \
//     src/html/tag-config/tiers/*.ts
import { readFileSync, writeFileSync } from "node:fs";

const SKIP = new Set(["include", "cssPseudoClass", "cssPseudoElement"]);
const ARRAY =
  /([A-Za-z0-9_$-]+|"[^"\n]*"|'[^'\n]*')\s*:\s*\[\s*("(?:[^"\\]|\\.)*"(?:\s*,\s*"(?:[^"\\]|\\.)*")*\s*,?\s*)\]/g;

let converted = 0;
let skipped = 0;

for (const file of process.argv.slice(2)) {
  const source = readFileSync(file, "utf8");
  const out = source.replace(ARRAY, (match, key, content) => {
    const bare = key.replace(/^["']|["']$/g, "");
    if (SKIP.has(bare)) {
      skipped += 1;
      return match;
    }
    const parts = [];
    const re = /"((?:[^"\\]|\\.)*)"/g;
    let mm;
    while ((mm = re.exec(content)) !== null) {
      parts.push(mm[1].replace(/\\"/g, '"'));
    }
    if (parts.length === 0) return match;
    converted += 1;
    return `${key}: ${JSON.stringify(parts.join(" | "))}`;
  });
  writeFileSync(file, out);
}

console.log(`converted=${converted} skipped=${skipped}`);
