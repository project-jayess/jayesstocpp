import {
  actualBackend,
  create,
  renderScene,
  requestedBackend
} from "jayess:canvas";

export function defaultCanvasBackends() {
  var canvas = create(2, 2, null);
  return [
    requestedBackend(canvas),
    actualBackend(canvas)
  ];
}

export function xmlCanvasBackends() {
  var canvas = renderScene("<scene width=\"2\" height=\"2\" />", null);
  return [
    requestedBackend(canvas),
    actualBackend(canvas)
  ];
}

export function explicitCpuBackend() {
  var canvas = renderScene("<scene width=\"2\" height=\"2\" />", { backend: "cpu" });
  return [
    requestedBackend(canvas),
    actualBackend(canvas)
  ];
}

export function explicitGpuBackend() {
  return renderScene("<scene width=\"2\" height=\"2\" />", { backend: "gpu" });
}
