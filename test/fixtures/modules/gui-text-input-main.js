import { create as createCanvas, getPixel } from "jayess:canvas";
import { rgb } from "jayess:color";
import {
  accessibility,
  createColumn,
  createTextInput,
  createWindowState,
  drainActions,
  draw,
  layout,
  needsRedraw,
  selection,
  setRoot,
  setValue,
  update,
  value
} from "jayess:gui";

export function runTextInputScenario() {
  var input = createTextInput({
    id: "name",
    value: "a",
    placeholder: "name"
  });
  setValue(input, value(input));

  var windowState = createWindowState({
    width: 120,
    height: 48,
    background: rgb(6, 8, 12)
  });
  setRoot(windowState, createColumn({ padding: 4, gap: 2 }, [input]));
  layout(windowState);

  var x = input.bounds.x + 2;
  var y = input.bounds.y + 2;
  update(windowState, [
    { type: "mouseDown", button: "left", x: x, y: y, pressed: true },
    { type: "keyDown", key: "b", code: "b", pressed: true },
    { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", pressed: true },
    { type: "keyDown", key: "Delete", code: "Delete", pressed: true },
    { type: "keyDown", key: "c", code: "c", pressed: true },
    { type: "keyDown", key: "End", code: "End", pressed: true },
    { type: "keyDown", key: "Backspace", code: "Backspace", pressed: true },
    { type: "keyDown", key: "Enter", code: "Enter", pressed: true }
  ]);

  var actions = drainActions(windowState);
  var selected = selection(input);
  var metadata = accessibility(input);
  var redrawAfterInput = needsRedraw(windowState);
  var canvas = createCanvas(120, 48, { background: rgb(0, 0, 0) });
  draw(windowState, canvas);
  var sample = getPixel(canvas, input.bounds.x + 1, input.bounds.y + 1);

  return [
    input.focused,
    value(input),
    input.cursor,
    actions.length,
    actions[0].type,
    actions[0].value,
    actions[1].type,
    actions[1].value,
    actions[2].type,
    actions[2].value,
    selected.start,
    selected.end,
    metadata.role,
    metadata.label,
    metadata.focused,
    metadata.value,
    redrawAfterInput,
    needsRedraw(windowState),
    sample.red > 0
  ];
}

export function runBlurScenario() {
  var input = createTextInput({ id: "name", value: "" });
  var windowState = createWindowState({ width: 80, height: 40 });
  setRoot(windowState, createColumn({ padding: 2 }, [input]));
  layout(windowState);

  update(windowState, [
    { type: "mouseDown", button: "left", x: input.bounds.x + 1, y: input.bounds.y + 1, pressed: true },
    { type: "keyDown", key: "x", code: "x", pressed: true },
    { type: "mouseDown", button: "left", x: 79, y: 39, pressed: true }
  ]);

  var actions = drainActions(windowState);
  return [
    input.focused,
    value(input),
    actions.length,
    actions[0].type,
    actions[1].type
  ];
}

export function runCursorScenario() {
  var input = createTextInput({ id: "name", value: "abc" });
  var windowState = createWindowState({ width: 80, height: 40 });
  setRoot(windowState, createColumn({ padding: 2 }, [input]));
  layout(windowState);
  drainActions(windowState);
  draw(windowState, createCanvas(80, 40, { background: rgb(0, 0, 0) }));

  update(windowState, [
    { type: "mouseDown", button: "left", x: input.bounds.x + 1, y: input.bounds.y + 1, pressed: true }
  ]);
  drainActions(windowState);
  draw(windowState, createCanvas(80, 40, { background: rgb(0, 0, 0) }));

  update(windowState, [
    { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", pressed: true }
  ]);

  var actions = drainActions(windowState);
  return [
    input.cursor,
    actions.length,
    needsRedraw(windowState)
  ];
}
