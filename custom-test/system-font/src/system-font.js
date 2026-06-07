import { create, savePpm, text } from "jayess:canvas";
import { rgb } from "jayess:color";
import { registerSystemDefaultFont } from "jayess:font";

export function main() {
  registerSystemDefaultFont("system-ui", null);
  var canvas = create(180, 48, rgb(20, 24, 28));
  text(canvas, "SYSTEM FONT", 8, 8, {
    fontFamily: "system-ui",
    fontSize: 18,
    color: rgb(240, 245, 250)
  });
  text(canvas, "JAYESS FALLBACK OK", 8, 28, {
    fontFamily: "missing-system-font",
    color: rgb(150, 210, 255)
  });
  savePpm(canvas, "custom-test/system-font/dist/system-font.ppm");
  return 0;
}
