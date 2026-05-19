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

compileTest("transpile async function output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "async-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("async function inner(value) { return value + 1; } async function outer(value) { var next = await inner(value); return next + 1; }", { moduleName: "async_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile async function expression and async arrow output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "async-expression-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile(
      "function build(step) { var declared = async function run(value) { return await value + step; }; var arrow = async (value = step) => await value + step; return [declared, arrow]; } function run(input) { var pair = build(1); return pair; }",
      { moduleName: "async_expression_module" }
    ),
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

compileTest("transpile function default parameter output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-param-function-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function greet(name, title = `Mx. ${name}`) { return title; } function run() { return greet(\"Jayess\"); }", { moduleName: "default_param_function_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile rest parameter output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "rest-param-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function collect(head, ...tail) { return tail; } function run() { return collect(1, 2, 3); }", { moduleName: "rest_param_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile method default parameter output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-param-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Greeter { constructor(name) { this.name = name; } greet(title = `Mx. ${this.name}`) { return title; } } function run() { var greeter = new Greeter(\"Jayess\"); return greeter.greet(); }", { moduleName: "default_param_method_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile async class method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "async-class-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Worker { async run(value) { return await value; } } function run(value) { var worker = new Worker(); return worker.run(value); }", { moduleName: "async_class_method_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

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

compileTest("transpile constructor default parameter output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-param-constructor-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Greeter { constructor(name = \"Jayess\") { this.name = name; } greet() { return this.name; } } function run() { var greeter = new Greeter(); return greeter.greet(); }", { moduleName: "default_param_constructor_module" }),
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

compileTest("transpileFile trailing comma project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "trailing-comma-project-compile");
  const fixture = path.resolve("test/fixtures/modules/trailing-commas-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
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

compileTest("transpile composite built-in output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "composite-builtins-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(values) { var size = values.length; values.push(3); return "Jayess".length + size; }', { moduleName: "composite_builtins_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile primitive toString built-in output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "primitive-tostring-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run() { var one = (1).toString(); var truth = true.toString(); var empty = null.toString(); return one; }', { moduleName: "primitive_tostring_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile array and string method built-in output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "array-string-methods-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('function run(values, text) { var last = values.pop(); var joined = values.join("-"); var found = values.includes(2); var sliced = text.slice(1, 3); var sub = text.substring(2); var hasMid = text.includes("aye"); var firstIndex = text.indexOf("ye"); var hasSuffix = text.endsWith("ss"); return text.startsWith("Ja"); }', { moduleName: "array_string_methods_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
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

compileTest("transpileFile built-in date module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-date-project-compile");
  const fixture = path.resolve("test/fixtures/modules/date-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in json module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-json-project-compile");
  const fixture = path.resolve("test/fixtures/modules/json-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in map module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-map-project-compile");
  const fixture = path.resolve("test/fixtures/modules/map-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in set module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-set-project-compile");
  const fixture = path.resolve("test/fixtures/modules/set-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in object module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-object-project-compile");
  const fixture = path.resolve("test/fixtures/modules/object-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in number module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-number-project-compile");
  const fixture = path.resolve("test/fixtures/modules/number-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in math module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-math-project-compile");
  const fixture = path.resolve("test/fixtures/modules/math-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in iterator module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-iter-project-compile");
  const fixture = path.resolve("test/fixtures/modules/iter-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in path module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-path-project-compile");
  const fixture = path.resolve("test/fixtures/modules/path-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in filesystem module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-project-compile");
  const fixture = path.resolve("test/fixtures/modules/fs-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in string module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-string-project-compile");
  const fixture = path.resolve("test/fixtures/modules/string-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in array module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-array-project-compile");
  const fixture = path.resolve("test/fixtures/modules/array-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in async module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-async-project-compile");
  const fixture = path.resolve("test/fixtures/modules/async-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in regex module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-regex-project-compile");
  const fixture = path.resolve("test/fixtures/modules/regex-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in system module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-system-project-compile");
  const fixture = path.resolve("test/fixtures/modules/system-modules-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in jayess:system module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-system-alias-project-compile");
  const fixture = path.resolve("test/fixtures/modules/system-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile built-in thread module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-thread-project-compile");
  const fixture = path.resolve("test/fixtures/modules/thread-main.js");
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

compileTest("transpileFile default-exported class project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-class-compile");
  const fixture = path.resolve("test/fixtures/modules/default-class-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpileFile anonymous default-exported class project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "default-anonymous-class-compile");
  const fixture = path.resolve("test/fixtures/modules/default-anonymous-class-main.js");
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

compileTest("transpile closure output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "closure-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function outer(x) { return function(y) { return x + y; }; } function run() { var addOne = outer(1); return addOne(2); }", { moduleName: "closure_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile arrow function output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "arrow-function-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function build(step) { var local = value => value + step; return local; } function run() { var holder = { call: build(1) }; return holder.call(2); }", { moduleName: "arrow_function_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile arrow lexical this output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "arrow-this-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Counter { value = 1; make(step) { return (delta = step) => this.value + delta; } } function run() { var counter = new Counter(); var fn = counter.make(2); return fn(); }", { moduleName: "arrow_this_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile named function expression output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "named-function-expression-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function outer(x) { var make = function inner(y) { return x + y; }; return make; } function run() { var addOne = outer(1); return addOne(2); }", { moduleName: "named_function_expression_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile class construction and method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } } function run() { var point = new Point(1, 2); return point.sum(); }", { moduleName: "class_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile derived class output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "derived-class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Base { constructor(value) { this.value = value; } name() { return this.value; } } class Child extends Base { constructor(value) { super(value); this.extra = value; } read() { return super.name(); } } function run() { var child = new Child(\"Jayess\"); return child.read(); }", { moduleName: "derived_class_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile inherited instance method dispatch output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "derived-method-dispatch-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Base { name() { return \"Jayess\"; } } class Child extends Base {} function run() { var child = new Child(); return child.name(); }", { moduleName: "derived_dispatch_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile class field output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "class-field-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Point { x = 1; y = 2; sum() { return this.x + this.y; } } function run() { var point = new Point(); return point.sum(); }", { moduleName: "class_field_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private field output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-field-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Box { #value = 1; read(other) { return other.#value; } write(other, next) { other.#value = next; return other.#value; } } function run() { var box = new Box(); return box.write(box, 2); }", { moduleName: "private_field_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private field initialization and same-class access output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-field-init-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Box { #value = 1; #copy = this.#value; read() { return this.#copy; } write(next) { this.#value = next; return this.#value; } } function run() { var box = new Box(); return box.write(box.read()); }", { moduleName: "private_field_init_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private instance method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Box { #value() { return 1; } call(other) { return other.#value(); } } function run() { var box = new Box(); return box.call(box); }", { moduleName: "private_method_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private static member output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-static-member-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Box { static #value = 1; static #read() { return Box.#value; } static read() { return Box.#read(); } } function run() { return Box.read(); }", { moduleName: "private_static_member_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile computed class members and static block output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "computed-class-members-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile('class Point { ["field"] = 1; static first = 1; static { Point.second = Point.first; } static ["build"]() { return new Point(); } read() { return this["field"]; } } function run() { var point = Point.build(); return point.read(); }', { moduleName: "computed_class_members_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpileFile class field project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "class-field-project-compile");
  const fixture = path.resolve("test/fixtures/modules/class-fields-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});

compileTest("transpile static class member output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Point { static origin = 0; static make() { return new Point(); } x = Point.origin; } function run() { var point = Point.make(); return point.x; }", { moduleName: "static_class_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile static inheritance output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-inheritance-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("class Base { static label = 1; static read() { return Base.label; } } class Child extends Base { static label = 2; } class Grandchild extends Child {} function run() { return Grandchild.read() + Grandchild.label; }", { moduleName: "static_inheritance_module" }),
    "utf8"
  );

  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpileFile static class member project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-class-project-compile");
  const fixture = path.resolve("test/fixtures/modules/static-class-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});
