import { parse as parseColor } from "jayess:color";
import { parseFloat } from "jayess:number";
import { slice, split, trim } from "jayess:string";
import { pointInsidePolygon } from "./polygon-helpers.js";

function fail(message) {
  throw message;
}

function requireScene(source) {
  if (source === null) {
    fail("jayess:canvas expected a canvas or scene");
  }
  if (source.kind === "scene") {
    return source;
  }
  if (source.scene !== null) {
    return source.scene;
  }
  fail("jayess:canvas expected a canvas rendered from an XML scene");
}

function clearHitCache(source) {
  var scene = requireScene(source);
  scene.hitCache = null;
}

function parseNumber(value, name) {
  var parsed = parseFloat(trim(value + ""));
  if (parsed === null) {
    fail("jayess:canvas XML runtime attribute " + name + " must be a number");
  }
  return parsed;
}

function parseBoolean(value, name) {
  var normalized = trim(value + "");
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be true or false");
}

function parsePoint(value, name) {
  var text = trim(value + "");
  if (text.length < 5) {
    fail("jayess:canvas XML runtime attribute " + name + " must use one tuple like (10,10)");
  }
  var index = 0;
  while (index < text.length && slice(text, index, index + 1) !== "(") {
    index = index + 1;
  }
  if (index !== 0) {
    fail("jayess:canvas XML runtime attribute " + name + " must use one tuple like (10,10)");
  }
  var comma = index + 1;
  while (comma < text.length && slice(text, comma, comma + 1) !== ",") {
    comma = comma + 1;
  }
  var close = comma + 1;
  while (close < text.length && slice(text, close, close + 1) !== ")") {
    close = close + 1;
  }
  if (comma >= text.length || close >= text.length || close !== text.length - 1) {
    fail("jayess:canvas XML runtime attribute " + name + " must use one tuple like (10,10)");
  }
  return {
    x: parseNumber(trim(slice(text, 1, comma)), name + " x"),
    y: parseNumber(trim(slice(text, comma + 1, close)), name + " y")
  };
}

function parseCorners(value, name) {
  var raw = split(trim(value + ""), " ");
  var parts = [];
  for (var index = 0; index < raw.length; index = index + 1) {
    var part = trim(raw[index]);
    if (part.length > 0) {
      parts.push(part);
    }
  }
  if (parts.length < 1 || parts.length > 4) {
    fail("jayess:canvas XML runtime attribute " + name + " must have 1 to 4 numeric values");
  }
  var topLeft = parseNumber(parts[0], name);
  var topRight = topLeft;
  var bottomRight = topLeft;
  var bottomLeft = topLeft;
  if (topLeft < 0) {
    fail("jayess:canvas XML runtime attribute " + name + " must be non-negative");
  }
  if (parts.length === 2) {
    topRight = parseNumber(parts[1], name);
    bottomLeft = topRight;
  } else if (parts.length === 3) {
    topRight = parseNumber(parts[1], name);
    bottomRight = parseNumber(parts[2], name);
  } else if (parts.length === 4) {
    topRight = parseNumber(parts[1], name);
    bottomRight = parseNumber(parts[2], name);
    bottomLeft = parseNumber(parts[3], name);
  }
  if (topRight < 0 || bottomRight < 0 || bottomLeft < 0) {
    fail("jayess:canvas XML runtime attribute " + name + " must be non-negative");
  }
  return {
    topLeft: topLeft,
    topRight: topRight,
    bottomRight: bottomRight,
    bottomLeft: bottomLeft
  };
}

function compactParts(value) {
  var raw = split(trim(value + ""), " ");
  var parts = [];
  for (var index = 0; index < raw.length; index = index + 1) {
    var part = trim(raw[index]);
    if (part.length > 0) {
      parts.push(part);
    }
  }
  return parts;
}

function parseTextAlignX(value, name) {
  var text = trim(value + "");
  if (text === "left" || text === "center" || text === "right") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be left, center, or right");
}

function parseTextAlignY(value, name) {
  var text = trim(value + "");
  if (text === "top" || text === "middle" || text === "bottom") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be top, middle, or bottom");
}

function parseTextTransform(value, name) {
  var text = trim(value + "");
  if (text === "none" || text === "uppercase" || text === "lowercase") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be none, uppercase, or lowercase");
}

