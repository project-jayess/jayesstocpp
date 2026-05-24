import {
  jayessGpuBeginFrame,
  jayessGpuClear,
  jayessGpuCreateBuffer,
  jayessGpuCreateDevice,
  jayessGpuCreatePipeline,
  jayessGpuCreateShader,
  jayessGpuCreateSurface,
  jayessGpuCreateTexture,
  jayessGpuDraw,
  jayessGpuEndFrame
} from "./gpu-primitives.hpp";
import { rgba } from "jayess:color";

function normalizeColor(color) {
  return rgba(color.red, color.green, color.blue, color.alpha);
}

export function createDevice(options) {
  return jayessGpuCreateDevice(options);
}

export function createSurface(window) {
  return jayessGpuCreateSurface(window);
}

export function createBuffer(device, options) {
  return jayessGpuCreateBuffer(device, options);
}

export function createTexture(device, options) {
  return jayessGpuCreateTexture(device, options);
}

export function createShader(device, source) {
  return jayessGpuCreateShader(device, source);
}

export function createPipeline(device, options) {
  return jayessGpuCreatePipeline(device, options);
}

export function beginFrame(surface) {
  return jayessGpuBeginFrame(surface);
}

export function clear(frame, color) {
  return jayessGpuClear(frame, normalizeColor(color));
}

export function draw(frame, pipeline, resources) {
  return jayessGpuDraw(frame, pipeline, resources);
}

export function endFrame(frame) {
  return jayessGpuEndFrame(frame);
}
