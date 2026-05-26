import { defaultTheme, optionValue, copyChildren } from "./shared.js";

function widget(kind, options) {
  return {
    kind: kind,
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null),
    bounds: null
  };
}

export function createApplication() {
  return {
    windows: []
  };
}

export function createWindowState(options) {
  return {
    title: optionValue(options, "title", ""),
    width: optionValue(options, "width", 320),
    height: optionValue(options, "height", 240),
    background: optionValue(options, "background", defaultTheme().windowBackground),
    theme: optionValue(options, "theme", defaultTheme()),
    root: null,
    actions: [],
    dirty: true,
    needsLayout: true,
    hoveredWidget: null,
    pressedWidget: null,
    focusedWidget: null,
    htmlDocument: null,
    htmlFocus: null,
    closed: false
  };
}

export function invalidate(windowState) {
  windowState.dirty = true;
  return windowState;
}

export function drainActions(windowState) {
  var actions = windowState.actions;
  windowState.actions = [];
  return actions;
}

export function needsRedraw(windowState) {
  return windowState.dirty || windowState.needsLayout;
}

export function setRoot(windowState, rootWidget) {
  windowState.root = rootWidget;
  windowState.hoveredWidget = null;
  windowState.pressedWidget = null;
  windowState.focusedWidget = null;
  windowState.needsLayout = true;
  windowState.dirty = true;
  return windowState;
}

export function createLabel(options) {
  var value = widget("label", options);
  value.text = optionValue(options, "text", "");
  value.align = optionValue(options, "align", "left");
  value.padding = optionValue(options, "padding", 2);
  value.color = optionValue(options, "color", null);
  value.background = optionValue(options, "background", null);
  return value;
}

export function createButton(options) {
  var value = widget("button", options);
  value.id = optionValue(options, "id", null);
  value.text = optionValue(options, "text", "");
  value.align = optionValue(options, "align", "center");
  value.padding = optionValue(options, "padding", 4);
  value.color = optionValue(options, "color", null);
  value.background = optionValue(options, "background", null);
  value.hoverBackground = optionValue(options, "hoverBackground", null);
  value.pressedBackground = optionValue(options, "pressedBackground", null);
  value.borderColor = optionValue(options, "borderColor", null);
  value.hovered = false;
  value.pressed = false;
  return value;
}

export function createPanel(options, children) {
  var value = widget("panel", options);
  value.layout = optionValue(options, "layout", "stack");
  value.padding = optionValue(options, "padding", 0);
  value.gap = optionValue(options, "gap", 0);
  value.background = optionValue(options, "background", null);
  value.children = copyChildren(children);
  return value;
}

export function createStack(options, children) {
  return createPanel({
    layout: "stack",
    padding: optionValue(options, "padding", 0),
    gap: optionValue(options, "gap", 0),
    background: optionValue(options, "background", null),
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null)
  }, children);
}

export function createColumn(options, children) {
  return createPanel({
    layout: "column",
    padding: optionValue(options, "padding", 0),
    gap: optionValue(options, "gap", 0),
    background: optionValue(options, "background", null),
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null)
  }, children);
}

export function createRow(options, children) {
  return createPanel({
    layout: "row",
    padding: optionValue(options, "padding", 0),
    gap: optionValue(options, "gap", 0),
    background: optionValue(options, "background", null),
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null)
  }, children);
}
