import { rgb } from "jayess:color";
import {
  create,
  drawCapsule,
  drawEllipse,
  drawLine,
  drawPixel,
  drawPolygon,
  drawPolyline,
  drawRect,
  drawSemiellipse,
  drawTriangle,
  fillCapsule,
  fillEllipse,
  fillPolygon,
  fillRect,
  fillSemiellipse,
  fillTriangle,
  getPixel
} from "jayess:canvas";

export function render() {
  var canvas = create(16, 12, {
    background: rgb(0, 0, 0)
  });

  drawPixel(canvas, 0, 0, rgb(10, 0, 0));
  drawLine(canvas, 1, 0, 1, 4, rgb(20, 0, 0));
  drawRect(canvas, 2, 0, 4, 4, rgb(30, 0, 0));
  fillRect(canvas, 3, 1, 2, 2, rgb(40, 0, 0));
  drawEllipse(canvas, 6, 0, 5, 3, rgb(50, 0, 0));
  fillEllipse(canvas, 7, 1, 3, 3, rgb(60, 0, 0));
  drawTriangle(canvas, [{ x: 0, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 4 }], rgb(70, 0, 0));
  fillTriangle(canvas, [{ x: 3, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 6 }], rgb(80, 0, 0));
  drawCapsule(canvas, 6, 4, 5, 3, rgb(90, 0, 0));
  fillCapsule(canvas, 0, 8, 5, 3, rgb(100, 0, 0));
  drawPolyline(canvas, [{ x: 6, y: 8 }, { x: 8, y: 8 }, { x: 8, y: 10 }], rgb(110, 0, 0));
  drawPolygon(canvas, [{ x: 9, y: 8 }, { x: 11, y: 8 }, { x: 11, y: 10 }], rgb(120, 0, 0));
  fillPolygon(canvas, [{ x: 9, y: 4 }, { x: 11, y: 4 }, { x: 9, y: 6 }], rgb(130, 0, 0));
  fillSemiellipse(canvas, 12, 0, 3, 5, rgb(140, 0, 0), { direction: "bottom" });
  drawSemiellipse(canvas, 12, 6, 3, 5, rgb(150, 0, 0), { direction: "right" });

  return [
    getPixel(canvas, 0, 0).red,
    getPixel(canvas, 1, 2).red,
    getPixel(canvas, 2, 0).red,
    getPixel(canvas, 3, 1).red,
    getPixel(canvas, 8, 0).red,
    getPixel(canvas, 8, 2).red,
    getPixel(canvas, 1, 5).red,
    getPixel(canvas, 4, 4).red,
    getPixel(canvas, 6, 5).red,
    getPixel(canvas, 2, 9).red,
    getPixel(canvas, 8, 9).red,
    getPixel(canvas, 10, 8).red,
    getPixel(canvas, 9, 4).red,
    getPixel(canvas, 13, 3).red,
    getPixel(canvas, 13, 6).red
  ];
}
