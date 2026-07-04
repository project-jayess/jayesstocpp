import { abs, round, sqrt } from "jayess:math";
import { rgb, rgba } from "jayess:color";
import {
  bitmapFontByName,
  defaultBitmapFont,
  glyphWidthForFontSize,
  glyphRowsForFontSize,
  glyphRowsForFont
} from "../font/glyphs.js";
import { chars as stringChars, slice as sliceString, toLower, toUpper } from "jayess:string";
import { fromUtf8 } from "jayess:bytes";
import { keys } from "jayess:object";
import {
  copy as copyImage,
  create as createImage,
  decodePgm,
  decodePpm,
  drawLine as drawImageLine,
  fill as fillImage,
  fillCapsule as fillImageCapsule,
  fillEllipse as fillImageEllipse,
  fillRect as fillImageRect,
  fillRectAlpha as fillImageRectAlpha,
  getPixel as getImagePixel,
  height as imageHeight,
  isImage,
  loadBmp,
  loadPgm,
  loadPpm,
  loadTga,
  resizeNearest,
  antialias as antialiasImage,
  savePpm as saveImagePpm,
  setPixel,
  shadowMask as shadowMaskImage,
  transparentBlit,
  transparentBlitClipped,
  width as imageWidth
} from "jayess:image";
import {
  pointInsidePolygon,
  polygonBounds
} from "./polygon-helpers.js";
import {
  addCanvasEventListener,
  dispatchCanvasEvent,
  getElementById,
  hitTest,
  hitTests,
  hitShapes,
  updateElementAttribute
} from "./runtime-scene.js";
import {
  clamp,
  maxValue,
  minValue,
  sign
} from "./scalar-helpers.js";
import {
  boxCenterX,
  boxCenterY,
  boxRadiusX,
  boxRadiusY,
  requireShapeSize
} from "./shapes.js";
import {
  copyDrawingState,
  copyDrawingStateStack,
  defaultDrawingState,
  popDrawingState,
  pushDrawingState,
  scaleState,
  transformedPoint
} from "./state.js";
import {
  drawSceneRegionWith,
  drawSceneWith,
  renderSceneWith,
  shapePaintBoundsWith,
  shapeRenderBoundsWith
} from "./xml-renderer.js";
export {
  parseScene,
  sceneBackground,
  sceneSize,
  sceneTitle
} from "./xml-scene.js";

function fail(message) {
  throw message;
}

