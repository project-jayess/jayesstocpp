import { rgb, rgba } from "jayess:color";
import { startsWith } from "jayess:string";
import { parseScene } from "./xml-scene.js";
import { drawShapeShadow } from "./xml-shadow.js";

function fail(message) {
  throw message;
}

function defaultFill() {
  return rgb(0, 0, 0);
}

function shapeFill(shape) {
  if (shape.fill === null) {
    return defaultFill();
  }
  return shape.fill;
}

function shapeOutline(shape) {
  if (shape.outline === null) {
    return defaultFill();
  }
  return shape.outline;
}

function shapeOutlineColor(shape) {
  var outline = shapeOutline(shape);
  return rgba(outline.red, outline.green, outline.blue, outline.alpha * shape.outlineOpacity);
}

function strokeOptions(shape) {
  return { strokeWidth: shape.outlineThickness };
}

function semiellipseOptions(shape) {
  return { strokeWidth: shape.outlineThickness };
}

function textOptions(shape) {
  var color = shapeFill(shape);
  if (shape.fontColor !== null) {
    color = shape.fontColor;
  }
  var options = {
    color: color,
    fontFamily: shape.fontFamily,
    fontSize: shape.fontSize,
    letterSpacing: shape.letterSpacing,
    wordSpacing: shape.wordSpacing,
    textTransform: shape.textTransform,
    textDecoration: shape.textDecoration,
    textOverflow: shape.textOverflow,
    overflow: shape.overflow,
    overflowX: shape.overflowX,
    overflowY: shape.overflowY,
    scrollX: shape.scrollOffsetX,
    scrollY: shape.scrollOffsetY
  };
  if (shape.lineHeight > 0) {
    options.lineHeight = shape.lineHeight;
  }
  return options;
}

function labelColor(shape) {
  if (shape.fontColor !== null) {
    return shape.fontColor;
  }
  return rgb(255, 255, 255);
}

function labelOptions(shape) {
  var options = {
    color: labelColor(shape),
    fontFamily: shape.fontFamily,
    fontSize: shape.fontSize,
    horizontal: shape.textAlignX,
    vertical: shape.textAlignY,
    letterSpacing: shape.letterSpacing,
    wordSpacing: shape.wordSpacing,
    textTransform: shape.textTransform,
    textDecoration: shape.textDecoration,
    textOverflow: shape.textOverflow,
    overflow: shape.overflow,
    overflowX: shape.overflowX,
    overflowY: shape.overflowY
  };
  if (shape.lineHeight > 0) {
    options.lineHeight = shape.lineHeight;
  }
  return options;
}

function scrollbarColors(shape) {
  if (shape.scrollbarColor !== null) {
    return shape.scrollbarColor;
  }
  return {
    thumb: rgb(136, 136, 136),
    track: rgb(241, 241, 241)
  };
}

function needsVerticalScrollbar(shape, measured, width, height) {
  return shape.overflowY === "scroll" || (shape.overflowY === "auto" && measured.height > height);
}

function needsHorizontalScrollbar(shape, measured, width, height) {
  return shape.overflowX === "scroll" || (shape.overflowX === "auto" && measured.width > width);
}

