import {
  beginFrame,
  createBuffer,
  createDevice,
  createPipeline,
  createShader,
  createSurface,
  createTexture,
  clear,
  draw,
  endFrame
} from "jayess:gpu";
import { rgb } from "jayess:color";
import { create as createWindow } from "jayess:window";

export function openGpu() {
  var device = createDevice({ backend: "opengl" });
  var window = createWindow({ title: "GPU", width: 64, height: 64 });
  var surface = createSurface(window);
  var buffer = createBuffer(device, { usage: "vertex" });
  var texture = createTexture(device, { width: 1, height: 1 });
  var shader = createShader(device, "clear");
  var pipeline = createPipeline(device, { shader: shader });
  var frame = beginFrame(surface);
  clear(frame, rgb(10, 20, 30));
  draw(frame, pipeline, { buffer: buffer, texture: texture });
  endFrame(frame);
  return true;
}

export function clearFrame(frame) {
  clear(frame, rgb(1, 2, 3));
  return true;
}

export function clearWithBadColor(frame) {
  return clear(frame, "bad");
}

export function invalidBackend() {
  return createDevice({ backend: "bad" });
}

export function invalidOptions() {
  return createDevice("bad");
}
