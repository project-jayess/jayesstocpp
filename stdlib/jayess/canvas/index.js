import { abs, round } from "jayess:math";
import { rgb, rgba } from "jayess:color";
import {
  bitmapFontByName,
  defaultBitmapFont,
  glyphRowsForFont
} from "../font/glyphs.js";
import { slice as sliceString } from "jayess:string";
import {
  copy as copyImage,
  create as createImage,
  fill as fillImage,
  fillRect as fillImageRect,
  fillRectAlpha as fillImageRectAlpha,
  getPixel as getImagePixel,
  height as imageHeight,
  savePpm as saveImagePpm,
  setPixel,
  width as imageWidth
} from "jayess:image";
import {
  pointInsidePolygon,
  polygonBounds
} from "./polygon-helpers.js";
import {
  clamp,
  maxValue,
  minValue,
  sign
} from "./scalar-helpers.js";
import {
  copyDrawingState,
  copyDrawingStateStack,
  defaultDrawingState,
  popDrawingState,
  pushDrawingState,
  scaleState,
  transformedPoint
} from "./state.js";
export { parseHtml } from "./html-parser.js";
export { parseCss } from "./css-parser.js";
export { createHtmlDocument } from "./html-style.js";
export { hitTestHtml, hitTestHtmlNode } from "./html-hit-test.js";
import { layoutHtml as layoutHtmlDocument } from "./html-layout.js";
import { paintHtmlDocument } from "./html-paint.js";

function fail(message) {
  throw message;
}

function makeCanvas(image, title, clipStack, state, stateStack) {
  return {
    image: image,
    title: title,
    clipStack: clipStack,
    state: state,
    stateStack: stateStack
  };
}

function requireCanvas(canvas) {
  if (canvas === null) {
    fail("jayess:canvas expected a canvas");
  }
  return canvas;
}

function requirePoint(point) {
  if (point === null || point.x === null || point.y === null) {
    fail("jayess:canvas expected a point with x and y");
  }
  return point;
}

function requireRadius(radius) {
  if (radius < 0) {
    fail("jayess:canvas radius must be non-negative");
  }
  return radius;
}

