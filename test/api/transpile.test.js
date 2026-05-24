import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";
import { JayessError } from "../../src/diagnostics.js";

test("transpile returns deterministic cpp", () => {
  const source = "function add(a, b) { return a + b; }";
  const first = transpile(source, { moduleName: "sample" });
  const second = transpile(source, { moduleName: "sample" });
  assert.equal(first, second);
  assert.match(first, /jayess::add/);
});

test("transpile rejects built-in Jayess modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { now } from "jayess:date"; function run() { return now(); }', { moduleName: "builtin_date_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects flagged regex imports in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { create } from "jayess:regex"; function run() { return create("hello", "i"); }', { moduleName: "builtin_regex_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess string modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { trim } from "jayess:string"; function run() { return trim(" Jayess "); }', { moduleName: "builtin_string_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess array modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { slice } from "jayess:array"; function run(items) { return slice(items, 0); }', { moduleName: "builtin_array_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess thread modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { currentId } from "jayess:thread"; function run() { return currentId(); }', { moduleName: "builtin_thread_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess math modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { sqrt } from "jayess:math"; function run() { return sqrt(9); }', { moduleName: "builtin_math_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess iterator modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { next } from "jayess:iter"; function run(generator) { return next(generator); }', { moduleName: "builtin_iter_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess path modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { join } from "jayess:path"; function run(root) { return join(root, "main.js"); }', { moduleName: "builtin_path_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess filesystem modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { exists } from "jayess:fs"; function run(path) { return exists(path); }', { moduleName: "builtin_fs_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess system modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { cwd } from "jayess:process"; function run() { return cwd(); }', { moduleName: "builtin_process_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects let", () => {
  assert.throws(
    () => transpile("let x = 1;"),
    (error) => error instanceof JayessError && /does not support 'let'/.test(error.diagnostics[0].message)
  );
});

test("transpile skips array elisions in destructuring patterns", () => {
  const cpp = transpile("function run(values) { var [first, , third] = values; return first + third; }", { moduleName: "destructure_elision_case" });

  assert.match(cpp, /destructure_index\(jayess_destructure_0, jayess::value\(static_cast<double>\(0\)\)\)/);
  assert.doesNotMatch(cpp, /static_cast<double>\(1\)/);
  assert.match(cpp, /destructure_index\(jayess_destructure_0, jayess::value\(static_cast<double>\(2\)\)\)/);
});

test("transpile inherits instance methods through class-chain dispatch", () => {
  const cpp = transpile(
    "class Base { name() { return 1; } } class Child extends Base {} function run() { var child = new Child(); return child.name(); }",
    { moduleName: "inheritance_dispatch_case" }
  );

  assert.match(cpp, /jayess::define_class_method\(class_value, "name"/);
  assert.match(cpp, /return jayess::call\(jayess::get_property\(child, "name"\)\)/);
});

test("transpile lowers static super method calls through base static lookup", () => {
  const cpp = transpile(
    "class Base { static read(value) { return value + 1; } } class Child extends Base { static read(value) { return super.read(value); } } function run() { return Child.read(1); }",
    { moduleName: "static_super_method_case" }
  );

  assert.match(cpp, /jayess::find_static_class_member\(jayess::get_base_class\(class_value\), "read"\)/);
  assert.match(cpp, /return jayess::call\(jayess::find_static_class_member\(jayess::get_base_class\(class_value\), "read"\), value\);/);
});

test("transpile lowers computed super instance calls through base method lookup", () => {
  const cpp = transpile(
    'class Base { read(value) { return value + 1; } } class Child extends Base { read(name, value) { return super[name](value); } } function run() { var child = new Child(); return child.read("read", 1); }',
    { moduleName: "computed_super_method_case" }
  );

  assert.match(cpp, /jayess::property_key_string\(name\)/);
  assert.match(cpp, /jayess::bind_method\(this_value, jayess::find_class_method\(jayess::get_base_class\(class_value\), jayess::property_key_string\(name\)\)\)/);
});

test("transpile lowers static super property reads through base static lookup", () => {
  const cpp = transpile(
    "class Base { static value = 1; } class Child extends Base { static read() { return super.value; } } function run() { return Child.read(); }",
    { moduleName: "static_super_read_case" }
  );

  assert.match(cpp, /return jayess::find_static_class_member\(jayess::get_base_class\(class_value\), "value"\);/);
});

test("transpile rejects derived constructors whose super call is not the first statement", () => {
  assert.throws(
    () => transpile(
      "class Base { constructor(value) { this.value = value; } } class Child extends Base { constructor(value) { this.before = value; super(value); } }",
      { moduleName: "invalid_super_order_case" }
    ),
    /Derived constructors currently require 'super\(\.\.\.\)' as their first statement/
  );
});

test("transpile preserves static class-side source order across static fields and blocks", () => {
  const cpp = transpile(
    'class Point { static first = 1; static { Point.second = Point.first; } static third = Point.second; }',
    { moduleName: "static_block_order_case" }
  );

  const firstIndex = cpp.indexOf('jayess::set_property(class_value, "first", jayess::value(static_cast<double>(1)))');
  const blockIndex = cpp.indexOf('jayess::set_property(class_value, "second", jayess::get_property(class_value, "first"))');
  const thirdIndex = cpp.indexOf('jayess::set_property(class_value, "third", jayess::get_property(class_value, "second"))');

  assert.notEqual(firstIndex, -1);
  assert.notEqual(blockIndex, -1);
  assert.notEqual(thirdIndex, -1);
  assert.ok(firstIndex < blockIndex);
  assert.ok(blockIndex < thirdIndex);
});
