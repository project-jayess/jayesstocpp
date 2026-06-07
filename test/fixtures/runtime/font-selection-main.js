import { create, drawHtml, getPixel, layoutHtml, measureText, text } from "jayess:canvas";
import { rgb } from "jayess:color";
import { createHtmlDocument } from "jayess:canvas";
import { fontMetrics, loadFont, measureGlyph } from "jayess:font";

export function inspectFontSelection(path) {
  var narrow = loadFont("narrow-file", path, {
    family: "Narrow File",
    charWidth: 4,
    charHeight: 7,
    advance: 5,
    baseline: 6,
    lineHeight: 8,
    ascent: 6,
    descent: 2,
    fallbackGlyph: "?"
  });
  var wide = loadFont("wide-file", path, {
    family: "Wide File",
    charWidth: 8,
    charHeight: 10,
    advance: 9,
    baseline: 8,
    lineHeight: 11,
    ascent: 8,
    descent: 3,
    fallbackGlyph: "?"
  });

  var narrowSize = measureText(null, "NN", { fontFamily: "narrow-file", fontSize: 14 });
  var wideSize = measureText(null, "NN", { fontFamily: "wide-file", fontSize: 14 });
  var metrics = fontMetrics(wide);
  var glyph = measureGlyph(wide, "N");

  var canvas = create(80, 24, rgb(0, 0, 0));
  text(canvas, "N", 1, 1, { fontFamily: "wide-file", fontSize: 14, color: rgb(255, 255, 255) });
  var directPixel = getPixel(canvas, 1, 1);

  var defaultCanvas = create(24, 16, rgb(0, 0, 0));
  text(defaultCanvas, "N", 1, 1, { color: rgb(255, 255, 255) });
  var defaultGapPixel = getPixel(defaultCanvas, 2, 1);
  var vectorCanvas = create(24, 16, rgb(0, 0, 0));
  text(vectorCanvas, "N", 1, 1, { fontFamily: "wide-file", fontSize: 20, color: rgb(255, 255, 255) });
  var vectorScaledPixel = getPixel(vectorCanvas, 2, 1);

  var document = createHtmlDocument("<p>NX</p>", "p { font-family: wide-file; font-size: 14px; color: #ffffff; }", null);
  layoutHtml(document, { x: 0, y: 0, width: 80, height: 24 });
  drawHtml(canvas, document);
  var htmlPixel = getPixel(canvas, 0, 0);

  return [
    narrow.family,
    wide.family,
    narrowSize.width,
    wideSize.width,
    metrics.ascent,
    metrics.descent,
    glyph.advance,
    directPixel.red,
    htmlPixel.red,
    defaultGapPixel.red,
    vectorScaledPixel.red
  ];
}
