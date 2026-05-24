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

test("transpileFile resolves built-in Jayess color module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-color-output");
  const fixture = path.resolve("test/fixtures/modules/color-main.js");
  const result = transpileFile(fixture, targetDir);

  const colorPath = generatedStdlibCppPath(targetDir, "color");
  const mathPath = generatedStdlibCppPath(targetDir, "math");
  const numberPath = generatedStdlibCppPath(targetDir, "number");
  const stringPath = generatedStdlibCppPath(targetDir, "string");

  assert.ok(result.files.some((file) => file.endsWith("color_main_js.cpp")));
  assert.ok(result.files.includes(colorPath));
  assert.ok(result.files.includes(mathPath));
  assert.ok(result.files.includes(numberPath));
  assert.ok(result.files.includes(stringPath));

  const colorSource = fs.readFileSync(colorPath, "utf8");
  assert.match(colorSource, /channel must be an integer between 0 and 255/);
  assert.match(colorSource, /jayess:color could not parse color input/);
  assert.match(colorSource, /jayess::value mix/);
});
