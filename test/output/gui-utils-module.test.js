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

test("transpileFile emits GUI utility modules and clipboard runtime output", (t) => {
  const targetDir = createManagedTempDir(t, "gui-utils-output");
  const fixture = path.resolve("test/fixtures/modules/gui-utils-main.js");
  const result = transpileFile(fixture, targetDir);

  const layoutPath = generatedStdlibCppPath(targetDir, "layout");
  const fontPath = generatedStdlibCppPath(targetDir, "font");
  const clipboardPath = generatedStdlibCppPath(targetDir, "clipboard");
  const primitivePath = path.join(targetDir, "native", "clipboard-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const fontSource = fs.readFileSync(fontPath, "utf8");

  assert.ok(result.files.includes(layoutPath));
  assert.ok(result.files.includes(fontPath));
  assert.ok(result.files.includes(clipboardPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(fontSource, /glyphRows/);
  assert.match(fontSource, /lineHeight/);
  assert.match(fontSource, /charWidth/);
  assert.match(fontSource, /drawTextAligned/);
  assert.match(headerSource, /clipboard_read_text/);
  assert.match(cppSource, /clipboard_platform_available/);
  assert.match(cppSource, /Jayess clipboard host adapter is not available/);
});
