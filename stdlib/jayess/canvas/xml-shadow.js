import { rgba } from "jayess:color";
import { round } from "jayess:math";

function maskBackground() {
  return rgba(0, 0, 0, 0);
}

function maskColor() {
  return rgba(0, 0, 0, 1);
}

function strokeOptions(shape) {
  return { strokeWidth: shape.outlineThickness };
}

function cornerValue(shape, name) {
  if (shape.corners === null) {
    return 0;
  }
  return shape.corners[name];
}

function textOptions(shape, color) {
  return {
    color: color,
    fontFamily: shape.fontFamily,
    fontSize: shape.fontSize
  };
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
  return {
    x: minPointX(points) - extra,
    y: minPointY(points) - extra,
    width: maxPointX(points) - minPointX(points) + extra * 2 + 1,
    height: maxPointY(points) - minPointY(points) + extra * 2 + 1
  };
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

function shapeBounds(renderer, shape) {
  if (shape.kind === "text") {
    var measured = renderer.measureText(null, shape.text, textOptions(shape, maskColor()));
    return { x: shape.x, y: shape.y, width: measured.width, height: measured.height };
  }
  if (shape.kind === "line" || shape.kind === "polyline") {
    return pointBounds(shape.points, shape.outlineThickness);
  }
  if (shape.kind === "polygon") {
    return pointBounds(shape.points, 0);
  }
  if (shape.kind === "triangle") {
    return pointBounds(trianglePoints(shape), 0);
  }
  if (shape.kind === "pixel") {
    return { x: shape.x, y: shape.y, width: 1, height: 1 };
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}

function localPoints(points, bounds, padding) {
  var shifted = [];
  for (var index = 0; index < points.length; index = index + 1) {
    shifted.push({
      x: points[index].x - bounds.x + padding,
      y: points[index].y - bounds.y + padding
    });
  }
  return shifted;
}

function drawMaskShape(renderer, mask, shape, bounds, padding) {
  var color = maskColor();
  var x = shape.x - bounds.x + padding;
  var y = shape.y - bounds.y + padding;
  if (shape.kind === "rectangle" || shape.kind === "button") {
    if (shape.corners !== null) {
      renderer.fillRoundedRect(mask, x, y, shape.width, shape.height, shape.corners, color);
    } else {
      renderer.fillRect(mask, x, y, shape.width, shape.height, color);
    }
  } else if (shape.kind === "ellipse") {
    renderer.fillEllipse(mask, x, y, shape.width, shape.height, color);
  } else if (shape.kind === "semiellipse") {
    renderer.fillSemiellipse(mask, x, y, shape.width, shape.height, color, strokeOptions(shape));
  } else if (shape.kind === "capsule") {
    renderer.fillCapsule(mask, x, y, shape.width, shape.height, color);
  } else if (shape.kind === "triangle") {
    renderer.fillTriangle(mask, localPoints(trianglePoints(shape), bounds, padding), color);
  } else if (shape.kind === "polygon") {
    renderer.fillPolygon(mask, localPoints(shape.points, bounds, padding), color);
  } else if (shape.kind === "polyline") {
    renderer.drawPolyline(mask, localPoints(shape.points, bounds, padding), color, strokeOptions(shape));
  } else if (shape.kind === "line") {
    var line = localPoints(shape.points, bounds, padding);
    renderer.drawLine(mask, line[0].x, line[0].y, line[1].x, line[1].y, color, strokeOptions(shape));
  } else if (shape.kind === "pixel") {
    renderer.drawPixel(mask, padding, padding, color);
  } else if (shape.kind === "text") {
    renderer.text(mask, shape.text, x, y, textOptions(shape, color));
  } else if (shape.kind === "image") {
    renderer.fillRect(mask, x, y, shape.width, shape.height, color);
  }
  return mask;
}

function renderShadowBitmapOnce(renderer, shape, bounds, blur, spread, padding) {
  var maskWidth = round(bounds.width + padding * 2);
  var maskHeight = round(bounds.height + padding * 2);
  var mask = renderer.create(maskWidth, maskHeight, { background: maskBackground() });
  drawMaskShape(renderer, mask, shape, bounds, padding);
  return renderer.shadowMask(mask, blur, spread, shape.shadow.color);
}

function copyPoints(points) {
  var copied = [];
  for (var index = 0; index < points.length; index = index + 1) {
    copied.push({ x: points[index].x, y: points[index].y });
  }
  return copied;
}

function pointsMatch(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (var index = 0; index < left.length; index = index + 1) {
    if (left[index].x !== right[index].x || left[index].y !== right[index].y) {
      return false;
    }
  }
  return true;
}

function cachePoints(shape) {
  if (shape.kind === "triangle") {
    return trianglePoints(shape);
  }
  return shape.points;
}

function shadowCacheMatches(cache, shape, bounds, blur, spread, padding) {
  if (cache === null) {
    return false;
  }
  var style = shape.shadow;
  return cache.kind === shape.kind &&
    cache.boundsWidth === bounds.width &&
    cache.boundsHeight === bounds.height &&
    cache.width === shape.width &&
    cache.height === shape.height &&
    cache.cornerTopLeft === cornerValue(shape, "topLeft") &&
    cache.cornerTopRight === cornerValue(shape, "topRight") &&
    cache.cornerBottomRight === cornerValue(shape, "bottomRight") &&
    cache.cornerBottomLeft === cornerValue(shape, "bottomLeft") &&
    cache.outlineThickness === shape.outlineThickness &&
    cache.text === shape.text &&
    cache.fontFamily === shape.fontFamily &&
    cache.fontSize === shape.fontSize &&
    cache.blur === blur &&
    cache.spread === spread &&
    cache.padding === padding &&
    cache.offsetX === style.offsetX &&
    cache.offsetY === style.offsetY &&
    cache.colorRed === style.color.red &&
    cache.colorGreen === style.color.green &&
    cache.colorBlue === style.color.blue &&
    cache.colorAlpha === style.color.alpha &&
    pointsMatch(cache.points, cachePoints(shape));
}

function makeShadowCache(cacheImage, shape, bounds, blur, spread, padding) {
  var style = shape.shadow;
  return {
    kind: shape.kind,
    boundsWidth: bounds.width,
    boundsHeight: bounds.height,
    width: shape.width,
    height: shape.height,
    cornerTopLeft: cornerValue(shape, "topLeft"),
    cornerTopRight: cornerValue(shape, "topRight"),
    cornerBottomRight: cornerValue(shape, "bottomRight"),
    cornerBottomLeft: cornerValue(shape, "bottomLeft"),
    outlineThickness: shape.outlineThickness,
    text: shape.text,
    fontFamily: shape.fontFamily,
    fontSize: shape.fontSize,
    blur: blur,
    spread: spread,
    padding: padding,
    offsetX: style.offsetX,
    offsetY: style.offsetY,
    colorRed: style.color.red,
    colorGreen: style.color.green,
    colorBlue: style.color.blue,
    colorAlpha: style.color.alpha,
    points: copyPoints(cachePoints(shape)),
    image: cacheImage
  };
}

export function drawShapeShadow(renderer, canvas, shape) {
  if (shape.shadow === null) {
    return canvas;
  }
  if (renderer.skipShadowIds !== null && shape.id.length > 0 && renderer.skipShadowIds[shape.id] === true) {
    return canvas;
  }
  var style = shape.shadow;
  if (style.color.alpha <= 0) {
    return canvas;
  }
  var bounds = shapeBounds(renderer, shape);
  if (bounds.width <= 0 || bounds.height <= 0) {
    return canvas;
  }
  var blur = round(style.blurRadius);
  var spread = round(style.spreadRadius);
  var padding = spread + blur * 3 + 2;
  var cache = shape.shadowCache;
  var shadow = null;
  if (shadowCacheMatches(cache, shape, bounds, blur, spread, padding)) {
    shadow = cache.image;
  } else {
    shadow = renderShadowBitmapOnce(renderer, shape, bounds, blur, spread, padding);
    shape.shadowCache = makeShadowCache(shadow, shape, bounds, blur, spread, padding);
  }
  renderer.drawImageAlpha(canvas, shadow, round(bounds.x + style.offsetX - padding), round(bounds.y + style.offsetY - padding));
  return canvas;
}
