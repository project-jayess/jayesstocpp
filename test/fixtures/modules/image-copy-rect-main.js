import { rgba, rgb } from "jayess:color";
import { copyRect, create, getPixel, setPixel } from "jayess:image";

function put(image, x, y, red, alpha) {
  setPixel(image, x, y, rgba(red, 0, 0, alpha));
}

export function run() {
  var vertical = create(1, 4, rgb(0, 0, 0));
  put(vertical, 0, 0, 10, 1);
  put(vertical, 0, 1, 20, 1);
  put(vertical, 0, 2, 30, 1);
  put(vertical, 0, 3, 40, 1);
  copyRect(vertical, 0, 0, 1, 3, 0, 1);

  var horizontal = create(4, 1, rgb(0, 0, 0));
  put(horizontal, 0, 0, 11, 1);
  put(horizontal, 1, 0, 22, 1);
  put(horizontal, 2, 0, 33, 1);
  put(horizontal, 3, 0, 44, 1);
  copyRect(horizontal, 0, 0, 3, 1, 1, 0);

  var clipped = create(3, 3, rgb(0, 0, 0));
  put(clipped, 0, 0, 77, 0.5);
  copyRect(clipped, -1, 0, 3, 1, 1, 2);

  var verticalTwo = getPixel(vertical, 0, 2);
  var verticalThree = getPixel(vertical, 0, 3);
  var horizontalTwo = getPixel(horizontal, 2, 0);
  var horizontalThree = getPixel(horizontal, 3, 0);
  var clippedCopied = getPixel(clipped, 2, 2);
  var clippedUntouched = getPixel(clipped, 1, 2);

  return [
    verticalTwo.red,
    verticalThree.red,
    horizontalTwo.red,
    horizontalThree.red,
    clippedCopied.red,
    clippedCopied.alpha,
    clippedUntouched.red
  ];
}

export function invalidCopyRectWidth() {
  var image = create(1, 1, rgb(0, 0, 0));
  return copyRect(image, 0, 0, -1, 1, 0, 0);
}

export function invalidCopyRectTargetX() {
  var image = create(1, 1, rgb(0, 0, 0));
  return copyRect(image, 0, 0, 1, 1, 0.5, 0);
}
