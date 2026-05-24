import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "single-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('import "cpp:string"; function add(a, b) { return a + b; }', { moduleName: "module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile call expression output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "call-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function add(a, b) { return a + b; } add(1, 2);", { moduleName: "module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile trailing comma output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "trailing-comma-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(value, ) { var values = [value, 2,]; var data = { answer: value, }; return run(values[0],); }', { moduleName: "trailing_comma_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile compound assignment output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "compound-assignment-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(total, data, index) { total += 2; total -= 1; total *= 3; total /= 2; total %= 2; total **= 2; data.value += 1; data[index] *= 2; return total; }", { moduleName: "compound_assignment_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile update expression output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "update-expression-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(total, data, index) { ++total; total--; ++data.value; data[index]--; return total; }", { moduleName: "update_expression_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});
