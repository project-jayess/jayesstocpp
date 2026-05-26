import { optionValue } from "./shared.js";

export function createTextInput(options) {
  return {
    kind: "textInput",
    id: optionValue(options, "id", null),
    width: optionValue(options, "width", null),
    height: optionValue(options, "height", null),
    bounds: null,
    value: optionValue(options, "value", ""),
    placeholder: optionValue(options, "placeholder", ""),
    padding: optionValue(options, "padding", 4),
    color: optionValue(options, "color", null),
    placeholderColor: optionValue(options, "placeholderColor", null),
    background: optionValue(options, "background", null),
    focusedBackground: optionValue(options, "focusedBackground", null),
    borderColor: optionValue(options, "borderColor", null),
    focusBorderColor: optionValue(options, "focusBorderColor", null),
    cursor: 0,
    selectionStart: 0,
    selectionEnd: 0,
    focused: false,
    changedSinceFocus: false
  };
}

export function value(widget) {
  return widget.value;
}

export function setValue(widget, text) {
  widget.value = text;
  if (widget.cursor > text.length) {
    widget.cursor = text.length;
  }
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  return widget;
}

export function focusTextInput(widget) {
  widget.focused = true;
  widget.cursor = widget.value.length;
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  widget.changedSinceFocus = false;
  return widget;
}

export function blurTextInput(widget) {
  widget.focused = false;
  var changed = widget.changedSinceFocus;
  widget.changedSinceFocus = false;
  return changed;
}

function insertText(widget, text) {
  var before = widget.value.slice(0, widget.cursor);
  var after = widget.value.slice(widget.cursor, widget.value.length);
  widget.value = before + text + after;
  widget.cursor = widget.cursor + text.length;
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  widget.changedSinceFocus = true;
  return true;
}

function deleteBefore(widget) {
  if (widget.cursor <= 0) {
    return false;
  }
  var before = widget.value.slice(0, widget.cursor - 1);
  var after = widget.value.slice(widget.cursor, widget.value.length);
  widget.value = before + after;
  widget.cursor = widget.cursor - 1;
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  widget.changedSinceFocus = true;
  return true;
}

function deleteAfter(widget) {
  if (widget.cursor >= widget.value.length) {
    return false;
  }
  var before = widget.value.slice(0, widget.cursor);
  var after = widget.value.slice(widget.cursor + 1, widget.value.length);
  widget.value = before + after;
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  widget.changedSinceFocus = true;
  return true;
}

function collapseSelection(widget) {
  widget.selectionStart = widget.cursor;
  widget.selectionEnd = widget.cursor;
  return widget;
}

export function selection(widget) {
  return {
    start: widget.selectionStart,
    end: widget.selectionEnd
  };
}

export function editTextInput(widget, event) {
  var key = event.key;
  if (key === "Backspace") {
    return deleteBefore(widget);
  }
  if (key === "Delete") {
    return deleteAfter(widget);
  }
  if (key === "ArrowLeft") {
    if (widget.cursor > 0) {
      widget.cursor = widget.cursor - 1;
      collapseSelection(widget);
      return "cursor";
    }
    return false;
  }
  if (key === "ArrowRight") {
    if (widget.cursor < widget.value.length) {
      widget.cursor = widget.cursor + 1;
      collapseSelection(widget);
      return "cursor";
    }
    return false;
  }
  if (key === "Home") {
    if (widget.cursor > 0) {
      widget.cursor = 0;
      collapseSelection(widget);
      return "cursor";
    }
    return false;
  }
  if (key === "End") {
    if (widget.cursor < widget.value.length) {
      widget.cursor = widget.value.length;
      collapseSelection(widget);
      return "cursor";
    }
    return false;
  }
  if (key === "Enter") {
    return "change";
  }
  if (key !== null && key.length === 1) {
    return insertText(widget, key);
  }
  return false;
}
