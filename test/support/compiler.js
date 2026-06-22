import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../../src/cpp/runtime-source.js";

function platformLibrariesForTarget(targetDir) {
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  if (!fs.existsSync(hintsPath)) {
    return [];
  }
  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  const libraries = new Set();
  for (const hint of hints.platformLibraryHints ?? []) {
    for (const library of hint.libraries ?? []) {
      libraries.add(library);
    }
  }
  const requiredAtLinkTime = process.platform === "win32"
    ? new Set(["gdi32", "user32", "ws2_32"])
    : new Set();
  return [...libraries].filter((library) => requiredAtLinkTime.has(library)).sort();
}

export function findAvailableCompiler() {
  for (const command of ["clang++", "c++", "g++"]) {
    try {
      execFileSync(command, ["--version"], {
        stdio: "pipe",
        encoding: "utf8"
      });
      return command;
    } catch {
      continue;
    }
  }

  return null;
}

export function writeRuntime(targetDir) {
  const runtimeDir = path.join(targetDir, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.hpp"), getRuntimeHeaderSource(), "utf8");
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.cpp"), getRuntimeCppSource(), "utf8");
  return path.join(runtimeDir, "jayess_runtime.cpp");
}

export function compileCppFiles(files, includeDir) {
  const compiler = findAvailableCompiler();
  if (compiler == null) {
    throw new Error("No supported C++ compiler found. Install clang++, c++, or g++ to run compile-validation tests.");
  }

  const args = [
    "-std=c++17",
    "-c",
    ...files,
    "-I",
    includeDir
  ];

  execFileSync(compiler, args, {
    stdio: "pipe",
    encoding: "utf8",
    cwd: includeDir,
    env: { ...process.env, TMPDIR: os.tmpdir(), TEMP: os.tmpdir(), TMP: os.tmpdir() }
  });
}

export function compileAndRunCppExecutable(files, includeDir, mainSource, executableName = "jayess-runtime-probe") {
  const compiler = findAvailableCompiler();
  if (compiler == null) {
    throw new Error("No supported C++ compiler found. Install clang++, c++, or g++ to run runtime-validation tests.");
  }

  const mainPath = path.join(includeDir, `${executableName}.cpp`);
  const executablePath = path.join(includeDir, process.platform === "win32" ? `${executableName}.exe` : executableName);
  const platformLibraries = platformLibrariesForTarget(includeDir).map((library) => `-l${library}`);
  fs.writeFileSync(mainPath, mainSource, "utf8");

  execFileSync(compiler, [
    "-std=c++17",
    "-pthread",
    ...files,
    mainPath,
    "-I",
    includeDir,
    "-o",
    executablePath,
    ...platformLibraries
  ], {
    stdio: "pipe",
    encoding: "utf8",
    cwd: includeDir,
    env: { ...process.env, TMPDIR: includeDir, TEMP: includeDir, TMP: includeDir }
  });

  return execFileSync(executablePath, [], {
    stdio: "pipe",
    encoding: "utf8",
    cwd: includeDir,
    env: { ...process.env, TMPDIR: includeDir, TEMP: includeDir, TMP: includeDir }
  });
}
