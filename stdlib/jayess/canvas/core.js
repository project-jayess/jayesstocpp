import { abs, round, sqrt } from "jayess:math";
import { rgb, rgba } from "jayess:color";
import { millis } from "jayess:time";
import {
  bitmapFontByName,
  defaultBitmapFont,
  glyphWidthForFontSize,
  glyphRowsForFontSize,
  glyphRowsForFont
} from "../font/glyphs.js";
import { chars as stringChars, slice as sliceString, toLower, toUpper } from "jayess:string";
import { fromArray } from "jayess:bytes";
import { keys } from "jayess:object";
import {
  copy as copyImage,
  copyRect as copyImageRect,
  create as createImage,
  decodeGif,
  decodeImage,
  decodeJpeg,
  decodePgm,
  decodePng,
  decodePpm,
  decodePsd,
  decodeWebp,
  drawLine as drawImageLine,
  fill as fillImage,
  fillCapsule as fillImageCapsule,
  fillEllipse as fillImageEllipse,
  fillRect as fillImageRect,
  fillRectAlpha as fillImageRectAlpha,
  getPixel as getImagePixel,
  height as imageHeight,
  isImage,
  loadImage as loadGenericImage,
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
  dispatchCanvasClickEvent,
  dispatchCanvasEvent,
  dispatchCanvasTargetEvent,
  emitCanvasCustomEvent,
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
  clampedScrollOffset,
  scrollbarThumbOffset,
  scrollbarThumbSize,
  wheelDelta,
  wheelScrollOffset
} from "./scroll-helpers.js";
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
  drawSceneFixedLayerWith,
  drawSceneScrollableLayerWith,
  drawSceneRegionWith,
  drawSceneWith,
  renderSceneWith,
  shapePaintBoundsWith,
  shapeRenderBoundsWith
} from "./xml-renderer.js";
import {
  parseScene,
  sceneBackground,
  sceneSize,
  sceneTitle
} from "./xml-scene.js";
export {
  parseScene,
  sceneBackground,
  sceneSize,
  sceneTitle
} from "./xml-scene.js";

function fail(message) {
  throw message;
}

function defaultRenderStats() {
  return {
    fullRedraws: 0,
    dirtyRegionRedraws: 0,
    copyRectScrolls: 0,
    cachePresents: 0
  };
}

function makeCanvas(image, title, clipStack, state, stateStack, scene, sceneOptions, hoveredElementId, canvasListeners, scrollDragState, textSelectionDragState, clickStartElementId, selectedTextShapeId, focusedTextInputShapeId, rootScrollCache, renderStats, requestedBackend, actualBackend) {
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
    textSelectionDragState: textSelectionDragState,
    clickStartElementId: clickStartElementId,
    selectedTextShapeId: selectedTextShapeId,
    focusedTextInputShapeId: focusedTextInputShapeId,
    rootScrollCache: rootScrollCache,
    renderStats: renderStats,
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
  return makeCanvas(createImage(width, height, background), title, defaultClipStack(), defaultState(), [], null, null, "", {}, null, null, "", "", "", null, defaultRenderStats(), requestedBackend, actualBackend);
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
  return makeCanvas(copyImage(source.image), source.title, copyClipStack(source.clipStack), copyDrawingState(source.state), copyDrawingStateStack(source.stateStack), source.scene, source.sceneOptions, source.hoveredElementId, source.canvasListeners, source.scrollDragState, source.textSelectionDragState, source.clickStartElementId, source.selectedTextShapeId, source.focusedTextInputShapeId, null, defaultRenderStats(), source.requestedBackend, source.actualBackend);
}

