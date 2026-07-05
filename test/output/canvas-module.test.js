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

function generatedCanvasCoreCppPath(targetDir) {
  return path.join(
    targetDir,
    "generated-stdlib",
    "jayess",
    "canvas",
    "stdlib_jayess_canvas_core_js.cpp"
  );
}

function hasCanvasHtmlCssFragment(file) {
  return /stdlib_jayess_canvas_(html|css|box)_/.test(file);
}

test("transpileFile resolves built-in Jayess canvas module over image and color dependencies", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const imagePath = generatedStdlibCppPath(targetDir, "image");
  const colorPath = generatedStdlibCppPath(targetDir, "color");

  assert.ok(result.files.some((file) => file.endsWith("canvas_main_js.cpp")));
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));
  assert.ok(result.files.includes(imagePath));
  assert.ok(result.files.includes(colorPath));
  assert.ok(!result.files.some(hasCanvasHtmlCssFragment));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "image-primitives.hpp")));
  assert.ok(!fs.existsSync(path.join(targetDir, "native", "canvas-primitives.hpp")));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /fillRect/);
  assert.match(canvasSource, /drawRect/);
  assert.match(canvasSource, /drawImage/);
  assert.match(canvasSource, /drawCanvas/);
  assert.match(canvasSource, /drawCapsule/);
  assert.match(canvasSource, /fillCapsule/);
  assert.match(canvasSource, /fillEllipse/);
  assert.match(canvasSource, /drawEllipse/);
  assert.match(canvasSource, /drawPolyline/);
  assert.match(canvasSource, /drawTriangle/);
  assert.match(canvasSource, /fillTriangle/);
  assert.match(canvasSource, /quadraticCurve/);
  assert.match(canvasSource, /bezierCurve/);
  assert.match(canvasSource, /measureText/);
  assert.match(canvasSource, /text/);
  assert.match(canvasSource, /clipRect/);
  assert.match(canvasSource, /fillRectClipped/);
  assert.match(canvasSource, /pixelLeft/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_math_index_js::round/);
  assert.match(canvasSource, /drawImageClipped/);
  assert.match(canvasSource, /fillPolygon/);
  assert.match(canvasSource, /drawPolygon/);
  assert.match(canvasSource, /fillRectAlpha/);
  assert.match(canvasSource, /getPixel/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::fillRect/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::fillRectAlpha/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::setPixel/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::getPixel/);
});

test("transpileFile resolves built-in Jayess canvas clip stack helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-clip-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-clip-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /currentClip/);
  assert.match(canvasSource, /pushClip/);
  assert.match(canvasSource, /popClip/);
});

test("transpileFile resolves built-in Jayess canvas stroke width helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-stroke-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-stroke-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /strokeWidthValue/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::drawLine/);
});

test("transpileFile resolves built-in Jayess canvas alpha compositing helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-alpha-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-alpha-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /blendColor/);
  assert.match(canvasSource, /fillRectAlpha/);
});

test("transpileFile resolves built-in Jayess canvas drawing state helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-state-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-state-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const statePath = result.files.find((file) => file.includes("stdlib_jayess_canvas_state_js.cpp"));
  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));
  assert.ok(statePath);

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  const stateSource = fs.readFileSync(statePath, "utf8");
  assert.match(canvasSource, /saveState/);
  assert.match(canvasSource, /restoreState/);
  assert.match(canvasSource, /setFillColor/);
  assert.match(canvasSource, /setStrokeColor/);
  assert.match(canvasSource, /setStrokeWidth/);
  assert.match(canvasSource, /setTextColor/);
  assert.match(canvasSource, /setTextSize/);
  assert.match(canvasSource, /translate/);
  assert.match(canvasSource, /scale/);
  assert.match(stateSource, /copyDrawingState/);
  assert.match(stateSource, /copyClipStack/);
  assert.match(stateSource, /restoreState requires a saved state/);
});

test("named primitive canvas imports compile with explicit fallback metadata", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-drawline-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-drawline-main.js");
  const result = transpileFile(fixture, targetDir);
  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const metadataPath = path.join(targetDir, "jayess_dependency_plan.json");

  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(canvasCorePath));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /drawLine/);
  assert.match(canvasSource, /jayess_module_stdlib_jayess_image_index_js::drawLine/);
  assert.doesNotMatch(canvasSource, /fillRect/);
  assert.doesNotMatch(canvasSource, /drawEllipse/);
  assert.doesNotMatch(canvasSource, /renderScene/);
  assert.doesNotMatch(canvasSource, /drawImage/);

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const entryModule = metadata.modules.find((moduleRecord) => moduleRecord.moduleStem === "canvas_drawline_main_js");
  const canvasDependency = entryModule.dependencies.find((dependency) => dependency.source === "jayess:canvas");
  assert.deepEqual(canvasDependency.requestedImportNames, ["create", "drawLine", "getPixel"]);
  assert.deepEqual(
    canvasDependency.reachableExports.map((exportRecord) => exportRecord.exportedName),
    ["create", "drawLine", "getPixel"]
  );
});

