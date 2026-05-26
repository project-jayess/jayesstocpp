import { optionValue } from "./shared.js";

function formWidget(kind, options) {
  return {
    kind: kind,
    id: optionValue(options, "id", null),
    name: optionValue(options, "name", null),
    value: optionValue(options, "value", kind),
    text: optionValue(options, "text", ""),
    checked: optionValue(options, "checked", false),
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null),
    bounds: null,
    padding: optionValue(options, "padding", 4),
    color: optionValue(options, "color", null),
    background: optionValue(options, "background", null),
    borderColor: optionValue(options, "borderColor", null),
    hovered: false,
    pressed: false,
    focused: false
  };
}

export function createCheckbox(options) {
  return formWidget("checkbox", options);
}

export function createRadio(options) {
  return formWidget("radio", options);
}

export function checked(widget) {
  return widget.checked;
}

export function setChecked(widget, value) {
  widget.checked = value;
  return widget;
}

function collectFormState(widget, output) {
  if (widget === null) {
    return output;
  }
  if (widget.kind === "checkbox") {
    if (widget.name !== null) {
      output[widget.name] = widget.checked;
    }
  } else if (widget.kind === "radio") {
    if (widget.name !== null && widget.checked) {
      output[widget.name] = widget.value;
    }
  } else if (widget.kind === "textInput") {
    if (widget.id !== null) {
      output[widget.id] = widget.value;
    }
  } else if (widget.kind === "panel") {
    for (var index = 0; index < widget.children.length; index = index + 1) {
      collectFormState(widget.children[index], output);
    }
  }
  return output;
}

export function formState(rootWidget) {
  return collectFormState(rootWidget, {});
}
