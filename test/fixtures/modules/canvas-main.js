import { rgb, rgba } from "jayess:color";
import { create as createImage, metadata, setPixel } from "jayess:image";
import {
  clipRect,
  copy,
  create,
  drawCanvas,
  bezierCurve,
  drawImage,
  drawImageClipped,
  fillCircle,
  fillEllipse,
  fillPolygon,
  fillRect,
  fillRectAlpha,
  fillRectClipped,
  getPixel,
  height,
  line,
  measureText,
  polyline,
  quadraticCurve,
  savePpm,
  strokeCircle,
  strokeEllipse,
  strokePolygon,
  strokeRect,
  text,
  width
} from "jayess:canvas";

export function run(outputPath) {
  var canvas = create(4, 4, {
    background: rgb(0, 0, 0),
    title: "fixture"
  });

  fillRect(canvas, 1, 1, 2, 2, rgb(255, 0, 0));
  strokeRect(canvas, 0, 0, 4, 4, rgb(0, 255, 0));
  line(canvas, 0, 3, 3, 0, rgb(0, 0, 255));
  savePpm(canvas, outputPath);

  return canvas.title;
}

export function inspect() {
  var canvas = create(6, 6, {
    background: rgb(0, 0, 0),
    title: "inspect"
  });

  fillCircle(canvas, 2, 2, 1, rgb(255, 0, 0));
  strokeCircle(canvas, 4, 4, 1, rgb(0, 255, 0));
  polyline(canvas, [{ x: 0, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 0 }], rgb(0, 0, 255));

  var image = createImage(2, 2, rgb(0, 0, 0));
  setPixel(image, 0, 0, rgb(80, 90, 100));
  setPixel(image, 1, 1, rgb(110, 120, 130));
  drawImage(canvas, image, 1, 3);

  var copied = copy(canvas);
  var target = create(3, 3, {
    background: rgb(0, 0, 0),
    title: "target"
  });
  drawCanvas(target, copied, -2, -2);

  var red = getPixel(canvas, 2, 2);
  var green = getPixel(canvas, 4, 3);
  var blue = getPixel(canvas, 5, 5);
  var imagePixel = getPixel(canvas, 1, 3);
  var clipped = getPixel(target, 0, 0);
  var clip = clipRect(canvas, 1, 1, 3, 3);
  fillRectClipped(canvas, 0, 0, 3, 3, rgb(10, 20, 30), clip);
  drawImageClipped(canvas, image, 1, 1, { x: 1, y: 1, width: 1, height: 1 });
  fillPolygon(canvas, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }], rgb(33, 44, 55));
  strokePolygon(canvas, [{ x: 3, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 2 }], rgb(77, 88, 99));
  fillRectAlpha(canvas, 0, 0, 1, 1, rgba(100, 0, 0, 0.5));
  var metadataValue = metadata(image);
  var clippedPixel = getPixel(canvas, 1, 1);
  var polygonPixel = getPixel(canvas, 0, 1);
  var strokePixel = getPixel(canvas, 4, 0);
  var alphaPixel = getPixel(canvas, 0, 0);
  fillEllipse(canvas, 3, 3, 2, 1, rgb(120, 1, 2));
  strokeEllipse(canvas, 3, 3, 2, 2, rgb(130, 1, 2));
  quadraticCurve(canvas, 0, 0, 2, 5, 5, 0, rgb(140, 1, 2), { steps: 4 });
  bezierCurve(canvas, 0, 5, 1, 3, 4, 3, 5, 5, rgb(150, 1, 2), { steps: 4 });
  text(canvas, "A", 0, 2, { color: rgb(160, 1, 2), charWidth: 3, charHeight: 3 });
  var ellipsePixel = getPixel(canvas, 3, 3);
  var strokeEllipsePixel = getPixel(canvas, 3, 1);
  var quadraticPixel = getPixel(canvas, 5, 0);
  var bezierPixel = getPixel(canvas, 5, 5);
  var textPixel = getPixel(canvas, 0, 2);
  var textSize = measureText(canvas, "AB", { charWidth: 3, charHeight: 3 });

  return [
    width(canvas),
    height(canvas),
    red.red,
    red.green,
    green.green,
    blue.blue,
    imagePixel.red,
    clipped.red,
    copied.title,
    clip.width,
    clippedPixel.red,
    polygonPixel.red,
    strokePixel.red,
    alphaPixel.red,
    metadataValue.width,
    metadataValue.height,
    ellipsePixel.red,
    strokeEllipsePixel.red,
    quadraticPixel.red,
    bezierPixel.red,
    textPixel.red,
    textSize.width,
    textSize.height
  ];
}

export function invalidPoint() {
  var canvas = create(2, 2, {
    background: rgb(0, 0, 0)
  });
  return polyline(canvas, [null, { x: 1, y: 1 }], rgb(255, 255, 255));
}

export function invalidRadius() {
  var canvas = create(2, 2, {
    background: rgb(0, 0, 0)
  });
  return fillCircle(canvas, 0, 0, -1, rgb(255, 255, 255));
}

export function invalidEllipseRadius() {
  var canvas = create(2, 2, {
    background: rgb(0, 0, 0)
  });
  return fillEllipse(canvas, 0, 0, -1, 1, rgb(255, 255, 255));
}