function requireEllipseRadius(radius) {
  if (radius < 0) {
    fail("jayess:canvas ellipse radius must be non-negative");
  }
  return radius;
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

function defaultBackground() {
  return rgb(0, 0, 0);
}

function defaultTextColor() {
  return rgb(255, 255, 255);
}

function defaultStrokeWidth() {
  return 1;
}

function defaultTextSize() {
  return 7;
}

function defaultClipStack() {
  return [];
}

function defaultState() {
  return defaultDrawingState(defaultBackground(), defaultTextColor(), defaultStrokeWidth(), defaultTextColor(), defaultTextSize());
}

function copyClipStack(stack) {
  var copied = [];
  for (var index = 0; index < stack.length; index = index + 1) {
    copied.push(stack[index]);
  }
  return copied;
}

function blendColor(destination, source) {
  var alpha = source.alpha;
  var inverse = 1 - alpha;
  return rgba(
    round(source.red * alpha + destination.red * inverse),
    round(source.green * alpha + destination.green * inverse),
    round(source.blue * alpha + destination.blue * inverse),
    1
  );
}

function currentState(canvas) {
  return requireCanvas(canvas).state;
}

function transformPoint(canvas, x, y) {
  return transformedPoint(currentState(canvas), x, y, round);
}

function fillColorValue(canvas, color) {
  if (color === null) {
    return currentState(canvas).fillColor;
  }
  return color;
}

function strokeColorValue(canvas, color) {
  if (color === null) {
    return currentState(canvas).strokeColor;
  }
  return color;
}

function textColorValue(canvas, options) {
  return optionValue(options, "color", currentState(canvas).textColor);
}

function textSizeValue(canvas, options) {
  var explicitFontSize = optionValue(options, "fontSize", null);
  if (explicitFontSize !== null) {
    return explicitFontSize;
  }
  if (canvas === null) {
    return optionValue(options, "textSize", defaultTextSize());
  }
  return optionValue(options, "textSize", currentState(canvas).textSize);
}

function textFontValue(options) {
  var explicit = optionValue(options, "font", null);
  if (explicit !== null) {
    return explicit;
  }
  return bitmapFontByName(optionValue(options, "fontFamily", null));
}

function scaledFontMetrics(font, options) {
  var charHeight = optionValue(options, "charHeight", optionValue(options, "textSize", font.charHeight));
  var scale = charHeight / font.charHeight;
  var explicitCharWidth = optionValue(options, "charWidth", null);
  var charWidth = explicitCharWidth === null ? font.charWidth * scale : explicitCharWidth;
  var defaultAdvance = explicitCharWidth === null ? font.advance * scale : explicitCharWidth + optionValue(options, "spacing", 1);
  var advance = optionValue(options, "advance", defaultAdvance);
  var lineHeight = optionValue(options, "lineHeight", font.lineHeight * scale);
  return {
    charWidth: charWidth,
    charHeight: charHeight,
    scale: scale,
    advance: advance,
    lineHeight: lineHeight
  };
}

function normalizeClip(canvas, clip) {
  var image = requireCanvas(canvas).image;
  var canvasWidth = imageWidth(image);
  var canvasHeight = imageHeight(image);
  if (clip === null) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }
  if (clip.width < 0 || clip.height < 0) {
    fail("jayess:canvas clip width and height must be non-negative");
  }
  var left = clamp(clip.x, 0, canvasWidth);
  var top = clamp(clip.y, 0, canvasHeight);
  var right = clamp(clip.x + clip.width, 0, canvasWidth);
  var bottom = clamp(clip.y + clip.height, 0, canvasHeight);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function intersectClip(left, right) {
  var x = maxValue(left.x, right.x);
  var y = maxValue(left.y, right.y);
  var rightEdge = minValue(left.x + left.width, right.x + right.width);
  var bottomEdge = minValue(left.y + left.height, right.y + right.height);
  if (rightEdge <= x || bottomEdge <= y) {
    return { x: x, y: y, width: 0, height: 0 };
  }
  return { x: x, y: y, width: rightEdge - x, height: bottomEdge - y };
}

function currentClipRegion(canvas) {
  var checkedCanvas = requireCanvas(canvas);
  if (checkedCanvas.clipStack.length === 0) {
    return normalizeClip(checkedCanvas, null);
  }
  return checkedCanvas.clipStack[checkedCanvas.clipStack.length - 1];
}

function drawPixel(canvas, x, y, color) {
  var checkedCanvas = requireCanvas(canvas);
  var point = transformPoint(checkedCanvas, x, y);
  var image = checkedCanvas.image;
  var clip = currentClipRegion(checkedCanvas);
  if (point.x < clip.x || point.y < clip.y || point.x >= clip.x + clip.width || point.y >= clip.y + clip.height) {
    return canvas;
  }
  if (point.x < 0 || point.y < 0 || point.x >= imageWidth(image) || point.y >= imageHeight(image)) {
    return canvas;
  }
  if (color.alpha <= 0) {
    return canvas;
  }
  if (color.alpha >= 1) {
    setPixel(image, point.x, point.y, color);
    return canvas;
  }
  setPixel(image, point.x, point.y, blendColor(getImagePixel(image, point.x, point.y), color));
  return canvas;
}

function drawStrokePixel(canvas, x, y, color, strokeWidth) {
  var radius = round((strokeWidth - 1) / 2);
  for (var row = y - radius; row <= y + radius; row = row + 1) {
    for (var column = x - radius; column <= x + radius; column = column + 1) {
      drawPixel(canvas, column, row, color);
    }
  }
  return canvas;
}

function resolveClipRegion(canvas, clip) {
  var stackClip = currentClipRegion(canvas);
  if (clip === null) {
    return stackClip;
  }
  return intersectClip(stackClip, normalizeClip(canvas, clip));
}

function drawPixelClipped(canvas, x, y, color, clip) {
  var region = normalizeClip(canvas, clip);
  if (x < region.x || y < region.y || x >= region.x + region.width || y >= region.y + region.height) {
    return canvas;
  }
  return drawPixel(canvas, x, y, color);
}

function clippedRect(canvas, x, y, width, height, clip) {
  var region = resolveClipRegion(canvas, clip);
  var left = maxValue(x, region.x);
  var top = maxValue(y, region.y);
  var right = minValue(x + width, region.x + region.width);
  var bottom = minValue(y + height, region.y + region.height);
  if (right <= left || bottom <= top) {
    return { x: left, y: top, width: 0, height: 0 };
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function fillImageRectByAlpha(image, x, y, width, height, color) {
  if (color.alpha <= 0) {
    return image;
  }
  if (color.alpha < 1) {
    return fillImageRectAlpha(image, x, y, width, height, color);
  }
  return fillImageRect(image, x, y, width, height, color);
}

function strokeWidthValue(canvas, options) {
  var width = optionValue(options, "strokeWidth", currentState(canvas).strokeWidth);
  if (width < 1) {
    fail("jayess:canvas strokeWidth must be at least 1");
  }
  return round(width);
}

export function create(width, height, options) {
  var background = optionValue(options, "background", defaultBackground());
  var title = optionValue(options, "title", "");
  return makeCanvas(createImage(width, height, background), title, defaultClipStack(), defaultState(), []);
}

export function clear(canvas, color) {
  fillImage(requireCanvas(canvas).image, fillColorValue(canvas, color));
  return canvas;
}

export function width(canvas) {
  return imageWidth(requireCanvas(canvas).image);
}

export function height(canvas) {
  return imageHeight(requireCanvas(canvas).image);
}

export function getPixel(canvas, x, y) {
  return getImagePixel(requireCanvas(canvas).image, x, y);
}

export function copy(canvas) {
  var source = requireCanvas(canvas);
  return makeCanvas(copyImage(source.image), source.title, copyClipStack(source.clipStack), copyDrawingState(source.state), copyDrawingStateStack(source.stateStack));
}

export function saveState(canvas) {
  return pushDrawingState(requireCanvas(canvas));
}

export function restoreState(canvas) {
  return popDrawingState(requireCanvas(canvas));
}

export function setFillColor(canvas, color) {
  currentState(canvas).fillColor = color;
  return canvas;
}

export function setStrokeColor(canvas, color) {
  currentState(canvas).strokeColor = color;
  return canvas;
}

export function setStrokeWidth(canvas, width) {
  if (width < 1) {
    fail("jayess:canvas strokeWidth must be at least 1");
  }
  currentState(canvas).strokeWidth = round(width);
  return canvas;
}

export function setTextColor(canvas, color) {
  currentState(canvas).textColor = color;
  return canvas;
}

export function setTextSize(canvas, size) {
  if (size < 1) {
    fail("jayess:canvas text size must be at least 1");
  }
  currentState(canvas).textSize = round(size);
  return canvas;
}

export function translate(canvas, x, y) {
  var state = currentState(canvas);
  state.translateX = state.translateX + x;
  state.translateY = state.translateY + y;
  return canvas;
}

export function scale(canvas, x, y) {
  scaleState(currentState(canvas), x, y);
  return canvas;
}

export function clipRect(canvas, x, y, width, height) {
  return resolveClipRegion(canvas, { x: x, y: y, width: width, height: height });
}

export function currentClip(canvas) {
  return currentClipRegion(canvas);
}

export function pushClip(canvas, x, y, width, height) {
  var checkedCanvas = requireCanvas(canvas);
  checkedCanvas.clipStack.push(resolveClipRegion(checkedCanvas, { x: x, y: y, width: width, height: height }));
  return canvas;
}

export function popClip(canvas) {
  var checkedCanvas = requireCanvas(canvas);
  if (checkedCanvas.clipStack.length === 0) {
    fail("jayess:canvas popClip requires an active clip");
  }
  checkedCanvas.clipStack.pop();
  return canvas;
}

export function fillRectClipped(canvas, x, y, width, height, color, clip) {
  var resolvedColor = fillColorValue(canvas, color);
  var rect = clippedRect(canvas, x, y, width, height, clip);
  if (rect.width <= 0 || rect.height <= 0) {
    return canvas;
  }
  fillImageRectByAlpha(requireCanvas(canvas).image, rect.x, rect.y, rect.width, rect.height, resolvedColor);
  return canvas;
}

export function fillRect(canvas, x, y, width, height, color) {
  var resolvedColor = fillColorValue(canvas, color);
  fillRectClipped(canvas, x, y, width, height, resolvedColor, null);
  return canvas;
}

export function fillRectAlpha(canvas, x, y, rectWidth, rectHeight, color) {
  var rect = clippedRect(canvas, x, y, rectWidth, rectHeight, null);
  if (rect.width <= 0 || rect.height <= 0) {
    return canvas;
  }
  fillImageRectAlpha(requireCanvas(canvas).image, rect.x, rect.y, rect.width, rect.height, fillColorValue(canvas, color));
  return canvas;
}

export function strokeRect(canvas, x, y, width, height, color, options) {
  if (width <= 0 || height <= 0) {
    return canvas;
  }
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  var horizontalStroke = minValue(strokeWidth, height);
  var verticalStroke = minValue(strokeWidth, width);
  var bottomY = y + height - horizontalStroke;
  var rightX = x + width - verticalStroke;

  fillRect(canvas, x, y, width, horizontalStroke, resolvedColor);
  if (bottomY > y) {
    fillRect(canvas, x, bottomY, width, horizontalStroke, resolvedColor);
  }

  var sideY = y + horizontalStroke;
  var sideHeight = height - horizontalStroke * 2;
  if (sideHeight > 0) {
    fillRect(canvas, x, sideY, verticalStroke, sideHeight, resolvedColor);
    if (rightX > x) {
      fillRect(canvas, rightX, sideY, verticalStroke, sideHeight, resolvedColor);
    }
  }
  return canvas;
}

export function drawImage(canvas, image, x, y) {
  for (var row = 0; row < imageHeight(image); row = row + 1) {
    for (var column = 0; column < imageWidth(image); column = column + 1) {
      drawPixel(canvas, x + column, y + row, getImagePixel(image, column, row));
    }
  }
  return canvas;
}

export function drawImageClipped(canvas, image, x, y, clip) {
  var region = resolveClipRegion(canvas, clip);
  for (var row = 0; row < imageHeight(image); row = row + 1) {
    for (var column = 0; column < imageWidth(image); column = column + 1) {
      drawPixelClipped(canvas, x + column, y + row, getImagePixel(image, column, row), region);
    }
  }
  return canvas;
}

export function drawCanvas(target, source, x, y) {
  return drawImage(target, requireCanvas(source).image, x, y);
}

export function fillCircle(canvas, centerX, centerY, radius, color) {
  var checkedRadius = requireRadius(radius);
  var radiusSquared = checkedRadius * checkedRadius;
  var resolvedColor = fillColorValue(canvas, color);

  for (var row = centerY - checkedRadius; row <= centerY + checkedRadius; row = row + 1) {
    for (var column = centerX - checkedRadius; column <= centerX + checkedRadius; column = column + 1) {
      var dx = column - centerX;
      var dy = row - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }

  return canvas;
}

export function strokeCircle(canvas, centerX, centerY, radius, color, options) {
  var checkedRadius = requireRadius(radius);
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  if (checkedRadius === 0) {
    drawStrokePixel(canvas, centerX, centerY, resolvedColor, strokeWidth);
    return canvas;
  }

  var outer = checkedRadius * checkedRadius;
  var innerRadius = checkedRadius - 1;
  var inner = innerRadius * innerRadius;

  for (var row = centerY - checkedRadius; row <= centerY + checkedRadius; row = row + 1) {
    for (var column = centerX - checkedRadius; column <= centerX + checkedRadius; column = column + 1) {
      var dx = column - centerX;
      var dy = row - centerY;
      var distance = dx * dx + dy * dy;
      if (distance <= outer && distance > inner) {
        drawStrokePixel(canvas, column, row, resolvedColor, strokeWidth);
      }
    }
  }

  return canvas;
}

export function fillEllipse(canvas, centerX, centerY, radiusX, radiusY, color) {
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  var resolvedColor = fillColorValue(canvas, color);
  if (checkedX === 0 && checkedY === 0) {
    drawPixel(canvas, centerX, centerY, resolvedColor);
    return canvas;
  }

  var xSquare = checkedX * checkedX;
  var ySquare = checkedY * checkedY;
  for (var row = centerY - checkedY; row <= centerY + checkedY; row = row + 1) {
    for (var column = centerX - checkedX; column <= centerX + checkedX; column = column + 1) {
      var dx = column - centerX;
      var dy = row - centerY;
      var normalized = dx * dx * ySquare + dy * dy * xSquare;
      if (normalized <= xSquare * ySquare) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }
  return canvas;
}

function drawLine(canvas, x1, y1, x2, y2, color, options) {
  var dx = abs(x2 - x1);
  var dy = abs(y2 - y1);
  var sx = sign(x2 - x1);
  var sy = sign(y2 - y1);
  var error = dx - dy;
  var x = x1;
  var y = y1;
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);

  while (true) {
    drawStrokePixel(canvas, x, y, resolvedColor, strokeWidth);
    if (x === x2 && y === y2) {
      return canvas;
    }

    var doubled = error * 2;
    if (doubled > 0 - dy) {
      error = error - dy;
      x = x + sx;
    }
    if (doubled < dx) {
      error = error + dx;
      y = y + sy;
    }
  }
}

export function strokeEllipse(canvas, centerX, centerY, radiusX, radiusY, color, options) {
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  if (checkedX === 0 || checkedY === 0) {
    return drawLine(canvas, centerX - checkedX, centerY - checkedY, centerX + checkedX, centerY + checkedY, color, options);
  }

  var xSquare = checkedX * checkedX;
  var ySquare = checkedY * checkedY;
  var innerX = maxValue(checkedX - 1, 0);
  var innerY = maxValue(checkedY - 1, 0);
  var innerXSquare = innerX * innerX;
  var innerYSquare = innerY * innerY;
  var outer = xSquare * ySquare;
  var inner = innerXSquare * innerYSquare;
  for (var row = centerY - checkedY; row <= centerY + checkedY; row = row + 1) {
    for (var column = centerX - checkedX; column <= centerX + checkedX; column = column + 1) {
      var dx = column - centerX;
      var dy = row - centerY;
      var outerValue = dx * dx * ySquare + dy * dy * xSquare;
      var innerValue = dx * dx * innerYSquare + dy * dy * innerXSquare;
      if (outerValue <= outer && (inner === 0 || innerValue > inner)) {
        drawStrokePixel(canvas, column, row, resolvedColor, strokeWidth);
      }
    }
  }
  return canvas;
}

export function line(canvas, x1, y1, x2, y2, color, options) {
  return drawLine(canvas, x1, y1, x2, y2, color, options);
}

export function polyline(canvas, points, color, options) {
  if (points.length === 0) {
    return canvas;
  }

  for (var index = 0; index < points.length - 1; index = index + 1) {
    var start = requirePoint(points[index]);
    var end = requirePoint(points[index + 1]);
    line(canvas, start.x, start.y, end.x, end.y, color, options);
  }

  return canvas;
}

function curveSteps(options) {
  var steps = optionValue(options, "steps", 16);
  if (steps < 1) {
    return 1;
  }
  return steps;
}

export function quadraticCurve(canvas, x1, y1, controlX, controlY, x2, y2, color, options) {
  var steps = curveSteps(options);
  var previousX = x1;
  var previousY = y1;
  for (var index = 1; index <= steps; index = index + 1) {
    var t = index / steps;
    var inverse = 1 - t;
    var currentX = round(inverse * inverse * x1 + 2 * inverse * t * controlX + t * t * x2);
    var currentY = round(inverse * inverse * y1 + 2 * inverse * t * controlY + t * t * y2);
    line(canvas, round(previousX), round(previousY), currentX, currentY, color, options);
    previousX = currentX;
    previousY = currentY;
  }
  return canvas;
}

export function bezierCurve(canvas, x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, options) {
  var steps = curveSteps(options);
  var previousX = x1;
  var previousY = y1;
  for (var index = 1; index <= steps; index = index + 1) {
    var t = index / steps;
    var inverse = 1 - t;
    var currentX = round(
      inverse * inverse * inverse * x1
      + 3 * inverse * inverse * t * c1x
      + 3 * inverse * t * t * c2x
      + t * t * t * x2
    );
    var currentY = round(
      inverse * inverse * inverse * y1
      + 3 * inverse * inverse * t * c1y
      + 3 * inverse * t * t * c2y
      + t * t * t * y2
    );
    line(canvas, round(previousX), round(previousY), currentX, currentY, color, options);
    previousX = currentX;
    previousY = currentY;
  }
  return canvas;
}

export function measureText(canvas, textValue, options) {
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(canvas, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(canvas, options))
  });
  var maxWidth = 0;
  var currentWidth = 0;
  var lines = 1;
  for (var index = 0; index < textValue.length; index = index + 1) {
    if (textValue[index] === "\n") {
      maxWidth = maxValue(maxWidth, currentWidth);
      currentWidth = 0;
      lines = lines + 1;
    } else {
      currentWidth = currentWidth + metrics.advance;
    }
  }
  maxWidth = maxValue(maxWidth, currentWidth);
  return {
    width: maxWidth,
    height: metrics.lineHeight * lines
  };
}

function drawBitmapGlyph(canvas, font, char, x, y, metrics, color) {
  var rows = glyphRowsForFont(font, char);
  var pixelSize = round(metrics.scale);
  if (pixelSize < 1) {
    pixelSize = 1;
  }
  for (var row = 0; row < rows.length; row = row + 1) {
    var pixels = rows[row];
    var runStart = null;
    for (var column = 0; column <= pixels.length; column = column + 1) {
      var enabled = column < pixels.length && pixels[column] === "1";
      if (enabled && runStart === null) {
        runStart = column;
      }
      if ((!enabled || column === pixels.length) && runStart !== null) {
        fillRect(canvas, x + runStart * pixelSize, y + row * pixelSize, (column - runStart) * pixelSize, pixelSize, color);
        runStart = null;
      }
    }
  }
}

function coverageColor(color, coverage) {
  return rgba(color.red, color.green, color.blue, color.alpha * coverage);
}

function vectorCoverageForPixel(pixels, column) {
  var left = column === 0 ? "0" : pixels[column - 1];
  var right = column + 1 >= pixels.length ? "0" : pixels[column + 1];
  if (left === "1" && right === "1") {
    return 0.95;
  }
  return 0.7;
}

function drawVectorGlyph(canvas, font, char, x, y, metrics, color) {
  var rows = glyphRowsForFont(font, char);
  var pixelSize = round(metrics.scale);
  if (pixelSize < 1) {
    pixelSize = 1;
  }
  for (var row = 0; row < rows.length; row = row + 1) {
    var pixels = rows[row];
    for (var column = 0; column < pixels.length; column = column + 1) {
      if (pixels[column] === "1") {
        fillRectAlpha(
          canvas,
          x + column * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize,
          coverageColor(color, vectorCoverageForPixel(pixels, column))
        );
      }
    }
  }
}

function drawFontGlyph(canvas, font, char, x, y, metrics, color) {
  if (font.kind === "vector-font" && font.systemFont !== true) {
    drawVectorGlyph(canvas, font, char, x, y, metrics, color);
  } else {
    drawBitmapGlyph(canvas, font, char, x, y, metrics, color);
  }
}

export function text(canvas, textValue, x, y, options) {
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(canvas, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(canvas, options))
  });
  var color = textColorValue(canvas, options);
  var cursorX = x;
  var cursorY = y;
  for (var index = 0; index < textValue.length; index = index + 1) {
    var char = textValue[index];
    if (char === "\n") {
      cursorX = x;
      cursorY = cursorY + metrics.lineHeight;
    } else {
      if (char !== " ") {
        drawFontGlyph(canvas, font, char, cursorX, cursorY, metrics, color);
      }
      cursorX = cursorX + metrics.advance;
    }
  }
  return canvas;
}

