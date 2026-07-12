import { includes as arrayIncludes } from "jayess:array";
import { rgb } from "jayess:color";
import { round } from "jayess:math";
import { parse as parseXml } from "jayess:xml";
import {
  booleanAttribute,
  colorAttribute,
  cornersAttribute,
  lengthAttribute,
  numberAttribute,
  optionalLengthAttribute,
  overflowAttribute,
  pointAttribute,
  pointsAttribute,
  rejectForbiddenGeometryAttributes,
  rejectUnknownAttributes,
  scrollbarColorAttribute,
  selectionAttribute,
  requiredSizeAttribute,
  shadowAttribute,
  sizeAttribute,
  textAlignAttribute,
  textAttribute,
  textDecorationAttribute,
  textOverflowAttribute,
  textWrapAttribute,
  textTransformAttribute
} from "./xml-attributes.js";

const rootNames = ["scene", "canvas"];
const rootAttributes = [
  "width",
  "height",
  "w",
  "h",
  "background",
  "title",
  "antialias",
  "layout",
  "gap",
  "padding",
  "align",
  "justify",
  "overflow",
  "overflow-y",
  "scrollbar-width",
  "scrollbar-color",
  "scrollbar-thumb",
  "scrollbar-thumb-width",
  "scrollbar-thumb-height",
  "scrollbar-thumb-corners",
  "scrollbar-thumb-color",
  "scrollbar-thumb-opacity",
  "scrollbar-track",
  "scrollbar-track-corners",
  "scrollbar-track-color",
  "scrollbar-track-opacity"
];
const sharedAttributes = [
  "id",
  "color-event-mode",
  "x",
  "y",
  "xy",
  "width",
  "height",
  "w",
  "h",
  "fill",
  "outline",
  "outline-thickness",
  "outline-opacity",
  "corners",
  "opacity",
  "padding",
  "position",
  "left",
  "top",
  "right",
  "bottom",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "layout",
  "gap",
  "align",
  "justify",
  "grow",
  "shrink",
  "basis",
  "font-color",
  "font-family",
  "font-size",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-transform",
  "text-decoration",
  "text-overflow",
  "text-wrap",
  "text-select",
  "text-select-color",
  "mouse-select",
  "mouse-select-color",
  "overflow",
  "overflow-x",
  "overflow-y",
  "scrollbar-width",
  "scrollbar-color",
  "scrollbar-thumb",
  "scrollbar-thumb-width",
  "scrollbar-thumb-height",
  "scrollbar-thumb-corners",
  "scrollbar-thumb-color",
  "scrollbar-thumb-opacity",
  "scrollbar-track",
  "scrollbar-track-corners",
  "scrollbar-track-color",
  "scrollbar-track-opacity",
  "text-align",
  "text-align-x",
  "text-align-y",
  "text",
  "rotation",
  "clip",
  "visible",
  "points",
  "shadow",
  "z"
];
const shapeNames = [
  "group",
  "button",
  "rectangle",
  "ellipse",
  "semiellipse",
  "triangle",
  "capsule",
  "line",
  "pixel",
  "polyline",
  "polygon",
  "image",
  "text"
];
const imageAttributes = ["src"];
const textAttributes = [
  "font-family",
  "font-size",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-transform",
  "text-decoration",
  "text-overflow",
  "text-wrap",
  "text-select",
  "text-select-color",
  "mouse-select",
  "mouse-select-color",
  "overflow",
  "overflow-x",
  "overflow-y",
  "scrollbar-width",
  "scrollbar-color",
  "scrollbar-thumb",
  "scrollbar-thumb-width",
  "scrollbar-thumb-height",
  "scrollbar-thumb-corners",
  "scrollbar-thumb-color",
  "scrollbar-thumb-opacity",
  "scrollbar-track",
  "scrollbar-track-corners",
  "scrollbar-track-color",
  "scrollbar-track-opacity",
  "text"
];

function fail(message) {
  throw message;
}

function concatAttributes(left, right) {
  var values = [];
  for (var leftIndex = 0; leftIndex < left.length; leftIndex = leftIndex + 1) {
    values.push(left[leftIndex]);
  }
  for (var rightIndex = 0; rightIndex < right.length; rightIndex = rightIndex + 1) {
    values.push(right[rightIndex]);
  }
  return values;
}