function parseTextDecoration(value, name) {
  var text = trim(value + "");
  if (text === "none" || text === "underline" || text === "overline" || text === "line-through") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be none, underline, overline, or line-through");
}

function parseTextOverflow(value, name) {
  var text = trim(value + "");
  if (text === "overflow" || text === "clip" || text === "ellipsis") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be overflow, clip, or ellipsis");
}

function parseTextWrap(value, name) {
  var text = trim(value + "");
  if (text === "wrap" || text === "nowrap") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be wrap or nowrap");
}

function parseTextSelection(value, name) {
  var text = trim(value + "");
  if (text === "none" || text.length === 0) {
    return null;
  }
  var parts = compactParts(text);
  if (parts.length !== 2) {
    fail("jayess:canvas XML runtime attribute " + name + " must be none or: start end");
  }
  var start = parseNumber(parts[0], name + " start");
  var end = parseNumber(parts[1], name + " end");
  if (start < 0 || end < 0) {
    fail("jayess:canvas XML runtime attribute " + name + " must be non-negative");
  }
  if (end < start) {
    var previousStart = start;
    start = end;
    end = previousStart;
  }
  return {
    start: start,
    end: end
  };
}

function parseOverflow(value, name) {
  var text = trim(value + "");
  if (text === "visible" || text === "hidden" || text === "auto" || text === "scroll") {
    return text;
  }
  fail("jayess:canvas XML runtime attribute " + name + " must be visible, hidden, auto, or scroll");
}

function parseScrollbarColor(value, name) {
  var parts = compactParts(value);
  if (parts.length !== 2) {
    fail("jayess:canvas XML runtime attribute " + name + " must be: thumbColor trackColor");
  }
  return {
    thumb: parseColor(parts[0]),
    track: parseColor(parts[1])
  };
}

function applyTextAlign(shape, value, name) {
  var parts = compactParts(value);
  if (parts.length !== 1 && parts.length !== 2) {
    fail("jayess:canvas XML runtime attribute " + name + " must be: horizontal [vertical]");
  }
  shape.textAlignX = parseTextAlignX(parts[0], name);
  if (parts.length === 2) {
    shape.textAlignY = parseTextAlignY(parts[1], name);
  }
}

function orderedShapes(shapes) {
  var ordered = [];
  for (var index = 0; index < shapes.length; index = index + 1) {
    var shape = shapes[index];
    ordered.push(shape);
    var position = ordered.length - 1;
    while (position > 0 && ordered[position - 1].z > shape.z) {
      ordered[position] = ordered[position - 1];
      position = position - 1;
    }
    ordered[position] = shape;
  }
  return ordered;
}

function findInShapes(shapes, id) {
  for (var index = 0; index < shapes.length; index = index + 1) {
    var shape = shapes[index];
    if (shape.id === id) {
      return shape;
    }
    if (shape.children !== null && shape.children.length > 0) {
      var child = findInShapes(shape.children, id);
      if (child !== null) {
        return child;
      }
    }
  }
  return null;
}

export function getElementById(source, id) {
  if (id === null || id.length === 0) {
    fail("jayess:canvas getElementById expected a non-empty id");
  }
  return findInShapes(requireScene(source).shapes, id);
}

function applyColorAttribute(shape, name, value) {
  if (value === null || value === "none") {
    shape[name] = null;
  } else {
    shape[name] = parseColor(value);
  }
}