test("canvas XML scene helper imports retain XML adapter dependencies without GUI or window", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-xml-scene-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-xml-scene-main.js");
  const result = transpileFile(fixture, targetDir);
  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const metadataPath = path.join(targetDir, "jayess_dependency_plan.json");

  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_scene_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_attributes_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_xml_index_js.cpp")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_canvas_core_js.cpp")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_renderer_js.cpp")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_gui_")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_window_")));

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const entryModule = metadata.modules.find((moduleRecord) => moduleRecord.moduleStem === "canvas_xml_scene_main_js");
  const canvasDependency = entryModule.dependencies.find((dependency) => dependency.source === "jayess:canvas");
  assert.deepEqual(canvasDependency.requestedImportNames, [
    "parseScene",
    "sceneBackground",
    "sceneSize",
    "sceneTitle"
  ]);
  assert.deepEqual(
    canvasDependency.reachableExports.map((exportRecord) => exportRecord.exportedName),
    ["parseScene", "sceneBackground", "sceneSize", "sceneTitle"]
  );
});

test("canvas XML renderer imports retain renderer helper dependencies without GUI or window", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-xml-render-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-xml-render-main.js");
  const result = transpileFile(fixture, targetDir);
  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const metadataPath = path.join(targetDir, "jayess_dependency_plan.json");

  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_renderer_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_scene_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_canvas_xml_attributes_js.cpp")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_gui_")));
  assert.ok(!result.files.some((file) => file.includes("stdlib_jayess_window_")));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /fillRoundedRect/);
  assert.match(canvasSource, /drawRoundedRect/);

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const entryModule = metadata.modules.find((moduleRecord) => moduleRecord.moduleStem === "canvas_xml_render_main_js");
  const canvasDependency = entryModule.dependencies.find((dependency) => dependency.source === "jayess:canvas");
  assert.deepEqual(canvasDependency.requestedImportNames, ["getPixel", "renderScene"]);
  assert.deepEqual(
    canvasDependency.reachableExports.map((exportRecord) => exportRecord.exportedName),
    ["getPixel", "renderScene"]
  );
});

test("canvas backend helpers default to auto with CPU fallback metadata", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-backend-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-backend-main.js");
  const result = transpileFile(fixture, targetDir);
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const metadataPath = path.join(targetDir, "jayess_dependency_plan.json");

  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "canvas")));
  assert.ok(result.files.includes(canvasCorePath));

  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  assert.match(canvasSource, /requestedBackend/);
  assert.match(canvasSource, /actualBackend/);
  assert.match(canvasSource, /backend must be auto, cpu, or gpu/);
  assert.match(canvasSource, /GPU XML rendering is not available yet/);

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const entryModule = metadata.modules.find((moduleRecord) => moduleRecord.moduleStem === "canvas_backend_main_js");
  const canvasDependency = entryModule.dependencies.find((dependency) => dependency.source === "jayess:canvas");
  assert.deepEqual(canvasDependency.requestedImportNames, [
    "actualBackend",
    "create",
    "renderScene",
    "requestedBackend"
  ]);
  assert.deepEqual(
    canvasDependency.reachableExports.map((exportRecord) => exportRecord.exportedName),
    ["actualBackend", "create", "renderScene", "requestedBackend"]
  );
});

test("canvas pack helpers embed XML and image assets into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-pack-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-pack-main.js");
  const result = transpileFile(fixture, targetDir);

  const entrySource = fs.readFileSync(path.join(targetDir, "canvas_pack_main_js.cpp"), "utf8");
  const canvasCorePath = generatedCanvasCoreCppPath(targetDir);
  const canvasSource = fs.readFileSync(canvasCorePath, "utf8");
  const metadata = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));

  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "canvas")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "bytes")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "image")));
  assert.match(entrySource, /<scene/);
  assert.match(entrySource, /width=\\"4\\"/);
  assert.match(entrySource, /height=\\"4\\"/);
  assert.match(entrySource, /static_cast<double>\(137\)/);
  assert.match(entrySource, /std::string\("\.png"\)/);
  assert.doesNotMatch(entrySource, /packed-scene\.xml/);
  assert.doesNotMatch(entrySource, /packed-icon\.png/);
  assert.match(canvasSource, /packImage/);
  assert.match(canvasSource, /decodePng/);
  assert.match(canvasSource, /fromArray/);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "stb_image.h")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "libwebp", "src", "webp", "decode.h")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "libwebp", "src", "dec", "webp_dec.c")));
  assert.ok(fs.existsSync(path.join(targetDir, "licenses", "stb", "LICENSE")));
  assert.ok(fs.existsSync(path.join(targetDir, "licenses", "libwebp", "COPYING")));
  assert.ok(fs.existsSync(path.join(targetDir, "licenses", "libwebp", "PATENTS")));

  const entryModule = metadata.modules.find((moduleRecord) => moduleRecord.moduleStem === "canvas_pack_main_js");
  const canvasDependency = entryModule.dependencies.find((dependency) => dependency.source === "jayess:canvas");
  assert.deepEqual(canvasDependency.requestedImportNames, ["getPixel", "packImage", "packXml", "renderScene"]);
});