function allowedShapeAttributes(name) {
  if (name === "group") {
    return sharedAttributes;
  }
  if (name === "image") {
    return concatAttributes(sharedAttributes, imageAttributes);
  }
  if (name === "text") {
    return concatAttributes(sharedAttributes, textAttributes);
  }
  return sharedAttributes;
}

function requireRoot(node) {
  if (node === null || node.name === null) {
    fail("jayess:canvas XML scene must start with <scene> or <canvas>");
  }
  if (!arrayIncludes(rootNames, node.name)) {
    fail("jayess:canvas XML root must be <scene> or <canvas>");
  }
  return node;
}

function requireKnownShape(node) {
  if (node.name === null) {
    fail("jayess:canvas XML scene does not allow text nodes between shapes");
  }
  if (!arrayIncludes(shapeNames, node.name)) {
    fail("jayess:canvas XML unknown element <" + node.name + ">");
  }
}

function defaultColor() {
  return rgb(0, 0, 0);
}

function defaultButtonFill() {
  return rgb(246, 248, 250);
}

function defaultButtonOutline() {
  return rgb(209, 217, 224);
}

function defaultButtonCorners() {
  return {
    topLeft: 6,
    topRight: 6,
    bottomRight: 6,
    bottomLeft: 6
  };
}

function defaultButtonFontColor() {
  return rgb(36, 41, 47);
}

function colorEventModeAttribute(attributes) {
  var value = textAttribute(attributes, "color-event-mode", "darker");
  if (value === "darker" || value === "lighter") {
    return value;
  }
  fail("jayess:canvas XML color-event-mode must be darker or lighter");
}

function scrollbarStyleAttributes(attributes) {
  return {
    thumb: textAttribute(attributes, "scrollbar-thumb", ""),
    thumbWidth: sizeAttribute(attributes, "scrollbar-thumb-width", 0),
    thumbHeight: sizeAttribute(attributes, "scrollbar-thumb-height", 0),
    thumbCorners: cornersAttribute(attributes, "scrollbar-thumb-corners", null),
    thumbColor: colorAttribute(attributes, "scrollbar-thumb-color", null),
    thumbOpacity: numberAttribute(attributes, "scrollbar-thumb-opacity", 1),
    track: textAttribute(attributes, "scrollbar-track", ""),
    trackCorners: cornersAttribute(attributes, "scrollbar-track-corners", null),
    trackColor: colorAttribute(attributes, "scrollbar-track-color", null),
    trackOpacity: numberAttribute(attributes, "scrollbar-track-opacity", 1)
  };
}

function contentSize(size, padding) {
  var value = size - padding * 2;
  if (value < 0) {
    return 0;
  }
  return value;
}

function clampSize(value, minimum, maximum) {
  var resolved = value;
  if (minimum !== null && resolved < minimum) {
    resolved = minimum;
  }
  if (maximum !== null && resolved > maximum) {
    resolved = maximum;
  }
  return resolved;
}

function constrainedWidth(attributes, value, basis) {
  return clampSize(
    value,
    optionalLengthAttribute(attributes, "min-width", basis),
    optionalLengthAttribute(attributes, "max-width", basis)
  );
}

function constrainedHeight(attributes, value, basis) {
  return clampSize(
    value,
    optionalLengthAttribute(attributes, "min-height", basis),
    optionalLengthAttribute(attributes, "max-height", basis)
  );
}

function enumAttribute(attributes, name, fallback, allowed) {
  var value = textAttribute(attributes, name, fallback);
  if (!arrayIncludes(allowed, value)) {
    fail("jayess:canvas XML " + name + " has an unsupported value");
  }
  return value;
}

function positionAttribute(attributes, fallback) {
  return enumAttribute(attributes, "position", fallback, ["relative", "absolute", "fixed"]);
}

function layoutAttribute(attributes) {
  return enumAttribute(attributes, "layout", "column", ["none", "row", "column"]);
}

function alignAttribute(attributes) {
  return enumAttribute(attributes, "align", "start", ["start", "center", "end", "stretch"]);
}

function justifyAttribute(attributes) {
  return enumAttribute(attributes, "justify", "start", ["start", "center", "end", "space-between", "space-around", "space-evenly"]);
}

function defaultPositionFor(parentLayout) {
  return "relative";
}

function rootSizeAttribute(attributes, name, alias) {
  if (attributes[alias] !== null) {
    return sizeAttribute(attributes, alias, 0);
  }
  return requiredSizeAttribute(attributes, name);
}

