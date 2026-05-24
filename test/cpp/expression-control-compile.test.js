import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile conditional output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "conditional-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("if (1) { var x = 2; } else { var y = 3; }", { moduleName: "module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile boolean literal output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "boolean-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { var enabled = true; if (enabled) { return false; } return true; }", { moduleName: "boolean_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile null literal output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "null-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { var value = null; if (value == null) { return 1; } return 0; }", { moduleName: "null_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile unary logical not output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "unary-not-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { var disabled = !false; if (!disabled) { return 0; } return 1; }", { moduleName: "unary_not_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile unary minus output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "unary-minus-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { var value = -1; if (value < 0) { return -value; } return 0; }", { moduleName: "unary_minus_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile logical operator output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "logical-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(left, right, backup) { var result = left || right && backup; if (result) { return result; } return backup; }", { moduleName: "logical_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile nullish coalescing output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "nullish-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function choose(left, right, fallback) { return left ?? right ?? fallback; } function run() { return choose(null, 1, 2); }", { moduleName: "nullish_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile optional chaining output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "optional-chain-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(data, index, callback) { return callback?.(data?.value, data?.[index]); }", { moduleName: "optional_chain_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile ternary output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "ternary-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function choose(flag, left, right) { return flag ? left : right; } function run(flag, left, right) { var value = choose(flag, left, right); return value ? choose(false, 1, 2) : choose(true, 3, 4); }", { moduleName: "ternary_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile try/catch/finally output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "try-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(values) { try { values.push(1); } catch (err) { return err.toString(); } finally { values.push(2); } }', { moduleName: "try_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile finally control-flow output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "finally-control-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(values) { while (values.length) { try { values.pop(); } finally { if (values.length) { continue; } break; } } try { return 1; } finally { return 2; } }", {
      moduleName: "finally_control_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile throw output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "throw-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(value) { try { throw value; } catch (err) { return err; } }", { moduleName: "throw_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile switch output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "switch-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(value) { switch (value) { case 1: return 1; case 2: return 2; default: return 3; } }", { moduleName: "switch_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile strict equality output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "strict-equality-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(a, b) { if (a === b) { return true; } return a !== b; }", { moduleName: "strict_equality_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile modulo output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "modulo-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(a, b) { var remainder = a % b; if (remainder == 0) { return true; } return false; }", { moduleName: "modulo_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile exponentiation output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "power-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(a, b) { var value = a ** b; if (value > 0) { return value ** 1; } return 0; }", { moduleName: "power_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile unary plus output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "positive-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run(a) { var value = +a; if (+value > 0) { return +value; } return 0; }", { moduleName: "positive_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile template literal output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "template-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(name, count) { return `Hello ${name} ${count}`; }', { moduleName: "template_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile while-loop output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "while-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("while (1) { break; }", { moduleName: "while_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile for-loop control flow output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "for-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { for (var i = 0; i < 3; i = i + 1) { continue; } return 1; }", { moduleName: "for_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile do-while output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "do-while-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function run() { var total = 0; do { total += 1; if (total > 2) { break; } } while (total < 5); return total; }", { moduleName: "do_while_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile array and object access output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "composite-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run() { var data = { name: "jayess", items: [1, 2] }; return data.items[0]; }', { moduleName: "composite_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile member assignment output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "member-assignment-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run() { var data = { name: "jayess", items: [1, 2] }; data.name = "updated"; data.items[0] = 3; return data.items[0]; }', { moduleName: "member_assignment_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});
