import { contains } from "jayess:layout";

function clearHover(windowState) {
  if (windowState.hoveredWidget !== null) {
    windowState.hoveredWidget.hovered = false;
    windowState.hoveredWidget = null;
    windowState.dirty = true;
  }
}

function setHover(windowState, widget) {
  if (windowState.hoveredWidget === widget) {
    return null;
  }
  clearHover(windowState);
  if (widget !== null) {
    widget.hovered = true;
    windowState.hoveredWidget = widget;
    windowState.dirty = true;
  }
}

function clearPressed(windowState) {
  if (windowState.pressedWidget !== null) {
    windowState.pressedWidget.pressed = false;
    windowState.pressedWidget = null;
    windowState.dirty = true;
  }
}

function hitTest(widget, x, y) {
  if (widget === null || widget.bounds === null) {
    return null;
  }
  if (!contains(widget.bounds, x, y)) {
    return null;
  }
  if (widget.kind === "panel") {
    for (var index = widget.children.length - 1; index >= 0; index = index - 1) {
      var match = hitTest(widget.children[index], x, y);
      if (match !== null) {
        return match;
      }
    }
    return null;
  }
  if (widget.kind === "button") {
    return widget;
  }
  return null;
}

function dispatchMouseMove(windowState, event) {
  setHover(windowState, hitTest(windowState.root, event.x, event.y));
}

function dispatchMouseDown(windowState, event) {
  if (event.button !== "left") {
    return null;
  }
  clearPressed(windowState);
  var target = hitTest(windowState.root, event.x, event.y);
  if (target !== null) {
    target.pressed = true;
    windowState.pressedWidget = target;
    windowState.dirty = true;
  }
}

function dispatchMouseUp(windowState, event) {
  if (event.button !== "left") {
    return null;
  }
  var released = hitTest(windowState.root, event.x, event.y);
  var active = windowState.pressedWidget;
  clearPressed(windowState);
  if (active !== null && released === active) {
    windowState.actions.push({
      type: "click",
      targetId: active.id
    });
    windowState.dirty = true;
  }
}

export function update(windowState, events) {
  if (events === null) {
    return windowState;
  }
  for (var index = 0; index < events.length; index = index + 1) {
    var event = events[index];
    if (event.type === "resize") {
      windowState.width = event.width;
      windowState.height = event.height;
      windowState.needsLayout = true;
      windowState.dirty = true;
    } else if (event.type === "mouseMove") {
      dispatchMouseMove(windowState, event);
    } else if (event.type === "mouseDown") {
      dispatchMouseDown(windowState, event);
    } else if (event.type === "mouseUp") {
      dispatchMouseUp(windowState, event);
    } else if (event.type === "close") {
      windowState.closed = true;
    }
  }
  return windowState;
}
