import { create, getPixel, text } from "jayess:canvas";
import { rgb } from "jayess:color";
import { getFont, loadFont, measureText } from "jayess:font";

export function inspectFontFiles(ttfPath, otfPath, woffPath, compressedWoffPath, woff2Path) {
  var ttf = loadFont("tiny-ttf", ttfPath, null);
  var otf = loadFont("tiny-otf", otfPath, null);
  var woff = loadFont("tiny-woff", woffPath, null);
  var compressedWoff = loadFont("tiny-woff-stored", compressedWoffPath, null);
  var woff2 = loadFont("tiny-woff2", woff2Path, null);
  var measured = measureText(ttf, "NN");
  var canvas = create(20, 12, rgb(0, 0, 0));
  text(canvas, "N", 1, 1, { fontFamily: "tiny-ttf", color: rgb(255, 255, 255) });
  var pixel = getPixel(canvas, 1, 1);
  var selected = getFont("tiny-woff");

  return [
    ttf.kind,
    ttf.sourceFormat,
    otf.sourceFormat,
    woff.sourceFormat,
    compressedWoff.sourceFormat,
    woff2.sourceFormat,
    selected.name,
    measured.width,
    pixel.red
  ];
}

export function loadUnsupportedFont(path) {
  return loadFont("unsupported", path, null);
}

export function loadUnsupportedRasterizer(path) {
  return loadFont("rasterizer", path, { rasterizer: "native" });
}
