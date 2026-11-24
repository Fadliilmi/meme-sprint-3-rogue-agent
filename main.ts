import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const dest = join(outDir, "entry.png");

// Fail fast locally if the meme image is not a valid PNG in gate limits
// (whole PNG, at most 1 MiB, at most 1024 by 1024 pixels): the sealed
// scorer would refuse it server-side, so catch a bad file before submit.
const bytes = readFileSync(source);
const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!bytes.subarray(0, 8).equals(pngMagic)) {
  throw new Error("entry.png is not a PNG file");
}
if (bytes.length > 1_048_576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB gate`);
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate`);
}
console.log(`entry.png is a valid ${width}x${height} PNG (${bytes.length} bytes)`);

mkdirSync(outDir, { recursive: true });
copyFileSync(source, dest);

const srcBytes = statSync(source).size;
const dstBytes = statSync(dest).size;
if (srcBytes !== dstBytes) {
  throw new Error(
    `entry.png copy mismatch: source ${srcBytes} bytes, dest ${dstBytes} bytes`,
  );
}
console.log(`Wrote ${dest} (${dstBytes} bytes)`);
