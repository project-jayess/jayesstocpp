import { create as createCanvas, getPixel } from "jayess:canvas";
import { rgb, rgba } from "jayess:color";
import {
  createButton,
  createColumn,
  createLabel,
  createWindowState,
  drainActions,
  draw,
  invalidate,
  layout,
  needsRedraw,
  setRoot,
  update
} from "jayess:gui";

export function runToolkitScenario() {
  var status = createLabel({
    text: "idle",
    background: rgba(0, 0, 0, 0),
    padding: 2
  });
  var button = createButton({
    id: "run",
    text: "run"
  });
  var windowState = createWindowState({
    width: 120,
    height: 72,
    background: rgb(12, 16, 24)
  });
  windowState.clicks = 0;
  windowState.status = status;

  setRoot(windowState, createColumn({
    padding: 4,
    gap: 4,
    background: rgba(0, 0, 0, 0)
  }, [status, button]));
  layout(windowState);

  var centerX = button.bounds.x + button.bounds.width / 2;
  var centerY = button.bounds.y + button.bounds.height / 2;

  update(windowState, [
    { type: "mouseMove", x: centerX, y: centerY },
    { type: "mouseDown", button: "left", x: centerX, y: centerY, pressed: true },
    { type: "mouseUp", button: "left", x: centerX, y: centerY, pressed: false }
  ]);

  var actions = drainActions(windowState);
  if (actions.length === 1 && actions[0].type === "click" && actions[0].targetId === "run") {
    windowState.clicks = windowState.clicks + 1;
    status.text = "clicked";
    invalidate(windowState);
  }

  var redrawAfterClick = needsRedraw(windowState);
  var canvas = createCanvas(120, 72, { background: rgb(0, 0, 0) });
  draw(windowState, canvas);
  var redrawAfterDraw = needsRedraw(windowState);
  var sampled = getPixel(canvas, button.bounds.x + 1, button.bounds.y + 1);

  return [
    button.bounds.y > status.bounds.y,
    button.hovered,
    windowState.clicks,
    status.text,
    redrawAfterClick,
    redrawAfterDraw,
    sampled.red > 0
  ];
}

export function runResizeScenario() {
  var windowState = createWindowState({
    width: 100,
    height: 60
  });
  var label = createLabel({ text: "a" });
  var button = createButton({ text: "b" });
  setRoot(windowState, createColumn({ padding: 2, gap: 2 }, [label, button]));
  layout(windowState);

  var beforeWidth = button.bounds.width;
  update(windowState, [{ type: "resize", width: 140, height: 84 }]);

  var redrawAfterResize = needsRedraw(windowState);
  var canvas = createCanvas(140, 84, { background: rgb(0, 0, 0) });
  draw(windowState, canvas);
  return [
    redrawAfterResize,
    button.bounds.width > beforeWidth,
    button.bounds.height > 0
  ];
}
