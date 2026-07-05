#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage() {
  return [
    "Usage: node tools/compile-generated-project.js [--debug] <generated-cpp-dir> <output-executable>",
    "",
    "Developer-only helper for compiling generated Jayess C++ projects.",
    "This is not a public package CLI and is intentionally not exported as an npm bin.",
    "",
    "By default this builds a size-oriented release executable.",
    "Use --debug to keep compiler defaults and symbols for native debugging."
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

function collectSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".cpp") || entry.name.endsWith(".c"))) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function includeDirectories(targetDir) {
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  if (!fs.existsSync(hintsPath)) {
    return [targetDir];
  }
  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  return (hints.includeDirectories ?? ["."])
    .map((directory) => path.resolve(targetDir, directory));
}

function compileDefinitions(targetDir) {
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  if (!fs.existsSync(hintsPath)) {
    return [];
  }
  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  return (hints.compileDefinitions ?? []).map((definition) => `-D${definition}`);
}

function platformLibraries(targetDir) {
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  if (!fs.existsSync(hintsPath)) {
    return [];
  }
  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  const requiredAtLinkTime = process.platform === "win32"
    ? new Set(["gdi32", "user32", "ws2_32"])
    : new Set();
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

function parseArgs(args) {
  const options = { debug: false };
  const positional = [];

  for (const arg of args) {
    if (arg === "--debug") {
      options.debug = true;
    } else {
      positional.push(arg);
    }
  }

  return { options, positional };
}

function sizeFlags() {
  if (process.platform === "darwin") {
    return {
      compile: ["-Os", "-ffunction-sections", "-fdata-sections"],
      link: ["-Wl,-dead_strip", "-Wl,-x"]
    };
  }

  return {
    compile: ["-Os", "-ffunction-sections", "-fdata-sections"],
    link: ["-Wl,--gc-sections", "-s"]
  };
}

const { options, positional } = parseArgs(process.argv.slice(2));
const [generatedDirArg, outputArg] = positional;

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

const sourceFiles = collectSourceFiles(generatedDir);
if (sourceFiles.length === 0) {
  console.error(`No C/C++ source files found under ${generatedDir}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const releaseFlags = options.debug ? { compile: [], link: [] } : sizeFlags();

execFileSync(compiler, [
  "-std=c++17",
  "-pthread",
  ...releaseFlags.compile,
  ...sourceFiles,
  ...compileDefinitions(generatedDir),
  ...includeDirectories(generatedDir).flatMap((directory) => ["-I", directory]),
  "-o",
  outputPath,
  ...releaseFlags.link,
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
  mode: options.debug ? "debug" : "release-size",
  compileFlags: releaseFlags.compile,
  linkFlags: releaseFlags.link,
  files: sourceFiles.length
}, null, 2));
