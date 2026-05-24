import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile destructured parameter output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "destructured-parameter-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(
    cppPath,
    transpile("function pick(fallback, [first, second = 2] = fallback, {name}) { return first + second; } var read = ({value}) => value; var fn = function({inner}) { return inner; }; class Box { constructor([value]) { this.value = value; } read({suffix}) { return this.value + suffix; } static make({value}) { return value; } }", {
      moduleName: "destructured_parameter_module"
    }),
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
