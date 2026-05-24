import { rgb } from "jayess:color";
import { create as createCanvas, fillRect } from "jayess:canvas";
import { close, create, height, pollEvents, present, requestClose, setTitle, shouldClose, show, width } from "jayess:window";

export function openWindow() {
  var window = create({ title: "Jayess", width: 320, height: 240 });
  show(window);
  return [width(window), height(window), shouldClose(window), pollEvents(window)];
}

export function presentCanvas() {
  var window = create({ title: "Jayess", width: 64, height: 64 });
  var canvas = createCanvas(64, 64, { background: rgb(0, 0, 0) });
  fillRect(canvas, 4, 4, 8, 8, rgb(255, 0, 0));
  present(window, canvas);
  setTitle(window, "Updated");
  close(window);
  return true;
}

export function requestCloseWindow() {
  var window = create({ title: "Jayess", width: 64, height: 64 });
  requestClose(window);
  return shouldClose(window);
}

export function invalidOptions() {
  return create("bad");
}
