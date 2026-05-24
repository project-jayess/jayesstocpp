import { rgb, rgba } from "jayess:color";
import { create as createImage, setPixel } from "jayess:image";
import {
  create,
  drawImage,
  drawImageClipped,
  fillCircle,
  fillRect,
  getPixel,
  line
} from "jayess:canvas";

export function run() {
  var canvas = create(4, 4, {
    background: rgb(10, 0, 0)
  });

  fillRect(canvas, 0, 0, 1, 1, rgba(110, 0, 0, 0.5));

  var image = createImage(1, 1, rgb(0, 0, 0));
  setPixel(image, 0, 0, rgba(70, 0, 0, 0.5));
  drawImage(canvas, image, 1, 0);
  drawImageClipped(canvas, image, 2, 0, { x: 2, y: 0, width: 1, height: 1 });

  line(canvas, 0, 1, 0, 1, rgba(90, 0, 0, 0.5));
  fillCircle(canvas, 1, 1, 0, rgba(50, 0, 0, 0.5));

  var rectPixel = getPixel(canvas, 0, 0);
  var imagePixel = getPixel(canvas, 1, 0);
  var clippedImagePixel = getPixel(canvas, 2, 0);
  var linePixel = getPixel(canvas, 0, 1);
  var fillPixel = getPixel(canvas, 1, 1);

  return [
    rectPixel.red,
    imagePixel.red,
    clippedImagePixel.red,
    linePixel.red,
    fillPixel.red
  ];
}
