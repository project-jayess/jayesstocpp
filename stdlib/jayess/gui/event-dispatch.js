import { contains } from "jayess:layout";
import {
  blurTextInput,
  editTextInput,
  focusTextInput
} from "./text-input.js";

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
  if (widget.kind === "button" || widget.kind === "textInput" || widget.kind === "checkbox" || widget.kind === "radio") {
    return widget;
  }
  return null;
}

function isFocusable(widget) {
  return widget !== null && (widget.kind === "button" || widget.kind === "textInput" || widget.kind === "checkbox" || widget.kind === "radio");
}

function collectFocusable(widget, output) {
  if (widget === null) {
    return output;
  }
  if (isFocusable(widget)) {
    output.push(widget);
  }
  if (widget.kind === "panel") {
    for (var index = 0; index < widget.children.length; index = index + 1) {
      collectFocusable(widget.children[index], output);
    }
  }
  return output;
}

function enqueueTextInputAction(windowState, type, widget) {
  windowState.actions.push({
    type: type,
    targetId: widget.id,
    value: widget.value
  });
  windowState.dirty = true;
}

function blurFocusedTextInput(windowState) {
  var focused = windowState.focusedWidget;
  if (focused !== null && focused.kind === "textInput") {
    if (blurTextInput(focused)) {
      enqueueTextInputAction(windowState, "change", focused);
    }
    windowState.focusedWidget = null;
    windowState.dirty = true;
  }
}

function blurFocusedWidget(windowState) {
  var focused = windowState.focusedWidget;
  if (focused !== null && focused.kind === "textInput") {
    blurFocusedTextInput(windowState);
    return null;
  }
  if (focused !== null && focused.focused !== null) {
    focused.focused = false;
    windowState.focusedWidget = null;
    windowState.dirty = true;
  }
}

function focusTextInputWidget(windowState, widget) {
  if (windowState.focusedWidget === widget) {
    return null;
  }
  blurFocusedTextInput(windowState);
  focusTextInput(widget);
  windowState.focusedWidget = widget;
  windowState.dirty = true;
}

function focusWidget(windowState, widget) {
  if (widget.kind === "textInput") {
    focusTextInputWidget(windowState, widget);
    return null;
  }
  if (windowState.focusedWidget === widget) {
    return null;
  }
  blurFocusedWidget(windowState);
  widget.focused = true;
  windowState.focusedWidget = widget;
  windowState.dirty = true;
}

function enqueueControlAction(windowState, widget) {
  windowState.actions.push({
    type: "change",
    targetId: widget.id,
    name: widget.name,
    value: widget.kind === "radio" ? widget.value : widget.checked,
    checked: widget.checked
  });
  windowState.dirty = true;
}

function setRadioGroup(windowState, active) {
  var focusable = collectFocusable(windowState.root, []);
  for (var index = 0; index < focusable.length; index = index + 1) {
    var widget = focusable[index];
    if (widget.kind === "radio" && widget.name === active.name) {
      widget.checked = widget === active;
    }
  }
}

function activateControl(windowState, widget) {
  if (widget.kind === "checkbox") {
    widget.checked = !widget.checked;
    enqueueControlAction(windowState, widget);
  } else if (widget.kind === "radio") {
    if (!widget.checked) {
      setRadioGroup(windowState, widget);
      enqueueControlAction(windowState, widget);
    }
  }
}

function focusNextWidget(windowState) {
  var focusable = collectFocusable(windowState.root, []);
  if (focusable.length === 0) {
    return null;
  }
  var nextIndex = 0;
  for (var index = 0; index < focusable.length; index = index + 1) {
    if (focusable[index] === windowState.focusedWidget) {
      nextIndex = index + 1;
      if (nextIndex >= focusable.length) {
        nextIndex = 0;
      }
    }
  }
  focusWidget(windowState, focusable[nextIndex]);
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
  if (target !== null && target.kind === "textInput") {
    focusTextInputWidget(windowState, target);
    return null;
  }
  if (target === null) {
    blurFocusedWidget(windowState);
    return null;
  }
  if (target.kind === "button" || target.kind === "checkbox" || target.kind === "radio") {
    focusWidget(windowState, target);
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
  if (active !== null && released === active && active.kind === "button") {
    windowState.actions.push({
      type: "click",
      targetId: active.id
    });
    windowState.dirty = true;
  } else if (active !== null && released === active && (active.kind === "checkbox" || active.kind === "radio")) {
    activateControl(windowState, active);
  }
}

function dispatchKeyDown(windowState, event) {
  var focused = windowState.focusedWidget;
  if (event.key === "Tab") {
    focusNextWidget(windowState);
    return null;
  }
  if (focused === null) {
    return null;
  }
  if ((focused.kind === "checkbox" || focused.kind === "radio") && (event.key === " " || event.key === "Enter")) {
    activateControl(windowState, focused);
    return null;
  }
  if (focused.kind !== "textInput") {
    return null;
  }
  var result = editTextInput(focused, event);
  if (result === true) {
    enqueueTextInputAction(windowState, "input", focused);
  } else if (result === "cursor") {
    windowState.dirty = true;
  } else if (result === "change") {
    focused.changedSinceFocus = false;
    enqueueTextInputAction(windowState, "change", focused);
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
    } else if (event.type === "keyDown") {
      dispatchKeyDown(windowState, event);
    } else if (event.type === "close") {
      windowState.closed = true;
    }
  }
  return windowState;
}