function hasAttribute(attributes, name) {
  return attributes[name] !== null;
}

function lengthAliasAttribute(attributes, alias, name, fallback, basis) {
  if (hasAttribute(attributes, alias)) {
    return lengthAttribute(attributes, alias, fallback, basis);
  }
  return lengthAttribute(attributes, name, fallback, basis);
}

function resolveWidth(attributes, parentWidth) {
  var width = lengthAliasAttribute(attributes, "w", "width", 0, parentWidth);
  var left = optionalLengthAttribute(attributes, "left", parentWidth);
  var right = optionalLengthAttribute(attributes, "right", parentWidth);
  if (!hasAttribute(attributes, "width") && !hasAttribute(attributes, "w") && left !== null && right !== null) {
    width = parentWidth - left - right;
  }
  return constrainedWidth(attributes, width, parentWidth);
}

function resolveHeight(attributes, parentHeight) {
  var height = lengthAliasAttribute(attributes, "h", "height", 0, parentHeight);
  var top = optionalLengthAttribute(attributes, "top", parentHeight);
  var bottom = optionalLengthAttribute(attributes, "bottom", parentHeight);
  if (!hasAttribute(attributes, "height") && !hasAttribute(attributes, "h") && top !== null && bottom !== null) {
    height = parentHeight - top - bottom;
  }
  return constrainedHeight(attributes, height, parentHeight);
}

function resolveOrigin(attributes, position, context, width, height) {
  if (position === "relative") {
    if (hasAttribute(attributes, "xy")) {
      pointAttribute(attributes, "xy", 0, 0);
    }
    lengthAttribute(attributes, "x", 0, context.parentWidth);
    lengthAttribute(attributes, "y", 0, context.parentHeight);
    optionalLengthAttribute(attributes, "left", context.parentWidth);
    optionalLengthAttribute(attributes, "right", context.parentWidth);
    optionalLengthAttribute(attributes, "top", context.parentHeight);
    optionalLengthAttribute(attributes, "bottom", context.parentHeight);
    return { x: context.offsetX, y: context.offsetY };
  }
  var parentWidth = context.parentWidth;
  var parentHeight = context.parentHeight;
  var baseX = context.offsetX;
  var baseY = context.offsetY;
  if (position === "fixed") {
    parentWidth = context.viewportWidth;
    parentHeight = context.viewportHeight;
    baseX = 0;
    baseY = 0;
  }
  var x = lengthAttribute(attributes, "x", 0, parentWidth);
  var y = lengthAttribute(attributes, "y", 0, parentHeight);
  if (hasAttribute(attributes, "xy")) {
    var point = pointAttribute(attributes, "xy", 0, 0);
    x = point.x;
    y = point.y;
  } else {
    if (!hasAttribute(attributes, "x") && hasAttribute(attributes, "left")) {
      x = lengthAttribute(attributes, "left", 0, parentWidth);
    } else if (!hasAttribute(attributes, "x") && hasAttribute(attributes, "right")) {
      x = parentWidth - lengthAttribute(attributes, "right", 0, parentWidth) - width;
    }
    if (!hasAttribute(attributes, "y") && hasAttribute(attributes, "top")) {
      y = lengthAttribute(attributes, "top", 0, parentHeight);
    } else if (!hasAttribute(attributes, "y") && hasAttribute(attributes, "bottom")) {
      y = parentHeight - lengthAttribute(attributes, "bottom", 0, parentHeight) - height;
    }
  }
  return { x: baseX + x, y: baseY + y };
}

