import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

test("runtime handle diagnostics use shared helper declarations", () => {
  const header = getRuntimeHeaderSource();

  assert.match(header, /void throw_invalid_handle\(const std::string& moduleName, const std::string& handleName\);/);
  assert.match(header, /void throw_closed_handle\(const std::string& moduleName, const std::string& handleName\);/);
  assert.match(header, /void throw_completed_handle\(const std::string& moduleName, const std::string& handleName, const std::string& stateName\);/);
  assert.match(header, /void throw_wrong_direction\(const std::string& moduleName, const std::string& operationName, const std::string& expectedDirection\);/);
  assert.match(header, /void throw_timeout_elapsed\(const std::string& moduleName\);/);
});

test("runtime handle diagnostics keep normalized message forms", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /"Jayess " \+ moduleName \+ " expected a " \+ handleName \+ " handle"/);
  assert.match(runtime, /"Jayess " \+ moduleName \+ " " \+ handleName \+ " handle is closed"/);
  assert.match(runtime, /"Jayess " \+ moduleName \+ " " \+ handleName \+ " handle is already " \+ stateName/);
  assert.match(runtime, /"Jayess " \+ moduleName \+ " " \+ operationName \+ " requires a " \+ expectedDirection \+ " stream"/);
  assert.match(runtime, /"Jayess " \+ moduleName \+ " operation timed out"/);
});

test("runtime handle fragments use shared diagnostic helpers", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /throw_invalid_handle\("async", "async"\);/);
  assert.match(runtime, /throw_invalid_handle\("stream", "stream"\);/);
  assert.match(runtime, /throw_invalid_handle\("net", "socket"\);/);
  assert.match(runtime, /throw_invalid_handle\("http", "response"\);/);
  assert.match(runtime, /throw_invalid_handle\("subprocess", "subprocess"\);/);
  assert.match(runtime, /throw_invalid_handle\("thread", "thread"\);/);
  assert.match(runtime, /throw_invalid_handle\("channel", "channel"\);/);
  assert.match(runtime, /throw_closed_handle\("stream", "stream"\);/);
  assert.match(runtime, /throw_closed_handle\("net", "socket"\);/);
  assert.match(runtime, /throw_wrong_direction\("stream", "readChunk", "read"\);/);
  assert.match(runtime, /throw_completed_handle\("thread", "thread", "joined"\);/);
  assert.match(runtime, /throw_completed_handle\("subprocess", "subprocess", "joined"\);/);
});
