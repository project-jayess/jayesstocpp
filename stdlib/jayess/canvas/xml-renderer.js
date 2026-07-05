import { rgb, rgba } from "jayess:color";
import { round } from "jayess:math";
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
    overflowY: shape.overflowY,
    scrollX: shape.scrollOffsetX,
    scrollY: shape.scrollOffsetY
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

function clampUnit(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function colorWithOpacity(color, opacity) {
  return rgba(color.red, color.green, color.blue, color.alpha * clampUnit(opacity));
}

function scrollbarStyle(shape) {
  var colors = scrollbarColors(shape);
  var style = shape.scrollbarStyle;
  var thumbColor = colors.thumb;
  var trackColor = colors.track;
  if (style.thumbColor !== null) {
    thumbColor = style.thumbColor;
  }
  if (style.trackColor !== null) {
    trackColor = style.trackColor;
  }
  return {
    thumb: style.thumb,
    thumbWidth: style.thumbWidth,
    thumbHeight: style.thumbHeight,
    thumbCorners: style.thumbCorners,
    thumbColor: colorWithOpacity(thumbColor, style.thumbOpacity),
    thumbOpacity: style.thumbOpacity,
    track: style.track,
    trackCorners: style.trackCorners,
    trackColor: colorWithOpacity(trackColor, style.trackOpacity),
    trackOpacity: style.trackOpacity
  };
}

function roundedRectFill(renderer, canvas, x, y, width, height, corners, color) {
  if (corners !== null) {
    renderer.fillRoundedRect(canvas, x, y, width, height, corners, color);
  } else {
    renderer.fillRect(canvas, x, y, width, height, color);
  }
  return canvas;
}

function scrollbarImageFromOptions(renderer, src, options) {
  if (startsWith(src, "http://") || startsWith(src, "https://")) {
    fail("jayess:canvas XML scrollbar image network sources must be fetched, decoded, cached, and passed as explicit image handles by application code");
  }
  var images = optionValue(options, "images", null);
  if (images !== null) {
    var bySource = images[src];
    if (bySource !== null) {
      return bySource;
    }
  }
  var optionLoader = optionValue(options, "loadImage", null);
  if (optionLoader !== null) {
    return optionLoader(src);
  }
  return renderer.loadImage(src);
}

function drawScrollbarPart(renderer, canvas, source, x, y, width, height, corners, color, opacity, options) {
  var drawX = round(x);
  var drawY = round(y);
  var drawWidth = round(width);
  var drawHeight = round(height);
  if (drawWidth <= 0 || drawHeight <= 0 || clampUnit(opacity) <= 0) {
    return canvas;
  }
  if (source.length > 0) {
    var image = scrollbarImageFromOptions(renderer, source, options);
    if (!renderer.isImage(image)) {
      fail("jayess:canvas XML scrollbar image loader must return a jayess:image handle");
    }
    var resolved = renderer.resizeNearest(image, drawWidth, drawHeight);
    renderer.drawImageAlphaOpacity(canvas, resolved, drawX, drawY, opacity);
    return canvas;
  }
  return roundedRectFill(renderer, canvas, drawX, drawY, drawWidth, drawHeight, corners, color);
}

function resolvedThumbWidth(style, fallback) {
  if (style.thumb.length > 0 && style.thumbWidth > 0) {
    return style.thumbWidth;
  }
  return fallback;
}

function resolvedThumbHeight(style, fallback) {
  if (style.thumb.length > 0 && style.thumbHeight > 0) {
    return style.thumbHeight;
  }
  return fallback;
}

function needsVerticalScrollbar(shape, measured, width, height) {
  return shape.overflowY === "scroll" || (shape.overflowY === "auto" && measured.height > height);
}

function needsHorizontalScrollbar(shape, measured, width, height) {
  return shape.overflowX === "scroll" || (shape.overflowX === "auto" && measured.width > width);
}

function textLayoutCacheKey(shape, box, options) {
  var lineHeight = shape.lineHeight > 0 ? shape.lineHeight : 0;
  return shape.text + "|" +
    box.width.toString() + "x" + box.height.toString() + "|" +
    shape.fontFamily + "|" +
    shape.fontSize.toString() + "|" +
    lineHeight.toString() + "|" +
    shape.letterSpacing.toString() + "|" +
    shape.wordSpacing.toString() + "|" +
    shape.textTransform + "|" +
    shape.textOverflow;
}

function measureShapeTextBox(renderer, canvas, shape, box, options) {
  var key = textLayoutCacheKey(shape, box, options);
  if (shape.textLayoutCache !== null && shape.textLayoutCache.key === key) {
    return shape.textLayoutCache.measured;
  }
  var measured = renderer.measureTextBox(canvas, shape.text, box, options);
  shape.textLayoutCache = {
    key: key,
    measured: measured
  };
  return measured;
}

function bitmapCacheKey(shape, box, measured) {
  var lineHeight = shape.lineHeight > 0 ? shape.lineHeight : 0;
  return shape.text + "|" +
    box.width.toString() + "x" + box.height.toString() + "|" +
    measured.width.toString() + "x" + measured.height.toString() + "|" +
    shape.fontFamily + "|" +
    shape.fontSize.toString() + "|" +
    lineHeight.toString() + "|" +
    shape.letterSpacing.toString() + "|" +
    shape.wordSpacing.toString() + "|" +
    shape.textTransform + "|" +
    shape.textDecoration + "|" +
    shape.textOverflow + "|" +
    labelColor(shape).red.toString() + "," +
    labelColor(shape).green.toString() + "," +
    labelColor(shape).blue.toString() + "," +
    labelColor(shape).alpha.toString();
}

function largerSize(left, right) {
  if (left > right) {
    return left;
  }
  return right;
}

function layerSize(value) {
  var rounded = round(value);
  if (rounded < 1) {
    return 1;
  }
  return rounded;
}

function textLayerOptions(options) {
  var layer = {
    color: options.color,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    horizontal: options.horizontal,
    vertical: "top",
    letterSpacing: options.letterSpacing,
    wordSpacing: options.wordSpacing,
    textTransform: options.textTransform,
    textDecoration: options.textDecoration,
    textOverflow: options.textOverflow,
    overflow: options.overflow,
    overflowX: options.overflowX,
    overflowY: options.overflowY,
    scrollX: 0,
    scrollY: 0
  };
  if (options.lineHeight !== null) {
    layer.lineHeight = options.lineHeight;
  }
  return layer;
}

function textLayer(renderer, canvas, shape, box, measured, options) {
  var width = layerSize(largerSize(measured.width, box.width));
  var height = layerSize(largerSize(measured.height, box.height));
  var key = bitmapCacheKey(shape, box, measured);
  if (
    shape.textBitmapCache !== null &&
    shape.textBitmapCache.key === key &&
    shape.textBitmapCache.width === width &&
    shape.textBitmapCache.height === height
  ) {
    return shape.textBitmapCache.canvas;
  }
  var layer = renderer.create(width, height, {
    background: rgba(0, 0, 0, 0)
  });
  renderer.drawTextBox(layer, shape.text, {
    x: 0,
    y: 0,
    width: box.width,
    height: height
  }, textLayerOptions(options));
  shape.textBitmapCache = {
    key: key,
    width: width,
    height: height,
    canvas: layer
  };
  return layer;
}

function scrollbarLayout(renderer, canvas, shape, x, y, width, height, options) {
  var contentWidth = width;
  var contentHeight = height;
  var box = { x: x, y: y, width: contentWidth, height: contentHeight };
  var measured = measureShapeTextBox(renderer, canvas, shape, box, options);
  var vertical = shape.scrollbarWidth > 0 && needsVerticalScrollbar(shape, measured, contentWidth, contentHeight);
  var horizontal = shape.scrollbarWidth > 0 && needsHorizontalScrollbar(shape, measured, contentWidth, contentHeight);
  if (vertical) {
    contentWidth = contentWidth - shape.scrollbarWidth;
  }
  if (horizontal) {
    contentHeight = contentHeight - shape.scrollbarWidth;
  }
  if (contentWidth < 1) {
    contentWidth = 1;
  }
  if (contentHeight < 1) {
    contentHeight = 1;
  }
  if (vertical || horizontal) {
    box = { x: x, y: y, width: contentWidth, height: contentHeight };
    measured = measureShapeTextBox(renderer, canvas, shape, box, options);
    vertical = shape.scrollbarWidth > 0 && needsVerticalScrollbar(shape, measured, contentWidth, contentHeight);
    horizontal = shape.scrollbarWidth > 0 && needsHorizontalScrollbar(shape, measured, contentWidth, contentHeight);
  }
  return {
    contentBox: box,
    measured: measured,
    vertical: vertical,
    horizontal: horizontal
  };
}

function drawCachedTextLayer(renderer, canvas, shape, layout, options) {
  var layer = textLayer(renderer, canvas, shape, layout.contentBox, layout.measured, options);
  renderer.pushClip(canvas, layout.contentBox.x, layout.contentBox.y, layout.contentBox.width, layout.contentBox.height);
  renderer.drawImageAlpha(canvas, layer.image, layout.contentBox.x - shape.scrollOffsetX, layout.contentBox.y - shape.scrollOffsetY);
  renderer.popClip(canvas);
  return canvas;
}

function drawScrollbars(renderer, canvas, shape, x, y, width, height, layout, options) {
  if (shape.scrollbarWidth <= 0) {
    return canvas;
  }
  var style = scrollbarStyle(shape);
  var measured = layout.measured;
  if (layout.vertical) {
    var barX = x + width - shape.scrollbarWidth;
    drawScrollbarPart(renderer, canvas, style.track, barX, y, shape.scrollbarWidth, height, style.trackCorners, style.trackColor, style.trackOpacity, options);
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
    var drawThumbWidth = resolvedThumbWidth(style, shape.scrollbarWidth);
    var drawThumbHeight = resolvedThumbHeight(style, thumbHeight);
    var drawThumbX = barX + (shape.scrollbarWidth - drawThumbWidth) / 2;
    var drawThumbY = thumbY + (thumbHeight - drawThumbHeight) / 2;
    drawScrollbarPart(renderer, canvas, style.thumb, drawThumbX, drawThumbY, drawThumbWidth, drawThumbHeight, style.thumbCorners, style.thumbColor, style.thumbOpacity, options);
  }
  if (layout.horizontal) {
    var barY = y + height - shape.scrollbarWidth;
    drawScrollbarPart(renderer, canvas, style.track, x, barY, width, shape.scrollbarWidth, style.trackCorners, style.trackColor, style.trackOpacity, options);
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
    var drawThumbWidth = resolvedThumbWidth(style, thumbWidth);
    var drawThumbHeight = resolvedThumbHeight(style, shape.scrollbarWidth);
    var drawThumbX = thumbX + (thumbWidth - drawThumbWidth) / 2;
    var drawThumbY = barY + (shape.scrollbarWidth - drawThumbHeight) / 2;
    drawScrollbarPart(renderer, canvas, style.thumb, drawThumbX, drawThumbY, drawThumbWidth, drawThumbHeight, style.thumbCorners, style.thumbColor, style.thumbOpacity, options);
  }
  return canvas;
}

function drawShapeLabelInBox(renderer, canvas, shape, x, y, width, height, renderOptions) {
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
  var layout = scrollbarLayout(renderer, canvas, shape, x + padding, y + padding, innerWidth, innerHeight, options);
  if (layout.vertical || layout.horizontal) {
    drawCachedTextLayer(renderer, canvas, shape, layout, options);
  } else {
    renderer.drawTextBox(canvas, shape.text, layout.contentBox, options);
  }
  drawScrollbars(renderer, canvas, shape, x + padding, y + padding, innerWidth, innerHeight, layout, renderOptions);
  return canvas;
}

function drawShapeLabelInBounds(renderer, canvas, shape, bounds, options) {
  if (bounds === null) {
    return canvas;
  }
  return drawShapeLabelInBox(renderer, canvas, shape, bounds.x, bounds.y, bounds.width, bounds.height, options);
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

function drawRectAt(renderer, canvas, shape, x, y, options) {
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
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height, options);
}

function drawRectangle(renderer, canvas, shape, options) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawRectAt(renderer, canvas, shape, points[index].x, points[index].y, options);
  }
}

