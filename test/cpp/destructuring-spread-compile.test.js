import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile destructuring output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "destructuring-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run() { var values = [1, 2]; var data = { name: "jayess", score: 3 }; var [left, right] = values; const { name, score: total } = data; return left + right + total; }', { moduleName: "destructuring_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile destructuring rest output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "destructuring-rest-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(values, data) { var [head, ...tail] = values; const { name, ...rest } = data; return tail; }', { moduleName: "destructuring_rest_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile expanded destructuring output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "destructuring-expanded-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(values, data, fallback, pair, info) { var [head = 1, { value, nested: [left = 2, ...tail] } = fallback] = values; var name = null; var total = null; ({ meta: { name = "Jayess" } = info, score: total = 0 } = data); for (var [current, ...rest] = values; current; current = current - 1) { value = current; } return left + total; }', { moduleName: "destructuring_expanded_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile array spread output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "array-spread-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(prefix, items) { return [...prefix, ...items, 4]; }", { moduleName: "array_spread_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile object spread output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "object-spread-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(base) { return { ...base, answer: 1 }; }', { moduleName: "object_spread_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile spread call output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "spread-call-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(fn, items, Point, coords) { fn(...items, 3); return new Point(...coords); }", { moduleName: "spread_call_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});
