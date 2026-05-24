import { rgb } from "jayess:color";
import {
  create,
  getPixel,
  line,
  quadraticCurve,
  strokePolygon,
  strokeRect
} from "jayess:canvas";

export function run() {
  var canvas = create(7, 7, {
    background: rgb(0, 0, 0)
  });

  line(canvas, 3, 0, 3, 6, rgb(10, 0, 0), { strokeWidth: 3 });
  strokeRect(canvas, 1, 1, 3, 3, rgb(20, 0, 0), { strokeWidth: 3 });
  quadraticCurve(canvas, 0, 6, 3, 0, 6, 6, rgb(30, 0, 0), { steps: 4, strokeWidth: 3 });
  strokePolygon(canvas, [{ x: 4, y: 1 }, { x: 6, y: 1 }, { x: 5, y: 3 }], rgb(40, 0, 0), { strokeWidth: 3 });

  return [
    getPixel(canvas, 2, 3).red,
    getPixel(canvas, 4, 3).red,
    getPixel(canvas, 2, 2).red,
    getPixel(canvas, 3, 4).red,
    getPixel(canvas, 5, 1).red
  ];
}

export function invalidStrokeWidth() {
  var canvas = create(2, 2, {
    background: rgb(0, 0, 0)
  });
  return line(canvas, 0, 0, 1, 1, rgb(255, 255, 255), { strokeWidth: 0 });
}
