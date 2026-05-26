import { rgb } from "jayess:color";
import {
  create,
  fillRect,
  line,
  pushClip,
  restoreState,
  savePpm,
  saveState,
  setFillColor,
  setStrokeColor,
  setStrokeWidth,
  setTextColor,
  setTextSize,
  scale,
  text,
  translate
} from "jayess:canvas";

export function renderStateScene(path) {
  var canvas = create(5, 5, {
    background: rgb(0, 0, 0)
  });

  setFillColor(canvas, rgb(255, 0, 0));
  fillRect(canvas, 0, 0, 1, 1, null);

  saveState(canvas);
  translate(canvas, 2, 0);
  setFillColor(canvas, rgb(0, 255, 0));
  fillRect(canvas, 0, 0, 1, 1, null);
  pushClip(canvas, 2, 2, 1, 1);
  fillRect(canvas, 0, 2, 4, 1, rgb(0, 0, 255));
  restoreState(canvas);

  fillRect(canvas, 1, 1, 1, 1, null);

  saveState(canvas);
  scale(canvas, 2, 2);
  setStrokeColor(canvas, rgb(255, 255, 0));
  setStrokeWidth(canvas, 1);
  line(canvas, 1, 1, 2, 1, null);
  restoreState(canvas);

  setTextColor(canvas, rgb(255, 255, 255));
  setTextSize(canvas, 1);
  text(canvas, "A", 0, 4, { spacing: 0 });

  savePpm(canvas, path);
  return true;
}

export function invalidRestore() {
  var canvas = create(1, 1, {
    background: rgb(0, 0, 0)
  });
  restoreState(canvas);
  return false;
}

export function invalidScale() {
  var canvas = create(1, 1, {
    background: rgb(0, 0, 0)
  });
  scale(canvas, 0, 1);
  return false;
}
