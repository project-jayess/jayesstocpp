import { create, getPixel, text } from "jayess:canvas";
import { rgb } from "jayess:color";
import { registerSystemDefaultFont } from "jayess:font";

export function inspectSystemFont(searchPath) {
  var fallback = registerSystemDefaultFont("system-fallback", { disabled: true });
  var fallbackCanvas = create(24, 16, rgb(0, 0, 0));
  text(fallbackCanvas, "N", 1, 1, { fontFamily: "system-fallback", color: rgb(255, 255, 255) });
  var fallbackPixel = getPixel(fallbackCanvas, 1, 1);

  var invalid = registerSystemDefaultFont("system-invalid", {
    searchPaths: [searchPath],
    candidates: ["invalid.ttf"]
  });

  var discovered = registerSystemDefaultFont("system-local", {
    searchPaths: [searchPath],
    candidates: ["local-system.ttf"],
    family: "Local System",
    charWidth: 8,
    charHeight: 10,
    advance: 9,
    baseline: 8,
    lineHeight: 11,
    ascent: 8,
    descent: 3
  });
  var vectorCanvas = create(24, 16, rgb(0, 0, 0));
  text(vectorCanvas, "N", 1, 1, { fontFamily: "system-local", fontSize: 20, color: rgb(255, 255, 255) });
  var vectorPixel = getPixel(vectorCanvas, 2, 1);

  return [
    fallback.name,
    fallback.fallbackUsed,
    fallbackPixel.red,
    invalid.fallbackUsed,
    invalid.diagnostic,
    discovered.name,
    discovered.family,
    discovered.systemFont,
    discovered.fallbackUsed,
    discovered.sourceFormat,
    vectorPixel.red
  ];
}
