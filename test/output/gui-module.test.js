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

function generatedStdlibHelperCppPath(targetDir, subdir, filename) {
  return path.join(targetDir, "generated-stdlib", "jayess", subdir, filename);
}

test("transpileFile resolves built-in Jayess gui module over layout, font, canvas, and color", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-gui-output");
  const fixture = path.resolve("test/fixtures/modules/gui-main.js");
  const result = transpileFile(fixture, targetDir);

  const guiPath = generatedStdlibCppPath(targetDir, "gui");
  const modelPath = generatedStdlibHelperCppPath(targetDir, "gui", "stdlib_jayess_gui_model_js.cpp");
  const layoutPassPath = generatedStdlibHelperCppPath(targetDir, "gui", "stdlib_jayess_gui_layout_pass_js.cpp");
  const paintPath = generatedStdlibHelperCppPath(targetDir, "gui", "stdlib_jayess_gui_paint_js.cpp");
  const layoutPath = generatedStdlibCppPath(targetDir, "layout");
  const fontPath = generatedStdlibCppPath(targetDir, "font");
  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const colorPath = generatedStdlibCppPath(targetDir, "color");

  assert.ok(result.files.includes(guiPath));
  assert.ok(result.files.includes(modelPath));
  assert.ok(result.files.includes(layoutPassPath));
  assert.ok(result.files.includes(paintPath));
  assert.ok(result.files.includes(layoutPath));
  assert.ok(result.files.includes(fontPath));
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(colorPath));

  const modelSource = fs.readFileSync(modelPath, "utf8");
  assert.match(modelSource, /createWindowState/);
  assert.match(modelSource, /createButton/);
  assert.match(modelSource, /createColumn/);
  assert.match(modelSource, /needsRedraw/);

  const layoutPassSource = fs.readFileSync(layoutPassPath, "utf8");
  assert.match(layoutPassSource, /layout\(/);

  const paintSource = fs.readFileSync(paintPath, "utf8");
  assert.match(paintSource, /draw\(/);
});
