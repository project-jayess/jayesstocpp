import { rgb } from "jayess:color";
import {
  create,
  drawCapsule,
  drawEllipse,
  fillEllipse,
  getPixel
} from "jayess:canvas";

export function shapeQuality() {
  var canvas = create(24, 8, {
    background: rgb(0, 0, 0)
  });

  drawEllipse(canvas, 1, 1, 5, 5, rgb(10, 0, 0));
  fillEllipse(canvas, 7, 1, 5, 5, rgb(20, 0, 0));
  drawCapsule(canvas, 14, 1, 9, 5, rgb(30, 0, 0));

  return [
    getPixel(canvas, 2, 1).red,
    getPixel(canvas, 3, 1).red,
    getPixel(canvas, 8, 1).red,
    getPixel(canvas, 9, 1).red,
    getPixel(canvas, 14, 1).red,
    getPixel(canvas, 15, 1).red,
    getPixel(canvas, 14, 3).red,
    getPixel(canvas, 18, 3).red
  ];
}
