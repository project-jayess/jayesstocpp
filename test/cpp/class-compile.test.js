import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpile async class method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "async-class-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Worker { async run(value) { return await value; } } function run(value) { var worker = new Worker(); return worker.run(value); }", { moduleName: "async_class_method_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile class construction and method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } } function run() { var point = new Point(1, 2); return point.sum(); }", { moduleName: "class_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile derived class output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "derived-class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Base { constructor(value) { this.value = value; } name() { return this.value; } } class Child extends Base { constructor(value) { super(value); this.extra = value; } read() { return super.name(); } } function run() { var child = new Child(\"Jayess\"); return child.read(); }", { moduleName: "derived_class_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile inherited instance method dispatch output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "derived-method-dispatch-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Base { name() { return \"Jayess\"; } } class Child extends Base {} function run() { var child = new Child(); return child.name(); }", { moduleName: "derived_dispatch_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile class field output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "class-field-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Point { x = 1; y = 2; sum() { return this.x + this.y; } } function run() { var point = new Point(); return point.sum(); }", { moduleName: "class_field_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private field output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-field-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Box { #value = 1; read(other) { return other.#value; } write(other, next) { other.#value = next; return other.#value; } } function run() { var box = new Box(); return box.write(box, 2); }", { moduleName: "private_field_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private field initialization and same-class access output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-field-init-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Box { #value = 1; #copy = this.#value; read() { return this.#copy; } write(next) { this.#value = next; return this.#value; } } function run() { var box = new Box(); return box.write(box.read()); }", { moduleName: "private_field_init_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private instance method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Box { #value() { return 1; } call(other) { return other.#value(); } } function run() { var box = new Box(); return box.call(box); }", { moduleName: "private_method_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile private static member output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "private-static-member-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Box { static #value = 1; static #read() { return Box.#value; } static read() { return Box.#read(); } } function run() { return Box.read(); }", { moduleName: "private_static_member_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile computed class members and static block output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "computed-class-members-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile('class Point { ["field"] = 1; static first = 1; static { Point.second = Point.first; } static ["build"]() { return new Point(); } read() { return this["field"]; } } function run() { var point = Point.build(); return point.read(); }', { moduleName: "computed_class_members_module" }), "utf8");
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

compileTest("transpile static class member output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-class-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Point { static origin = 0; static make() { return new Point(); } x = Point.origin; } function run() { var point = Point.make(); return point.x; }", { moduleName: "static_class_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile static inheritance output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-inheritance-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Base { static label = 1; static read() { return Base.label; } } class Child extends Base { static label = 2; } class Grandchild extends Child {} function run() { return Grandchild.read() + Grandchild.label; }", { moduleName: "static_inheritance_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile static super method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-super-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Base { static read(value) { return value + 1; } static #hidden() { return 0; } } class Child extends Base { static read(value) { return super.read(value); } } function run() { return Child.read(1); }", { moduleName: "static_super_method_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile computed super method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "computed-super-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile('class Base { read(value) { return value + 1; } } class Child extends Base { read(name, value) { return super[name](value); } } function run() { var child = new Child(); return child.read("read", 1); }', { moduleName: "computed_super_method_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile computed static super method output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "computed-static-super-method-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile('class Base { static read(value) { return value + 1; } } class Child extends Base { static read(name, value) { return super[name](value); } } function run() { return Child.read("read", 1); }', { moduleName: "computed_static_super_method_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile computed instance super read output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "computed-instance-super-read-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile('class Base { read(value) { return value + 1; } } class Child extends Base { read(name) { return super[name]; } } function run() { var child = new Child(); return child.read("read"); }', { moduleName: "computed_instance_super_read_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile static super read output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-super-read-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile("class Base { static value = 1; } class Child extends Base { static read() { return super.value; } } function run() { return Child.read(); }", { moduleName: "static_super_read_module" }), "utf8");
  compileCppFiles([runtimeCppPath, cppPath], targetDir);
  assert.ok(true);
});

compileTest("transpile deeper inherited static lookup output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "static-chain-compile");
  const runtimeCppPath = writeRuntime(targetDir);
  const cppPath = path.join(targetDir, "module.cpp");
  fs.writeFileSync(cppPath, transpile('class Root { static prefix = "Jay"; static label() { return Root.prefix; } } class Middle extends Root { static suffix = "ess"; static label() { return super.label() + Middle.suffix; } } class Leaf extends Middle { static punctuation = "!"; static inherited = super["label"](); static read() { return Leaf.inherited + Leaf.punctuation; } } function run() { return Leaf.read(); }', { moduleName: "static_chain_module" }), "utf8");
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
