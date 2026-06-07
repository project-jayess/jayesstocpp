#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage() {
  return [
    "Usage: node tools/compile-generated-project.js <generated-cpp-dir> <output-executable>",
    "",
    "Developer-only helper for compiling generated Jayess C++ projects.",
    "This is not a public package CLI and is intentionally not exported as an npm bin."
  ].join("\n");
}

function findCompiler() {
  for (const command of ["clang++", "c++", "g++"]) {
    try {
      execFileSync(command, ["--version"], { stdio: "pipe" });
      return command;
    } catch {
      continue;
    }
  }
  return null;
}

function collectCppFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCppFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".cpp")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function platformLibraries(targetDir) {
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  if (!fs.existsSync(hintsPath)) {
    return [];
  }
  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  const requiredAtLinkTime = new Set(["gdi32", "user32", "ws2_32"]);
  const libraries = new Set();
  for (const hint of hints.platformLibraryHints ?? []) {
    for (const library of hint.libraries ?? []) {
      if (requiredAtLinkTime.has(library)) {
        libraries.add(library);
      }
    }
  }
  return [...libraries].sort().map((library) => `-l${library}`);
}

const [, , generatedDirArg, outputArg] = process.argv;

if (generatedDirArg == null || outputArg == null) {
  console.error(usage());
  process.exit(1);
}

const generatedDir = path.resolve(generatedDirArg);
const outputBase = path.resolve(outputArg);
const outputPath = process.platform === "win32" && !outputBase.endsWith(".exe")
  ? `${outputBase}.exe`
  : outputBase;
const compiler = findCompiler();

if (compiler == null) {
  console.error("No supported C++ compiler found. Install clang++, c++, or g++.");
  process.exit(1);
}

const cppFiles = collectCppFiles(generatedDir);
if (cppFiles.length === 0) {
  console.error(`No .cpp files found under ${generatedDir}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

execFileSync(compiler, [
  "-std=c++17",
  "-pthread",
  ...cppFiles,
  "-I",
  generatedDir,
  "-o",
  outputPath,
  ...platformLibraries(generatedDir)
], {
  stdio: "inherit",
  cwd: generatedDir,
  env: { ...process.env, TMPDIR: os.tmpdir(), TEMP: os.tmpdir(), TMP: os.tmpdir() }
});

console.log(JSON.stringify({
  compiler,
  generatedDir,
  outputPath,
  files: cppFiles.length
}, null, 2));
