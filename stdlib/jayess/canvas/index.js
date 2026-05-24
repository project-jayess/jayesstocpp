import { abs, round } from "jayess:math";
import { rgb, rgba } from "jayess:color";
import {
  copy as copyImage,
  create as createImage,
  fill as fillImage,
  getPixel as getImagePixel,
  height as imageHeight,
  savePpm as saveImagePpm,
  setPixel,
  width as imageWidth
} from "jayess:image";

function fail(message) {
  throw message;
}

function makeCanvas(image, title) {
  return {
    image: image,
    title: title
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

function sign(value) {
  if (value < 0) {
    return -1;
  }
  if (value > 0) {
    return 1;
  }
  return 0;
}

function drawPixel(canvas, x, y, color) {
  var image = requireCanvas(canvas).image;
  if (x < 0 || y < 0 || x >= imageWidth(image) || y >= imageHeight(image)) {
    return canvas;
  }
  setPixel(image, x, y, color);
  return canvas;
}

function clamp(value, low, high) {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

function minValue(left, right) {
  if (left < right) {
    return left;
  }
  return right;
}

function maxValue(left, right) {
  if (left > right) {
    return left;
  }
  return right;
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

function drawPixelClipped(canvas, x, y, color, clip) {
  var region = normalizeClip(canvas, clip);
  if (x < region.x || y < region.y || x >= region.x + region.width || y >= region.y + region.height) {
    return canvas;
  }
  return drawPixel(canvas, x, y, color);
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

export function create(width, height, options) {
  var background = optionValue(options, "background", defaultBackground());
  var title = optionValue(options, "title", "");
  return makeCanvas(createImage(width, height, background), title);
}

export function clear(canvas, color) {
  fillImage(requireCanvas(canvas).image, color);
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
  return makeCanvas(copyImage(source.image), source.title);
}

export function fillRect(canvas, x, y, width, height, color) {
  for (var row = y; row < y + height; row = row + 1) {
    for (var column = x; column < x + width; column = column + 1) {
      drawPixel(canvas, column, row, color);
    }
  }
  return canvas;
}

export function clipRect(canvas, x, y, width, height) {
  return normalizeClip(canvas, { x: x, y: y, width: width, height: height });
}

export function fillRectClipped(canvas, x, y, width, height, color, clip) {
  var region = normalizeClip(canvas, clip);
  for (var row = y; row < y + height; row = row + 1) {
    for (var column = x; column < x + width; column = column + 1) {
      if (column >= region.x && row >= region.y && column < region.x + region.width && row < region.y + region.height) {
        drawPixel(canvas, column, row, color);
      }
    }
  }
  return canvas;
}

export function fillRectAlpha(canvas, x, y, rectWidth, rectHeight, color) {
  for (var row = y; row < y + rectHeight; row = row + 1) {
    for (var column = x; column < x + rectWidth; column = column + 1) {
      if (column >= 0 && row >= 0 && column < width(canvas) && row < height(canvas)) {
        drawPixel(canvas, column, row, blendColor(getPixel(canvas, column, row), color));
      }
    }
  }
  return canvas;
}

export function strokeRect(canvas, x, y, width, height, color) {
  if (width <= 0 || height <= 0) {
    return canvas;
  }

  for (var column = x; column < x + width; column = column + 1) {
    drawPixel(canvas, column, y, color);
    drawPixel(canvas, column, y + height - 1, color);
  }
  for (var row = y + 1; row < y + height - 1; row = row + 1) {
    drawPixel(canvas, x, row, color);
    drawPixel(canvas, x + width - 1, row, color);
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
  for (var row = 0; row < imageHeight(image); row = row + 1) {
    for (var column = 0; column < imageWidth(image); column = column + 1) {
      drawPixelClipped(canvas, x + column, y + row, getImagePixel(image, column, row), clip);
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

  for (var row = centerY - checkedRadius; row <= centerY + checkedRadius; row = row + 1) {
    for (var column = centerX - checkedRadius; column <= centerX + checkedRadius; column = column + 1) {
      var dx = column - centerX;
      var dy = row - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        drawPixel(canvas, column, row, color);
      }
    }
  }

  return canvas;
}

export function strokeCircle(canvas, centerX, centerY, radius, color) {
  var checkedRadius = requireRadius(radius);
  if (checkedRadius === 0) {
    drawPixel(canvas, centerX, centerY, color);
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
        drawPixel(canvas, column, row, color);
      }
    }
  }

  return canvas;
}

export function fillEllipse(canvas, centerX, centerY, radiusX, radiusY, color) {
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  if (checkedX === 0 && checkedY === 0) {
    drawPixel(canvas, centerX, centerY, color);
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
        drawPixel(canvas, column, row, color);
      }
    }
  }
  return canvas;
}

export function strokeEllipse(canvas, centerX, centerY, radiusX, radiusY, color) {
  var checkedX = requireEllipseRadius(radiusX);
  var checkedY = requireEllipseRadius(radiusY);
  if (checkedX === 0 || checkedY === 0) {
    return line(canvas, centerX - checkedX, centerY - checkedY, centerX + checkedX, centerY + checkedY, color);
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
        drawPixel(canvas, column, row, color);
      }
    }
  }
  return canvas;
}

export function line(canvas, x1, y1, x2, y2, color) {
  var dx = abs(x2 - x1);
  var dy = abs(y2 - y1);
  var sx = sign(x2 - x1);
  var sy = sign(y2 - y1);
  var error = dx - dy;
  var x = x1;
  var y = y1;

  while (true) {
    drawPixel(canvas, x, y, color);
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

export function polyline(canvas, points, color) {
  if (points.length === 0) {
    return canvas;
  }

  for (var index = 0; index < points.length - 1; index = index + 1) {
    var start = requirePoint(points[index]);
    var end = requirePoint(points[index + 1]);
    line(canvas, start.x, start.y, end.x, end.y, color);
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
    line(canvas, round(previousX), round(previousY), currentX, currentY, color);
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
    line(canvas, round(previousX), round(previousY), currentX, currentY, color);
    previousX = currentX;
    previousY = currentY;
  }
  return canvas;
}

export function measureText(canvas, textValue, options) {
  var charWidth = optionValue(options, "charWidth", 5);
  var charHeight = optionValue(options, "charHeight", 7);
  var spacing = optionValue(options, "spacing", 1);
  var lineSpacing = optionValue(options, "lineSpacing", 1);
  var maxWidth = 0;
  var currentWidth = 0;
  var lines = 1;
  for (var index = 0; index < textValue.length; index = index + 1) {
    if (textValue[index] === "\n") {
      maxWidth = maxValue(maxWidth, currentWidth);
      currentWidth = 0;
      lines = lines + 1;
    } else {
      if (currentWidth > 0) {
        currentWidth = currentWidth + spacing;
      }
      currentWidth = currentWidth + charWidth;
    }
  }
  maxWidth = maxValue(maxWidth, currentWidth);
  return {
    width: maxWidth,
    height: charHeight * lines + lineSpacing * (lines - 1)
  };
}

function drawBlockGlyph(canvas, x, y, charWidth, charHeight, color) {
  for (var row = 0; row < charHeight; row = row + 1) {
    for (var column = 0; column < charWidth; column = column + 1) {
      if (row === 0 || row === charHeight - 1 || column === 0 || column === charWidth - 1) {
        drawPixel(canvas, x + column, y + row, color);
      }
    }
  }
}

export function text(canvas, textValue, x, y, options) {
  var charWidth = optionValue(options, "charWidth", 5);
  var charHeight = optionValue(options, "charHeight", 7);
  var spacing = optionValue(options, "spacing", 1);
  var lineSpacing = optionValue(options, "lineSpacing", 1);
  var color = optionValue(options, "color", defaultTextColor());
  var cursorX = x;
  var cursorY = y;
  for (var index = 0; index < textValue.length; index = index + 1) {
    var char = textValue[index];
    if (char === "\n") {
      cursorX = x;
      cursorY = cursorY + charHeight + lineSpacing;
    } else {
      if (char !== " ") {
        drawBlockGlyph(canvas, cursorX, cursorY, charWidth, charHeight, color);
      }
      cursorX = cursorX + charWidth + spacing;
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
  var current = "";
  if (maxColumns < 1) {
    maxColumns = 1;
  }
  for (var index = 0; index < textValue.length; index = index + 1) {
    var char = textValue[index];
    if (char === "\n") {
      lines.push(current);
      current = "";
    } else {
      if (current.length >= maxColumns) {
        lines.push(current);
        current = "";
      }
      current = current + char;
    }
  }
  lines.push(current);
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
  var charWidth = optionValue(options, "charWidth", 5);
  var charHeight = optionValue(options, "charHeight", 7);
  var spacing = optionValue(options, "spacing", 1);
  var lineSpacing = optionValue(options, "lineSpacing", 1);
  var horizontal = optionValue(options, "horizontal", "left");
  var vertical = optionValue(options, "vertical", "top");
  var columns = round((rect.width + spacing) / (charWidth + spacing));
  var lines = wrappedTextLines(textValue, columns);
  var contentHeight = lines.length * charHeight + (lines.length - 1) * lineSpacing;
  var cursorY = alignedTextY(rect, contentHeight, vertical);
  for (var index = 0; index < lines.length; index = index + 1) {
    var lineText = lines[index];
    var lineSize = measureText(target, lineText, options);
    var cursorX = alignedTextX(rect, lineSize.width, horizontal);
    text(target, lineText, cursorX, cursorY, options);
    cursorY = cursorY + charHeight + lineSpacing;
  }
  return target;
}

function polygonBounds(points) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: -1, maxY: -1 };
  }
  var first = requirePoint(points[0]);
  var minX = first.x;
  var maxX = first.x;
  var minY = first.y;
  var maxY = first.y;
  for (var index = 1; index < points.length; index = index + 1) {
    var point = requirePoint(points[index]);
    minX = minValue(minX, point.x);
    maxX = maxValue(maxX, point.x);
    minY = minValue(minY, point.y);
    maxY = maxValue(maxY, point.y);
  }
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}

function pointInsidePolygon(x, y, points) {
  var inside = false;
  var previous = points.length - 1;
  for (var index = 0; index < points.length; index = index + 1) {
    var currentPoint = requirePoint(points[index]);
    var previousPoint = requirePoint(points[previous]);
    var crosses = (currentPoint.y > y) !== (previousPoint.y > y);
    if (crosses) {
      var atX = (previousPoint.x - currentPoint.x) * (y - currentPoint.y) / (previousPoint.y - currentPoint.y) + currentPoint.x;
      if (x < atX) {
        inside = !inside;
      }
    }
    previous = index;
  }
  return inside;
}

export function fillPolygon(canvas, points, color) {
  if (points.length < 3) {
    return canvas;
  }
  var bounds = polygonBounds(points);
  for (var row = bounds.minY; row <= bounds.maxY; row = row + 1) {
    for (var column = bounds.minX; column <= bounds.maxX; column = column + 1) {
      if (pointInsidePolygon(column + 0.5, row + 0.5, points)) {
        drawPixel(canvas, column, row, color);
      }
    }
  }
  return canvas;
}

export function strokePolygon(canvas, points, color) {
  if (points.length === 0) {
    return canvas;
  }
  polyline(canvas, points, color);
  if (points.length > 2) {
    var first = requirePoint(points[0]);
    var last = requirePoint(points[points.length - 1]);
    line(canvas, last.x, last.y, first.x, first.y, color);
  }
  return canvas;
}

export function savePpm(canvas, path) {
  return saveImagePpm(requireCanvas(canvas).image, path);
}

export function saveImage(canvas, path) {
  return savePpm(canvas, path);
}
