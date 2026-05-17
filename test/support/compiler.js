import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../../src/cpp/runtime-source.js";

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
