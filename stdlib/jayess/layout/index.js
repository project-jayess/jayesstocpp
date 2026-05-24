function fail(message) {
  throw message;
}

function requireRect(rectangle) {
  if (rectangle === null) {
    fail("jayess:layout expected a rectangle");
  }
  return rectangle;
}

export function rect(x, y, width, height) {
  if (width < 0 || height < 0) {
    fail("jayess:layout rectangle dimensions must be non-negative");
  }
  return { x: x, y: y, width: width, height: height };
}

export function contains(rectangle, x, y) {
  var area = requireRect(rectangle);
  return x >= area.x && y >= area.y && x < area.x + area.width && y < area.y + area.height;
}

export function intersect(a, b) {
  var left = a.x > b.x ? a.x : b.x;
  var top = a.y > b.y ? a.y : b.y;
  var rightA = a.x + a.width;
  var rightB = b.x + b.width;
  var bottomA = a.y + a.height;
  var bottomB = b.y + b.height;
  var right = rightA < rightB ? rightA : rightB;
  var bottom = bottomA < bottomB ? bottomA : bottomB;
  if (right <= left || bottom <= top) {
    return rect(left, top, 0, 0);
  }
  return rect(left, top, right - left, bottom - top);
}

export function inset(rectangle, amount) {
  var area = requireRect(rectangle);
  var width = area.width - amount * 2;
  var height = area.height - amount * 2;
  if (width < 0) {
    width = 0;
  }
  if (height < 0) {
    height = 0;
  }
  return rect(area.x + amount, area.y + amount, width, height);
}

export function row(area, count) {
  var bounds = requireRect(area);
  var items = [];
  var itemWidth = bounds.width / count;
  for (var index = 0; index < count; index = index + 1) {
    items.push(rect(bounds.x + itemWidth * index, bounds.y, itemWidth, bounds.height));
  }
  return items;
}

export function column(area, count) {
  var bounds = requireRect(area);
  var items = [];
  var itemHeight = bounds.height / count;
  for (var index = 0; index < count; index = index + 1) {
    items.push(rect(bounds.x, bounds.y + itemHeight * index, bounds.width, itemHeight));
  }
  return items;
}

export function grid(area, columns, rows) {
  var bounds = requireRect(area);
  var items = [];
  var itemWidth = bounds.width / columns;
  var itemHeight = bounds.height / rows;
  for (var rowIndex = 0; rowIndex < rows; rowIndex = rowIndex + 1) {
    for (var columnIndex = 0; columnIndex < columns; columnIndex = columnIndex + 1) {
      items.push(rect(bounds.x + itemWidth * columnIndex, bounds.y + itemHeight * rowIndex, itemWidth, itemHeight));
    }
  }
  return items;
}
