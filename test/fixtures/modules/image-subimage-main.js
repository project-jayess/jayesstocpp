import { rgb } from "jayess:color";
import { create, getPixel, setPixel, subimage, width, height } from "jayess:image";

export function run() {
  var source = create(3, 2, rgb(0, 0, 0));
  setPixel(source, 1, 0, rgb(255, 0, 0));
  setPixel(source, 2, 1, rgb(0, 0, 255));

  var child = subimage(source, 1, 0, 2, 2);
  var childBefore = getPixel(child, 0, 0);

  setPixel(source, 1, 0, rgb(0, 255, 0));
  var childAfterSourceMutation = getPixel(child, 0, 0);

  setPixel(child, 1, 1, rgb(255, 255, 0));
  var sourceAfterChildMutation = getPixel(source, 2, 1);
  var childAfterChildMutation = getPixel(child, 1, 1);

  return [
    width(child),
    height(child),
    childBefore.red,
    childAfterSourceMutation.red,
    childAfterSourceMutation.green,
    sourceAfterChildMutation.blue,
    childAfterChildMutation.red,
    childAfterChildMutation.green,
    childAfterChildMutation.blue
  ];
}

export function invalidSubimage() {
  var image = create(2, 2, rgb(0, 0, 0));
  return subimage(image, 1, 0, 2, 1);
}
