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

test("transpileFile emits canvas HTML/CSS renderer helper modules", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-html-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-html-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const guiPath = generatedStdlibCppPath(targetDir, "gui");
  const helperNames = [
    "html-parser",
    "css-parser",
    "html-style",
    "html-layout",
    "html-paint",
    "html-hit-test",
    "box-values"
  ];

  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(guiPath));
  for (const helperName of helperNames) {
    assert.ok(result.files.some((file) => file.includes(`stdlib_jayess_canvas_${helperName}_js.cpp`)));
  }

  const canvasSource = fs.readFileSync(canvasPath, "utf8");
  const guiSource = fs.readFileSync(guiPath, "utf8");
  const layoutSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_html-layout_js.cpp")), "utf8");
  const styleSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_html-style_js.cpp")), "utf8");
  const cssSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_css-parser_js.cpp")), "utf8");
  assert.match(canvasSource, /layoutHtml/);
  assert.match(canvasSource, /drawHtml/);
  assert.match(canvasSource, /hitTestHtml/);
  assert.match(cssSource, /descendant/);
  assert.match(cssSource, /parseBoxValue/);
  assert.match(cssSource, /min-width/);
  assert.match(cssSource, /overflow/);
  assert.match(styleSource, /descendantSelectorMatches/);
  assert.match(layoutSource, /wrapText/);
  assert.match(layoutSource, /applySizeConstraints/);
  assert.match(layoutSource, /marginTop/);
  assert.match(layoutSource, /paddingRight/);
  assert.match(layoutSource, /borderWidth/);
  assert.match(layoutSource, /textLines/);
  assert.match(guiSource, /attachHtmlDocument/);
  assert.match(guiSource, /updateHtmlDocument/);
  assert.match(guiSource, /drawHtmlDocument/);
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_gui_html-input_js.cpp")));
});