function normalizeShared(node, context) {
  var attributes = node.attributes;
  var isButton = node.name === "button";
  var position = positionAttribute(attributes, defaultPositionFor(context.parentLayout));
  var width = resolveWidth(attributes, context.parentWidth);
  var height = resolveHeight(attributes, context.parentHeight);
  var origin = resolveOrigin(attributes, position, context, width, height);
  var x = origin.x;
  var y = origin.y;
  var fill = colorAttribute(attributes, "fill", null);
  var outline = colorAttribute(attributes, "outline", null);
  var corners = cornersAttribute(attributes, "corners", null);
  var padding = sizeAttribute(attributes, "padding", 0);
  var fontColor = colorAttribute(attributes, "font-color", null);
  var fontSize = sizeAttribute(attributes, "font-size", 0);
  var textSelection = selectionAttribute(attributes, "text-select", null);
  if (isButton) {
    if (fill === null) {
      fill = defaultButtonFill();
    }
    if (outline === null) {
      outline = defaultButtonOutline();
    }
    if (corners === null) {
      corners = defaultButtonCorners();
    }
    if (padding === 0) {
      padding = 8;
    }
    if (fontColor === null) {
      fontColor = defaultButtonFontColor();
    }
    if (fontSize === 0) {
      fontSize = 14;
    }
  }
  return {
    id: textAttribute(attributes, "id", ""),
    colorEventMode: colorEventModeAttribute(attributes),
    position: position,
    x: x,
    y: y,
    width: width,
    height: height,
    fill: fill,
    outline: outline,
    outlineThickness: sizeAttribute(attributes, "outline-thickness", 1),
    outlineOpacity: numberAttribute(attributes, "outline-opacity", 1),
    corners: corners,
    opacity: numberAttribute(attributes, "opacity", 1),
    padding: padding,
    layout: layoutAttribute(attributes),
    gap: sizeAttribute(attributes, "gap", 0),
    align: alignAttribute(attributes),
    justify: justifyAttribute(attributes),
    grow: numberAttribute(attributes, "grow", 0),
    shrink: numberAttribute(attributes, "shrink", 1),
    basis: optionalLengthAttribute(attributes, "basis", context.parentWidth),
    fontColor: fontColor,
    fontSize: fontSize,
    lineHeight: sizeAttribute(attributes, "line-height", 0),
    letterSpacing: numberAttribute(attributes, "letter-spacing", 0),
    wordSpacing: numberAttribute(attributes, "word-spacing", 0),
    textTransform: textTransformAttribute(attributes, "text-transform", "none"),
    textDecoration: textDecorationAttribute(attributes, "text-decoration", "none"),
    textOverflow: textOverflowAttribute(attributes, "text-overflow", "overflow"),
    textWrap: textWrapAttribute(attributes, "text-wrap", "wrap"),
    textSelection: textSelection,
    textSelectionKind: textSelection === null ? "" : "text",
    textSelectColor: colorAttribute(attributes, "text-select-color", null),
    mouseSelect: booleanAttribute(attributes, "mouse-select", false),
    mouseSelectColor: colorAttribute(attributes, "mouse-select-color", null),
    overflow: overflowAttribute(attributes, "overflow", "visible"),
    overflowX: overflowAttribute(attributes, "overflow-x", overflowAttribute(attributes, "overflow", "visible")),
    overflowY: overflowAttribute(attributes, "overflow-y", overflowAttribute(attributes, "overflow", "visible")),
    scrollbarWidth: sizeAttribute(attributes, "scrollbar-width", 8),
    scrollbarColor: scrollbarColorAttribute(attributes, "scrollbar-color", null),
    scrollbarStyle: scrollbarStyleAttributes(attributes),
    textAlign: textAlignAttribute(attributes, "center", "middle"),
    rotation: numberAttribute(attributes, "rotation", 0),
    clip: booleanAttribute(attributes, "clip", false),
    visible: booleanAttribute(attributes, "visible", true),
    points: pointsAttribute(attributes, x, y),
    shadow: shadowAttribute(attributes, "shadow", null),
    z: numberAttribute(attributes, "z", 0)
  };
}

function collectShapeText(parent, child, currentText) {
  if (child.text === null) {
    return currentText;
  }
  if (parent.name === "group") {
    fail("jayess:canvas XML <group> does not allow text nodes");
  }
  return currentText + child.text;
}

function shiftShape(shape, deltaX, deltaY) {
  shape.x = shape.x + deltaX;
  shape.y = shape.y + deltaY;
  for (var pointIndex = 0; pointIndex < shape.points.length; pointIndex = pointIndex + 1) {
    shape.points[pointIndex].x = shape.points[pointIndex].x + deltaX;
    shape.points[pointIndex].y = shape.points[pointIndex].y + deltaY;
  }
  for (var childIndex = 0; childIndex < shape.children.length; childIndex = childIndex + 1) {
    shiftShape(shape.children[childIndex], deltaX, deltaY);
  }
}

function flowChildren(children) {
  var values = [];
  for (var index = 0; index < children.length; index = index + 1) {
    if (children[index].position === "relative") {
      values.push(children[index]);
    }
  }
  return values;
}

function mainSize(shape, direction) {
  if (direction === "row") {
    return shape.width;
  }
  return shape.height;
}

function crossSize(shape, direction) {
  if (direction === "row") {
    return shape.height;
  }
  return shape.width;
}