export function renderStats(canvas) {
  var stats = requireCanvas(canvas).renderStats;
  return {
    fullRedraws: stats.fullRedraws,
    dirtyRegionRedraws: stats.dirtyRegionRedraws,
    copyRectScrolls: stats.copyRectScrolls,
    cachePresents: stats.cachePresents
  };
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

function imageOpacityValue(opacity) {
  if (opacity < 0) {
    return 0;
  }
  if (opacity > 1) {
    return 1;
  }
  return opacity;
}

export function drawImageAlphaOpacity(canvas, image, x, y, opacity) {
  var resolvedOpacity = imageOpacityValue(opacity);
  if (resolvedOpacity <= 0) {
    return canvas;
  }
  if (resolvedOpacity >= 1) {
    return drawImageAlpha(canvas, image, x, y);
  }
  for (var row = 0; row < imageHeight(image); row = row + 1) {
    for (var column = 0; column < imageWidth(image); column = column + 1) {
      var color = getImagePixel(image, column, row);
      drawPixel(canvas, x + column, y + row, rgba(color.red, color.green, color.blue, color.alpha * resolvedOpacity));
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

function clipContainsRect(canvas, x, y, width, height) {
  var clip = currentClipRegion(canvas);
  return x >= clip.x &&
    y >= clip.y &&
    x + width <= clip.x + clip.width &&
    y + height <= clip.y + clip.height;
}

function fillEllipseBox(canvas, x, y, width, height, color) {
  var target = requireCanvas(canvas);
  var resolvedColor = fillColorValue(target, color);
  if (clipContainsRect(target, x, y, width, height)) {
    fillImageEllipse(target.image, x, y, width, height, resolvedColor);
    return target;
  }
  var rect = clippedRect(target, x, y, width, height, null);
  for (var row = rect.y; row < rect.y + rect.height; row = row + 1) {
    for (var column = rect.x; column < rect.x + rect.width; column = column + 1) {
      if (ellipsePixelInside(column, row, x, y, width, height)) {
        drawPixel(target, column, row, resolvedColor);
      }
    }
  }
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

function textSelectionRangeFrom(selection) {
  if (selection === null) {
    return null;
  }
  var start = round(selection.start);
  var end = round(selection.end);
  if (start < 0) {
    start = 0;
  }
  if (end < 0) {
    end = 0;
  }
  if (end < start) {
    var previousStart = start;
    start = end;
    end = previousStart;
  }
  if (start === end) {
    return null;
  }
  return {
    start: start,
    end: end
  };
}

function textSelectionRange(options) {
  return textSelectionRangeFrom(optionValue(options, "select", null));
}

function selectedTextColor(canvas, options) {
  var color = optionValue(options, "selectColor", null);
  if (color === null) {
    return rgba(96, 165, 250, 0.38);
  }
  return fillColorValue(canvas, color);
}

function drawTextSelectionRange(canvas, lineText, lineStart, x, y, metrics, options, selection, color, paddingValue, corners) {
  if (selection === null) {
    return canvas;
  }
  var lineEnd = lineStart + lineText.length;
  var start = maxValue(lineStart, selection.start);
  var end = minValue(lineEnd, selection.end);
  if (start >= end) {
    return canvas;
  }
  var prefix = sliceString(lineText, 0, start - lineStart);
  var selected = sliceString(lineText, start - lineStart, end - lineStart);
  var highlightX = x + measureText(canvas, prefix, options).width;
  var highlightWidth = measureText(canvas, selected, options).width;
  var drawWidth = round(highlightWidth);
  if (drawWidth <= 0) {
    drawWidth = 1;
  }
  var padding = round(paddingValue);
  var drawX = round(highlightX) - padding;
  var drawY = round(y) - padding;
  var drawHeight = round(metrics.lineHeight) + padding * 2;
  drawWidth = drawWidth + padding * 2;
  if (corners !== null) {
    for (var row = drawY; row < drawY + drawHeight; row = row + 1) {
      var span = roundedRectRowSpan(drawX, drawY, drawWidth, drawHeight, corners, row);
      fillRectAlpha(canvas, span.left, row, span.right - span.left, 1, color);
    }
  } else {
    fillRectAlpha(canvas, drawX, drawY, drawWidth, drawHeight, color);
  }
  return canvas;
}

function drawTextSelection(canvas, rect, lineText, lineStart, x, y, metrics, options) {
  var selection = textSelectionRange(options);
  var mouseSelection = textSelectionRangeFrom(optionValue(options, "mouseSelect", null));
  drawTextSelectionRange(canvas, lineText, lineStart, x, y, metrics, options, selection, selectedTextColor(canvas, options), optionValue(options, "selectPadding", 0), optionValue(options, "selectCorners", null));
  if (mouseSelection !== null) {
    var mouseOptions = {
      selectColor: optionValue(options, "mouseSelectColor", null)
    };
    drawTextSelectionRange(canvas, lineText, lineStart, x, y, metrics, options, mouseSelection, selectedTextColor(canvas, mouseOptions), optionValue(options, "mouseSelectPadding", 0), optionValue(options, "mouseSelectCorners", null));
  }
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
  if (optionValue(options, "textWrap", "wrap") === "nowrap") {
    var nowrapLines = [];
    var nowrapWidths = [];
    var start = 0;
    var nowrapCharacters = stringChars(textValue);
    for (var nowrapIndex = 0; nowrapIndex < nowrapCharacters.length; nowrapIndex = nowrapIndex + 1) {
      if (nowrapCharacters[nowrapIndex] === "\n") {
        var line = sliceString(textValue, start, nowrapIndex);
        pushLayoutLine(nowrapLines, nowrapWidths, line, target, options);
        start = nowrapIndex + 1;
      }
    }
    var lastLine = sliceString(textValue, start, textValue.length);
    pushLayoutLine(nowrapLines, nowrapWidths, lastLine, target, options);
    return { lines: nowrapLines, widths: nowrapWidths };
  }
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
  var lineStart = 0;
  for (var index = 0; index < lines.length; index = index + 1) {
    var lineText = lines[index];
    var lineWidth = layout.widths[index];
    var cursorX = alignedTextX(rect, lineWidth, horizontal) - scrollX;
    drawTextSelection(target, rect, lineText, lineStart, cursorX, cursorY, metrics, options);
    text(target, lineText, cursorX, cursorY, options);
    drawTextDecoration(target, rect, lineWidth, cursorX, cursorY, metrics, color, decoration);
    cursorY = cursorY + metrics.lineHeight;
    lineStart = lineStart + lineText.length;
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
  var target = requireCanvas(canvas);
  var resolvedColor = fillColorValue(target, color);
  if (clipContainsRect(target, x, y, size.width, size.height)) {
    fillImageCapsule(target.image, x, y, size.width, size.height, resolvedColor);
    return target;
  }
  var rect = clippedRect(target, x, y, size.width, size.height, null);
  for (var row = rect.y; row < rect.y + rect.height; row = row + 1) {
    for (var column = rect.x; column < rect.x + rect.width; column = column + 1) {
      if (capsulePixelInside(column, row, x, y, size.width, size.height)) {
        drawPixel(target, column, row, resolvedColor);
      }
    }
  }
  return target;
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
  return loadGenericImage(src);
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
    drawImageAlphaOpacity: drawImageAlphaOpacity,
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

function collectShapesById(shapes, byId) {
  for (var index = 0; index < shapes.length; index = index + 1) {
    var shape = shapes[index];
    if (shape.id !== null && shape.id.length > 0) {
      byId[shape.id] = shape;
    }
    if (shape.children !== null && shape.children.length > 0) {
      collectShapesById(shape.children, byId);
    }
  }
}

function shapeMapById(scene) {
  var byId = {};
  if (scene !== null) {
    collectShapesById(scene.shapes, byId);
  }
  return byId;
}

function copyRuntimeShapeState(previous, next) {
  next.text = previous.text;
  next.fill = previous.fill;
  next.outline = previous.outline;
  next.outlineThickness = previous.outlineThickness;
  next.outlineOpacity = previous.outlineOpacity;
  next.opacity = previous.opacity;
  next.visible = previous.visible;
  next.textSelection = previous.textSelection;
  next.textSelectionKind = previous.textSelectionKind;
  next.textSelectColor = previous.textSelectColor;
  next.textSelectPadding = previous.textSelectPadding;
  next.textSelectCorners = previous.textSelectCorners;
  next.mouseTextSelection = previous.mouseTextSelection;
  next.mouseSelectColor = previous.mouseSelectColor;
  next.mouseSelectPadding = previous.mouseSelectPadding;
  next.mouseSelectCorners = previous.mouseSelectCorners;
  next.textInputFocused = previous.textInputFocused;
  next.textCursorIndex = previous.textCursorIndex;
  next.textCursorVisible = previous.textCursorVisible;
  next.textCursorLastTick = previous.textCursorLastTick;
  next.textUndoStack = previous.textUndoStack;
  next.textRedoStack = previous.textRedoStack;
  next.textLastEditMillis = previous.textLastEditMillis;
  next.scrollOffsetX = previous.scrollOffsetX;
  next.scrollOffsetY = previous.scrollOffsetY;
}

function preserveRuntimeSceneState(previousScene, nextScene) {
  var previousById = shapeMapById(previousScene);
  var nextById = shapeMapById(nextScene);
  var ids = keys(nextById);
  for (var index = 0; index < ids.length; index = index + 1) {
    var id = ids[index];
    var previous = previousById[id];
    if (previous !== null) {
      copyRuntimeShapeState(previous, nextById[id]);
    }
  }
  if (previousScene !== null) {
    nextScene.scrollOffsetY = clampedScrollOffset(previousScene.scrollOffsetY, maxValue(0, nextScene.scrollHeight - nextScene.height));
  }
}

function sceneHasElementId(scene, id) {
  if (scene === null || id === null || id.length === 0) {
    return false;
  }
  return getElementById({ scene: scene }, id) !== null;
}

function keepExistingElementId(scene, id) {
  if (sceneHasElementId(scene, id)) {
    return id;
  }
  return "";
}

export function reflowScene(canvas, xmlText, options) {
  var target = requireCanvas(canvas);
  var nextScene = parseScene(xmlText, options);
  preserveRuntimeSceneState(target.scene, nextScene);
  target.image = createImage(nextScene.width, nextScene.height, nextScene.background);
  target.title = nextScene.title;
  target.scene = nextScene;
  target.sceneOptions = options;
  target.hoveredElementId = keepExistingElementId(nextScene, target.hoveredElementId);
  target.selectedTextShapeId = keepExistingElementId(nextScene, target.selectedTextShapeId);
  target.focusedTextInputShapeId = keepExistingElementId(nextScene, target.focusedTextInputShapeId);
  target.scrollDragState = null;
  target.textSelectionDragState = null;
  target.rootScrollCache = null;
  target.renderStats.fullRedraws = target.renderStats.fullRedraws + 1;
  drawSceneWith(xmlSceneRenderer(), target, nextScene, options);
  return target;
}

function redrawAttachedScene(canvas) {
  var target = requireCanvas(canvas);
  var scene = target.scene;
  if (scene === null) {
    fail("jayess:canvas expected a canvas rendered from an XML scene");
  }
  target.rootScrollCache = null;
  target.renderStats.fullRedraws = target.renderStats.fullRedraws + 1;
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

function paddedRegion(region, padding) {
  if (!validRegion(region)) {
    return region;
  }
  return {
    x: region.x - padding,
    y: region.y - padding,
    width: region.width + padding * 2,
    height: region.height + padding * 2
  };
}

function viewportRegionForShape(canvas, shape, region) {
  if (!validRegion(region)) {
    return region;
  }
  if (canvas.scene === null || shape.position === "fixed") {
    return region;
  }
  return {
    x: region.x,
    y: region.y - canvas.scene.scrollOffsetY,
    width: region.width,
    height: region.height
  };
}

function shapeRenderViewportBoundsWith(canvas, renderer, shape) {
  return viewportRegionForShape(canvas, shape, shapeRenderBoundsWith(renderer, shape));
}

function shapePaintViewportBoundsWith(canvas, renderer, shape) {
  return viewportRegionForShape(canvas, shape, shapePaintBoundsWith(renderer, shape));
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
  target.rootScrollCache = null;
  target.renderStats.dirtyRegionRedraws = target.renderStats.dirtyRegionRedraws + 1;
  var dirty = clampRegionToCanvas(target, paddedRegion(region, 2));
  if (!validRegion(dirty)) {
    return target;
  }
  fillImageRectByAlpha(target.image, dirty.x, dirty.y, dirty.width, dirty.height, scene.background);
  drawSceneRegionWith(xmlSceneRenderer(skipShadowIds), target, scene, target.sceneOptions, dirty);
  return target;
}

function rootScrollCacheKey(scene) {
  return scene.contentWidth.toString() + "x" + scene.scrollHeight.toString() + "|" +
    scene.width.toString() + "x" + scene.height.toString();
}

function rootScrollCacheReady(canvas, scene) {
  return canvas.rootScrollCache !== null && canvas.rootScrollCache.key === rootScrollCacheKey(scene);
}

function buildRootScrollCache(canvas, scene) {
  var backing = create(scene.contentWidth, scene.scrollHeight, {
    background: scene.background,
    backend: canvas.actualBackend
  });
  drawSceneScrollableLayerWith(xmlSceneRenderer(), backing, scene, canvas.sceneOptions);
  canvas.rootScrollCache = {
    key: rootScrollCacheKey(scene),
    image: backing.image
  };
  return canvas.rootScrollCache;
}

function rootScrollCacheFor(canvas, scene) {
  if (!rootScrollCacheReady(canvas, scene)) {
    return buildRootScrollCache(canvas, scene);
  }
  return canvas.rootScrollCache;
}

function presentRootScrollCache(canvas) {
  var target = requireCanvas(canvas);
  var scene = target.scene;
  if (scene === null) {
    fail("jayess:canvas expected a canvas rendered from an XML scene");
  }
  var cache = rootScrollCacheFor(target, scene);
  target.renderStats.cachePresents = target.renderStats.cachePresents + 1;
  clear(target, scene.background);
  transparentBlitClipped(target.image, cache.image, 0, 0 - scene.scrollOffsetY, 0, 0, scene.contentWidth, scene.height);
  drawSceneFixedLayerWith(xmlSceneRenderer(), target, scene, target.sceneOptions);
  return target;
}

function skipShadowMap(id) {
  var values = {};
  values[id] = true;
  return values;
}

function shapeTextOptions(shape) {
  var selectionColor = shape.textSelectionKind === "mouse" ? shape.mouseSelectColor : shape.textSelectColor;
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
    textWrap: shape.textWrap,
    select: shape.textSelection,
    selectColor: selectionColor,
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
    shape.textWrap + "|" +
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
  return redrawAttachedSceneRegion(canvas, shapeRenderViewportBoundsWith(canvas, renderer, shape), null);
}

function redrawShapePaint(canvas, shape) {
  var renderer = xmlSceneRenderer();
  return redrawAttachedSceneRegion(canvas, shapePaintViewportBoundsWith(canvas, renderer, shape), skipShadowMap(shape.id));
}

function redrawShapeScrollArea(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return redrawShapePaint(canvas, shape);
  }
  return redrawAttachedSceneRegion(canvas, viewportRegionForShape(canvas, shape, info.fullRect), skipShadowMap(shape.id));
}

function documentYForShape(canvas, shape, y) {
  if (canvas.scene === null || shape.position === "fixed") {
    return y;
  }
  return y + canvas.scene.scrollOffsetY;
}

function textIndexForLineX(canvas, shape, lineText, lineStart, lineX, x, options) {
  var localX = x - lineX;
  if (localX <= 0) {
    return lineStart;
  }
  var characters = stringChars(lineText);
  var previousWidth = 0;
  for (var index = 0; index < characters.length; index = index + 1) {
    var nextWidth = measureText(canvas, sliceString(lineText, 0, index + 1), options).width;
    var midpoint = previousWidth + (nextWidth - previousWidth) / 2;
    if (localX < midpoint) {
      return lineStart + index;
    }
    previousWidth = nextWidth;
  }
  return lineStart + lineText.length;
}

function lineStartIndexes(textValue, lines) {
  var starts = [];
  var searchStart = 0;
  for (var index = 0; index < lines.length; index = index + 1) {
    var line = lines[index];
    var found = -1;
    if (line.length === 0) {
      found = searchStart;
    } else {
      var limit = textValue.length - line.length;
      var cursor = searchStart;
      while (cursor <= limit && found < 0) {
        if (sliceString(textValue, cursor, cursor + line.length) === line) {
          found = cursor;
        }
        cursor = cursor + 1;
      }
    }
    if (found < 0) {
      found = searchStart;
    }
    starts.push(found);
    searchStart = found + line.length;
  }
  return starts;
}

function textIndexAtPoint(canvas, shape, x, y) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return 0;
  }
  var options = shapeTextOptions(shape);
  var layout = measureTextBox(canvas, shape.text, info.rect, options);
  var docY = documentYForShape(canvas, shape, y);
  var contentTop = alignedTextY(info.rect, layout.height, shape.textAlignY) - shape.scrollOffsetY;
  var starts = lineStartIndexes(shape.text, layout.lines);
  for (var index = 0; index < layout.lines.length; index = index + 1) {
    var lineText = layout.lines[index];
    var lineWidth = layout.widths[index];
    var lineTop = contentTop + index * layout.lineHeight;
    if (docY < lineTop + layout.lineHeight) {
      var lineX = alignedTextX(info.rect, lineWidth, shape.textAlignX) - shape.scrollOffsetX;
      return textIndexForLineX(canvas, shape, lineText, starts[index], lineX, x, options);
    }
  }
  return shape.text.length;
}

function selectableTextShapeAt(canvas, x, y) {
  var shapes = hitShapes(canvas, x, y);
  for (var index = 0; index < shapes.length; index = index + 1) {
    var shape = shapes[index];
    if (shape.mouseSelect === true && shape.text.length > 0) {
      return shape;
    }
  }
  return null;
}

function textSelectEvent(event, shape) {
  return {
    type: "textselect",
    targetId: shape.id,
    targetKind: shape.kind,
    x: event.x,
    y: event.y,
    sourceEvent: event
  };
}

function setMouseTextSelection(canvas, shape, anchor, focus) {
  var start = minValue(anchor, focus);
  var end = maxValue(anchor, focus);
  if (start === end) {
    shape.mouseTextSelection = null;
  } else {
    shape.mouseTextSelection = {
      start: start,
      end: end
    };
  }
  shape.textBitmapCache = null;
  canvas.selectedTextShapeId = shape.id;
  redrawShapeScrollArea(canvas, shape);
  return true;
}

function clearActiveMouseTextSelection(canvas) {
  if (canvas.selectedTextShapeId.length === 0) {
    return null;
  }
  var shape = getElementById(canvas, canvas.selectedTextShapeId);
  canvas.selectedTextShapeId = "";
  if (shape === null || shape.mouseTextSelection === null) {
    return null;
  }
  shape.mouseTextSelection = null;
  shape.textBitmapCache = null;
  redrawShapeScrollArea(canvas, shape);
  return shape;
}

function beginTextSelection(canvas, event) {
  var shape = selectableTextShapeAt(canvas, event.x, event.y);
  if (shape === null) {
    canvas.textSelectionDragState = null;
    return null;
  }
  var index = textIndexAtPoint(canvas, shape, event.x, event.y);
  canvas.textSelectionDragState = {
    shape: shape,
    anchor: index,
    focus: index
  };
  return textSelectEvent(event, shape);
}

function updateTextSelectionDrag(canvas, event) {
  var state = canvas.textSelectionDragState;
  if (state === null) {
    return null;
  }
  var nextFocus = textIndexAtPoint(canvas, state.shape, event.x, event.y);
  if (nextFocus === state.focus) {
    return null;
  }
  state.focus = nextFocus;
  if (canvas.selectedTextShapeId.length > 0 && canvas.selectedTextShapeId !== state.shape.id) {
    clearActiveMouseTextSelection(canvas);
  }
  setMouseTextSelection(canvas, state.shape, state.anchor, state.focus);
  return textSelectEvent(event, state.shape);
}

function textInputEvent(event, shape) {
  var x = event.x;
  var y = event.y;
  if (x === null) {
    x = 0;
  }
  if (y === null) {
    y = 0;
  }
  return {
    type: "textinput",
    targetId: shape.id,
    targetKind: shape.kind,
    x: x,
    y: y,
    sourceEvent: event
  };
}

function textFocusEvent(event, shape, type) {
  var x = event.x;
  var y = event.y;
  if (x === null) {
    x = 0;
  }
  if (y === null) {
    y = 0;
  }
  return {
    type: type,
    targetId: shape.id,
    targetKind: shape.kind,
    x: x,
    y: y,
    sourceEvent: event
  };
}

function topTextInputShapeAt(canvas, x, y) {
  var hits = hitShapes(canvas, x, y);
  for (var index = 0; index < hits.length; index = index + 1) {
    if (hits[index].textInput === true) {
      return hits[index];
    }
  }
  return null;
}

function clampTextCursorIndex(shape, index) {
  if (index < 0) {
    return 0;
  }
  if (index > shape.text.length) {
    return shape.text.length;
  }
  return index;
}

function clearFocusedTextInput(canvas, event) {
  if (canvas.focusedTextInputShapeId.length === 0) {
    return null;
  }
  var previous = getElementById(canvas, canvas.focusedTextInputShapeId);
  canvas.focusedTextInputShapeId = "";
  if (previous === null || previous.textInputFocused !== true) {
    return null;
  }
  previous.textInputFocused = false;
  previous.textCursorVisible = false;
  previous.textBitmapCache = null;
  redrawShapeScrollArea(canvas, previous);
  return textFocusEvent(event, previous, "blur");
}

function focusTextInput(canvas, shape, event) {
  if (shape === null || shape.textInput !== true) {
    return clearFocusedTextInput(canvas, event);
  }
  if (canvas.focusedTextInputShapeId.length > 0 && canvas.focusedTextInputShapeId !== shape.id) {
    var blurEvent = clearFocusedTextInput(canvas, event);
    if (blurEvent !== null) {
      emitCanvasCustomEvent(canvas, blurEvent);
    }
  }
  canvas.focusedTextInputShapeId = shape.id;
  shape.textInputFocused = true;
  shape.textCursorIndex = clampTextCursorIndex(shape, textIndexAtPoint(canvas, shape, event.x, event.y));
  shape.textCursorVisible = true;
  shape.textCursorLastTick = 0;
  shape.textBitmapCache = null;
  redrawShapeScrollArea(canvas, shape);
  return textFocusEvent(event, shape, "focus");
}

function focusedTextInputShape(canvas) {
  if (canvas.focusedTextInputShapeId.length === 0) {
    return null;
  }
  var shape = getElementById(canvas, canvas.focusedTextInputShapeId);
  if (shape === null || shape.textInput !== true || shape.textInputFocused !== true) {
    canvas.focusedTextInputShapeId = "";
    return null;
  }
  return shape;
}

function replaceTextRange(text, start, end, inserted) {
  return sliceString(text, 0, start) + inserted + sliceString(text, end, text.length);
}

function textSnapshot(shape) {
  return {
    text: shape.text,
    cursor: shape.textCursorIndex
  };
}

function restoreTextSnapshot(shape, snapshot) {
  shape.text = snapshot.text;
  shape.textCursorIndex = clampTextCursorIndex(shape, snapshot.cursor);
  shape.textCursorVisible = true;
  shape.textCursorLastTick = 0;
  shape.textLayoutCache = null;
  shape.textBitmapCache = null;
}

function pushTextUndoSnapshot(shape) {
  var now = millis();
  if (shape.textLastEditMillis <= 0 || now - shape.textLastEditMillis > 300) {
    shape.textUndoStack.push(textSnapshot(shape));
  }
  shape.textLastEditMillis = now;
  shape.textRedoStack = [];
}

function applyTextUndo(canvas, shape) {
  if (shape.textUndoStack.length === 0) {
    return false;
  }
  shape.textRedoStack.push(textSnapshot(shape));
  restoreTextSnapshot(shape, shape.textUndoStack.pop());
  shape.textLastEditMillis = 0;
  redrawShapeScrollArea(canvas, shape);
  return true;
}

function applyTextRedo(canvas, shape) {
  if (shape.textRedoStack.length === 0) {
    return false;
  }
  shape.textUndoStack.push(textSnapshot(shape));
  restoreTextSnapshot(shape, shape.textRedoStack.pop());
  shape.textLastEditMillis = 0;
  redrawShapeScrollArea(canvas, shape);
  return true;
}

function insertTextInputText(canvas, shape, text) {
  if (text.length === 0) {
    return false;
  }
  pushTextUndoSnapshot(shape);
  var index = clampTextCursorIndex(shape, shape.textCursorIndex);
  shape.text = replaceTextRange(shape.text, index, index, text);
  shape.textCursorIndex = index + text.length;
  shape.textCursorVisible = true;
  shape.textCursorLastTick = 0;
  shape.textLayoutCache = null;
  shape.textBitmapCache = null;
  redrawShapeScrollArea(canvas, shape);
  return true;
}

function eventModifier(event, name) {
  var names = keys(event);
  for (var index = 0; index < names.length; index = index + 1) {
    if (names[index] === name) {
      return event[name] === true;
    }
  }
  return false;
}

function isUndoKey(event) {
  return (eventModifier(event, "ctrlKey") || eventModifier(event, "controlKey") || eventModifier(event, "metaKey")) &&
    !eventModifier(event, "shiftKey") &&
    (event.key === "z" || event.key === "Z" || event.code === "KeyZ");
}

function isRedoKey(event) {
  return (eventModifier(event, "ctrlKey") || eventModifier(event, "controlKey") || eventModifier(event, "metaKey")) &&
    eventModifier(event, "shiftKey") &&
    (event.key === "z" || event.key === "Z" || event.code === "KeyZ");
}

function editFocusedTextInput(canvas, event) {
  var shape = focusedTextInputShape(canvas);
  if (shape === null) {
    return null;
  }
  if (event.type === "textInput") {
    if (eventModifier(event, "ctrlKey") || eventModifier(event, "controlKey") || eventModifier(event, "metaKey")) {
      return null;
    }
    if (insertTextInputText(canvas, shape, event.text)) {
      return textInputEvent(event, shape);
    }
    return null;
  }
  if (event.type !== "keyDown") {
    return null;
  }
  if (isUndoKey(event)) {
    if (applyTextUndo(canvas, shape)) {
      return textInputEvent(event, shape);
    }
    return null;
  }
  if (isRedoKey(event)) {
    if (applyTextRedo(canvas, shape)) {
      return textInputEvent(event, shape);
    }
    return null;
  }
  var key = event.key;
  var index = clampTextCursorIndex(shape, shape.textCursorIndex);
  if (key === "Backspace") {
    if (index <= 0) {
      return null;
    }
    pushTextUndoSnapshot(shape);
    shape.text = replaceTextRange(shape.text, index - 1, index, "");
    shape.textCursorIndex = index - 1;
  } else if (key === "Delete") {
    if (index >= shape.text.length) {
      return null;
    }
    pushTextUndoSnapshot(shape);
    shape.text = replaceTextRange(shape.text, index, index + 1, "");
  } else if (key === "ArrowLeft") {
    shape.textCursorIndex = clampTextCursorIndex(shape, index - 1);
  } else if (key === "ArrowRight") {
    shape.textCursorIndex = clampTextCursorIndex(shape, index + 1);
  } else if (key === "Home") {
    shape.textCursorIndex = 0;
  } else if (key === "End") {
    shape.textCursorIndex = shape.text.length;
  } else {
    return null;
  }
  shape.textCursorVisible = true;
  shape.textCursorLastTick = 0;
  shape.textLayoutCache = null;
  shape.textBitmapCache = null;
  redrawShapeScrollArea(canvas, shape);
  return textInputEvent(event, shape);
}

function cursorToggleInterval(shape) {
  if (shape.textCursorSpeed <= 0) {
    return 0;
  }
  return 500 / shape.textCursorSpeed;
}

export function tickTextCursor(canvas, nowMillis) {
  var target = requireCanvas(canvas);
  var shape = focusedTextInputShape(target);
  if (shape === null) {
    return false;
  }
  var interval = cursorToggleInterval(shape);
  if (interval <= 0) {
    if (shape.textCursorVisible !== true) {
      shape.textCursorVisible = true;
      redrawShapeScrollArea(target, shape);
      return true;
    }
    return false;
  }
  if (shape.textCursorLastTick <= 0) {
    shape.textCursorLastTick = nowMillis;
    shape.textCursorVisible = true;
    redrawShapeScrollArea(target, shape);
    return true;
  }
  if (nowMillis - shape.textCursorLastTick < interval) {
    return false;
  }
  shape.textCursorLastTick = nowMillis;
  shape.textCursorVisible = !shape.textCursorVisible;
  redrawShapeScrollArea(target, shape);
  return true;
}

function isLeftMouseEvent(event) {
  var names = keys(event);
  var hasButton = false;
  for (var index = 0; index < names.length; index = index + 1) {
    if (names[index] === "button") {
      hasButton = true;
    }
  }
  if (!hasButton || event.button === null) {
    return true;
  }
  return event.button === "left" || event.button === 0;
}

function redrawShapeScrollbarArea(canvas, shape, info) {
  var region = null;
  if (info.vertical) {
    region = unionRegion(region, {
      x: info.fullRect.x + info.fullRect.width - shape.scrollbarWidth,
      y: info.fullRect.y,
      width: shape.scrollbarWidth,
      height: info.fullRect.height
    });
  }
  if (info.horizontal) {
    region = unionRegion(region, {
      x: info.fullRect.x,
      y: info.fullRect.y + info.fullRect.height - shape.scrollbarWidth,
      width: info.fullRect.width,
      height: shape.scrollbarWidth
    });
  }
  if (!validRegion(region)) {
    return canvas;
  }
  return redrawAttachedSceneRegion(canvas, viewportRegionForShape(canvas, shape, region), skipShadowMap(shape.id));
}

function integerDelta(value) {
  var rounded = round(value);
  if (rounded !== value) {
    return null;
  }
  return rounded;
}

function redrawVerticalShapeScrollByCopy(canvas, shape, info, deltaY) {
  var amount = abs(deltaY);
  var rect = clampRegionToCanvas(canvas, viewportRegionForShape(canvas, shape, info.rect));
  if (!validRegion(rect) || amount <= 0 || amount >= rect.height) {
    return false;
  }
  if (deltaY > 0) {
    canvas.renderStats.copyRectScrolls = canvas.renderStats.copyRectScrolls + 1;
    copyImageRect(canvas.image, rect.x, rect.y + amount, rect.width, rect.height - amount, rect.x, rect.y);
    redrawAttachedSceneRegion(canvas, {
      x: rect.x,
      y: rect.y + rect.height - amount,
      width: rect.width,
      height: amount
    }, skipShadowMap(shape.id));
  } else {
    canvas.renderStats.copyRectScrolls = canvas.renderStats.copyRectScrolls + 1;
    copyImageRect(canvas.image, rect.x, rect.y, rect.width, rect.height - amount, rect.x, rect.y + amount);
    redrawAttachedSceneRegion(canvas, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: amount
    }, skipShadowMap(shape.id));
  }
  redrawShapeScrollbarArea(canvas, shape, info);
  return true;
}

function redrawHorizontalShapeScrollByCopy(canvas, shape, info, deltaX) {
  var amount = abs(deltaX);
  var rect = clampRegionToCanvas(canvas, viewportRegionForShape(canvas, shape, info.rect));
  if (!validRegion(rect) || amount <= 0 || amount >= rect.width) {
    return false;
  }
  if (deltaX > 0) {
    canvas.renderStats.copyRectScrolls = canvas.renderStats.copyRectScrolls + 1;
    copyImageRect(canvas.image, rect.x + amount, rect.y, rect.width - amount, rect.height, rect.x, rect.y);
    redrawAttachedSceneRegion(canvas, {
      x: rect.x + rect.width - amount,
      y: rect.y,
      width: amount,
      height: rect.height
    }, skipShadowMap(shape.id));
  } else {
    canvas.renderStats.copyRectScrolls = canvas.renderStats.copyRectScrolls + 1;
    copyImageRect(canvas.image, rect.x, rect.y, rect.width - amount, rect.height, rect.x + amount, rect.y);
    redrawAttachedSceneRegion(canvas, {
      x: rect.x,
      y: rect.y,
      width: amount,
      height: rect.height
    }, skipShadowMap(shape.id));
  }
  redrawShapeScrollbarArea(canvas, shape, info);
  return true;
}

function redrawShapeScrollAreaAfterOffsetChange(canvas, shape, oldX, oldY) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null) {
    return redrawShapePaint(canvas, shape);
  }
  var deltaX = integerDelta(shape.scrollOffsetX - oldX);
  var deltaY = integerDelta(shape.scrollOffsetY - oldY);
  if (deltaX === null || deltaY === null) {
    return redrawShapeScrollArea(canvas, shape);
  }
  if (deltaX !== 0 && deltaY !== 0) {
    return redrawShapeScrollArea(canvas, shape);
  }
  if (deltaY !== 0 && redrawVerticalShapeScrollByCopy(canvas, shape, info, deltaY)) {
    return canvas;
  }
  if (deltaX !== 0 && redrawHorizontalShapeScrollByCopy(canvas, shape, info, deltaX)) {
    return canvas;
  }
  return redrawShapeScrollArea(canvas, shape);
}

function setShapeScroll(canvas, shape, scrollX, scrollY) {
  var maxX = maxScrollXFor(canvas, shape);
  var maxY = maxScrollYFor(canvas, shape);
  var nextX = clampedScrollOffset(scrollX, maxX);
  var nextY = clampedScrollOffset(scrollY, maxY);
  if (nextX === shape.scrollOffsetX && nextY === shape.scrollOffsetY) {
    return false;
  }
  var oldX = shape.scrollOffsetX;
  var oldY = shape.scrollOffsetY;
  shape.scrollOffsetX = nextX;
  shape.scrollOffsetY = nextY;
  redrawShapeScrollAreaAfterOffsetChange(canvas, shape, oldX, oldY);
  return true;
}

function scrollShapeByWheel(canvas, event) {
  var shape = topScrollableShapeAt(canvas, event.x, event.y);
  if (shape === null) {
    return false;
  }
  return setShapeScroll(
    canvas,
    shape,
    wheelScrollOffset(shape.scrollOffsetX, event.deltaX, 32, maxScrollXFor(canvas, shape)),
    wheelScrollOffset(shape.scrollOffsetY, event.deltaY, 32, maxScrollYFor(canvas, shape))
  );
}

function maxSceneScrollY(canvas) {
  if (canvas.scene === null || canvas.scene.scrollbarWidth <= 0) {
    return 0;
  }
  if (canvas.scene.overflowY !== "scroll" && canvas.scene.overflowY !== "auto") {
    return 0;
  }
  return maxValue(0, canvas.scene.scrollHeight - canvas.scene.height);
}

function setSceneScrollY(canvas, scrollY) {
  var maxY = maxSceneScrollY(canvas);
  var nextY = clampedScrollOffset(scrollY, maxY);
  if (canvas.scene === null || nextY === canvas.scene.scrollOffsetY) {
    return false;
  }
  canvas.scene.scrollOffsetY = nextY;
  presentRootScrollCache(canvas);
  return true;
}

function scrollSceneByWheel(canvas, event) {
  if (canvas.scene === null) {
    return false;
  }
  return setSceneScrollY(canvas, wheelScrollOffset(canvas.scene.scrollOffsetY, event.deltaY, 48, maxSceneScrollY(canvas)));
}

function shapeScrollbarInfo(canvas, shape) {
  var info = shapeTextMeasurement(canvas, shape);
  if (info === null || shape.scrollbarWidth <= 0 || info.vertical !== true || info.measured.height <= info.rect.height) {
    return null;
  }
  var thumbHeight = scrollbarThumbSize(info.rect.height, info.measured.height, shape.scrollbarWidth);
  var maxScrollY = info.measured.height - info.rect.height;
  var thumbY = info.rect.y + scrollbarThumbOffset(shape.scrollOffsetY, maxScrollY, info.rect.height, thumbHeight);
  var thumb = viewportRegionForShape(canvas, shape, {
    x: info.fullRect.x + info.fullRect.width - shape.scrollbarWidth,
    y: thumbY,
    width: shape.scrollbarWidth,
    height: thumbHeight
  });
  var track = viewportRegionForShape(canvas, shape, {
    x: info.fullRect.x + info.fullRect.width - shape.scrollbarWidth,
    y: info.rect.y,
    width: shape.scrollbarWidth,
    height: info.rect.height
  });
  return {
    thumb: thumb,
    track: track,
    trackY: info.rect.y,
    trackHeight: info.rect.height,
    viewportTrackY: track.y,
    maxScrollY: maxScrollY
  };
}

function eventInsideRect(event, rect) {
  return event.x >= rect.x && event.y >= rect.y && event.x < rect.x + rect.width && event.y < rect.y + rect.height;
}

function scrollInteractionResult(handled, changed) {
  return {
    handled: handled,
    changed: changed
  };
}

function canvasScrollEvent(event) {
  return {
    type: "scroll",
    targetId: "",
    targetKind: "",
    x: event.x,
    y: event.y,
    sourceEvent: event
  };
}

function scrollForTrackPoint(y, trackY, trackHeight, thumbHeight, maxScrollY) {
  var movable = trackHeight - thumbHeight;
  if (movable <= 0 || maxScrollY <= 0) {
    return 0;
  }
  return (y - trackY - thumbHeight / 2) * maxScrollY / movable;
}

function sceneScrollbarInfo(canvas) {
  var scene = canvas.scene;
  var maxScrollY = maxSceneScrollY(canvas);
  if (scene === null || scene.scrollbarWidth <= 0 || maxScrollY <= 0) {
    return null;
  }
  var thumbHeight = scrollbarThumbSize(scene.height, scene.scrollHeight, scene.scrollbarWidth);
  var thumbY = scrollbarThumbOffset(scene.scrollOffsetY, maxScrollY, scene.height, thumbHeight);
  return {
    thumb: {
      x: scene.contentWidth,
      y: thumbY,
      width: scene.scrollbarWidth,
      height: thumbHeight
    },
    track: {
      x: scene.contentWidth,
      y: 0,
      width: scene.scrollbarWidth,
      height: scene.height
    },
    trackY: 0,
    trackHeight: scene.height,
    maxScrollY: maxScrollY
  };
}

function beginSceneScrollDrag(canvas, event) {
  var info = sceneScrollbarInfo(canvas);
  if (info === null || !eventInsideRect(event, info.track)) {
    return scrollInteractionResult(false, false);
  }
  var changed = false;
  if (!eventInsideRect(event, info.thumb)) {
    changed = setSceneScrollY(canvas, scrollForTrackPoint(event.y, info.track.y, info.trackHeight, info.thumb.height, info.maxScrollY));
    info = sceneScrollbarInfo(canvas);
    if (info === null) {
      canvas.scrollDragState = null;
      return scrollInteractionResult(true, changed);
    }
  }
  if (eventInsideRect(event, info.thumb)) {
    canvas.scrollDragState = {
      kind: "scene",
      startY: event.y,
      startScrollY: canvas.scene.scrollOffsetY,
      trackHeight: info.trackHeight,
      thumbHeight: info.thumb.height,
      maxScrollY: info.maxScrollY
    };
  }
  return scrollInteractionResult(true, changed);
}

function beginScrollDrag(canvas, event) {
  var shape = topScrollableShapeAt(canvas, event.x, event.y);
  if (shape === null) {
    return beginSceneScrollDrag(canvas, event);
  }
  var info = shapeScrollbarInfo(canvas, shape);
  if (info === null || !eventInsideRect(event, info.track)) {
    return beginSceneScrollDrag(canvas, event);
  }
  var changed = false;
  if (!eventInsideRect(event, info.thumb)) {
    changed = setShapeScroll(canvas, shape, shape.scrollOffsetX, scrollForTrackPoint(event.y, info.track.y, info.trackHeight, info.thumb.height, info.maxScrollY));
    info = shapeScrollbarInfo(canvas, shape);
    if (info === null) {
      canvas.scrollDragState = null;
      return scrollInteractionResult(true, changed);
    }
  }
  if (!eventInsideRect(event, info.thumb)) {
    canvas.scrollDragState = null;
    return scrollInteractionResult(true, changed);
  }
  canvas.scrollDragState = {
    kind: "shape",
    shape: shape,
    startY: event.y,
    startScrollY: shape.scrollOffsetY,
    trackHeight: info.trackHeight,
    thumbHeight: info.thumb.height,
    maxScrollY: info.maxScrollY
  };
  return scrollInteractionResult(true, changed);
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
  if (drag.kind === "scene") {
    return setSceneScrollY(canvas, nextY);
  }
  return setShapeScroll(canvas, drag.shape, drag.shape.scrollOffsetX, nextY);
}

function mixChannel(value, target, amount) {
  return round(value + (target - value) * amount);
}

function buttonEventFill(shape, amount) {
  var base = shape.baseFill;
  if (base === null) {
    base = shape.fill;
  }
  if (base === null) {
    return null;
  }
  var target = shape.colorEventMode === "lighter" ? 255 : 0;
  return rgba(
    mixChannel(base.red, target, amount),
    mixChannel(base.green, target, amount),
    mixChannel(base.blue, target, amount),
    base.alpha
  );
}

function buttonStateFill(shape, state) {
  if (state === "normal") {
    return shape.baseFill;
  }
  if (state === "pressed") {
    return buttonEventFill(shape, 0.18);
  }
  if (state === "hover") {
    return buttonEventFill(shape, 0.12);
  }
  return shape.baseFill;
}

function setButtonState(canvas, shape, state) {
  if (shape === null || shape.kind !== "button") {
    return false;
  }
  var nextFill = buttonStateFill(shape, state);
  if (nextFill === null) {
    return false;
  }
  if (shape.fill !== null &&
      shape.fill.red === nextFill.red &&
      shape.fill.green === nextFill.green &&
      shape.fill.blue === nextFill.blue &&
      shape.fill.alpha === nextFill.alpha) {
    return false;
  }
  shape.fill = nextFill;
  redrawAttachedSceneRegion(canvas, shapeRenderViewportBoundsWith(canvas, xmlSceneRenderer(), shape), null);
  return true;
}

function applyButtonHoverTransition(canvas, event) {
  var changed = false;
  var nextHit = hitTest(canvas, event.x, event.y);
  var nextId = nextHit === null ? "" : nextHit.id;
  var previousId = canvas.hoveredElementId;
  if (previousId === null) {
    previousId = "";
  }
  if (previousId.length > 0 && previousId !== nextId) {
    if (setButtonState(canvas, getElementById(canvas, previousId), "normal")) {
      changed = true;
    }
  }
  if (nextHit !== null && previousId !== nextId) {
    if (setButtonState(canvas, getElementById(canvas, nextHit.id), "hover")) {
      changed = true;
    }
  }
  return changed;
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
  var oldBounds = shapeRenderViewportBoundsWith(target, renderer, shape);
  var updated = updateElementAttribute(target, id, name, value);
  var newBounds = shapeRenderViewportBoundsWith(target, renderer, updated);
  return redrawAttachedSceneRegion(target, unionRegion(oldBounds, newBounds), null);
}

export function setAttributes(canvas, id, attributes) {
  var target = requireCanvas(canvas);
  var shape = getElementById(target, id);
  if (shape === null) {
    updateElementAttribute(target, id, "", null);
  }
  var renderer = xmlSceneRenderer();
  var oldBounds = shapeRenderViewportBoundsWith(target, renderer, shape);
  var names = keys(attributes);
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    updateElementAttribute(target, id, name, attributes[name]);
  }
  var updated = getElementById(target, id);
  var newBounds = shapeRenderViewportBoundsWith(target, renderer, updated);
  return redrawAttachedSceneRegion(target, unionRegion(oldBounds, newBounds), null);
}

export function selectedText(canvas) {
  var target = requireCanvas(canvas);
  if (target.selectedTextShapeId.length === 0) {
    return "";
  }
  var shape = getElementById(target, target.selectedTextShapeId);
  if (shape === null || shape.mouseTextSelection === null) {
    return "";
  }
  var start = round(shape.mouseTextSelection.start);
  var end = round(shape.mouseTextSelection.end);
  if (end < start) {
    var previousStart = start;
    start = end;
    end = previousStart;
  }
  if (start < 0) {
    start = 0;
  }
  if (end > shape.text.length) {
    end = shape.text.length;
  }
  if (start >= end) {
    return "";
  }
  return sliceString(shape.text, start, end);
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
    if (!scrollShapeByWheel(target, event)) {
      scrollSceneByWheel(target, event);
    }
    return [];
  }
  if (event.type === "mouseDown") {
    var scrollStart = beginScrollDrag(target, event);
    if (scrollStart.handled) {
      target.clickStartElementId = "";
      if (scrollStart.changed) {
        return [canvasScrollEvent(event)];
      }
      return [];
    }
    if (isLeftMouseEvent(event)) {
      var inputShape = topTextInputShapeAt(target, event.x, event.y);
      if (inputShape !== null) {
        target.clickStartElementId = "";
        var inputEvents = [];
        var focusEvent = focusTextInput(target, inputShape, event);
        if (focusEvent !== null) {
          emitCanvasCustomEvent(target, focusEvent);
          inputEvents.push(focusEvent);
        }
        var inputSelectionStart = beginTextSelection(target, event);
        if (inputSelectionStart !== null) {
          inputEvents.push(inputSelectionStart);
        }
        return inputEvents;
      }
      var clearedInput = clearFocusedTextInput(target, event);
      if (clearedInput !== null) {
        target.clickStartElementId = "";
        clearActiveMouseTextSelection(target);
        emitCanvasCustomEvent(target, clearedInput);
        return [clearedInput];
      }
    }
    var selectionStart = beginTextSelection(target, event);
    if (selectionStart !== null) {
      target.clickStartElementId = "";
      return [selectionStart];
    }
    if (isLeftMouseEvent(event)) {
      var clearedSelection = clearActiveMouseTextSelection(target);
      if (clearedSelection !== null) {
        target.clickStartElementId = "";
        return [textSelectEvent(event, clearedSelection)];
      }
    }
    var downHit = hitTest(target, event.x, event.y);
    target.clickStartElementId = downHit === null ? "" : downHit.id;
    if (downHit !== null) {
      setButtonState(target, getElementById(target, downHit.id), "pressed");
    }
    return dispatchCanvasTargetEvent(target, event, downHit, "mouseDown");
  }
  if (event.type === "mouseUp") {
    if (target.textSelectionDragState !== null) {
      var selectionEnd = updateTextSelectionDrag(target, event);
      var selectedShape = target.textSelectionDragState.shape;
      target.textSelectionDragState = null;
      target.clickStartElementId = "";
      if (selectionEnd !== null) {
        return [selectionEnd];
      }
      return [textSelectEvent(event, selectedShape)];
    }
    if (target.scrollDragState !== null) {
      target.scrollDragState = null;
      target.clickStartElementId = "";
      return [];
    }
    var upHit = hitTest(target, event.x, event.y);
    var startId = target.clickStartElementId;
    target.clickStartElementId = "";
    var releaseHit = upHit;
    if (startId.length > 0 && (upHit === null || upHit.id !== startId)) {
      var startShape = getElementById(target, startId);
      if (startShape !== null) {
        releaseHit = {
          id: startShape.id,
          kind: startShape.kind,
          x: event.x,
          y: event.y
        };
      }
    }
    if (releaseHit !== null) {
      var releaseState = upHit !== null && releaseHit.id === upHit.id ? "hover" : "normal";
      setButtonState(target, getElementById(target, releaseHit.id), releaseState);
    }
    var emitted = dispatchCanvasTargetEvent(target, event, releaseHit, "mouseUp");
    if (upHit !== null && startId === upHit.id) {
      var clickEvents = dispatchCanvasClickEvent(target, event, upHit);
      for (var index = 0; index < clickEvents.length; index = index + 1) {
        emitted.push(clickEvents[index]);
      }
    }
    return emitted;
  }
  if (event.type === "mouseMove" && target.scrollDragState !== null) {
    if (updateScrollDrag(target, event)) {
      return [canvasScrollEvent(event)];
    }
    return [];
  }
  if (event.type === "mouseMove" && target.textSelectionDragState !== null) {
    var selectionMove = updateTextSelectionDrag(target, event);
    if (selectionMove !== null) {
      return [selectionMove];
    }
    return [];
  }
  if (event.type === "mouseMove") {
    var buttonChanged = applyButtonHoverTransition(target, event);
    var emitted = dispatchCanvasEvent(target, event);
    if (buttonChanged && emitted.length === 0) {
      emitted.push({
        type: "statechange",
        targetId: "",
        targetKind: "",
        x: event.x,
        y: event.y,
        sourceEvent: event
      });
    }
    return emitted;
  }
  if (event.type === "keyDown" || event.type === "textInput") {
    var editedInput = editFocusedTextInput(target, event);
    if (editedInput !== null) {
      emitCanvasCustomEvent(target, editedInput);
      return [editedInput];
    }
    return [];
  }
  return dispatchCanvasEvent(target, event);
}

export function packXml(path) {
  fail("jayess:canvas packXml() requires a static relative .xml path during transpilation");
}

export function packImage(data, format) {
  var bytes = fromArray(data);
  if (format === ".ppm") {
    return decodePpm(bytes);
  }
  if (format === ".pgm") {
    return decodePgm(bytes);
  }
  if (format === ".png") {
    return decodePng(bytes);
  }
  if (format === ".jpeg" || format === ".jpg") {
    return decodeJpeg(bytes);
  }
  if (format === ".bmp") {
    return decodeImage(bytes);
  }
  if (format === ".psd") {
    return decodePsd(bytes);
  }
  if (format === ".gif") {
    return decodeGif(bytes);
  }
  if (format === ".webp") {
    return decodeWebp(bytes);
  }
  fail("jayess:canvas packImage() requires a static relative .ppm, .pgm, .bmp, .png, .jpeg, .jpg, .psd, .gif, or .webp path during transpilation");
}
