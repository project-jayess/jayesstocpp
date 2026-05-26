import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpileFile built-in canvas module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in canvas clip stack project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-clip-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-clip-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in canvas stroke width project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-stroke-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-stroke-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in canvas alpha compositing project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-alpha-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-alpha-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in canvas golden scene project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-golden-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-golden-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in canvas drawing state project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-state-project-compile");
  const fixture = path.resolve("test/fixtures/modules/canvas-state-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});