function setMainSize(shape, direction, value) {
  if (direction === "row") {
    shape.width = value;
  } else {
    shape.height = value;
  }
}

function setCrossSize(shape, direction, value) {
  if (direction === "row") {
    shape.height = value;
  } else {
    shape.width = value;
  }
}

function childBasis(child, direction) {
  if (child.basis !== null) {
    return child.basis;
  }
  return mainSize(child, direction);
}

function flowTotalBase(children, direction, gap) {
  var total = 0;
  for (var index = 0; index < children.length; index = index + 1) {
    total = total + childBasis(children[index], direction);
  }
  if (children.length > 1) {
    total = total + gap * (children.length - 1);
  }
  return total;
}

function flowGrowTotal(children) {
  var total = 0;
  for (var index = 0; index < children.length; index = index + 1) {
    total = total + children[index].grow;
  }
  return total;
}

function flowShrinkTotal(children) {
  var total = 0;
  for (var index = 0; index < children.length; index = index + 1) {
    total = total + children[index].shrink;
  }
  return total;
}

function distributeFlowSizes(children, direction, available, gap) {
  var base = flowTotalBase(children, direction, gap);
  var remaining = available - base;
  var growTotal = flowGrowTotal(children);
  var shrinkTotal = flowShrinkTotal(children);
  for (var index = 0; index < children.length; index = index + 1) {
    var child = children[index];
    var size = childBasis(child, direction);
    if (remaining > 0 && growTotal > 0) {
      size = size + remaining * child.grow / growTotal;
    } else if (remaining < 0 && shrinkTotal > 0) {
      size = size + remaining * child.shrink / shrinkTotal;
      if (size < 0) {
        size = 0;
      }
    }
    setMainSize(child, direction, size);
  }
}

function resolvedFlowTotal(children, direction, gap) {
  var total = 0;
  for (var index = 0; index < children.length; index = index + 1) {
    total = total + mainSize(children[index], direction);
  }
  if (children.length > 1) {
    total = total + gap * (children.length - 1);
  }
  return total;
}

function flowStart(parent, children, direction, available, gap) {
  var total = resolvedFlowTotal(children, direction, gap);
  if (parent.justify === "center") {
    return (available - total) / 2;
  }
  if (parent.justify === "end") {
    return available - total;
  }
  if (parent.justify === "space-around" && children.length > 0) {
    return (available - total) / children.length / 2;
  }
  if (parent.justify === "space-evenly" && children.length > 0) {
    return (available - total) / (children.length + 1);
  }
  return 0;
}

function flowGap(parent, children, direction, available, gap) {
  if (children.length <= 1) {
    return gap;
  }
  var total = resolvedFlowTotal(children, direction, 0);
  if (parent.justify === "space-between") {
    return (available - total) / (children.length - 1);
  }
  if (parent.justify === "space-around") {
    return (available - total) / children.length;
  }
  if (parent.justify === "space-evenly") {
    return (available - total) / (children.length + 1);
  }
  return gap;
}

function crossOffset(parent, child, direction, available) {
  if (parent.align === "center") {
    return (available - crossSize(child, direction)) / 2;
  }
  if (parent.align === "end") {
    return available - crossSize(child, direction);
  }
  return 0;
}

function applyFlowLayout(parent) {
  if (parent.layout !== "row" && parent.layout !== "column") {
    return null;
  }
  var children = flowChildren(parent.children);
  if (children.length === 0) {
    return null;
  }
  var direction = parent.layout;
  var contentX = parent.x + parent.padding;
  var contentY = parent.y + parent.padding;
  var contentWidth = contentSize(parent.width, parent.padding);
  var contentHeight = contentSize(parent.height, parent.padding);
  var mainAvailable = direction === "row" ? contentWidth : contentHeight;
  var crossAvailable = direction === "row" ? contentHeight : contentWidth;
  distributeFlowSizes(children, direction, mainAvailable, parent.gap);
  var cursor = flowStart(parent, children, direction, mainAvailable, parent.gap);
  var gap = flowGap(parent, children, direction, mainAvailable, parent.gap);
  for (var index = 0; index < children.length; index = index + 1) {
    var child = children[index];
    if (parent.align === "stretch") {
      setCrossSize(child, direction, crossAvailable);
    }
    var targetX = contentX;
    var targetY = contentY;
    if (direction === "row") {
      targetX = contentX + cursor;
      targetY = contentY + crossOffset(parent, child, direction, crossAvailable);
    } else {
      targetX = contentX + crossOffset(parent, child, direction, crossAvailable);
      targetY = contentY + cursor;
    }
    shiftShape(child, targetX - child.x, targetY - child.y);
    cursor = cursor + mainSize(child, direction) + gap;
    applyFlowLayout(child);
  }
  return null;
}

