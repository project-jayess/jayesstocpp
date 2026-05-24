import { rgb } from "jayess:color";
import { create as createImage, setPixel } from "jayess:image";
import {
  clipRect,
  create,
  currentClip,
  drawImageClipped,
  fillRectClipped,
  getPixel,
  popClip,
  pushClip
} from "jayess:canvas";

export function run() {
  var canvas = create(5, 5, {
    background: rgb(0, 0, 0),
    title: "clip"
  });
  var image = createImage(2, 2, rgb(0, 0, 0));
  setPixel(image, 1, 1, rgb(90, 91, 92));

  var baseClip = clipRect(canvas, 1, 1, 3, 3);
  pushClip(canvas, 1, 1, 3, 3);
  var activeClip = currentClip(canvas);
  fillRectClipped(canvas, 0, 0, 5, 5, rgb(10, 20, 30), null);
  pushClip(canvas, 2, 2, 1, 1);
  var nestedClip = currentClip(canvas);
  drawImageClipped(canvas, image, 1, 1, null);
  popClip(canvas);
  var restoredClip = currentClip(canvas);
  var centerPixel = getPixel(canvas, 2, 2);
  var edgePixel = getPixel(canvas, 1, 1);
  var outsidePixel = getPixel(canvas, 4, 4);
  popClip(canvas);
  var fullClip = currentClip(canvas);

  return [
    baseClip.width,
    activeClip.width,
    activeClip.height,
    nestedClip.width,
    nestedClip.height,
    restoredClip.width,
    restoredClip.height,
    centerPixel.red,
    edgePixel.red,
    outsidePixel.red,
    fullClip.width,
    fullClip.height
  ];
}

export function invalidPopClip() {
  var canvas = create(2, 2, {
    background: rgb(0, 0, 0)
  });
  return popClip(canvas);
}