export function updateElementAttribute(source, id, name, value) {
  var shape = getElementById(source, id);
  if (shape === null) {
    fail("jayess:canvas could not find XML element id " + id);
  }

  if (name === "fill" || name === "outline") {
    applyColorAttribute(shape, name, value);
    if (name === "fill") {
      shape.baseFill = shape.fill;
    }
  } else if (name === "font-color") {
    applyColorAttribute(shape, "fontColor", value);
  } else if (name === "outline-thickness") {
    shape.outlineThickness = parseNumber(value, name);
  } else if (name === "outline-opacity") {
    shape.outlineOpacity = parseNumber(value, name);
  } else if (name === "corners") {
    if (value === null || value === "none") {
      shape.corners = null;
    } else {
      shape.corners = parseCorners(value, name);
    }
  } else if (name === "opacity") {
    shape.opacity = parseNumber(value, name);
  } else if (name === "padding") {
    shape.padding = parseNumber(value, name);
  } else if (name === "font-size") {
    shape.fontSize = parseNumber(value, name);
  } else if (name === "line-height") {
    shape.lineHeight = parseNumber(value, name);
  } else if (name === "letter-spacing") {
    shape.letterSpacing = parseNumber(value, name);
  } else if (name === "word-spacing") {
    shape.wordSpacing = parseNumber(value, name);
  } else if (name === "text-transform") {
    shape.textTransform = parseTextTransform(value, name);
  } else if (name === "text-decoration") {
    shape.textDecoration = parseTextDecoration(value, name);
  } else if (name === "text-overflow") {
    shape.textOverflow = parseTextOverflow(value, name);
  } else if (name === "text-wrap") {
    shape.textWrap = parseTextWrap(value, name);
  } else if (name === "text-select") {
    shape.textSelection = parseTextSelection(value, name);
    shape.textSelectionKind = shape.textSelection === null ? "" : "text";
  } else if (name === "text-select-color") {
    applyColorAttribute(shape, "textSelectColor", value);
  } else if (name === "mouse-select") {
    shape.mouseSelect = parseBoolean(value, name);
  } else if (name === "mouse-select-color") {
    applyColorAttribute(shape, "mouseSelectColor", value);
  } else if (name === "overflow") {
    shape.overflow = parseOverflow(value, name);
    shape.overflowX = shape.overflow;
    shape.overflowY = shape.overflow;
  } else if (name === "overflow-x") {
    shape.overflowX = parseOverflow(value, name);
  } else if (name === "overflow-y") {
    shape.overflowY = parseOverflow(value, name);
  } else if (name === "color-event-mode") {
    if (value !== "darker" && value !== "lighter") {
      fail("jayess:canvas XML runtime attribute color-event-mode must be darker or lighter");
    }
    shape.colorEventMode = value;
  } else if (name === "scrollbar-width") {
    shape.scrollbarWidth = parseNumber(value, name);
  } else if (name === "scrollbar-color") {
    shape.scrollbarColor = parseScrollbarColor(value, name);
  } else if (name === "scrollbar-thumb") {
    shape.scrollbarStyle.thumb = value;
  } else if (name === "scrollbar-thumb-width") {
    shape.scrollbarStyle.thumbWidth = parseNumber(value, name);
  } else if (name === "scrollbar-thumb-height") {
    shape.scrollbarStyle.thumbHeight = parseNumber(value, name);
  } else if (name === "scrollbar-thumb-corners") {
    if (value === null || value === "none") {
      shape.scrollbarStyle.thumbCorners = null;
    } else {
      shape.scrollbarStyle.thumbCorners = parseCorners(value, name);
    }
  } else if (name === "scrollbar-thumb-color") {
    shape.scrollbarStyle.thumbColor = parseColor(value);
  } else if (name === "scrollbar-thumb-opacity") {
    shape.scrollbarStyle.thumbOpacity = parseNumber(value, name);
  } else if (name === "scrollbar-track") {
    shape.scrollbarStyle.track = value;
  } else if (name === "scrollbar-track-corners") {
    if (value === null || value === "none") {
      shape.scrollbarStyle.trackCorners = null;
    } else {
      shape.scrollbarStyle.trackCorners = parseCorners(value, name);
    }
  } else if (name === "scrollbar-track-color") {
    shape.scrollbarStyle.trackColor = parseColor(value);
  } else if (name === "scrollbar-track-opacity") {
    shape.scrollbarStyle.trackOpacity = parseNumber(value, name);
  } else if (name === "text-align") {
    applyTextAlign(shape, value, name);
  } else if (name === "text-align-x") {
    shape.textAlignX = parseTextAlignX(value, name);
  } else if (name === "text-align-y") {
    shape.textAlignY = parseTextAlignY(value, name);
  } else if (name === "visible") {
    shape.visible = parseBoolean(value, name);
  } else if (name === "xy") {
    var point = parsePoint(value, name);
    shape.x = point.x;
    shape.y = point.y;
  } else if (name === "w") {
    shape.width = parseNumber(value, name);
  } else if (name === "h") {
    shape.height = parseNumber(value, name);
  } else if (name === "x" || name === "y" || name === "width" || name === "height" || name === "z") {
    shape[name] = parseNumber(value, name);
  } else if (name === "font-family") {
    shape.fontFamily = value;
  } else if (name === "text" || name === "src") {
    shape[name] = value;
  } else {
    fail("jayess:canvas XML runtime attribute " + name + " is not supported yet");
  }
  shape.textLayoutCache = null;
  shape.textBitmapCache = null;
  clearHitCache(source);
  return shape;
}