function drawScrollbars(renderer, canvas, shape, x, y, width, height, measured) {
  if (shape.scrollbarWidth <= 0) {
    return canvas;
  }
  var colors = scrollbarColors(shape);
  if (needsVerticalScrollbar(shape, measured, width, height)) {
    var barX = x + width - shape.scrollbarWidth;
    renderer.fillRect(canvas, barX, y, shape.scrollbarWidth, height, colors.track);
    var thumbHeight = height;
    if (measured.height > 0 && measured.height > height) {
      thumbHeight = height * height / measured.height;
      if (thumbHeight < shape.scrollbarWidth) {
        thumbHeight = shape.scrollbarWidth;
      }
    }
    var maxScrollY = measured.height - height;
    var thumbY = y;
    if (maxScrollY > 0 && height > thumbHeight) {
      thumbY = y + shape.scrollOffsetY * (height - thumbHeight) / maxScrollY;
    }
    renderer.fillRect(canvas, barX, thumbY, shape.scrollbarWidth, thumbHeight, colors.thumb);
  }
  if (needsHorizontalScrollbar(shape, measured, width, height)) {
    var barY = y + height - shape.scrollbarWidth;
    renderer.fillRect(canvas, x, barY, width, shape.scrollbarWidth, colors.track);
    var thumbWidth = width;
    if (measured.width > 0 && measured.width > width) {
      thumbWidth = width * width / measured.width;
      if (thumbWidth < shape.scrollbarWidth) {
        thumbWidth = shape.scrollbarWidth;
      }
    }
    var maxScrollX = measured.width - width;
    var thumbX = x;
    if (maxScrollX > 0 && width > thumbWidth) {
      thumbX = x + shape.scrollOffsetX * (width - thumbWidth) / maxScrollX;
    }
    renderer.fillRect(canvas, thumbX, barY, thumbWidth, shape.scrollbarWidth, colors.thumb);
  }
  return canvas;
}

function drawShapeLabelInBox(renderer, canvas, shape, x, y, width, height) {
  if (shape.kind === "text" || shape.text.length === 0) {
    return canvas;
  }
  var padding = shape.padding;
  var innerWidth = width - padding * 2;
  var innerHeight = height - padding * 2;
  if (innerWidth <= 0 || innerHeight <= 0) {
    return canvas;
  }
  var options = labelOptions(shape);
  var textBox = {
    x: x + padding,
    y: y + padding,
    width: innerWidth,
    height: innerHeight
  };
  var measured = renderer.measureTextBox(canvas, shape.text, textBox, options);
  renderer.drawTextBox(canvas, shape.text, {
    x: x + padding,
    y: y + padding,
    width: innerWidth,
    height: innerHeight
  }, options);
  drawScrollbars(renderer, canvas, shape, x + padding, y + padding, innerWidth, innerHeight, measured);
  return canvas;
}

function drawShapeLabelInBounds(renderer, canvas, shape, bounds) {
  if (bounds === null) {
    return canvas;
  }
  return drawShapeLabelInBox(renderer, canvas, shape, bounds.x, bounds.y, bounds.width, bounds.height);
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

function requirePointCount(shape, expected) {
  if (shape.points.length !== expected) {
    fail("jayess:canvas XML <" + shape.kind + "> expects exactly " + expected + " points");
  }
}

function requireMinimumPointCount(shape, minimum) {
  if (shape.points.length < minimum) {
    fail("jayess:canvas XML <" + shape.kind + "> expects at least " + minimum + " points");
  }
}

function labelPointBounds(points) {
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
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

function anchorPoints(shape) {
  if (shape.points.length === 0) {
    return [{ x: shape.x, y: shape.y }];
  }
  return shape.points;
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

function drawRectAt(renderer, canvas, shape, x, y) {
  if (shape.fill !== null) {
    if (shape.corners !== null) {
      renderer.fillRoundedRect(canvas, x, y, shape.width, shape.height, shape.corners, shape.fill);
    } else {
      renderer.fillRect(canvas, x, y, shape.width, shape.height, shape.fill);
    }
  }
  if (shape.outline !== null) {
    if (shape.corners !== null) {
      renderer.drawRoundedRect(canvas, x, y, shape.width, shape.height, shape.corners, shapeOutlineColor(shape), strokeOptions(shape));
    } else {
      renderer.drawRect(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), strokeOptions(shape));
    }
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height);
}

function drawRectangle(renderer, canvas, shape) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawRectAt(renderer, canvas, shape, points[index].x, points[index].y);
  }
}