function childContext(parent, viewportWidth, viewportHeight) {
  return {
    offsetX: parent.x + parent.padding,
    offsetY: parent.y + parent.padding,
    parentWidth: contentSize(parent.width, parent.padding),
    parentHeight: contentSize(parent.height, parent.padding),
    viewportWidth: viewportWidth,
    viewportHeight: viewportHeight,
    parentLayout: parent.layout
  };
}

function normalizeShape(node, context) {
  requireKnownShape(node);
  rejectForbiddenGeometryAttributes(node.attributes);
  rejectUnknownAttributes(node.attributes, allowedShapeAttributes(node.name), node.name);
  var shared = normalizeShared(node, context);
  var children = [];
  var childText = "";
  var nestedContext = childContext(shared, context.viewportWidth, context.viewportHeight);
  for (var index = 0; index < node.children.length; index = index + 1) {
    var child = node.children[index];
    if (child.text !== null) {
      childText = collectShapeText(node, child, childText);
    } else {
      children.push(normalizeShape(child, nestedContext));
    }
  }
  var shape = {
    kind: node.name,
    id: shared.id,
    colorEventMode: shared.colorEventMode,
    baseFill: shared.fill,
    position: shared.position,
    x: shared.x,
    y: shared.y,
    width: shared.width,
    height: shared.height,
    fill: shared.fill,
    outline: shared.outline,
    outlineThickness: shared.outlineThickness,
    outlineOpacity: shared.outlineOpacity,
    corners: shared.corners,
    opacity: shared.opacity,
    padding: shared.padding,
    layout: shared.layout,
    gap: shared.gap,
    align: shared.align,
    justify: shared.justify,
    grow: shared.grow,
    shrink: shared.shrink,
    basis: shared.basis,
    fontColor: shared.fontColor,
    textAlignX: shared.textAlign.x,
    textAlignY: shared.textAlign.y,
    rotation: shared.rotation,
    clip: shared.clip,
    visible: shared.visible,
    points: shared.points,
    shadow: shared.shadow,
    z: shared.z,
    src: textAttribute(node.attributes, "src", ""),
    fontFamily: textAttribute(node.attributes, "font-family", ""),
    fontSize: shared.fontSize,
    lineHeight: shared.lineHeight,
    letterSpacing: shared.letterSpacing,
    wordSpacing: shared.wordSpacing,
    textTransform: shared.textTransform,
    textDecoration: shared.textDecoration,
    textOverflow: shared.textOverflow,
    textWrap: shared.textWrap,
    textSelection: shared.textSelection,
    textSelectionKind: shared.textSelectionKind,
    textSelectColor: shared.textSelectColor,
    mouseSelect: shared.mouseSelect,
    mouseSelectColor: shared.mouseSelectColor,
    overflow: shared.overflow,
    overflowX: shared.overflowX,
    overflowY: shared.overflowY,
    scrollbarWidth: shared.scrollbarWidth,
    scrollbarColor: shared.scrollbarColor,
    scrollbarStyle: shared.scrollbarStyle,
    scrollOffsetX: 0,
    scrollOffsetY: 0,
    textLayoutCache: null,
    textBitmapCache: null,
    text: textAttribute(node.attributes, "text", childText),
    children: children
  };
  applyFlowLayout(shape);
  return shape;
}

function snapShapeToPixels(shape) {
  shape.x = round(shape.x);
  shape.y = round(shape.y);
  shape.width = round(shape.width);
  shape.height = round(shape.height);
  for (var pointIndex = 0; pointIndex < shape.points.length; pointIndex = pointIndex + 1) {
    shape.points[pointIndex].x = round(shape.points[pointIndex].x);
    shape.points[pointIndex].y = round(shape.points[pointIndex].y);
  }
  for (var childIndex = 0; childIndex < shape.children.length; childIndex = childIndex + 1) {
    snapShapeToPixels(shape.children[childIndex]);
  }
}

function snapShapesToPixels(shapes) {
  for (var index = 0; index < shapes.length; index = index + 1) {
    snapShapeToPixels(shapes[index]);
  }
  return shapes;
}

