import { create } from "jayess:window";

export function methodSurface(canvas) {
  var window = create({
    title: "Jayess",
    width: 64,
    height: 64
  });
  var closed = false;
  window.addEventListener("close", function () {
    closed = true;
    window.close();
  });
  window.setFps(30);
  window.frame(false);
  window.frame(true);
  window.dispatchEvents();
  window.requestRender(canvas);
  return [window.isClosing(), window.currentFps(), closed];
}
