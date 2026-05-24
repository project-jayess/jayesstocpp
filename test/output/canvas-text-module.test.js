import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits canvas text-box helper calls", (t) => {
  const targetDir = createManagedTempDir(t, "canvas-text-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-text-main.js");
  const result = transpileFile(fixture, targetDir);
  const canvasPath = path.join(targetDir, "generated-stdlib", "jayess", "canvas", "stdlib_jayess_canvas_index_js.cpp");
  const canvasSource = fs.readFileSync(canvasPath, "utf8");

  assert.ok(result.files.includes(canvasPath));
  assert.match(canvasSource, /drawTextBox/);
  assert.match(canvasSource, /wrappedTextLines/);
  assert.match(canvasSource, /saveImage/);
});
