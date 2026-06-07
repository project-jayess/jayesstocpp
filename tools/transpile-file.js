#!/usr/bin/env node
import path from "node:path";
import { transpileFile } from "../src/api/transpile-file.js";

function usage() {
  return [
    "Usage: node tools/transpile-file.js <entry.js> <target-dir>",
    "",
    "Developer-only helper for exercising transpileFile() from this repository.",
    "This is not a public package CLI and is intentionally not exported as an npm bin."
  ].join("\n");
}

const [, , entryArg, targetArg] = process.argv;

if (entryArg == null || targetArg == null) {
  console.error(usage());
  process.exit(1);
}

try {
  const result = transpileFile(path.resolve(entryArg), path.resolve(targetArg));
  console.log(JSON.stringify({
    entryFilename: result.entryFilename,
    targetDirname: result.targetDirname,
    files: result.files.map((file) => path.relative(result.targetDirname, file).replace(/\\/g, "/"))
  }, null, 2));
} catch (error) {
  console.error(error?.stack ?? String(error));
  process.exit(1);
}