function requireRect(rect) {
  if (rect === null || rect.x === null || rect.y === null || rect.width === null || rect.height === null) {
    fail("jayess:canvas expected a rectangle with x, y, width, and height");
  }
  if (rect.width < 0 || rect.height < 0) {
    fail("jayess:canvas rectangle width and height must be non-negative");
  }
  return rect;
}

function wrappedTextLines(textValue, maxColumns) {
  var lines = [];
  var lineStart = 0;
  var currentLength = 0;
  if (maxColumns < 1) {
    maxColumns = 1;
  }
  for (var index = 0; index < textValue.length; index = index + 1) {
    var char = textValue[index];
    if (char === "\n") {
      lines.push(sliceString(textValue, lineStart, index));
      lineStart = index + 1;
      currentLength = 0;
    } else {
      if (currentLength >= maxColumns) {
        lines.push(sliceString(textValue, lineStart, index));
        lineStart = index;
        currentLength = 0;
      }
      currentLength = currentLength + 1;
    }
  }
  lines.push(sliceString(textValue, lineStart, textValue.length));
  return lines;
}

function alignedTextX(rect, lineWidth, align) {
  if (align === "center") {
    return rect.x + round((rect.width - lineWidth) / 2);
  }
  if (align === "right") {
    return rect.x + rect.width - lineWidth;
  }
  return rect.x;
}

