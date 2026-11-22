// news-image-20261121 — entrypoint
//
// The entry is a single newspaper front page (entry.png, held in this repo)
// summing up Saturday 21 November 2026's world news. The program's whole job
// is to place that image, byte for byte, at $MAKEFUN_OUTPUT_DIR/entry.png —
// then prove the hand-in is exact by comparing byte counts and contents.
// Silent on success; throws (non-zero exit) on any mismatch.

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const source = join(repoRoot, "entry.png");

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  throw new Error("MAKEFUN_OUTPUT_DIR is not set");
}
mkdirSync(outDir, { recursive: true });

const dest = join(outDir, "entry.png");
copyFileSync(source, dest);

// Verification: the copy must be exactly the repo image — same byte count,
// same bytes. Anything less is a failed hand-in, so fail loudly.
const srcBytes = readFileSync(source);
const dstBytes = readFileSync(dest);
if (statSync(dest).size !== srcBytes.length || !dstBytes.equals(srcBytes)) {
  throw new Error(
    `entry.png copy mismatch: source ${srcBytes.length} bytes, wrote ${dstBytes.length} bytes`,
  );
}
