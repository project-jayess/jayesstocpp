function widgetRole(widget) {
  if (widget.kind === "textInput") {
    return "textbox";
  }
  if (widget.kind === "panel") {
    return "group";
  }
  return widget.kind;
}

function widgetLabel(widget) {
  if (widget.text !== null) {
    return widget.text;
  }
  if (widget.placeholder !== null && widget.placeholder !== "") {
    return widget.placeholder;
  }
  if (widget.id !== null) {
    return widget.id;
  }
  if (widget.name !== null) {
    return widget.name;
  }
  return "";
}

function widgetChecked(widget) {
  if (widget.kind === "checkbox" || widget.kind === "radio") {
    return widget.checked;
  }
  return null;
}

function widgetValue(widget) {
  if (widget.kind === "textInput") {
    return widget.value;
  }
  if (widget.kind === "checkbox" || widget.kind === "radio") {
    return widget.value;
  }
  return widgetLabel(widget);
}

export function accessibility(widget) {
  return {
    role: widgetRole(widget),
    label: widgetLabel(widget),
    disabled: widget.disabled === true,
    checked: widgetChecked(widget),
    focused: widget.focused === true,
    value: widgetValue(widget)
  };
}
