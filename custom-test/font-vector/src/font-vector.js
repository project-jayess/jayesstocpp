import { createVectorFontFixtures } from "./font-fixtures.hpp";
import { create, saveImage, text } from "jayess:canvas";
import { rgb } from "jayess:color";
import { writeLine } from "jayess:console";
import { loadFont } from "jayess:font";

function loadProbeFont(name, path, advance, line) {
  return loadFont(name, path, {
    family: name,
    charWidth: advance - 1,
    charHeight: 7,
    advance: advance,
    baseline: 6,
    lineHeight: 8,
    ascent: 6,
    descent: 2,
    fallbackGlyph: "?"
  });
}

function drawSample(canvas, name, label, y) {
  text(canvas, label, 6, y, {
    color: rgb(255, 255, 255),
    fontFamily: name,
    fontSize: 14
  });
}

export function main() {
  var fixtureDir = "custom-test/font-vector/dist/fonts";
  createVectorFontFixtures(fixtureDir);

  loadProbeFont("probe-ttf", fixtureDir + "/probe.ttf", 6, 0);
  loadProbeFont("probe-otf", fixtureDir + "/probe.otf", 7, 1);
  loadProbeFont("probe-woff", fixtureDir + "/probe.woff", 8, 2);
  loadProbeFont("probe-woff2", fixtureDir + "/probe.woff2", 9, 3);

  var canvas = create(220, 70, { background: rgb(0, 0, 0) });
  drawSample(canvas, "probe-ttf", "TTF SAMPLE", 4);
  drawSample(canvas, "probe-otf", "OTF SAMPLE", 20);
  drawSample(canvas, "probe-woff", "WOFF SAMPLE", 36);
  drawSample(canvas, "probe-woff2", "WOFF2 SAMPLE", 52);

  saveImage(canvas, "custom-test/font-vector/dist/font-vector.ppm");
  writeLine("Wrote custom-test/font-vector/dist/font-vector.ppm");
  return 0;
}