function drawEllipseAt(renderer, canvas, shape, x, y) {
  if (shape.fill !== null) {
    renderer.fillEllipse(canvas, x, y, shape.width, shape.height, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawEllipse(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height);
}

function drawEllipse(renderer, canvas, shape) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawEllipseAt(renderer, canvas, shape, points[index].x, points[index].y);
  }
}

function drawSemiellipseAt(renderer, canvas, shape, x, y) {
  if (shape.fill !== null) {
    renderer.fillSemiellipse(canvas, x, y, shape.width, shape.height, shape.fill, semiellipseOptions(shape));
  }
  if (shape.outline !== null) {
    renderer.drawSemiellipse(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), semiellipseOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height);
}

function drawSemiellipse(renderer, canvas, shape) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawSemiellipseAt(renderer, canvas, shape, points[index].x, points[index].y);
  }
}

function drawCapsuleAt(renderer, canvas, shape, x, y) {
  if (shape.fill !== null) {
    renderer.fillCapsule(canvas, x, y, shape.width, shape.height, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawCapsule(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height);
}

function drawCapsule(renderer, canvas, shape) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawCapsuleAt(renderer, canvas, shape, points[index].x, points[index].y);
  }
}

function drawTriangleShape(renderer, canvas, shape) {
  var points = trianglePoints(shape);
  if (shape.fill !== null) {
    renderer.fillTriangle(canvas, points, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawTriangle(canvas, points, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(points));
}

function drawPolygonShape(renderer, canvas, shape) {
  requireMinimumPointCount(shape, 3);
  if (shape.fill !== null) {
    renderer.fillPolygon(canvas, shape.points, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawPolygon(canvas, shape.points, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points));
}

function optionValue(options, key, fallback) {
  if (options === null) {
    return fallback;
  }
  var value = options[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

function antialiasScale(scene, options) {
  var scale = optionValue(options, "antialias", scene.antialias);
  if (scale < 0) {
    fail("jayess:canvas XML antialias must be non-negative");
  }
  if (scale > 4) {
    fail("jayess:canvas XML antialias must be at most 4");
  }
  return scale;
}

function imageFromOptions(shape, options) {
  var images = optionValue(options, "images", null);
  if (images === null || shape.src.length === 0) {
    return null;
  }
  var bySource = images[shape.src];
  if (bySource !== null) {
    return bySource;
  }
  if (shape.id.length > 0) {
    return images[shape.id];
  }
  return null;
}

function loadImage(renderer, shape, options) {
  if (startsWith(shape.src, "http://") || startsWith(shape.src, "https://")) {
    fail("jayess:canvas XML <image> network sources must be fetched, decoded, cached, and passed as explicit image handles by application code");
  }
  var explicit = imageFromOptions(shape, options);
  if (explicit !== null) {
    if (!renderer.isImage(explicit)) {
      fail("jayess:canvas XML <image> option must be a jayess:image handle");
    }
    return explicit;
  }
  var optionLoader = optionValue(options, "loadImage", null);
  if (optionLoader !== null) {
    return optionLoader(shape.src);
  }
  return renderer.loadImage(shape.src);
}

function drawImageShape(renderer, canvas, shape, options) {
  if (shape.src.length === 0 && shape.id.length === 0) {
    fail("jayess:canvas XML <image> requires src or id for image lookup");
  }
  var image = loadImage(renderer, shape, options);
  if (!renderer.isImage(image)) {
    fail("jayess:canvas XML <image> loader must return a jayess:image handle");
  }
  var resolved = image;
  if (shape.width > 0 && shape.height > 0) {
    resolved = renderer.resizeNearest(image, shape.width, shape.height);
  }
  renderer.drawImage(canvas, resolved, shape.x, shape.y);
  drawShapeLabelInBox(renderer, canvas, shape, shape.x, shape.y, shape.width, shape.height);
}

function minPointX(points) {
  var value = points[0].x;
  for (var index = 1; index < points.length; index = index + 1) {
    if (points[index].x < value) {
      value = points[index].x;
    }
  }
  return value;
}

function minPointY(points) {
  var value = points[0].y;
  for (var index = 1; index < points.length; index = index + 1) {
    if (points[index].y < value) {
      value = points[index].y;
    }
  }
  return value;
}

function maxPointX(points) {
  var value = points[0].x;
  for (var index = 1; index < points.length; index = index + 1) {
    if (points[index].x > value) {
      value = points[index].x;
    }
  }
  return value;
}

function maxPointY(points) {
  var value = points[0].y;
  for (var index = 1; index < points.length; index = index + 1) {
    if (points[index].y > value) {
      value = points[index].y;
    }
  }
  return value;
}

function pointBounds(points, extra) {
  if (points.length === 0) {
    return null;
  }
  return {
    x: minPointX(points) - extra,
    y: minPointY(points) - extra,
    width: maxPointX(points) - minPointX(points) + extra * 2 + 1,
    height: maxPointY(points) - minPointY(points) + extra * 2 + 1
  };
}

function absoluteValue(value) {
  if (value < 0) {
    return 0 - value;
  }
  return value;
}

function zeroPadding() {
  return { left: 0, top: 0, right: 0, bottom: 0 };
}

function shadowPadding(shape) {
  if (shape.shadow === null) {
    return zeroPadding();
  }
  var base = shape.shadow.spreadRadius + shape.shadow.blurRadius * 3 + 2;
  var left = base;
  var top = base;
  var right = base;
  var bottom = base;
  if (shape.shadow.offsetX < 0) {
    left = left + absoluteValue(shape.shadow.offsetX);
  } else {
    right = right + shape.shadow.offsetX;
  }
  if (shape.shadow.offsetY < 0) {
    top = top + absoluteValue(shape.shadow.offsetY);
  } else {
    bottom = bottom + shape.shadow.offsetY;
  }
  return { left: left, top: top, right: right, bottom: bottom };
}

function shapeBaseBounds(renderer, shape) {
  if (shape.kind === "text") {
    var measured = renderer.measureText(null, shape.text, textOptions(shape));
    return { x: shape.x, y: shape.y, width: measured.width, height: measured.height };
  }
  if (shape.kind === "line" || shape.kind === "polyline") {
    return pointBounds(shape.points, shape.outlineThickness);
  }
  if (shape.kind === "polygon") {
    return pointBounds(shape.points, shape.outlineThickness);
  }
  if (shape.kind === "triangle") {
    return pointBounds(trianglePoints(shape), shape.outlineThickness);
  }
  if (shape.kind === "pixel") {
    return { x: shape.x, y: shape.y, width: 1, height: 1 };
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}

export function shapeRenderBoundsWith(renderer, shape) {
  var bounds = shapeBaseBounds(renderer, shape);
  if (bounds === null || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }
  var outline = shape.outline === null ? 0 : shape.outlineThickness;
  var antialiasPad = 2;
  var shadow = shadowPadding(shape);
  var leftPad = outline + antialiasPad + shadow.left;
  var topPad = outline + antialiasPad + shadow.top;
  var rightPad = outline + antialiasPad + shadow.right;
  var bottomPad = outline + antialiasPad + shadow.bottom;
  return {
    x: bounds.x - leftPad,
    y: bounds.y - topPad,
    width: bounds.width + leftPad + rightPad,
    height: bounds.height + topPad + bottomPad
  };
}

export function shapePaintBoundsWith(renderer, shape) {
  var bounds = shapeBaseBounds(renderer, shape);
  if (bounds === null || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }
  var outline = shape.outline === null ? 0 : shape.outlineThickness;
  var pad = outline + 2;
  return {
    x: bounds.x - pad,
    y: bounds.y - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2
  };
}

function boundsIntersect(left, right) {
  if (left === null || right === null) {
    return false;
  }
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}

function drawShape(renderer, canvas, shape, options) {
  if (shape.visible !== true) {
    return canvas;
  }
  if (shape.kind === "group") {
    var children = orderedShapes(shape.children);
    for (var index = 0; index < children.length; index = index + 1) {
      drawShape(renderer, canvas, children[index], options);
    }
  } else if (shape.kind === "rectangle") {
    drawShapeShadow(renderer, canvas, shape);
    drawRectangle(renderer, canvas, shape);
  } else if (shape.kind === "line") {
    requirePointCount(shape, 2);
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawLine(canvas, shape.points[0].x, shape.points[0].y, shape.points[1].x, shape.points[1].y, shapeOutlineColor(shape), strokeOptions(shape));
    drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points));
  } else if (shape.kind === "pixel") {
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawPixel(canvas, shape.x, shape.y, shapeFill(shape));
  } else if (shape.kind === "ellipse") {
    drawShapeShadow(renderer, canvas, shape);
    drawEllipse(renderer, canvas, shape);
  } else if (shape.kind === "semiellipse") {
    drawShapeShadow(renderer, canvas, shape);
    drawSemiellipse(renderer, canvas, shape);
  } else if (shape.kind === "triangle") {
    drawShapeShadow(renderer, canvas, shape);
    drawTriangleShape(renderer, canvas, shape);
  } else if (shape.kind === "polygon") {
    drawShapeShadow(renderer, canvas, shape);
    drawPolygonShape(renderer, canvas, shape);
  } else if (shape.kind === "polyline") {
    requireMinimumPointCount(shape, 2);
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawPolyline(canvas, shape.points, shapeOutlineColor(shape), strokeOptions(shape));
    drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points));
  } else if (shape.kind === "capsule") {
    drawShapeShadow(renderer, canvas, shape);
    drawCapsule(renderer, canvas, shape);
  } else if (shape.kind === "text") {
    drawShapeShadow(renderer, canvas, shape);
    renderer.text(canvas, shape.text, shape.x, shape.y, textOptions(shape));
  } else if (shape.kind === "image") {
    drawShapeShadow(renderer, canvas, shape);
    drawImageShape(renderer, canvas, shape, options);
  }
  return canvas;
}

function drawShapeInRegion(renderer, canvas, shape, options, region) {
  if (shape.visible !== true) {
    return canvas;
  }
  if (shape.kind === "group") {
    var children = orderedShapes(shape.children);
    for (var index = 0; index < children.length; index = index + 1) {
      drawShapeInRegion(renderer, canvas, children[index], options, region);
    }
    return canvas;
  }
  if (boundsIntersect(shapeRenderBoundsWith(renderer, shape), region)) {
    drawShape(renderer, canvas, shape, options);
  }
  return canvas;
}

export function drawSceneWith(renderer, canvas, scene, options) {
  var shapes = orderedShapes(scene.shapes);
  for (var index = 0; index < shapes.length; index = index + 1) {
    drawShape(renderer, canvas, shapes[index], options);
  }
  if (renderer.attachScene !== null) {
    renderer.attachScene(canvas, scene, options);
  }
  return canvas;
}

export function drawSceneRegionWith(renderer, canvas, scene, options, region) {
  var shapes = orderedShapes(scene.shapes);
  renderer.pushClip(canvas, region.x, region.y, region.width, region.height);
  for (var index = 0; index < shapes.length; index = index + 1) {
    drawShapeInRegion(renderer, canvas, shapes[index], options, region);
  }
  renderer.popClip(canvas);
  if (renderer.attachScene !== null) {
    renderer.attachScene(canvas, scene, options);
  }
  return canvas;
}

export function renderSceneWith(renderer, xmlText, options) {
  var scene = parseScene(xmlText, options);
  var scale = antialiasScale(scene, options);
  var canvas = renderer.create(scene.width, scene.height, {
    background: scene.background,
    title: scene.title,
    backend: optionValue(options, "backend", "auto")
  });
  drawSceneWith(renderer, canvas, scene, options);
  if (scale > 1) {
    return renderer.antialias(canvas, scale);
  }
  return canvas;
}
