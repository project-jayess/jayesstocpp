import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

test("runtime exposes normalized diagnostic helper declarations", () => {
  const header = getRuntimeHeaderSource();

  assert.match(header, /void throw_unsupported_receiver\(const std::string& moduleName, const std::string& operationName, const std::string& expectedReceiver\);/);
  assert.match(header, /void throw_unsupported_option\(const std::string& moduleName, const std::string& optionName\);/);
  assert.match(header, /void throw_unsupported_string_conversion\(const std::string& typeName\);/);
  assert.match(header, /void throw_unsupported_destructuring_source\(const std::string& patternName, const std::string& expectedSource\);/);
  assert.match(header, /void throw_unsupported_spread_source\(const std::string& spreadName, const std::string& expectedSource\);/);
});

test("runtime normalizes receiver and operand diagnostics through shared helpers", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /throw_unsupported_operand\("add"\);/);
  assert.match(runtime, /throw_unsupported_receiver\("array", "pop", "array"\);/);
  assert.match(runtime, /throw_unsupported_receiver\("array", "join", "array"\);/);
  assert.match(runtime, /throw_unsupported_receiver\("array", "includes", "array"\);/);
  assert.match(runtime, /throw_unsupported_receiver\("map", "operation", "map"\);/);
  assert.match(runtime, /throw_unsupported_receiver\("set", "operation", "set"\);/);
});

test("runtime normalizes option, string conversion, spread, and destructuring diagnostics", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /throw_unsupported_option\("net", key\);/);
  assert.match(runtime, /throw_unsupported_option\("http request", key\);/);
  assert.match(runtime, /throw_unsupported_option\("http server", key\);/);
  assert.match(runtime, /throw_unsupported_option\("subprocess", key\);/);
  assert.match(runtime, /throw_unsupported_string_conversion\("stream handles"\);/);
  assert.match(runtime, /throw_unsupported_interpolation_value\(\);/);
  assert.match(runtime, /throw_unsupported_spread_source\("argument", "an array source"\);/);
  assert.match(runtime, /throw_unsupported_spread_source\("object", "an object or callable source"\);/);
  assert.match(runtime, /throw_unsupported_destructuring_source\("array rest", "an array source"\);/);
  assert.match(runtime, /throw_unsupported_destructuring_source\("object rest", "an object or callable source"\);/);
});

test("runtime string method receivers use normalized user-facing wording", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /Jayess string slice requires a string receiver/);
  assert.match(runtime, /Jayess string substring requires a string receiver/);
  assert.match(runtime, /Jayess string startsWith requires a string receiver/);
  assert.match(runtime, /Jayess string includes requires a string receiver/);
  assert.match(runtime, /Jayess string indexOf requires a string receiver/);
  assert.match(runtime, /Jayess string endsWith requires a string receiver/);
});
