import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const stem = `stdlib_jayess_${subpath}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", subpath, `${stem}.cpp`);
}

test("transpileFile resolves built-in watch module with runtime and native bridge output", (t) => {
  const targetDir = createManagedTempDir(t, "watch-output");
  const fixture = path.resolve("test/fixtures/modules/watch-main.js");
  const result = transpileFile(fixture, targetDir);

  const watchPath = generatedStdlibCppPath(targetDir, "watch");
  const primitivePath = path.join(targetDir, "native", "watch-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(primitivePath, "utf8");
  const runtimeFeatures = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));

  assert.ok(result.files.includes(watchPath));
  assert.match(headerSource, /struct watch_state/);
  assert.match(headerSource, /using watch_ptr = std::shared_ptr<watch_state>;/);
  assert.match(cppSource, /value watch_poll\(const value& watcherValue\)/);
  assert.match(primitiveSource, /jayessWatchCreate/);
  assert.ok(runtimeFeatures.fragments.includes("watch"));
});
