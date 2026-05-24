import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

test("runtime math module helpers stay explicit and numeric", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value math_abs\(const value& input\);/);
  assert.match(header, /value math_min\(const std::vector<value>& inputs\);/);
  assert.match(header, /value math_pow\(const value& base, const value& exponent\);/);
  assert.match(runtime, /double require_math_number\(const value& input, const std::string& helperName\)/);
  assert.match(runtime, /Jayess math helper '/);
  assert.match(runtime, /value math_abs\(const value& input\)/);
  assert.match(runtime, /value math_round\(const value& input\)/);
  assert.match(runtime, /value math_min\(const std::vector<value>& inputs\)/);
  assert.match(runtime, /value math_max\(const std::vector<value>& inputs\)/);
  assert.match(runtime, /if \(number < 0\.0\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value math_pow\(const value& base, const value& exponent\)/);
});

test("runtime missing lookups now resolve through Jayess null", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /return find_static_class_member\(input, key\);/);
  assert.match(runtime, /return value\(std::monostate\{\}\);\s*\}\s*value get_index/);
  assert.match(runtime, /if \(index >= array->items\.size\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(std::holds_alternative<object_ptr>\(input\) \|\| std::holds_alternative<callable_ptr>\(input\)\) \{\s*return get_property/);
});