function shapeContentBottom(shape) {
  if (shape.position === "fixed") {
    return 0;
  }
  var bottom = shape.y + shape.height;
  for (var index = 0; index < shape.children.length; index = index + 1) {
    var childBottom = shapeContentBottom(shape.children[index]);
    if (childBottom > bottom) {
      bottom = childBottom;
    }
  }
  return bottom;
}

function sceneScrollHeight(shapes, fallback) {
  var bottom = fallback;
  for (var index = 0; index < shapes.length; index = index + 1) {
    var shapeBottom = shapeContentBottom(shapes[index]);
    if (shapeBottom > bottom) {
      bottom = shapeBottom;
    }
  }
  return bottom;
}

function rootScrollbarGutter(overflowY, scrollbarWidth) {
  if (scrollbarWidth <= 0) {
    return 0;
  }
  if (overflowY === "scroll" || overflowY === "auto") {
    return scrollbarWidth;
  }
  return 0;
}

function rootLayoutShape(root, width, height, children) {
  var attributes = root.attributes;
  var overflowY = overflowAttribute(attributes, "overflow-y", overflowAttribute(attributes, "overflow", "visible"));
  var scrollbarWidth = sizeAttribute(attributes, "scrollbar-width", 8);
  var gutter = rootScrollbarGutter(overflowY, scrollbarWidth);
  return {
    kind: root.name,
    id: "",
    position: "relative",
    x: 0,
    y: 0,
    width: width - gutter,
    height: height,
    padding: sizeAttribute(attributes, "padding", 0),
    layout: layoutAttribute(attributes),
    gap: sizeAttribute(attributes, "gap", 0),
    align: alignAttribute(attributes),
    justify: justifyAttribute(attributes),
    overflowY: overflowY,
    scrollbarWidth: scrollbarWidth,
    scrollbarGutter: gutter,
    scrollbarStyle: scrollbarStyleAttributes(attributes),
    children: children
  };
}

function normalizeChildren(root, width, height) {
  var children = [];
  var rootParent = rootLayoutShape(root, width, height, children);
  var context = {
    offsetX: rootParent.padding,
    offsetY: rootParent.padding,
    parentWidth: contentSize(rootParent.width, rootParent.padding),
    parentHeight: contentSize(height, rootParent.padding),
    viewportWidth: rootParent.width,
    viewportHeight: height,
    parentLayout: rootParent.layout
  };
  for (var index = 0; index < root.children.length; index = index + 1) {
    children.push(normalizeShape(root.children[index], context));
  }
  applyFlowLayout(rootParent);
  return snapShapesToPixels(children);
}

export function parseScene(xmlText, options) {
  var root = requireRoot(parseXml(xmlText));
  rejectForbiddenGeometryAttributes(root.attributes);
  rejectUnknownAttributes(root.attributes, rootAttributes, root.name);
  var width = rootSizeAttribute(root.attributes, "width", "w");
  var height = rootSizeAttribute(root.attributes, "height", "h");
  var overflowY = overflowAttribute(root.attributes, "overflow-y", overflowAttribute(root.attributes, "overflow", "visible"));
  var scrollbarWidth = sizeAttribute(root.attributes, "scrollbar-width", 8);
  var scrollbarGutter = rootScrollbarGutter(overflowY, scrollbarWidth);
  var shapes = normalizeChildren(root, width, height);
  return {
    kind: "scene",
    root: root.name,
    width: width,
    height: height,
    background: colorAttribute(root.attributes, "background", defaultColor()),
    title: textAttribute(root.attributes, "title", ""),
    antialias: sizeAttribute(root.attributes, "antialias", 0),
    contentWidth: width - scrollbarGutter,
    overflowY: overflowY,
    scrollbarWidth: scrollbarWidth,
    scrollbarGutter: scrollbarGutter,
    scrollbarColor: scrollbarColorAttribute(root.attributes, "scrollbar-color", null),
    scrollbarStyle: scrollbarStyleAttributes(root.attributes),
    scrollOffsetY: 0,
    scrollHeight: sceneScrollHeight(shapes, height),
    hitCache: null,
    shapes: shapes
  };
}

export function sceneSize(scene) {
  return { width: scene.width, height: scene.height };
}

export function sceneBackground(scene) {
  return scene.background;
}

export function sceneTitle(scene) {
  return scene.title;
}
