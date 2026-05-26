import { create as createCanvas, getPixel } from "jayess:canvas";
import {
  checked,
  createCheckbox,
  createColumn,
  createRadio,
  createTextInput,
  createWindowState,
  drainActions,
  draw,
  formState,
  layout,
  setRoot,
  update
} from "jayess:gui";

export function runFormScenario() {
  var accept = createCheckbox({ id: "accept", name: "accept", text: "Accept" });
  var light = createRadio({ id: "light", name: "theme", value: "light", text: "Light", checked: true });
  var dark = createRadio({ id: "dark", name: "theme", value: "dark", text: "Dark" });
  var name = createTextInput({ id: "name", value: "Ada" });
  var root = createColumn({ padding: 4, gap: 2 }, [accept, light, dark, name]);
  var windowState = createWindowState({ width: 160, height: 96 });
  setRoot(windowState, root);
  layout(windowState);

  update(windowState, [
    { type: "mouseDown", button: "left", x: accept.bounds.x + 2, y: accept.bounds.y + 2 },
    { type: "mouseUp", button: "left", x: accept.bounds.x + 2, y: accept.bounds.y + 2 },
    { type: "mouseDown", button: "left", x: dark.bounds.x + 2, y: dark.bounds.y + 2 },
    { type: "mouseUp", button: "left", x: dark.bounds.x + 2, y: dark.bounds.y + 2 },
    { type: "keyDown", key: "Tab" },
    { type: "keyDown", key: "Tab" }
  ]);

  var actions = drainActions(windowState);
  var state = formState(root);
  var canvas = createCanvas(160, 96, null);
  draw(windowState, canvas);
  var sample = getPixel(canvas, accept.bounds.x + 1, accept.bounds.y + 1);
  return [
    checked(accept),
    checked(light),
    checked(dark),
    state.accept,
    state.theme,
    state.name,
    actions.length,
    actions[0].type,
    actions[0].targetId,
    actions[0].checked,
    actions[1].type,
    actions[1].targetId,
    actions[1].value,
    windowState.focusedWidget.id,
    sample.red > 0
  ];
}
