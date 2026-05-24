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
  const asyncPath = generatedStdlibCppPath(targetDir, "async");
  assert.ok(result.files.some((file) => file.endsWith("timers_main_js.cpp")));
  assert.ok(result.files.includes(timersPath));
  assert.ok(result.files.includes(asyncPath));

  const timersSource = fs.readFileSync(timersPath, "utf8");
  assert.match(timersSource, /jayess:timers duration must be non-negative/);
  assert.match(timersSource, /runTimer/);
});
