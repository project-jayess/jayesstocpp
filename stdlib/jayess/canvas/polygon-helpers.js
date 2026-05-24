function fail(message) {
  throw message;
}

function requirePoint(point) {
  if (point === null || point.x === null || point.y === null) {
    fail("jayess:canvas expected a point with x and y");
  }
  return point;
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

export function polygonBounds(points) {
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

export function pointInsidePolygon(x, y, points) {
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
