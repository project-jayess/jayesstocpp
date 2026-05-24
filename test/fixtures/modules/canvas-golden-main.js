import { rgb, rgba } from "jayess:color";
import { create as createImage, setPixel } from "jayess:image";
import {
  create,
  drawImageClipped,
  drawTextBox,
  fillPolygon,
  fillRect,
  fillRectClipped,
  popClip,
  pushClip,
  quadraticCurve,
  savePpm,
  strokePolygon
} from "jayess:canvas";

export function renderScene(path) {
  var canvas = create(6, 6, {
    background: rgb(0, 0, 0)
  });

  fillRect(canvas, 0, 0, 4, 4, rgb(20, 0, 0));
  fillRect(canvas, 1, 1, 4, 4, rgba(100, 0, 0, 0.5));

  pushClip(canvas, 2, 0, 2, 3);
  fillRectClipped(canvas, 0, 0, 6, 6, rgb(0, 60, 0), null);
  popClip(canvas);

  var image = createImage(2, 1, rgb(0, 0, 0));
  setPixel(image, 0, 0, rgba(0, 0, 80, 1));
  setPixel(image, 1, 0, rgba(0, 0, 120, 1));
  drawImageClipped(canvas, image, 3, 2, { x: 3, y: 2, width: 1, height: 1 });

  fillPolygon(canvas, [{ x: 0, y: 4 }, { x: 2, y: 4 }, { x: 0, y: 5 }], rgb(0, 90, 0));
  strokePolygon(canvas, [{ x: 3, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 5 }], rgb(0, 0, 200));
  quadraticCurve(canvas, 0, 5, 3, 2, 5, 5, rgb(140, 0, 0), { steps: 4 });

  savePpm(canvas, path);
  return true;
}

export function renderText(path) {
  var canvas = create(8, 5, {
    background: rgb(0, 0, 0)
  });

  drawTextBox(canvas, "ABCD", { x: 1, y: 1, width: 6, height: 3 }, {
    color: rgb(255, 255, 255),
    charWidth: 1,
    charHeight: 1,
    spacing: 0,
    lineSpacing: 0,
    horizontal: "center",
    vertical: "middle"
  });

  savePpm(canvas, path);
  return true;
}