function makeCanvas(image, title, clipStack, state, stateStack, scene, sceneOptions, hoveredElementId, canvasListeners, scrollDragState, requestedBackend, actualBackend) {
  return {
    image: image,
    title: title,
    clipStack: clipStack,
    state: state,
    stateStack: stateStack,
    scene: scene,
    sceneOptions: sceneOptions,
    hoveredElementId: hoveredElementId,
    canvasListeners: canvasListeners,
    scrollDragState: scrollDragState,
    requestedBackend: requestedBackend,
    actualBackend: actualBackend
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

function validateBackend(backend) {
  if (backend === "auto" || backend === "cpu" || backend === "gpu") {
    return backend;
  }
  fail("jayess:canvas backend must be auto, cpu, or gpu");
}

function requestedBackendValue(options) {
  return validateBackend(optionValue(options, "backend", "auto"));
}

function actualBackendValue(requested) {
  if (requested === "gpu") {
    fail("jayess:canvas GPU XML rendering is not available yet; use backend auto or cpu");
  }
  return "cpu";
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
  var letterSpacing = optionValue(options, "letterSpacing", 0);
  var wordSpacing = optionValue(options, "wordSpacing", 0);
  return {
    charWidth: charWidth,
    charHeight: charHeight,
    scale: scale,
    advance: advance,
    lineHeight: lineHeight,
    letterSpacing: letterSpacing,
    wordSpacing: wordSpacing
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

export function drawPixel(canvas, x, y, color) {
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
  var pixelLeft = round(left);
  var pixelTop = round(top);
  var pixelRight = round(right);
  var pixelBottom = round(bottom);
  if (pixelRight <= pixelLeft || pixelBottom <= pixelTop) {
    return { x: pixelLeft, y: pixelTop, width: 0, height: 0 };
  }
  return { x: pixelLeft, y: pixelTop, width: pixelRight - pixelLeft, height: pixelBottom - pixelTop };
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
  var requestedBackend = requestedBackendValue(options);
  var actualBackend = actualBackendValue(requestedBackend);
  return makeCanvas(createImage(width, height, background), title, defaultClipStack(), defaultState(), [], null, null, "", {}, null, requestedBackend, actualBackend);
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
  return makeCanvas(copyImage(source.image), source.title, copyClipStack(source.clipStack), copyDrawingState(source.state), copyDrawingStateStack(source.stateStack), source.scene, source.sceneOptions, source.hoveredElementId, source.canvasListeners, source.scrollDragState, source.requestedBackend, source.actualBackend);
}

export function requestedBackend(canvas) {
  return requireCanvas(canvas).requestedBackend;
}

export function actualBackend(canvas) {
  return requireCanvas(canvas).actualBackend;
}

function downsamplePixel(source, x, y, scale) {
  var image = requireCanvas(source).image;
  var red = 0;
  var green = 0;
  var blue = 0;
  var alpha = 0;
  var count = scale * scale;
  for (var row = 0; row < scale; row = row + 1) {
    for (var column = 0; column < scale; column = column + 1) {
      var pixel = getImagePixel(image, x * scale + column, y * scale + row);
      red = red + pixel.red;
      green = green + pixel.green;
      blue = blue + pixel.blue;
      alpha = alpha + pixel.alpha;
    }
  }
  return rgba(round(red / count), round(green / count), round(blue / count), alpha / count);
}

export function downsample(canvas, targetWidth, targetHeight, scale, options) {
  var target = create(targetWidth, targetHeight, options);
  var image = requireCanvas(target).image;
  for (var row = 0; row < targetHeight; row = row + 1) {
    for (var column = 0; column < targetWidth; column = column + 1) {
      setPixel(image, column, row, downsamplePixel(canvas, column, row, scale));
    }
  }
  return target;
}

export function antialias(canvas, level) {
  var target = requireCanvas(canvas);
  antialiasImage(target.image, level);
  return canvas;
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

export function drawRect(canvas, x, y, width, height, color, options) {
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

function zeroCorners() {
  return { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
}

function roundedCornersValue(corners) {
  if (corners === null) {
    return zeroCorners();
  }
  return corners;
}

function scaledRoundedCorners(width, height, corners) {
  var resolved = roundedCornersValue(corners);
  var topLeft = resolved.topLeft;
  var topRight = resolved.topRight;
  var bottomRight = resolved.bottomRight;
  var bottomLeft = resolved.bottomLeft;
  var limit = minValue(width, height) / 2;
  topLeft = minValue(topLeft, limit);
  topRight = minValue(topRight, limit);
  bottomRight = minValue(bottomRight, limit);
  bottomLeft = minValue(bottomLeft, limit);
  var scale = 1;
  if (topLeft + topRight > width) {
    scale = minValue(scale, width / (topLeft + topRight));
  }
  if (bottomLeft + bottomRight > width) {
    scale = minValue(scale, width / (bottomLeft + bottomRight));
  }
  if (topLeft + bottomLeft > height) {
    scale = minValue(scale, height / (topLeft + bottomLeft));
  }
  if (topRight + bottomRight > height) {
    scale = minValue(scale, height / (topRight + bottomRight));
  }
  return {
    topLeft: topLeft * scale,
    topRight: topRight * scale,
    bottomRight: bottomRight * scale,
    bottomLeft: bottomLeft * scale
  };
}

function insetCorners(corners, amount) {
  var resolved = roundedCornersValue(corners);
  return {
    topLeft: maxValue(0, resolved.topLeft - amount),
    topRight: maxValue(0, resolved.topRight - amount),
    bottomRight: maxValue(0, resolved.bottomRight - amount),
    bottomLeft: maxValue(0, resolved.bottomLeft - amount)
  };
}

function roundedInsetForRow(py, centerY, radius) {
  if (radius <= 0) {
    return 0;
  }
  var dy = py - centerY;
  var inside = radius * radius - dy * dy;
  if (inside <= 0) {
    return radius;
  }
  return radius - sqrt(inside);
}

function roundedRectRowSpan(x, y, width, height, corners, row) {
  var radii = scaledRoundedCorners(width, height, corners);
  var py = row + 0.5;
  var left = x;
  var right = x + width;
  if (py < y + radii.topLeft) {
    left = maxValue(left, x + round(roundedInsetForRow(py, y + radii.topLeft, radii.topLeft)));
  }
  if (py >= y + height - radii.bottomLeft) {
    left = maxValue(left, x + round(roundedInsetForRow(py, y + height - radii.bottomLeft, radii.bottomLeft)));
  }
  if (py < y + radii.topRight) {
    right = minValue(right, x + width - round(roundedInsetForRow(py, y + radii.topRight, radii.topRight)));
  }
  if (py >= y + height - radii.bottomRight) {
    right = minValue(right, x + width - round(roundedInsetForRow(py, y + height - radii.bottomRight, radii.bottomRight)));
  }
  return { left: left, right: right };
}

function fillSpan(canvas, left, row, right, color) {
  if (right <= left) {
    return canvas;
  }
  return fillRect(canvas, left, row, right - left, 1, color);
}

export function fillRoundedRect(canvas, x, y, width, height, corners, color) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  var resolvedColor = fillColorValue(canvas, color);
  for (var row = y; row < y + size.height; row = row + 1) {
    var span = roundedRectRowSpan(x, y, size.width, size.height, corners, row);
    fillSpan(canvas, span.left, row, span.right, resolvedColor);
  }
  return canvas;
}

export function drawRoundedRect(canvas, x, y, width, height, corners, color, options) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  var innerX = x + strokeWidth;
  var innerY = y + strokeWidth;
  var innerWidth = size.width - strokeWidth * 2;
  var innerHeight = size.height - strokeWidth * 2;
  var innerCorners = insetCorners(corners, strokeWidth);
  for (var row = y; row < y + size.height; row = row + 1) {
    var outer = roundedRectRowSpan(x, y, size.width, size.height, corners, row);
    if (innerWidth <= 0 || innerHeight <= 0 || row < innerY || row >= innerY + innerHeight) {
      fillSpan(canvas, outer.left, row, outer.right, resolvedColor);
    } else {
      var inner = roundedRectRowSpan(innerX, innerY, innerWidth, innerHeight, innerCorners, row);
      fillSpan(canvas, outer.left, row, minValue(inner.left, outer.right), resolvedColor);
      fillSpan(canvas, maxValue(inner.right, outer.left), row, outer.right, resolvedColor);
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

export function drawImageAlpha(canvas, image, x, y) {
  var checkedCanvas = requireCanvas(canvas);
  if (checkedCanvas.clipStack.length === 0) {
    transparentBlit(checkedCanvas.image, image, x, y);
    return canvas;
  }
  var region = currentClipRegion(checkedCanvas);
  transparentBlitClipped(checkedCanvas.image, image, x, y, region.x, region.y, region.width, region.height);
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

export function shadowMask(canvas, blurRadius, spreadRadius, color) {
  return shadowMaskImage(requireCanvas(canvas).image, blurRadius, spreadRadius, color);
}

function fillEllipseCentered(canvas, centerX, centerY, radiusX, radiusY, color) {
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

function ellipsePixelInside(column, row, x, y, width, height) {
  if (width <= 0 || height <= 0) {
    return false;
  }
  var radiusX = width / 2;
  var radiusY = height / 2;
  var centerX = x + radiusX;
  var centerY = y + radiusY;
  var dx = (column + 0.5 - centerX) / radiusX;
  var dy = (row + 0.5 - centerY) / radiusY;
  return dx * dx + dy * dy <= 1;
}

function fillEllipseBox(canvas, x, y, width, height, color) {
  var resolvedColor = fillColorValue(canvas, color);
  fillImageEllipse(requireCanvas(canvas).image, x, y, width, height, resolvedColor);
  return canvas;
}

export function drawLine(canvas, x1, y1, x2, y2, color, options) {
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  drawImageLine(requireCanvas(canvas).image, x1, y1, x2, y2, resolvedColor, strokeWidth);
  return canvas;
}

function drawEllipseCentered(canvas, centerX, centerY, radiusX, radiusY, color, options) {
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

function drawEllipseBox(canvas, x, y, width, height, color, options) {
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  var innerX = x + strokeWidth;
  var innerY = y + strokeWidth;
  var innerWidth = width - strokeWidth * 2;
  var innerHeight = height - strokeWidth * 2;
  for (var row = y; row < y + height; row = row + 1) {
    for (var column = x; column < x + width; column = column + 1) {
      var outer = ellipsePixelInside(column, row, x, y, width, height);
      var inner = ellipsePixelInside(column, row, innerX, innerY, innerWidth, innerHeight);
      if (outer && !inner) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }
  return canvas;
}

export function fillEllipse(canvas, x, y, width, height, color) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  return fillEllipseBox(canvas, x, y, size.width, size.height, color);
}

export function drawEllipse(canvas, x, y, width, height, color, options) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  return drawEllipseBox(canvas, x, y, size.width, size.height, color, options);
}

function semiellipseDirection(options) {
  return optionValue(options, "direction", "top");
}

function isSemiellipsePixel(direction, column, row, centerX, centerY) {
  if (direction === "bottom") {
    return row >= centerY;
  }
  if (direction === "left") {
    return column <= centerX;
  }
  if (direction === "right") {
    return column >= centerX;
  }
  return row <= centerY;
}

export function fillSemiellipse(canvas, x, y, width, height, color, options) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  var centerX = boxCenterX(x, size.width);
  var centerY = boxCenterY(y, size.height);
  var radiusX = boxRadiusX(size.width);
  var radiusY = boxRadiusY(size.height);
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  var resolvedColor = fillColorValue(canvas, color);
  var direction = semiellipseDirection(options);
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
      if (normalized <= xSquare * ySquare && isSemiellipsePixel(direction, column, row, centerX, centerY)) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }
  return canvas;
}

export function drawSemiellipse(canvas, x, y, width, height, color, options) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  var centerX = boxCenterX(x, size.width);
  var centerY = boxCenterY(y, size.height);
  var radiusX = boxRadiusX(size.width);
  var radiusY = boxRadiusY(size.height);
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  var direction = semiellipseDirection(options);
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  if (checkedX === 0 && checkedY === 0) {
    drawStrokePixel(canvas, centerX, centerY, resolvedColor, strokeWidth);
    return canvas;
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
      var onArc = outerValue <= outer && (inner === 0 || innerValue > inner);
      if (onArc && isSemiellipsePixel(direction, column, row, centerX, centerY)) {
        drawStrokePixel(canvas, column, row, resolvedColor, strokeWidth);
      }
    }
  }
  if (direction === "left" || direction === "right") {
    drawLine(canvas, centerX, centerY - checkedY, centerX, centerY + checkedY, resolvedColor, options);
    return canvas;
  }
  drawLine(canvas, centerX - checkedX, centerY, centerX + checkedX, centerY, resolvedColor, options);
  return canvas;
}

export function drawPolyline(canvas, points, color, options) {
  if (points.length === 0) {
    return canvas;
  }

  for (var index = 0; index < points.length - 1; index = index + 1) {
    var start = requirePoint(points[index]);
    var end = requirePoint(points[index + 1]);
    drawLine(canvas, start.x, start.y, end.x, end.y, color, options);
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
    drawLine(canvas, round(previousX), round(previousY), currentX, currentY, color, options);
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
    drawLine(canvas, round(previousX), round(previousY), currentX, currentY, color, options);
    previousX = currentX;
    previousY = currentY;
  }
  return canvas;
}

function textAdvance(font, metrics, char) {
  if (char !== " " && font.kind === "vector-font" && font.systemFont !== true && font.metricsOnly !== true) {
    var glyphWidth = glyphWidthForFontSize(font, char, round(metrics.charHeight));
    if (glyphWidth > 0) {
      return glyphWidth + metrics.letterSpacing;
    }
  }
  var value = metrics.advance + metrics.letterSpacing;
  if (char.length > 1 && value < metrics.charHeight) {
    value = metrics.charHeight + metrics.letterSpacing;
  }
  if (char === " ") {
    value = value + metrics.wordSpacing;
  }
  return value;
}

function transformText(textValue, transform) {
  if (transform === "uppercase") {
    return toUpper(textValue);
  }
  if (transform === "lowercase") {
    return toLower(textValue);
  }
  return textValue;
}

export function measureText(canvas, textValue, options) {
  var renderedText = transformText(textValue, optionValue(options, "textTransform", "none"));
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(canvas, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(canvas, options)),
    letterSpacing: optionValue(options, "letterSpacing", 0),
    wordSpacing: optionValue(options, "wordSpacing", 0)
  });
  var maxWidth = 0;
  var currentWidth = 0;
  var lines = 1;
  var characters = stringChars(renderedText);
  for (var index = 0; index < characters.length; index = index + 1) {
    var char = characters[index];
    if (char === "\n") {
      maxWidth = maxValue(maxWidth, currentWidth);
      currentWidth = 0;
      lines = lines + 1;
    } else {
      currentWidth = currentWidth + textAdvance(font, metrics, char);
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
  var current = pixels[column];
  var coverage = 0;
  if (current === "9") {
    coverage = 1;
  } else if (current === "8") {
    coverage = 0.89;
  } else if (current === "7") {
    coverage = 0.78;
  } else if (current === "6") {
    coverage = 0.67;
  } else if (current === "5") {
    coverage = 0.56;
  } else if (current === "4") {
    coverage = 0.44;
  } else if (current === "3") {
    coverage = 0.33;
  } else if (current === "2") {
    coverage = 0.22;
  } else if (current === "1") {
    coverage = 0.11;
  }
  if (coverage <= 0) {
    return 0;
  }
  return sqrt(coverage);
}

function drawVectorGlyph(canvas, font, char, x, y, metrics, color) {
  var rows = glyphRowsForFontSize(font, char, round(metrics.charHeight));
  for (var row = 0; row < rows.length; row = row + 1) {
    var pixels = rows[row];
    for (var column = 0; column < pixels.length; column = column + 1) {
      if (pixels[column] !== "0") {
        fillRectAlpha(
          canvas,
          x + column,
          y + row,
          1,
          1,
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
  var renderedText = transformText(textValue, optionValue(options, "textTransform", "none"));
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(canvas, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(canvas, options)),
    letterSpacing: optionValue(options, "letterSpacing", 0),
    wordSpacing: optionValue(options, "wordSpacing", 0)
  });
  var color = textColorValue(canvas, options);
  var cursorX = x;
  var cursorY = y;
  var characters = stringChars(renderedText);
  for (var index = 0; index < characters.length; index = index + 1) {
    var char = characters[index];
    if (char === "\n") {
      cursorX = x;
      cursorY = cursorY + metrics.lineHeight;
    } else {
      if (char !== " ") {
        drawFontGlyph(canvas, font, char, cursorX, cursorY, metrics, color);
      }
      cursorX = cursorX + textAdvance(font, metrics, char);
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

function overflowTextLine(textValue, target, rect, options) {
  if (optionValue(options, "textOverflow", "overflow") !== "ellipsis") {
    return textValue;
  }
  var suffix = "...";
  if (measureText(target, textValue, options).width <= rect.width) {
    return textValue;
  }
  var end = textValue.length;
  while (end > 0) {
    var candidate = sliceString(textValue, 0, end) + suffix;
    if (measureText(target, candidate, options).width <= rect.width) {
      return candidate;
    }
    end = end - 1;
  }
  return suffix;
}

function shouldClipTextBox(options) {
  return true;
}

function textScrollX(options) {
  return optionValue(options, "scrollX", 0);
}

function textScrollY(options) {
  return optionValue(options, "scrollY", 0);
}

function drawTextDecoration(canvas, rect, lineWidth, x, y, metrics, color, decoration) {
  if (decoration === "none") {
    return canvas;
  }
  var lineY = y + metrics.charHeight;
  if (decoration === "line-through") {
    lineY = y + metrics.charHeight / 2;
  }
  if (decoration === "overline") {
    lineY = y;
  }
  fillRect(canvas, x, round(lineY), lineWidth, 1, color);
  return canvas;
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

function pushLayoutLine(lines, widths, line, target, options) {
  lines.push(line);
  widths.push(measureText(target, line, options).width);
}

function isWrapSpace(char) {
  return char === " " || char === "\t";
}

function measuredWidth(target, textValue, options) {
  return measureText(target, textValue, options).width;
}

function pushWrappedLongWord(lines, widths, word, target, rect, options) {
  var current = "";
  var characters = stringChars(word);
  for (var index = 0; index < characters.length; index = index + 1) {
    var candidate = current + characters[index];
    if (current.length > 0 && measuredWidth(target, candidate, options) > rect.width) {
      pushLayoutLine(lines, widths, current, target, options);
      current = characters[index];
    } else {
      current = candidate;
    }
  }
  return current;
}

function pushWrappedWord(lines, widths, state, word, target, rect, options) {
  if (word.length === 0) {
    return state;
  }
  var separator = "";
  if (state.line.length > 0 && state.pendingSpace.length > 0) {
    separator = state.pendingSpace;
  }
  var candidate = state.line + separator + word;
  if (state.line.length === 0) {
    if (measuredWidth(target, word, options) <= rect.width) {
      return { line: word, pendingSpace: "" };
    }
    return { line: pushWrappedLongWord(lines, widths, word, target, rect, options), pendingSpace: "" };
  }
  if (measuredWidth(target, candidate, options) <= rect.width) {
    return { line: candidate, pendingSpace: "" };
  }
  pushLayoutLine(lines, widths, state.line, target, options);
  if (measuredWidth(target, word, options) <= rect.width) {
    return { line: word, pendingSpace: "" };
  }
  return { line: pushWrappedLongWord(lines, widths, word, target, rect, options), pendingSpace: "" };
}

function wrapTextByWidth(target, textValue, rect, options) {
  var lines = [];
  var widths = [];
  var state = { line: "", pendingSpace: "" };
  var word = "";
  var characters = stringChars(textValue);
  for (var index = 0; index < characters.length; index = index + 1) {
    var char = characters[index];
    if (char === "\n") {
      state = pushWrappedWord(lines, widths, state, word, target, rect, options);
      word = "";
      pushLayoutLine(lines, widths, state.line, target, options);
      state = { line: "", pendingSpace: "" };
    } else if (isWrapSpace(char)) {
      state = pushWrappedWord(lines, widths, state, word, target, rect, options);
      word = "";
      if (state.line.length > 0) {
        state.pendingSpace = state.pendingSpace + char;
      }
    } else {
      word = word + char;
    }
  }
  state = pushWrappedWord(lines, widths, state, word, target, rect, options);
  pushLayoutLine(lines, widths, state.line, target, options);
  return { lines: lines, widths: widths };
}

function maxLineWidth(widths) {
  var value = 0;
  for (var index = 0; index < widths.length; index = index + 1) {
    if (widths[index] > value) {
      value = widths[index];
    }
  }
  return value;
}

export function measureTextBox(canvas, textValue, rectValue, options) {
  var target = canvas === null ? null : requireCanvas(canvas);
  var rect = requireRect(rectValue);
  var renderedText = transformText(textValue, optionValue(options, "textTransform", "none"));
  var font = textFontValue(options);
  var metrics = scaledFontMetrics(font, {
    charHeight: optionValue(options, "charHeight", textSizeValue(target, options)),
    charWidth: optionValue(options, "charWidth", null),
    advance: optionValue(options, "advance", null),
    lineHeight: optionValue(options, "lineHeight", null),
    textSize: optionValue(options, "textSize", textSizeValue(target, options)),
    letterSpacing: optionValue(options, "letterSpacing", 0),
    wordSpacing: optionValue(options, "wordSpacing", 0)
  });
  var layout = wrapTextByWidth(target, renderedText, rect, options);
  if (optionValue(options, "textOverflow", "overflow") === "ellipsis") {
    var line = overflowTextLine(layout.lines[0], target, rect, options);
    layout = {
      lines: [line],
      widths: [measureText(target, line, options).width]
    };
  }
  return {
    width: maxLineWidth(layout.widths),
    height: layout.lines.length * metrics.lineHeight,
    lines: layout.lines,
    widths: layout.widths,
    lineHeight: metrics.lineHeight
  };
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
    textSize: optionValue(options, "textSize", textSizeValue(target, options)),
    letterSpacing: optionValue(options, "letterSpacing", 0),
    wordSpacing: optionValue(options, "wordSpacing", 0)
  });
  var horizontal = optionValue(options, "horizontal", "left");
  var vertical = optionValue(options, "vertical", "top");
  var decoration = optionValue(options, "textDecoration", "none");
  var color = textColorValue(target, options);
  var layout = measureTextBox(target, textValue, rect, options);
  var lines = layout.lines;
  var contentHeight = layout.height;
  var cursorY = alignedTextY(rect, contentHeight, vertical) - textScrollY(options);
  var scrollX = textScrollX(options);
  var clipped = shouldClipTextBox(options);
  if (clipped) {
    pushClip(target, rect.x, rect.y, rect.width, rect.height);
  }
  for (var index = 0; index < lines.length; index = index + 1) {
    var lineText = lines[index];
    var lineWidth = layout.widths[index];
    var cursorX = alignedTextX(rect, lineWidth, horizontal) - scrollX;
    text(target, lineText, cursorX, cursorY, options);
    drawTextDecoration(target, rect, lineWidth, cursorX, cursorY, metrics, color, decoration);
    cursorY = cursorY + metrics.lineHeight;
  }
  if (clipped) {
    popClip(target);
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

export function drawPolygon(canvas, points, color, options) {
  if (points.length === 0) {
    return canvas;
  }
  drawPolyline(canvas, points, color, options);
  if (points.length > 2) {
    var first = requirePoint(points[0]);
    var last = requirePoint(points[points.length - 1]);
    drawLine(canvas, last.x, last.y, first.x, first.y, color, options);
  }
  return canvas;
}

export function fillTriangle(canvas, points, color) {
  if (points.length !== 3) {
    fail("jayess:canvas fillTriangle expects exactly three points");
  }
  return fillPolygon(canvas, points, color);
}

export function drawTriangle(canvas, points, color, options) {
  if (points.length !== 3) {
    fail("jayess:canvas drawTriangle expects exactly three points");
  }
  return drawPolygon(canvas, points, color, options);
}

function clampToRange(value, lower, upper) {
  return minValue(maxValue(value, lower), upper);
}

function capsulePixelInside(column, row, x, y, width, height) {
  if (width <= 0 || height <= 0) {
    return false;
  }
  var px = column + 0.5;
  var py = row + 0.5;
  if (width >= height) {
    var radius = height / 2;
    var centerY = y + radius;
    var leftCenterX = x + radius;
    var rightCenterX = x + width - radius;
    var closestX = clampToRange(px, leftCenterX, rightCenterX);
    var dx = px - closestX;
    var dy = py - centerY;
    return dx * dx + dy * dy <= radius * radius;
  }
  var verticalRadius = width / 2;
  var centerX = x + verticalRadius;
  var topCenterY = y + verticalRadius;
  var bottomCenterY = y + height - verticalRadius;
  var closestY = clampToRange(py, topCenterY, bottomCenterY);
  var verticalDx = px - centerX;
  var verticalDy = py - closestY;
  return verticalDx * verticalDx + verticalDy * verticalDy <= verticalRadius * verticalRadius;
}

export function fillCapsule(canvas, x, y, width, height, color) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  fillImageCapsule(requireCanvas(canvas).image, x, y, size.width, size.height, fillColorValue(canvas, color));
  return canvas;
}

export function drawCapsule(canvas, x, y, width, height, color, options) {
  var size = requireShapeSize(width, height);
  if (size.width === 0 || size.height === 0) {
    return canvas;
  }
  var strokeWidth = strokeWidthValue(canvas, options);
  var resolvedColor = strokeColorValue(canvas, color);
  var innerX = x + strokeWidth;
  var innerY = y + strokeWidth;
  var innerWidth = size.width - strokeWidth * 2;
  var innerHeight = size.height - strokeWidth * 2;
  for (var row = y; row < y + size.height; row = row + 1) {
    for (var column = x; column < x + size.width; column = column + 1) {
      var outer = capsulePixelInside(column, row, x, y, size.width, size.height);
      var inner = capsulePixelInside(column, row, innerX, innerY, innerWidth, innerHeight);
      if (outer && !inner) {
        drawPixel(canvas, column, row, resolvedColor);
      }
    }
  }
  return canvas;
}

export function savePpm(canvas, path) {
  return saveImagePpm(requireCanvas(canvas).image, path);
}

export function saveImage(canvas, path) {
  return savePpm(canvas, path);
}

function loadSceneImage(src) {
  if (src.endsWith(".ppm")) {
    return loadPpm(src);
  }
  if (src.endsWith(".bmp")) {
    return loadBmp(src);
  }
  if (src.endsWith(".pgm")) {
    return loadPgm(src);
  }
  if (src.endsWith(".tga")) {
    return loadTga(src);
  }
  fail("jayess:canvas XML <image> supports explicit image handles or local .ppm, .bmp, .pgm, and .tga files");
}

function attachScene(canvas, scene, options) {
  var target = requireCanvas(canvas);
  target.scene = scene;
  target.sceneOptions = options;
  return target;
}

function xmlSceneRenderer(skipShadowIds) {
  return {
    attachScene: attachScene,
    clear: clear,
    create: create,
    drawPixel: drawPixel,
    drawLine: drawLine,
    drawRect: drawRect,
    fillRect: fillRect,
    drawRoundedRect: drawRoundedRect,
    fillRoundedRect: fillRoundedRect,
    drawEllipse: drawEllipse,
    fillEllipse: fillEllipse,
    drawSemiellipse: drawSemiellipse,
    fillSemiellipse: fillSemiellipse,
    drawTriangle: drawTriangle,
    fillTriangle: fillTriangle,
    drawCapsule: drawCapsule,
    fillCapsule: fillCapsule,
    drawPolyline: drawPolyline,
    drawPolygon: drawPolygon,
    fillPolygon: fillPolygon,
    drawImage: drawImage,
    drawImageAlpha: drawImageAlpha,
    drawTextBox: drawTextBox,
    isImage: isImage,
    loadImage: loadSceneImage,
    measureText: measureText,
    measureTextBox: measureTextBox,
    popClip: popClip,
    pushClip: pushClip,
    resizeNearest: resizeNearest,
    skipShadowIds: skipShadowIds,
    shadowMask: shadowMask,
    text: text,
    downsample: downsample,
    antialias: antialias
  };
}

export function drawScene(canvas, scene, options) {
  return drawSceneWith(xmlSceneRenderer(), canvas, scene, options);
}

export function renderScene(xmlText, options) {
  return renderSceneWith(xmlSceneRenderer(), xmlText, options);
}

function redrawAttachedScene(canvas) {
  var target = requireCanvas(canvas);
  var scene = target.scene;
  if (scene === null) {
    fail("jayess:canvas expected a canvas rendered from an XML scene");
  }
  clear(target, scene.background);
  drawSceneWith(xmlSceneRenderer(), target, scene, target.sceneOptions);
  return target;
}

function validRegion(region) {
  return region !== null && region.width > 0 && region.height > 0;
}

function unionRegion(left, right) {
  if (!validRegion(left)) {
    return right;
  }
  if (!validRegion(right)) {
    return left;
  }
  var x = minValue(left.x, right.x);
  var y = minValue(left.y, right.y);
  var rightEdge = maxValue(left.x + left.width, right.x + right.width);
  var bottomEdge = maxValue(left.y + left.height, right.y + right.height);
  return { x: x, y: y, width: rightEdge - x, height: bottomEdge - y };
}

function clampRegionToCanvas(canvas, region) {
  if (!validRegion(region)) {
    return null;
  }
  var canvasWidth = width(canvas);
  var canvasHeight = height(canvas);
  var x = clamp(region.x, 0, canvasWidth);
  var y = clamp(region.y, 0, canvasHeight);
  var right = clamp(region.x + region.width, 0, canvasWidth);
  var bottom = clamp(region.y + region.height, 0, canvasHeight);
  if (right <= x || bottom <= y) {
    return null;
  }
  var pixelX = round(x);
  var pixelY = round(y);
  var pixelRight = round(right);
  var pixelBottom = round(bottom);
  if (pixelRight <= pixelX || pixelBottom <= pixelY) {
    return null;
  }
  return { x: pixelX, y: pixelY, width: pixelRight - pixelX, height: pixelBottom - pixelY };
}

function redrawAttachedSceneRegion(canvas, region, skipShadowIds) {
  var target = requireCanvas(canvas);
  var scene = target.scene;
  if (scene === null) {
    fail("jayess:canvas expected a canvas rendered from an XML scene");
  }
  var dirty = clampRegionToCanvas(target, region);
  if (!validRegion(dirty)) {
    return target;
  }
  fillImageRectByAlpha(target.image, dirty.x, dirty.y, dirty.width, dirty.height, scene.background);
  drawSceneRegionWith(xmlSceneRenderer(skipShadowIds), target, scene, target.sceneOptions, dirty);
  return target;
}

function isPaintOnlyAttribute(name) {
  return name === "fill" ||
    name === "outline" ||
    name === "outline-opacity" ||
    name === "opacity" ||
    name === "font-color" ||
    name === "text-align" ||
    name === "text-align-x" ||
    name === "text-align-y";
}

function arePaintOnlyAttributes(attributes) {
  var names = keys(attributes);
  if (names.length === 0) {
    return false;
  }
  for (var index = 0; index < names.length; index = index + 1) {
    if (isPaintOnlyAttribute(names[index]) !== true) {
      return false;
    }
  }
  return true;
}

function skipShadowMap(id) {
  var values = {};
  values[id] = true;
  return values;
}

function shapeTextOptions(shape) {
  var options = {
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

function needsVerticalTextScrollbar(shape, measured, rect) {
  return shape.scrollbarWidth > 0 && (shape.overflowY === "scroll" || (shape.overflowY === "auto" && measured.height > rect.height));
}

function needsHorizontalTextScrollbar(shape, measured, rect) {
  return shape.scrollbarWidth > 0 && (shape.overflowX === "scroll" || (shape.overflowX === "auto" && measured.width > rect.width));
}

function textLayoutCacheKey(shape, rect) {
  var lineHeight = shape.lineHeight > 0 ? shape.lineHeight : 0;
  return shape.text + "|" +
    rect.width.toString() + "x" + rect.height.toString() + "|" +
    shape.fontFamily + "|" +
    shape.fontSize.toString() + "|" +
    lineHeight.toString() + "|" +
    shape.letterSpacing.toString() + "|" +
    shape.wordSpacing.toString() + "|" +
    shape.textTransform + "|" +
    shape.textOverflow;
}

function measureShapeTextBox(canvas, shape, rect, options) {
  var key = textLayoutCacheKey(shape, rect);
  if (shape.textLayoutCache !== null && shape.textLayoutCache.key === key) {
    return shape.textLayoutCache.measured;
  }
  var measured = measureTextBox(canvas, shape.text, rect, options);
  shape.textLayoutCache = {
    key: key,
    measured: measured
  };
  return measured;
}

function shapeFullTextRect(shape) {
  var padding = shape.padding;
  var width = shape.width - padding * 2;
  var height = shape.height - padding * 2;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    x: shape.x + padding,
    y: shape.y + padding,
    width: width,
    height: height
  };
}

function shapeTextMeasurement(canvas, shape) {
  var fullRect = shapeFullTextRect(shape);
  var rect = fullRect;
  if (rect === null || shape.text.length === 0) {
    return null;
  }
  var options = shapeTextOptions(shape);
  var measured = measureShapeTextBox(canvas, shape, rect, options);
  var vertical = needsVerticalTextScrollbar(shape, measured, rect);
  var horizontal = needsHorizontalTextScrollbar(shape, measured, rect);
  if (vertical || horizontal) {
    var width = fullRect.width;
    var height = fullRect.height;
    if (vertical) {
      width = width - shape.scrollbarWidth;
    }
    if (horizontal) {
      height = height - shape.scrollbarWidth;
    }
    if (width < 1) {
      width = 1;
    }
    if (height < 1) {
      height = 1;
    }
    rect = { x: fullRect.x, y: fullRect.y, width: width, height: height };
    measured = measureShapeTextBox(canvas, shape, rect, options);
    vertical = needsVerticalTextScrollbar(shape, measured, rect);
    horizontal = needsHorizontalTextScrollbar(shape, measured, rect);
  }
  return {
    fullRect: fullRect,
    rect: rect,
    measured: measured,
    vertical: vertical,
    horizontal: horizontal
  };
}

function maxScrollXFor(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return 0;
  }
  return maxValue(0, info.measured.width - info.rect.width);
}

function maxScrollYFor(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return 0;
  }
  return maxValue(0, info.measured.height - info.rect.height);
}

function isScrollableShape(canvas, shape) {
  if (shape === null || shape.text.length === 0 || shape.scrollbarWidth <= 0) {
    return false;
  }
  if (shape.overflowY === "scroll" || shape.overflowY === "auto") {
    if (maxScrollYFor(canvas, shape) > 0) {
      return true;
    }
  }
  if (shape.overflowX === "scroll" || shape.overflowX === "auto") {
    if (maxScrollXFor(canvas, shape) > 0) {
      return true;
    }
  }
  return false;
}

function topScrollableShapeAt(canvas, x, y) {
  var hits = hitShapes(canvas, x, y);
  for (var index = 0; index < hits.length; index = index + 1) {
    if (isScrollableShape(canvas, hits[index])) {
      return hits[index];
    }
  }
  return null;
}

function redrawShape(canvas, shape) {
  var renderer = xmlSceneRenderer();
  return redrawAttachedSceneRegion(canvas, shapeRenderBoundsWith(renderer, shape), null);
}

function redrawShapePaint(canvas, shape) {
  var renderer = xmlSceneRenderer();
  return redrawAttachedSceneRegion(canvas, shapePaintBoundsWith(renderer, shape), skipShadowMap(shape.id));
}

function redrawShapeScrollArea(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return redrawShapePaint(canvas, shape);
  }
  return redrawAttachedSceneRegion(canvas, info.fullRect, skipShadowMap(shape.id));
}

function setShapeScroll(canvas, shape, scrollX, scrollY) {
  var maxX = maxScrollXFor(canvas, shape);
  var maxY = maxScrollYFor(canvas, shape);
  var nextX = clamp(scrollX, 0, maxX);
  var nextY = clamp(scrollY, 0, maxY);
  if (nextX === shape.scrollOffsetX && nextY === shape.scrollOffsetY) {
    return false;
  }
  shape.scrollOffsetX = nextX;
  shape.scrollOffsetY = nextY;
  redrawShapeScrollArea(canvas, shape);
  return true;
}

function wheelDelta(value) {
  if (value === null) {
    return 0;
  }
  return value;
}

function scrollShapeByWheel(canvas, event) {
  var shape = topScrollableShapeAt(canvas, event.x, event.y);
  if (shape === null) {
    return false;
  }
  return setShapeScroll(
    canvas,
    shape,
    shape.scrollOffsetX + wheelDelta(event.deltaX) * 32,
    shape.scrollOffsetY + wheelDelta(event.deltaY) * 32
  );
}

function scrollbarThumbRect(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null || shape.scrollbarWidth <= 0 || info.vertical !== true || info.measured.height <= info.rect.height) {
    return null;
  }
  var thumbHeight = info.rect.height * info.rect.height / info.measured.height;
  if (thumbHeight < shape.scrollbarWidth) {
    thumbHeight = shape.scrollbarWidth;
  }
  var maxScrollY = info.measured.height - info.rect.height;
  var thumbY = info.rect.y;
  if (maxScrollY > 0 && info.rect.height > thumbHeight) {
    thumbY = info.rect.y + shape.scrollOffsetY * (info.rect.height - thumbHeight) / maxScrollY;
  }
  return {
    x: info.fullRect.x + info.fullRect.width - shape.scrollbarWidth,
    y: thumbY,
    width: shape.scrollbarWidth,
    height: thumbHeight,
    trackY: info.rect.y,
    trackHeight: info.rect.height,
    maxScrollY: maxScrollY
  };
}

function eventInsideRect(event, rect) {
  return event.x >= rect.x && event.y >= rect.y && event.x < rect.x + rect.width && event.y < rect.y + rect.height;
}

function beginScrollDrag(canvas, event) {
  var shape = topScrollableShapeAt(canvas, event.x, event.y);
  if (shape === null) {
    canvas.scrollDragState = null;
    return false;
  }
  var thumb = scrollbarThumbRect(canvas, shape);
  if (thumb === null || !eventInsideRect(event, thumb)) {
    canvas.scrollDragState = null;
    return false;
  }
  canvas.scrollDragState = {
    shape: shape,
    startY: event.y,
    startScrollY: shape.scrollOffsetY,
    trackHeight: thumb.trackHeight,
    thumbHeight: thumb.height,
    maxScrollY: thumb.maxScrollY
  };
  return true;
}

function updateScrollDrag(canvas, event) {
  var drag = canvas.scrollDragState;
  if (drag === null) {
    return false;
  }
  var movable = drag.trackHeight - drag.thumbHeight;
  if (movable <= 0 || drag.maxScrollY <= 0) {
    return false;
  }
  var delta = event.y - drag.startY;
  var nextY = drag.startScrollY + delta * drag.maxScrollY / movable;
  return setShapeScroll(canvas, drag.shape, drag.shape.scrollOffsetX, nextY);
}

export function findElement(canvas, id) {
  return getElementById(canvas, id);
}

export function setAttribute(canvas, id, name, value) {
  var target = requireCanvas(canvas);
  var shape = getElementById(target, id);
  if (shape === null) {
    updateElementAttribute(target, id, name, value);
  }
  var renderer = xmlSceneRenderer();
  var paintOnly = isPaintOnlyAttribute(name);
  var oldBounds = paintOnly ? shapePaintBoundsWith(renderer, shape) : shapeRenderBoundsWith(renderer, shape);
  var updated = updateElementAttribute(target, id, name, value);
  var newBounds = paintOnly ? shapePaintBoundsWith(renderer, updated) : shapeRenderBoundsWith(renderer, updated);
  return redrawAttachedSceneRegion(target, unionRegion(oldBounds, newBounds), null);
}

export function setAttributes(canvas, id, attributes) {
  var target = requireCanvas(canvas);
  var shape = getElementById(target, id);
  if (shape === null) {
    updateElementAttribute(target, id, "", null);
  }
  var renderer = xmlSceneRenderer();
  var paintOnly = arePaintOnlyAttributes(attributes);
  var oldBounds = paintOnly ? shapePaintBoundsWith(renderer, shape) : shapeRenderBoundsWith(renderer, shape);
  var names = keys(attributes);
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    updateElementAttribute(target, id, name, attributes[name]);
  }
  var updated = getElementById(target, id);
  var newBounds = paintOnly ? shapePaintBoundsWith(renderer, updated) : shapeRenderBoundsWith(renderer, updated);
  return redrawAttachedSceneRegion(target, unionRegion(oldBounds, newBounds), null);
}

export function hitElement(canvas, x, y) {
  return hitTest(canvas, x, y);
}

export function hitElements(canvas, x, y) {
  return hitTests(canvas, x, y);
}

export function addEventListener(canvas, name, callback) {
  return addCanvasEventListener(requireCanvas(canvas), name, callback);
}

export function dispatchEvent(canvas, event) {
  var target = requireCanvas(canvas);
  if (event.type === "wheel") {
    scrollShapeByWheel(target, event);
    return [];
  }
  if (event.type === "mouseDown") {
    beginScrollDrag(target, event);
    return [];
  }
  if (event.type === "mouseUp") {
    target.scrollDragState = null;
    return [];
  }
  if (event.type === "mouseMove" && target.scrollDragState !== null) {
    updateScrollDrag(target, event);
    return [];
  }
  return dispatchCanvasEvent(target, event);
}

export function packXml(path) {
  fail("jayess:canvas packXml() requires a static relative .xml path during transpilation");
}

export function packImage(data, format) {
  if (format === ".ppm") {
    return decodePpm(fromUtf8(data));
  }
  if (format === ".pgm") {
    return decodePgm(fromUtf8(data));
  }
  fail("jayess:canvas packImage() requires a static relative .ppm or .pgm path during transpilation");
}
