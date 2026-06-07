import { rgb } from "jayess:color";
import { create, getPixel, text } from "jayess:canvas";
import { createFont, defaultFont, measureGlyph, registerFont } from "jayess:font";

function red() {
  return rgb(255, 0, 0);
}

function customFont(name, topRow) {
  return createFont(name, {
    A: [
      topRow,
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001"
    ]
  }, {
    charWidth: 5,
    charHeight: 7,
    advance: 6,
    baseline: 6,
    lineHeight: 8
  });
}

export function inspectDefault() {
  var canvas = create(16, 12, { background: rgb(0, 0, 0) });
  text(canvas, "A", 0, 0, { color: red(), charHeight: 7 });
  return [
    getPixel(canvas, 0, 0).red,
    getPixel(canvas, 2, 0).red,
    getPixel(canvas, 4, 0).red,
    getPixel(canvas, 2, 3).red
  ];
}

export function inspectFonts() {
  registerFont(customFont("jayess-test-top", "11111"));
  registerFont(customFont("jayess-test-gap", "00000"));

  var topCanvas = create(16, 12, { background: rgb(0, 0, 0) });
  var gapCanvas = create(16, 12, { background: rgb(0, 0, 0) });
  text(topCanvas, "A", 0, 0, { color: red(), fontFamily: "jayess-test-top", charHeight: 7 });
  text(gapCanvas, "A", 0, 0, { color: red(), fontFamily: "jayess-test-gap", charHeight: 7 });

  return [
    getPixel(topCanvas, 0, 0).red,
    getPixel(gapCanvas, 0, 0).red,
    getPixel(topCanvas, 2, 3).red,
    getPixel(gapCanvas, 2, 3).red
  ];
}

export function inspectDefaultCoverage() {
  var lower = measureGlyph(defaultFont(), "a");
  var at = measureGlyph(defaultFont(), "@");
  var brace = measureGlyph(defaultFont(), "{");
  var pipe = measureGlyph(defaultFont(), "|");
  return [
    lower.missing,
    at.missing,
    brace.missing,
    pipe.missing
  ];
}
