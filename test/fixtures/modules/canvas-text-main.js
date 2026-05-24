import { create, drawTextBox, saveImage } from "jayess:canvas";
import { rgb } from "jayess:color";

export function renderTextBox(path) {
  var canvas = create(48, 24, { background: rgb(0, 0, 0) });
  drawTextBox(canvas, "hello native gui", { x: 2, y: 2, width: 44, height: 20 }, {
    color: rgb(255, 255, 255),
    horizontal: "center",
    vertical: "middle"
  });
  saveImage(canvas, path);
  return true;
}
