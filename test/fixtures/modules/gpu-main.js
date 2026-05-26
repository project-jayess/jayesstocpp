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
  endFrame,
  uploadBuffer
} from "jayess:gpu";
import { fromArray } from "jayess:bytes";
import { rgb } from "jayess:color";
import { create as createWindow } from "jayess:window";

export function openGpu() {
  var device = createDevice({ backend: "opengl" });
  var window = createWindow({ title: "GPU", width: 64, height: 64 });
  var surface = createSurface(window);
  var buffer = createBuffer(device, { size: 4, usage: "vertex" });
  uploadBuffer(buffer, [1, 2, 3, 4]);
  var texture = createTexture(device, { width: 1, height: 1 });
  var shader = createShader(device, { stage: "vertex", source: "clear" });
  var pipeline = createPipeline(device, { vertexShader: shader, primitive: "triangles" });
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

export function uploadBytesIntoBuffer() {
  var device = createDevice({ backend: "validation" });
  var buffer = createBuffer(device, { size: 3, usage: "storage" });
  uploadBuffer(buffer, fromArray([9, 8, 7]));
  return true;
}

export function uploadTooMuchBufferData() {
  var device = createDevice({ backend: "validation" });
  var buffer = createBuffer(device, { size: 1, usage: "vertex" });
  return uploadBuffer(buffer, [1, 2]);
}

export function invalidShaderStage() {
  var device = createDevice({ backend: "validation" });
  return createShader(device, { stage: "compute", source: "noop" });
}

export function invalidPipelinePrimitive() {
  var device = createDevice({ backend: "validation" });
  return createPipeline(device, { primitive: "points" });
}
