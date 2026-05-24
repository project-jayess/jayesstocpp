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

test("transpileFile resolves built-in Jayess canvas module over image and color dependencies", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const imagePath = generatedStdlibCppPath(targetDir, "image");
  const colorPath = generatedStdlibCppPath(targetDir, "color");

  assert.ok(result.files.some((file) => file.endsWith("canvas_main_js.cpp")));
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(imagePath));
  assert.ok(result.files.includes(colorPath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "image-primitives.hpp")));
  assert.ok(!fs.existsSync(path.join(targetDir, "native", "canvas-primitives.hpp")));

  const canvasSource = fs.readFileSync(canvasPath, "utf8");
  assert.match(canvasSource, /fillRect/);
  assert.match(canvasSource, /strokeRect/);
  assert.match(canvasSource, /drawImage/);
  assert.match(canvasSource, /drawCanvas/);
  assert.match(canvasSource, /fillCircle/);
  assert.match(canvasSource, /strokeCircle/);
  assert.match(canvasSource, /fillEllipse/);
  assert.match(canvasSource, /strokeEllipse/);
  assert.match(canvasSource, /polyline/);
  assert.match(canvasSource, /quadraticCurve/);
  assert.match(canvasSource, /bezierCurve/);
  assert.match(canvasSource, /measureText/);
  assert.match(canvasSource, /text/);
  assert.match(canvasSource, /clipRect/);
  assert.match(canvasSource, /fillRectClipped/);
  assert.match(canvasSource, /drawImageClipped/);
  assert.match(canvasSource, /fillPolygon/);
  assert.match(canvasSource, /strokePolygon/);
  assert.match(canvasSource, /fillRectAlpha/);
  assert.match(canvasSource, /getPixel/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::setPixel/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::getPixel/);
});
