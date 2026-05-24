import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile resolves built-in Jayess timers module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-timers-output");
  const fixture = path.resolve("test/fixtures/modules/timers-main.js");
  const result = transpileFile(fixture, targetDir);

  const timersPath = generatedStdlibCppPath(targetDir, "timers");
  assert.ok(result.files.some((file) => file.endsWith("timers_main_js.cpp")));
  assert.ok(result.files.includes(timersPath));

  const timersSource = fs.readFileSync(timersPath, "utf8");
  const timersHeader = fs.readFileSync(path.join(targetDir, "generated-stdlib", "jayess", "timers", "stdlib_jayess_timers_index_js.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  assert.match(timersSource, /jayessTimersSetTimeout/);
  assert.match(timersSource, /jayessTimersSetInterval/);
  assert.match(timersHeader, /#include "native\/timers-primitives\.hpp"/);
  assert.match(runtimeHeader, /value async_sleep\(const value& milliseconds\);/);
  assert.match(runtimeHeader, /value async_timeout\(const value& handle, const value& milliseconds\);/);
  assert.match(runtimeHeader, /value timer_schedule_once\(const value& callback, int milliseconds, const value& args, const value& handle\);/);
  assert.match(runtimeHeader, /value timer_schedule_interval\(const value& callback, int milliseconds, const value& args, const value& handle\);/);
  assert.match(runtimeSource, /value async_sleep\(const value& milliseconds\)/);
  assert.match(runtimeSource, /value async_timeout\(const value& handle, const value& milliseconds\)/);
  assert.match(runtimeSource, /struct async_timer_record/);
  assert.match(runtimeSource, /value timer_schedule_once\(const value& callback, int milliseconds, const value& args, const value& handle\)/);
  assert.match(runtimeSource, /value timer_schedule_interval\(const value& callback, int milliseconds, const value& args, const value& handle\)/);
  assert.equal(fs.existsSync(path.join(targetDir, "native", "timers-primitives.hpp")), true);
});
