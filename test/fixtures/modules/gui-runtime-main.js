import { create as createCanvas } from "jayess:canvas";
import { rgb } from "jayess:color";
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

export function runRuntimeScenario() {
  var label = createLabel({ text: "" });
  var button = createButton({ id: "run", text: "" });
  var windowState = createWindowState({
    width: 100,
    height: 64,
    background: rgb(8, 10, 14)
  });

  setRoot(windowState, createColumn({ padding: 4, gap: 4 }, [label, button]));
  layout(windowState);

  var centerX = button.bounds.x + button.bounds.width / 2;
  var centerY = button.bounds.y + button.bounds.height / 2;
  update(windowState, [
    { type: "mouseMove", x: centerX, y: centerY },
    { type: "mouseDown", button: "left", x: centerX, y: centerY, pressed: true },
    { type: "mouseUp", button: "left", x: centerX, y: centerY, pressed: false }
  ]);

  var actions = drainActions(windowState);
  if (actions.length === 1 && actions[0].targetId === "run") {
    windowState.lastAction = actions[0].targetId;
    invalidate(windowState);
  }

  var redrawAfterAction = needsRedraw(windowState);
  var canvas = createCanvas(100, 64, { background: rgb(0, 0, 0) });
  draw(windowState, canvas);

  return [
    button.bounds.y > label.bounds.y,
    button.hovered,
    actions.length,
    windowState.lastAction,
    redrawAfterAction,
    needsRedraw(windowState)
  ];
}
