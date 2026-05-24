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

test("transpileFile resolves built-in terminal module with runtime and native bridge output", (t) => {
  const targetDir = createManagedTempDir(t, "terminal-output");
  const fixture = path.resolve("test/fixtures/modules/terminal-main.js");
  const result = transpileFile(fixture, targetDir);

  const terminalPath = generatedStdlibCppPath(targetDir, "terminal");
  const primitivePath = path.join(targetDir, "native", "terminal-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(primitivePath, "utf8");
  const terminalSource = fs.readFileSync(terminalPath, "utf8");
  const runtimeFeatures = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));

  assert.ok(result.files.includes(terminalPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(headerSource, /value terminal_ansi\(const value& style\);/);
  assert.match(headerSource, /value terminal_size\(\);/);
  assert.match(cppSource, /value terminal_strip_ansi\(const value& textValue\)/);
  assert.match(cppSource, /Jayess terminal ansi style is not supported/);
  assert.match(primitiveSource, /jayessTerminalCursorTo/);
  assert.match(primitiveSource, /jayessTerminalSize/);
  assert.match(terminalSource, /jayessTerminalStripAnsi/);
  assert.ok(runtimeFeatures.fragments.includes("terminal"));
});
