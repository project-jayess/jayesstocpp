import { rgb } from "jayess:color";
import { create as createCanvas, fillRect } from "jayess:canvas";
import {
  close,
  create,
  height,
  pollEvents,
  present,
  setTitle,
  shouldClose,
  show,
  width
} from "jayess:window";

export function createWindow() {
  return create({ title: "Jayess Wayland", width: 96, height: 64 });
}

export function showWindow(window) {
  show(window);
  return [width(window), height(window), shouldClose(window)];
}

export function pollWindow(window) {
  return pollEvents(window);
}

export function presentWindow(window) {
  var canvas = createCanvas(8, 6, { background: rgb(0, 0, 0) });
  fillRect(canvas, 1, 1, 2, 2, rgb(255, 180, 0));
  present(window, canvas);
  return true;
}

export function renameWindow(window, title) {
  setTitle(window, title);
  return true;
}

export function closeWindow(window) {
  return close(window);
}

export function isClosing(window) {
  return shouldClose(window);
}
