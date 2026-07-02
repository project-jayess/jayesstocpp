import { rgb } from "jayess:color";
import { create, drawLine, getPixel } from "jayess:canvas";

export function render() {
  var canvas = create(3, 3, {
    background: rgb(0, 0, 0)
  });
  drawLine(canvas, 0, 0, 2, 2, rgb(20, 0, 0));
  return getPixel(canvas, 1, 1).red;
}
