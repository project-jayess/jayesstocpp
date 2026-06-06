import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

function compileGeneratedExecutable(files, includeDir, executableName) {
  const compiler = findAvailableCompiler();
  const executablePath = path.join(includeDir, process.platform === "win32" ? `${executableName}.exe` : executableName);

  execFileSync(compiler, [
    "-std=c++17",
    "-pthread",
    ...files,
    "-I",
    includeDir,
    "-o",
    executablePath
  ], {
    stdio: "pipe",
    encoding: "utf8",
    cwd: includeDir,
    env: { ...process.env, TMPDIR: includeDir, TEMP: includeDir, TMP: includeDir }
  });

  return executablePath;
}

compileTest("transpileFile trailing comma project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "trailing-comma-project-compile");
  const fixture = path.resolve("test/fixtures/modules/trailing-commas-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile pruned minimal arithmetic project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-pruned-minimal-compile");
  const fixture = path.resolve("test/fixtures/modules/arithmetic-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile package-project output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "package-project-compile");
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile jayess package condition project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "package-jayess-condition-compile");
  const fixture = path.resolve("test/fixtures/package-project/src/jayess-condition-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile hardening project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "hardening-project-compile");
  const fixture = path.resolve("test/fixtures/modules/hardening-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile larger mixed module graph project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "graph-project-compile");
  const fixture = path.resolve("test/fixtures/modules/graph-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "project-compile");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile default import/export project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-import-compile");
  const fixture = path.resolve("test/fixtures/modules/default-import-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile default-exported function project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-function-compile");
  const fixture = path.resolve("test/fixtures/modules/default-function-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile anonymous default-exported function project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-anonymous-function-compile");
  const fixture = path.resolve("test/fixtures/modules/default-anonymous-function-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile shared-library layout compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "shared-layout-compile");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir, {
    projectKind: "shared-library",
    libraryName: "jayess_demo"
  });
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile executable layout links and uses top-level main exit code", (t) => {
  const targetDir = createManagedTempDir(t, "executable-layout-compile");
  const fixture = path.resolve("test/fixtures/modules/native-entry-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));
  const executablePath = compileGeneratedExecutable(cppFiles, targetDir, "jayess-native-entry-main");
  const run = spawnSync(executablePath, [], {
    cwd: targetDir,
    encoding: "utf8",
    env: { ...process.env, TMPDIR: targetDir, TEMP: targetDir, TMP: targetDir }
  });

  assert.equal(run.status, 7);
  assert.equal(run.stderr, "");
});

compileTest("transpileFile namespace import project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "namespace-compile");
  const fixture = path.resolve("test/fixtures/modules/namespace-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile re-export chain project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "reexport-chain-compile");
  const fixture = path.resolve("test/fixtures/modules/reexport-chain-consumer.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile export-all project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "export-all-compile");
  const fixture = path.resolve("test/fixtures/modules/export-all-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});