function alignedTextY(rect, contentHeight, align) {
  if (align === "middle") {
    return rect.y + round((rect.height - contentHeight) / 2);
  }
  if (align === "bottom") {
    return rect.y + rect.height - contentHeight;
  }
  return rect.y;
}

export function drawTextBox(canvas, textValue, rectValue, options) {
  var target = requireCanvas(canvas);
  var rect = requireRect(rectValue);
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(target, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(target, options))
  });
  var horizontal = optionValue(options, "horizontal", "left");
  var vertical = optionValue(options, "vertical", "top");
  var columns = round(rect.width / metrics.advance);
  var lines = wrappedTextLines(textValue, columns);
  var contentHeight = lines.length * metrics.lineHeight;
  var cursorY = alignedTextY(rect, contentHeight, vertical);
  for (var index = 0; index < lines.length; index = index + 1) {
    var lineText = lines[index];
    var lineSize = measureText(target, lineText, options);
    var cursorX = alignedTextX(rect, lineSize.width, horizontal);
    text(target, lineText, cursorX, cursorY, options);
    cursorY = cursorY + metrics.lineHeight;
  }
  return target;
}

export function fillPolygon(canvas, points, color) {
  if (points.length < 3) {
    return canvas;
  }
  var resolvedColor = fillColorValue(canvas, color);
  var bounds = polygonBounds(points);
  for (var row = bounds.minY; row <= bounds.maxY; row = row + 1) {
    for (var column = bounds.minX; column <= bounds.maxX; column = column + 1) {
      if (pointInsidePolygon(column + 0.5, row + 0.5, points)) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }
  return canvas;
}

export function strokePolygon(canvas, points, color, options) {
  if (points.length === 0) {
    return canvas;
  }
  polyline(canvas, points, color, options);
  if (points.length > 2) {
    var first = requirePoint(points[0]);
    var last = requirePoint(points[points.length - 1]);
    line(canvas, last.x, last.y, first.x, first.y, color, options);
  }
  return canvas;
}

export function savePpm(canvas, path) {
  return saveImagePpm(requireCanvas(canvas).image, path);
}

export function saveImage(canvas, path) {
  return savePpm(canvas, path);
}

export function layoutHtml(document, bounds) {
  return layoutHtmlDocument(document, bounds, function (textValue, options) {
    return measureText(null, textValue, options);
  });
}

export function drawHtml(canvas, document) {
  return paintHtmlDocument(canvas, document, {
    fillRect: fillRect,
    strokeRect: strokeRect,
    clipRect: pushClip,
    popClip: popClip,
    text: text,
    drawImage: drawImage
  });
}
