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

function generatedStdlibHeaderPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.hpp`);
}

test("transpileFile emits canvas HTML/CSS renderer helper modules", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-canvas-html-output");
  const fixture = path.resolve("test/fixtures/modules/canvas-html-main.js");
  const result = transpileFile(fixture, targetDir);

  const canvasPath = generatedStdlibCppPath(targetDir, "canvas");
  const guiPath = generatedStdlibCppPath(targetDir, "gui");
  const helperNames = [
    "html_parser",
    "css_parser",
    "html_style",
    "html_layout",
    "html_paint",
    "html_hit_test",
    "box_values",
    "css_values",
    "css_layout_values"
  ];

  assert.ok(result.files.includes(canvasPath));
  assert.ok(result.files.includes(guiPath));
  for (const helperName of helperNames) {
    assert.ok(result.files.some((file) => file.includes(`stdlib_jayess_canvas_${helperName}_js.cpp`)));
  }

  const canvasHeader = fs.readFileSync(generatedStdlibHeaderPath(targetDir, "canvas"), "utf8");
  const guiHeader = fs.readFileSync(generatedStdlibHeaderPath(targetDir, "gui"), "utf8");
  const guiSource = fs.readFileSync(guiPath, "utf8");
  const layoutSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_html_layout_js.cpp")), "utf8");
  const styleSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_html_style_js.cpp")), "utf8");
  const cssSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_css_parser_js.cpp")), "utf8");
  const cssValuesSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_css_values_js.cpp")), "utf8");
  const layoutValuesSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_css_layout_values_js.cpp")), "utf8");
  const parserSource = fs.readFileSync(result.files.find((file) => file.includes("stdlib_jayess_canvas_html_parser_js.cpp")), "utf8");
  assert.match(canvasHeader, /layoutHtml/);
  assert.match(canvasHeader, /drawHtml/);
  assert.match(canvasHeader, /hitTestHtml/);
  assert.match(cssSource, /descendant/);
  assert.match(cssSource, /child/);
  assert.match(cssSource, /stripComments/);
  assert.match(cssSource, /box-sizing/);
  assert.match(cssSource, /parseBoxValue/);
  assert.match(cssSource, /parseCssSize/);
  assert.match(cssSource, /parseMediaFeature/);
  assert.match(cssSource, /max-width/);
  assert.match(cssSource, /min-width/);
  assert.match(cssSource, /overflow/);
  assert.match(cssSource, /line-height/);
  assert.match(cssValuesSource, /parseCalcSize/);
  assert.match(cssValuesSource, /rem/);
  assert.match(cssValuesSource, /em/);
  assert.match(cssValuesSource, /vh/);
  assert.match(cssValuesSource, /vw/);
  assert.match(layoutValuesSource, /resolveCssSizeWithContext/);
  assert.match(layoutValuesSource, /viewportWidth/);
  assert.match(layoutValuesSource, /rootFontSize/);
  assert.match(parserSource, /attribute value is empty/);
  assert.match(styleSource, /descendantSelectorMatches/);
  assert.match(styleSource, /mediaMatches/);
  assert.match(styleSource, /styleHtmlDocument/);
  assert.match(styleSource, /box-sizing/);
  assert.match(layoutSource, /wrapText/);
  assert.match(layoutSource, /applySizeConstraints/);
  assert.match(layoutSource, /marginTop/);
  assert.match(layoutSource, /paddingRight/);
  assert.match(layoutSource, /borderWidth/);
  assert.match(layoutSource, /textLines/);
  assert.match(layoutSource, /lineHeight/);
  assert.match(guiHeader, /attachHtmlDocument/);
  assert.match(guiHeader, /updateHtmlDocument/);
  assert.match(guiHeader, /drawHtmlDocument/);
  assert.match(guiSource, /stdlib_jayess_gui_html_document_js\.hpp/);
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_gui_html_input_js.cpp")));
});
