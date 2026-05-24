import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile generator class method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-class-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Worker { *items(value) { yield value; return value; } } function run(value) { var worker = new Worker(); return worker.items(value); }", { moduleName: "generator_class_method_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* inner(value) { yield value; return value; } function* outer(value) { yield* inner(value); return value; }", { moduleName: "generator_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator function expression output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-expression-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function build(step) { var make = function* named(value) { yield value; return step; }; return make; } function run() { return build(1); }", { moduleName: "generator_expression_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator expression-yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-expression-yield-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(value, use, target) { var sum = 1 + (yield value); use(yield sum); target.value = yield sum; return yield target.value; }", { moduleName: "generator_expression_yield_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator short-circuit expression-yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-short-circuit-expression-yield-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(left, right) { var a = left && (yield right); var b = left || (yield right); return left ?? (yield right); }", { moduleName: "generator_short_circuit_expression_yield_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator composite expression-yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-composite-expression-yield-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(flag, first, second) { var items = [yield first, flag ? (yield second) : first]; var record = { first: yield first, second: items }; return flag ? record : items; }", {
      moduleName: "generator_composite_expression_yield_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator local-state output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-local-state-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(input) { var first = yield input; yield* input; return first; }", { moduleName: "generator_local_state_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator nested control-flow output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-control-flow-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile(
      "function* run(flag, items) { if (flag) { yield items[0]; } else { yield items[1]; } var index = 0; while (index < 2) { yield index; index = index + 1; } for (var step = 0; step < 2; step = step + 1) { yield step; } }",
      { moduleName: "generator_control_flow_module" }
    ),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile expanded generator statement yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-expanded-statement-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(value) { do { yield value; } while (false); switch (value) { case 1: yield value; break; default: yield 0; } try { value = value + 1; yield value; } catch (error) { return error; } return value; }", {
      moduleName: "generator_expanded_statement_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator multi-yield try/catch output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-multi-try-catch-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } catch (error) { return error; } return value; }", {
      moduleName: "generator_multi_try_catch_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator try/finally yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-try-finally-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } finally { value = value + 4; } return value; }", {
      moduleName: "generator_try_finally_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator catch-body yield output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-catch-yield-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(value) { try { if (value) { throw value; } } catch (error) { value = error; yield value; value = value + 1; } return value; }", {
      moduleName: "generator_catch_yield_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator destructuring output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-destructuring-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function* run(pair, record) { var [first, second] = pair; var { name } = record; yield first; yield second; return name; }", {
      moduleName: "generator_destructuring_module"
    }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile generator yield-star destructuring output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "generator-yield-star-destructuring-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile(
      "function* run(source) { var [first, second] = yield* source; var { value } = yield* source; yield first; yield second; return value; }",
      { moduleName: "generator_yield_star_destructuring_module" }
    ),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});