function pointBounds(points) {
  if (points.length === 0) {
    return null;
  }
  var left = points[0].x;
  var top = points[0].y;
  var right = points[0].x;
  var bottom = points[0].y;
  for (var index = 1; index < points.length; index = index + 1) {
    var point = points[index];
    if (point.x < left) {
      left = point.x;
    }
    if (point.x > right) {
      right = point.x;
    }
    if (point.y < top) {
      top = point.y;
    }
    if (point.y > bottom) {
      bottom = point.y;
    }
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function shapeBounds(shape) {
  if (shape.kind === "line" || shape.kind === "polyline" || shape.kind === "polygon") {
    return pointBounds(shape.points);
  }
  if (shape.kind === "triangle" && shape.points.length > 0) {
    return pointBounds(shape.points);
  }
  if (shape.points.length > 0) {
    var bounds = pointBounds(shape.points);
    if (bounds !== null) {
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width + shape.width,
        height: bounds.height + shape.height
      };
    }
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}

function contains(bounds, x, y) {
  if (bounds === null) {
    return false;
  }
  return x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height;
}

function clampToRange(value, lower, upper) {
  if (value < lower) {
    return lower;
  }
  if (value > upper) {
    return upper;
  }
  return value;
}

function pointInsideEllipse(shape, x, y) {
  if (shape.width <= 0 || shape.height <= 0) {
    return false;
  }
  var radiusX = shape.width / 2;
  var radiusY = shape.height / 2;
  var centerX = shape.x + radiusX;
  var centerY = shape.y + radiusY;
  var dx = (x + 0.5 - centerX) / radiusX;
  var dy = (y + 0.5 - centerY) / radiusY;
  return dx * dx + dy * dy <= 1;
}

function pointInsideCapsule(shape, x, y) {
  if (shape.width <= 0 || shape.height <= 0) {
    return false;
  }
  var px = x + 0.5;
  var py = y + 0.5;
  if (shape.width >= shape.height) {
    var radius = shape.height / 2;
    var centerY = shape.y + radius;
    var leftCenterX = shape.x + radius;
    var rightCenterX = shape.x + shape.width - radius;
    var closestX = clampToRange(px, leftCenterX, rightCenterX);
    var dx = px - closestX;
    var dy = py - centerY;
    return dx * dx + dy * dy <= radius * radius;
  }
  var verticalRadius = shape.width / 2;
  var centerX = shape.x + verticalRadius;
  var topCenterY = shape.y + verticalRadius;
  var bottomCenterY = shape.y + shape.height - verticalRadius;
  var closestY = clampToRange(py, topCenterY, bottomCenterY);
  var verticalDx = px - centerX;
  var verticalDy = py - closestY;
  return verticalDx * verticalDx + verticalDy * verticalDy <= verticalRadius * verticalRadius;
}

function cornerValue(shape, name) {
  if (shape.corners === null) {
    return 0;
  }
  return shape.corners[name];
}

function minValue(left, right) {
  if (left < right) {
    return left;
  }
  return right;
}

function scaledCornerValues(shape) {
  var topLeft = minValue(cornerValue(shape, "topLeft"), minValue(shape.width, shape.height) / 2);
  var topRight = minValue(cornerValue(shape, "topRight"), minValue(shape.width, shape.height) / 2);
  var bottomRight = minValue(cornerValue(shape, "bottomRight"), minValue(shape.width, shape.height) / 2);
  var bottomLeft = minValue(cornerValue(shape, "bottomLeft"), minValue(shape.width, shape.height) / 2);
  var scale = 1;
  if (topLeft + topRight > shape.width) {
    scale = minValue(scale, shape.width / (topLeft + topRight));
  }
  if (bottomLeft + bottomRight > shape.width) {
    scale = minValue(scale, shape.width / (bottomLeft + bottomRight));
  }
  if (topLeft + bottomLeft > shape.height) {
    scale = minValue(scale, shape.height / (topLeft + bottomLeft));
  }
  if (topRight + bottomRight > shape.height) {
    scale = minValue(scale, shape.height / (topRight + bottomRight));
  }
  return {
    topLeft: topLeft * scale,
    topRight: topRight * scale,
    bottomRight: bottomRight * scale,
    bottomLeft: bottomLeft * scale
  };
}

function pointInsideRoundedCorner(px, py, centerX, centerY, radius) {
  if (radius <= 0) {
    return true;
  }
  var dx = px - centerX;
  var dy = py - centerY;
  return dx * dx + dy * dy <= radius * radius;
}

function pointInsideRoundedRect(shape, x, y) {
  if (shape.corners === null) {
    return true;
  }
  var px = x + 0.5;
  var py = y + 0.5;
  var radii = scaledCornerValues(shape);
  if (px < shape.x + radii.topLeft && py < shape.y + radii.topLeft) {
    return pointInsideRoundedCorner(px, py, shape.x + radii.topLeft, shape.y + radii.topLeft, radii.topLeft);
  }
  if (px >= shape.x + shape.width - radii.topRight && py < shape.y + radii.topRight) {
    return pointInsideRoundedCorner(px, py, shape.x + shape.width - radii.topRight, shape.y + radii.topRight, radii.topRight);
  }
  if (px >= shape.x + shape.width - radii.bottomRight && py >= shape.y + shape.height - radii.bottomRight) {
    return pointInsideRoundedCorner(px, py, shape.x + shape.width - radii.bottomRight, shape.y + shape.height - radii.bottomRight, radii.bottomRight);
  }
  if (px < shape.x + radii.bottomLeft && py >= shape.y + shape.height - radii.bottomLeft) {
    return pointInsideRoundedCorner(px, py, shape.x + radii.bottomLeft, shape.y + shape.height - radii.bottomLeft, radii.bottomLeft);
  }
  return true;
}

function trianglePoints(shape) {
  if (shape.points.length > 0) {
    return shape.points;
  }
  return [
    { x: shape.x + shape.width / 2, y: shape.y },
    { x: shape.x, y: shape.y + shape.height },
    { x: shape.x + shape.width, y: shape.y + shape.height }
  ];
}

function pointInsideShape(shape, x, y) {
  var bounds = shapeBounds(shape);
  if (!contains(bounds, x, y)) {
    return false;
  }
  if (shape.kind === "ellipse") {
    return pointInsideEllipse(shape, x, y);
  }
  if (shape.kind === "capsule") {
    return pointInsideCapsule(shape, x, y);
  }
  if (shape.kind === "rectangle") {
    return pointInsideRoundedRect(shape, x, y);
  }
  if (shape.kind === "button") {
    return pointInsideRoundedRect(shape, x, y);
  }
  if (shape.kind === "triangle") {
    return pointInsidePolygon(trianglePoints(shape), x, y);
  }
  if (shape.kind === "polygon") {
    return pointInsidePolygon(shape.points, x, y);
  }
  return true;
}

function hitTestYForShape(shape, y, scrollY) {
  if (shape.position === "fixed") {
    return y;
  }
  return y + scrollY;
}

function collectHitsInShapes(shapes, x, y, scrollY, hits) {
  var ordered = orderedShapes(shapes);
  for (var index = ordered.length - 1; index >= 0; index = index - 1) {
    var shape = ordered[index];
    if (shape.visible !== true) {
      continue;
    }
    var shapeY = hitTestYForShape(shape, y, scrollY);
    if (shape.kind === "group") {
      var childScrollY = shape.position === "fixed" ? 0 : scrollY;
      collectHitsInShapes(shape.children, x, y, childScrollY, hits);
    }
    if (shape.id.length > 0 && pointInsideShape(shape, x, shapeY)) {
      hits.push({ id: shape.id, kind: shape.kind, x: x, y: y });
    }
  }
}

function collectShapeHitsInShapes(shapes, x, y, scrollY, hits) {
  var ordered = orderedShapes(shapes);
  for (var index = ordered.length - 1; index >= 0; index = index - 1) {
    var shape = ordered[index];
    if (shape.visible !== true) {
      continue;
    }
    var shapeY = hitTestYForShape(shape, y, scrollY);
    if (shape.kind === "group") {
      var childScrollY = shape.position === "fixed" ? 0 : scrollY;
      collectShapeHitsInShapes(shape.children, x, y, childScrollY, hits);
    }
    if (pointInsideShape(shape, x, shapeY)) {
      hits.push(shape);
    }
  }
}

function copyHit(hit) {
  return {
    id: hit.id,
    kind: hit.kind,
    x: hit.x,
    y: hit.y
  };
}

function copyHits(hits) {
  var copied = [];
  for (var index = 0; index < hits.length; index = index + 1) {
    copied.push(copyHit(hits[index]));
  }
  return copied;
}

function hitCacheMatches(cache, scene, x, y) {
  return cache !== null &&
    cache.x === x &&
    cache.y === y &&
    cache.scrollOffsetY === scene.scrollOffsetY;
}

function cachedHitTests(scene, x, y) {
  if (hitCacheMatches(scene.hitCache, scene, x, y)) {
    return scene.hitCache.hits;
  }
  var hits = [];
  var shapes = [];
  collectHitsInShapes(scene.shapes, x, y, scene.scrollOffsetY, hits);
  collectShapeHitsInShapes(scene.shapes, x, y, scene.scrollOffsetY, shapes);
  scene.hitCache = {
    x: x,
    y: y,
    scrollOffsetY: scene.scrollOffsetY,
    hits: hits,
    shapes: shapes
  };
  return hits;
}

function cachedHitShapes(scene, x, y) {
  if (hitCacheMatches(scene.hitCache, scene, x, y)) {
    return scene.hitCache.shapes;
  }
  cachedHitTests(scene, x, y);
  return scene.hitCache.shapes;
}

function hitInScene(scene, x, y) {
  var hits = cachedHitTests(scene, x, y);
  if (hits.length === 0) {
    return null;
  }
  return hits[0];
}

export function hitTest(source, x, y) {
  var hit = hitInScene(requireScene(source), x, y);
  if (hit === null) {
    return null;
  }
  return copyHit(hit);
}

export function hitTests(source, x, y) {
  var scene = requireScene(source);
  return copyHits(cachedHitTests(scene, x, y));
}

export function hitShapes(source, x, y) {
  var scene = requireScene(source);
  return cachedHitShapes(scene, x, y);
}

function listenerBucket(canvas, name) {
  if (canvas.canvasListeners === null) {
    canvas.canvasListeners = {};
  }
  var listeners = canvas.canvasListeners[name];
  if (listeners === null) {
    listeners = [];
    canvas.canvasListeners[name] = listeners;
  }
  return listeners;
}

export function addCanvasEventListener(canvas, name, callback) {
  listenerBucket(canvas, name).push(callback);
  return canvas;
}

function emitCanvasEvent(canvas, event) {
  var listeners = listenerBucket(canvas, event.type);
  for (var index = 0; index < listeners.length; index = index + 1) {
    listeners[index](event);
  }
}

function enrichMouseEvent(source, hit, fallbackType) {
  return {
    type: fallbackType,
    targetId: hit.id,
    targetKind: hit.kind,
    x: source.x,
    y: source.y,
    sourceEvent: source
  };
}

export function dispatchCanvasEvent(canvas, event) {
  var emitted = [];
  if (event.type !== "mouseMove") {
    return emitted;
  }

  var hit = hitTest(canvas, event.x, event.y);
  var nextId = hit === null ? "" : hit.id;
  var previousId = canvas.hoveredElementId;
  if (previousId === null) {
    previousId = "";
  }

  if (previousId.length > 0 && previousId !== nextId) {
    var previousShape = getElementById(canvas, previousId);
    if (previousShape !== null) {
      var outEvent = {
        type: "mouseout",
        targetId: previousShape.id,
        targetKind: previousShape.kind,
        x: event.x,
        y: event.y,
        sourceEvent: event
      };
      emitted.push(outEvent);
      emitCanvasEvent(canvas, outEvent);
    }
  }

  if (hit !== null && previousId !== nextId) {
    var overEvent = enrichMouseEvent(event, hit, "mouseover");
    emitted.push(overEvent);
    emitCanvasEvent(canvas, overEvent);
  }

  canvas.hoveredElementId = nextId;
  return emitted;
}

export function dispatchCanvasClickEvent(canvas, event, hit) {
  var emitted = [];
  if (hit === null) {
    return emitted;
  }
  var clickEvent = enrichMouseEvent(event, hit, "click");
  emitted.push(clickEvent);
  emitCanvasEvent(canvas, clickEvent);
  return emitted;
}

export function dispatchCanvasTargetEvent(canvas, event, hit, type) {
  var emitted = [];
  if (hit === null) {
    return emitted;
  }
  var targetEvent = enrichMouseEvent(event, hit, type);
  emitted.push(targetEvent);
  emitCanvasEvent(canvas, targetEvent);
  return emitted;
}
