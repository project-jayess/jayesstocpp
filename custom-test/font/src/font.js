import { rgb } from "jayess:color";
import { create, saveImage, text } from "jayess:canvas";
import { loadFont, setDefaultFont } from "jayess:font";
import { writeLine } from "jayess:console";

export function main() {
  loadFont("jayess-demo-bars", "custom-test/font/src/demo-font.json", null);
  setDefaultFont("jayess-demo-bars");

  var canvas = create(96, 24, { background: rgb(0, 0, 0) });
  text(canvas, "FONT 42", 4, 6, {
    color: rgb(255, 255, 255),
    fontFamily: "jayess-demo-bars",
    charHeight: 7
  });
  saveImage(canvas, "custom-test/font/dist/font.ppm");
  writeLine("Wrote custom-test/font/dist/font.ppm");
  return 0;
}
