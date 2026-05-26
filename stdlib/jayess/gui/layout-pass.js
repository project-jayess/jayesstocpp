import { inset, rect } from "jayess:layout";
import { lineHeight, measureText } from "jayess:font";

function intrinsicLength(widget, axis) {
  if (axis === "row" && widget.width !== null) {
    return widget.width;
  }
  if (axis === "column" && widget.height !== null) {
    return widget.height;
  }
  if (widget.kind === "label" || widget.kind === "button" || widget.kind === "textInput" || widget.kind === "checkbox" || widget.kind === "radio") {
    var textValue = widget.kind === "textInput" ? widget.value : widget.text;
    if (widget.kind === "textInput" && textValue === "") {
      textValue = widget.placeholder;
    }
    var measured = measureText(null, textValue);
    if (axis === "row") {
      if (widget.kind === "checkbox" || widget.kind === "radio") {
        return measured.width + widget.padding * 2 + 14;
      }
      return measured.width + widget.padding * 2;
    }
    return lineHeight(null) + widget.padding * 2;
  }
  return null;
}

function layoutWidget(widget, bounds) {
  widget.bounds = bounds;
  if (widget.kind !== "panel") {
    return widget;
  }

  var content = inset(bounds, widget.padding);
  var children = widget.children;
  if (children.length === 0) {
    return widget;
  }

  if (widget.layout === "stack") {
    for (var index = 0; index < children.length; index = index + 1) {
      layoutWidget(children[index], content);
    }
    return widget;
  }

  var axis = widget.layout === "row" ? "row" : "column";
  var available = axis === "row" ? content.width : content.height;
  var fixed = 0;
  var flexible = 0;

  for (var index = 0; index < children.length; index = index + 1) {
    var childLength = intrinsicLength(children[index], axis);
    if (childLength === null) {
      flexible = flexible + 1;
    } else {
      fixed = fixed + childLength;
    }
  }

  var remaining = available - fixed - widget.gap * (children.length - 1);
  if (remaining < 0) {
    remaining = 0;
  }
  var flexibleLength = flexible === 0 ? 0 : remaining / flexible;
  var cursor = axis === "row" ? content.x : content.y;

  for (var index = 0; index < children.length; index = index + 1) {
    var child = children[index];
    var childLength = intrinsicLength(child, axis);
    if (childLength === null) {
      childLength = flexibleLength;
    }
    if (axis === "row") {
      layoutWidget(child, rect(cursor, content.y, childLength, content.height));
    } else {
      layoutWidget(child, rect(content.x, cursor, content.width, childLength));
    }
    cursor = cursor + childLength + widget.gap;
  }

  return widget;
}

export function layout(windowState) {
  if (windowState.root === null) {
    windowState.needsLayout = false;
    return windowState;
  }
  layoutWidget(windowState.root, rect(0, 0, windowState.width, windowState.height));
  windowState.needsLayout = false;
  windowState.dirty = true;
  return windowState;
}
