import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

test("runtime truthiness semantics stay explicit", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /std::holds_alternative<std::monostate>\(input\)\)\s*\{\s*return false;/);
  assert.match(runtime, /std::holds_alternative<bool>\(input\)\)\s*\{\s*return std::get<bool>\(input\);/);
  assert.match(runtime, /std::holds_alternative<double>\(input\)\)\s*\{\s*return std::get<double>\(input\) != 0\.0;/);
  assert.match(runtime, /std::holds_alternative<array_ptr>\(input\)\)\s*\{\s*return !std::get<array_ptr>\(input\)->items\.empty\(\);/);
  assert.match(runtime, /std::holds_alternative<object_ptr>\(input\)\)\s*\{\s*return !std::get<object_ptr>\(input\)->fields\.empty\(\);/);
  assert.match(runtime, /std::holds_alternative<callable_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<event_emitter_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<async_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<generator_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<map_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<set_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<stream_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /return !std::get<std::string>\(input\)\.empty\(\);/);
});

test("runtime null checks stay explicit", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /bool is_null\(const value& input\) \{\s*return std::holds_alternative<std::monostate>\(input\);/);
});

test("runtime equality semantics stay exact-type and identity-based for composites", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(left\.index\(\) != right\.index\(\)\) \{\s*return false;/);
  assert.match(runtime, /if \(std::holds_alternative<std::monostate>\(left\)\) \{\s*return true;/);
  assert.match(runtime, /if \(std::holds_alternative<double>\(left\)\) \{\s*return std::get<double>\(left\) == std::get<double>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<bool>\(left\)\) \{\s*return std::get<bool>\(left\) == std::get<bool>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<array_ptr>\(left\)\) \{\s*return std::get<array_ptr>\(left\) == std::get<array_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<object_ptr>\(left\)\) \{\s*return std::get<object_ptr>\(left\) == std::get<object_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<callable_ptr>\(left\)\) \{\s*return std::get<callable_ptr>\(left\) == std::get<callable_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<event_emitter_ptr>\(left\)\) \{\s*return std::get<event_emitter_ptr>\(left\) == std::get<event_emitter_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<async_ptr>\(left\)\) \{\s*return std::get<async_ptr>\(left\) == std::get<async_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<generator_ptr>\(left\)\) \{\s*return std::get<generator_ptr>\(left\) == std::get<generator_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<map_ptr>\(left\)\) \{\s*return std::get<map_ptr>\(left\) == std::get<map_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<set_ptr>\(left\)\) \{\s*return std::get<set_ptr>\(left\) == std::get<set_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<stream_ptr>\(left\)\) \{\s*return std::get<stream_ptr>\(left\) == std::get<stream_ptr>\(right\);/);
  assert.match(runtime, /return std::get<std::string>\(left\) == std::get<std::string>\(right\);/);
});

test("runtime numeric operator helpers stay narrowly numeric", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /value positive\(const value& input\) \{\s*return std::get<double>\(input\);/);
  assert.match(runtime, /value subtract\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) - std::get<double>\(right\);/);
  assert.match(runtime, /value multiply\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) \* std::get<double>\(right\);/);
  assert.match(runtime, /value divide\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) \/ std::get<double>\(right\);/);
  assert.match(runtime, /value modulo\(const value& left, const value& right\) \{\s*return std::fmod\(std::get<double>\(left\), std::get<double>\(right\)\);/);
  assert.match(runtime, /value power\(const value& left, const value& right\) \{\s*return std::pow\(std::get<double>\(left\), std::get<double>\(right\)\);/);
});

test("runtime add helper rejects coercive mixed-type addition", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(std::holds_alternative<double>\(left\) && std::holds_alternative<double>\(right\)\) \{\s*return std::get<double>\(left\) \+ std::get<double>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<std::string>\(left\) && std::holds_alternative<std::string>\(right\)\) \{\s*return std::get<std::string>\(left\) \+ std::get<std::string>\(right\);/);
  assert.match(runtime, /throw_unsupported_operand\("add"\);/);
});

test("runtime thrown-value carrier stays explicit", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct thrown_value : std::exception/);
  assert.match(runtime, /void throw_value\(value input\) \{\s*throw thrown_value\(std::move\(input\)\);/);
  assert.match(runtime, /value exception_to_value\(const thrown_value& error\) \{\s*return error\.payload;/);
  assert.match(runtime, /value exception_to_value\(const std::exception& error\) \{\s*return std::string\(error\.what\(\)\);/);
});

test("runtime nullish and missing-value helpers stay null-only", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /bool is_null\(const value& input\) \{\s*return std::holds_alternative<std::monostate>\(input\);/);
  assert.doesNotMatch(runtime, /undefined/);
  assert.match(runtime, /if \(index >= args\.size\(\)\) \{\s*return 0\.0;/);
});

test("runtime optional-style missing lookups short-circuit through Jayess null", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(iterator == object->fields\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(iterator == callable->fields\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(index >= array->items\.size\(\)\) \{\s*return value\(std::monostate\{\}\);/);
});