function drawEllipseAt(renderer, canvas, shape, x, y, options) {
  if (shape.fill !== null) {
    renderer.fillEllipse(canvas, x, y, shape.width, shape.height, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawEllipse(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height, options);
}

function drawEllipse(renderer, canvas, shape, options) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawEllipseAt(renderer, canvas, shape, points[index].x, points[index].y, options);
  }
}

function drawSemiellipseAt(renderer, canvas, shape, x, y, options) {
  if (shape.fill !== null) {
    renderer.fillSemiellipse(canvas, x, y, shape.width, shape.height, shape.fill, semiellipseOptions(shape));
  }
  if (shape.outline !== null) {
    renderer.drawSemiellipse(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), semiellipseOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height, options);
}

function drawSemiellipse(renderer, canvas, shape, options) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawSemiellipseAt(renderer, canvas, shape, points[index].x, points[index].y, options);
  }
}

function drawCapsuleAt(renderer, canvas, shape, x, y, options) {
  if (shape.fill !== null) {
    renderer.fillCapsule(canvas, x, y, shape.width, shape.height, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawCapsule(canvas, x, y, shape.width, shape.height, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBox(renderer, canvas, shape, x, y, shape.width, shape.height, options);
}

function drawCapsule(renderer, canvas, shape, options) {
  var points = anchorPoints(shape);
  for (var index = 0; index < points.length; index = index + 1) {
    drawCapsuleAt(renderer, canvas, shape, points[index].x, points[index].y, options);
  }
}

function drawTriangleShape(renderer, canvas, shape, options) {
  var points = trianglePoints(shape);
  if (shape.fill !== null) {
    renderer.fillTriangle(canvas, points, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawTriangle(canvas, points, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(points), options);
}

function drawPolygonShape(renderer, canvas, shape, options) {
  requireMinimumPointCount(shape, 3);
  if (shape.fill !== null) {
    renderer.fillPolygon(canvas, shape.points, shape.fill);
  }
  if (shape.outline !== null) {
    renderer.drawPolygon(canvas, shape.points, shapeOutlineColor(shape), strokeOptions(shape));
  }
  drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points), options);
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
  drawShapeLabelInBox(renderer, canvas, shape, shape.x, shape.y, shape.width, shape.height, options);
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

function offsetBounds(bounds, deltaY) {
  if (bounds === null || deltaY === 0) {
    return bounds;
  }
  return {
    x: bounds.x,
    y: bounds.y + deltaY,
    width: bounds.width,
    height: bounds.height
  };
}

function shapeViewportRenderBoundsWith(renderer, shape, deltaY) {
  var bounds = shapeRenderBoundsWith(renderer, shape);
  if (shape.position === "fixed") {
    return bounds;
  }
  return offsetBounds(bounds, deltaY);
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
  } else if (shape.kind === "rectangle" || shape.kind === "button") {
    drawShapeShadow(renderer, canvas, shape);
    drawRectangle(renderer, canvas, shape, options);
  } else if (shape.kind === "line") {
    requirePointCount(shape, 2);
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawLine(canvas, shape.points[0].x, shape.points[0].y, shape.points[1].x, shape.points[1].y, shapeOutlineColor(shape), strokeOptions(shape));
    drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points), options);
  } else if (shape.kind === "pixel") {
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawPixel(canvas, shape.x, shape.y, shapeFill(shape));
  } else if (shape.kind === "ellipse") {
    drawShapeShadow(renderer, canvas, shape);
    drawEllipse(renderer, canvas, shape, options);
  } else if (shape.kind === "semiellipse") {
    drawShapeShadow(renderer, canvas, shape);
    drawSemiellipse(renderer, canvas, shape, options);
  } else if (shape.kind === "triangle") {
    drawShapeShadow(renderer, canvas, shape);
    drawTriangleShape(renderer, canvas, shape, options);
  } else if (shape.kind === "polygon") {
    drawShapeShadow(renderer, canvas, shape);
    drawPolygonShape(renderer, canvas, shape, options);
  } else if (shape.kind === "polyline") {
    requireMinimumPointCount(shape, 2);
    drawShapeShadow(renderer, canvas, shape);
    renderer.drawPolyline(canvas, shape.points, shapeOutlineColor(shape), strokeOptions(shape));
    drawShapeLabelInBounds(renderer, canvas, shape, labelPointBounds(shape.points), options);
  } else if (shape.kind === "capsule") {
    drawShapeShadow(renderer, canvas, shape);
    drawCapsule(renderer, canvas, shape, options);
  } else if (shape.kind === "text") {
    drawShapeShadow(renderer, canvas, shape);
    renderer.text(canvas, shape.text, shape.x, shape.y, textOptions(shape));
  } else if (shape.kind === "image") {
    drawShapeShadow(renderer, canvas, shape);
    drawImageShape(renderer, canvas, shape, options);
  }
  return canvas;
}

function translateShape(shape, deltaX, deltaY) {
  shape.x = shape.x + deltaX;
  shape.y = shape.y + deltaY;
  for (var pointIndex = 0; pointIndex < shape.points.length; pointIndex = pointIndex + 1) {
    shape.points[pointIndex].x = shape.points[pointIndex].x + deltaX;
    shape.points[pointIndex].y = shape.points[pointIndex].y + deltaY;
  }
  for (var childIndex = 0; childIndex < shape.children.length; childIndex = childIndex + 1) {
    translateShape(shape.children[childIndex], deltaX, deltaY);
  }
}

function drawTranslatedShape(renderer, canvas, shape, options, deltaY) {
  if (shape.position === "fixed" || deltaY === 0) {
    return drawShape(renderer, canvas, shape, options);
  }
  translateShape(shape, 0, deltaY);
  drawShape(renderer, canvas, shape, options);
  translateShape(shape, 0, 0 - deltaY);
  return canvas;
}

function drawShapeInRegion(renderer, canvas, shape, options, region, deltaY) {
  if (shape.visible !== true) {
    return canvas;
  }
  if (shape.kind === "group") {
    var children = orderedShapes(shape.children);
    var childDeltaY = shape.position === "fixed" ? 0 : deltaY;
    for (var index = 0; index < children.length; index = index + 1) {
      drawShapeInRegion(renderer, canvas, children[index], options, region, childDeltaY);
    }
    return canvas;
  }
  if (boundsIntersect(shapeViewportRenderBoundsWith(renderer, shape, deltaY), region)) {
    drawTranslatedShape(renderer, canvas, shape, options, deltaY);
  }
  return canvas;
}

function sceneNeedsVerticalScrollbar(scene) {
  return scene.scrollbarWidth > 0 &&
    (scene.overflowY === "scroll" || (scene.overflowY === "auto" && scene.scrollHeight > scene.height));
}

function sceneScrollbarColors(scene) {
  if (scene.scrollbarColor !== null) {
    return scene.scrollbarColor;
  }
  return {
    thumb: rgb(136, 136, 136),
    track: rgb(241, 241, 241)
  };
}

function sceneScrollbarStyle(scene) {
  return scrollbarStyle({
    scrollbarColor: scene.scrollbarColor,
    scrollbarStyle: scene.scrollbarStyle
  });
}

function drawSceneVerticalScrollbar(renderer, canvas, scene, options) {
  if (!sceneNeedsVerticalScrollbar(scene)) {
    return canvas;
  }
  var style = sceneScrollbarStyle(scene);
  var x = scene.contentWidth;
  drawScrollbarPart(renderer, canvas, style.track, x, 0, scene.scrollbarWidth, scene.height, style.trackCorners, style.trackColor, style.trackOpacity, options);
  var thumbHeight = scene.height;
  if (scene.scrollHeight > scene.height) {
    thumbHeight = scene.height * scene.height / scene.scrollHeight;
    if (thumbHeight < scene.scrollbarWidth) {
      thumbHeight = scene.scrollbarWidth;
    }
  }
  var maxScrollY = scene.scrollHeight - scene.height;
  var thumbY = 0;
  if (maxScrollY > 0 && scene.height > thumbHeight) {
    thumbY = scene.scrollOffsetY * (scene.height - thumbHeight) / maxScrollY;
  }
  var drawThumbWidth = resolvedThumbWidth(style, scene.scrollbarWidth);
  var drawThumbHeight = resolvedThumbHeight(style, thumbHeight);
  var drawThumbX = x + (scene.scrollbarWidth - drawThumbWidth) / 2;
  var drawThumbY = thumbY + (thumbHeight - drawThumbHeight) / 2;
  drawScrollbarPart(renderer, canvas, style.thumb, drawThumbX, drawThumbY, drawThumbWidth, drawThumbHeight, style.thumbCorners, style.thumbColor, style.thumbOpacity, options);
  return canvas;
}

export function drawSceneWith(renderer, canvas, scene, options) {
  var shapes = orderedShapes(scene.shapes);
  var offsetY = 0 - scene.scrollOffsetY;
  renderer.pushClip(canvas, 0, 0, scene.contentWidth, scene.height);
  for (var index = 0; index < shapes.length; index = index + 1) {
    drawTranslatedShape(renderer, canvas, shapes[index], options, offsetY);
  }
  renderer.popClip(canvas);
  drawSceneVerticalScrollbar(renderer, canvas, scene, options);
  if (renderer.attachScene !== null) {
    renderer.attachScene(canvas, scene, options);
  }
  return canvas;
}

export function drawSceneRegionWith(renderer, canvas, scene, options, region) {
  var shapes = orderedShapes(scene.shapes);
  var offsetY = 0 - scene.scrollOffsetY;
  renderer.pushClip(canvas, region.x, region.y, region.width, region.height);
  renderer.pushClip(canvas, 0, 0, scene.contentWidth, scene.height);
  for (var index = 0; index < shapes.length; index = index + 1) {
    drawShapeInRegion(renderer, canvas, shapes[index], options, region, offsetY);
  }
  renderer.popClip(canvas);
  renderer.popClip(canvas);
  drawSceneVerticalScrollbar(renderer, canvas, scene, options);
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
