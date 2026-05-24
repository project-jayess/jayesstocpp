import { rgb, rgba } from "jayess:color";
import { create, fillRect, fillRectAlpha, getPixel } from "jayess:image";

export function run() {
  var filled = create(4, 4, rgb(0, 0, 0));
  var alphaFilled = create(2, 2, rgb(0, 0, 255));
  var clipped = create(2, 2, rgb(0, 0, 0));

  fillRect(filled, 1, 1, 4, 2, rgb(20, 40, 60));
  fillRectAlpha(alphaFilled, 0, 0, 2, 2, rgba(255, 0, 0, 0.5));
  fillRect(clipped, -1, 0, 2, 1, rgb(0, 255, 0));

  var filledPixel = getPixel(filled, 3, 2);
  var untouchedPixel = getPixel(filled, 0, 1);
  var alphaPixel = getPixel(alphaFilled, 0, 0);
  var clippedPixel = getPixel(clipped, 0, 0);
  var clippedUntouched = getPixel(clipped, 1, 0);

  return [
    filledPixel.red,
    filledPixel.green,
    filledPixel.blue,
    untouchedPixel.red,
    alphaPixel.red,
    alphaPixel.green,
    alphaPixel.blue,
    clippedPixel.green,
    clippedUntouched.green
  ];
}

export function invalidFillRect() {
  var image = create(1, 1, rgb(0, 0, 0));
  return fillRect(image, 0, 0, -1, 1, rgb(255, 255, 255));
}

export function invalidFillRectAlpha() {
  var image = create(1, 1, rgb(0, 0, 0));
  return fillRectAlpha(image, 0, 0, 1, -1, rgba(255, 255, 255, 0.5));
}
