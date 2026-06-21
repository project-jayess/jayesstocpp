function nodeId(node) {
  if (node === null || node.attributes === null) {
    return null;
  }
  return node.attributes.id;
}

function findNodeById(node, id) {
  if (nodeId(node) === id) {
    return node;
  }
  if (node.children !== null) {
    for (var index = 0; index < node.children.length; index = index + 1) {
      var found = findNodeById(node.children[index], id);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function maxValue(left, right) {
  return left > right ? left : right;
}

function minValue(left, right) {
  return left < right ? left : right;
}

function clamp(value, maximum) {
  if (maximum <= 0 || value < 0) {
    return 0;
  }
  if (value > maximum) {
    return maximum;
  }
  return value;
}

function visibleScrollbar(axisOverflow, scrollSize, clientSize) {
  if (axisOverflow === "scroll") {
    return true;
  }
  return axisOverflow === "auto" && scrollSize > clientSize;
}

function rootScrollbarEdgeInset(node) {
  if (node.tagName === "html" || node.tagName === "body") {
    return 4;
  }
  return 0;
}

function scrollableOnAxis(node, axis) {
  if (node.layout === null) {
    return false;
  }
  if (axis === "x") {
    return visibleScrollbar(node.layout.overflowX, node.layout.scrollWidth, node.layout.clientWidth) && node.layout.scrollWidth > node.layout.clientWidth;
  }
  return visibleScrollbar(node.layout.overflowY, node.layout.scrollHeight, node.layout.clientHeight) && node.layout.scrollHeight > node.layout.clientHeight;
}

function scrollableForDelta(node, deltaX, deltaY) {
  if (node.layout === null) {
    return false;
  }
  var wantsX = deltaX !== 0;
  var wantsY = deltaY !== 0;
  if (wantsY && scrollableOnAxis(node, "y")) {
    return true;
  }
  if (wantsX && scrollableOnAxis(node, "x")) {
    return true;
  }
  return false;
}

function scrollbarThumb(trackStart, trackSize, scrollSize, clientSize, scrollOffset) {
  if (scrollSize <= clientSize || trackSize <= 0) {
    return {
      start: trackStart,
      size: trackSize
    };
  }
  var size = trackSize * clientSize / scrollSize;
  if (size < 8) {
    size = minValue(8, trackSize);
  }
  var range = trackSize - size;
  var scrollRange = scrollSize - clientSize;
  var start = trackStart;
  if (scrollRange > 0) {
    start = trackStart + range * scrollOffset / scrollRange;
  }
  return {
    start: start,
    size: size
  };
}

function contains(x, y, left, top, width, height) {
  return x >= left && y >= top && x < left + width && y < top + height;
}

function scrollbarHitForNode(node, x, y, offsetX, offsetY) {
  if (node.layout === null) {
    return null;
  }
  var layout = node.layout;
  var barSize = 12;
  var left = layout.x + offsetX;
  var top = layout.y + offsetY;
  var edgeInset = rootScrollbarEdgeInset(node);
  var showVertical = visibleScrollbar(layout.overflowY, layout.scrollHeight, layout.clientHeight);
  var showHorizontal = visibleScrollbar(layout.overflowX, layout.scrollWidth, layout.clientWidth);
  if (showVertical) {
    var trackHeight = layout.height - edgeInset - (showHorizontal ? barSize : 0);
    var trackX = left + layout.width - barSize - edgeInset;
    if (contains(x, y, trackX, top, barSize, trackHeight)) {
      var verticalThumb = scrollbarThumb(top, trackHeight, layout.scrollHeight, layout.clientHeight, layout.scrollTop);
      return {
        type: "htmlScrollbar",
        axis: "y",
        part: contains(x, y, trackX, verticalThumb.start, barSize, verticalThumb.size) ? "thumb" : "track",
        node: node,
        targetId: nodeId(node),
        trackStart: top,
        trackSize: trackHeight,
        thumbStart: verticalThumb.start,
        thumbSize: verticalThumb.size,
        scrollSize: layout.scrollHeight,
        clientSize: layout.clientHeight,
        scrollOffset: layout.scrollTop
      };
    }
  }
  if (showHorizontal) {
    var trackWidth = layout.width - edgeInset - (showVertical ? barSize : 0);
    var trackY = top + layout.height - barSize - edgeInset;
    if (contains(x, y, left, trackY, trackWidth, barSize)) {
      var horizontalThumb = scrollbarThumb(left, trackWidth, layout.scrollWidth, layout.clientWidth, layout.scrollLeft);
      return {
        type: "htmlScrollbar",
        axis: "x",
        part: contains(x, y, horizontalThumb.start, trackY, horizontalThumb.size, barSize) ? "thumb" : "track",
        node: node,
        targetId: nodeId(node),
        trackStart: left,
        trackSize: trackWidth,
        thumbStart: horizontalThumb.start,
        thumbSize: horizontalThumb.size,
        scrollSize: layout.scrollWidth,
        clientSize: layout.clientWidth,
        scrollOffset: layout.scrollLeft
      };
    }
  }
  return null;
}

function hitScrollbarNode(node, x, y, offsetX, offsetY) {
  var ownHit = scrollbarHitForNode(node, x, y, offsetX, offsetY);
  if (ownHit !== null) {
    return ownHit;
  }
  if (node.children !== null && node.layout !== null) {
    var childOffsetX = offsetX - node.layout.scrollLeft;
    var childOffsetY = offsetY - node.layout.scrollTop;
    for (var index = node.children.length - 1; index >= 0; index = index - 1) {
      var childHit = hitScrollbarNode(node.children[index], x, y, childOffsetX, childOffsetY);
      if (childHit !== null) {
        return childHit;
      }
    }
  }
  return null;
}

function contentContainsNode(node, x, y, offsetX, offsetY) {
  if (node.layout === null) {
    return false;
  }
  return contains(
    x,
    y,
    node.layout.contentX + offsetX,
    node.layout.contentY + offsetY,
    node.layout.clientWidth,
    node.layout.clientHeight
  );
}

function hitScrollTargetNode(node, x, y, deltaX, deltaY, offsetX, offsetY) {
  if (node.layout === null || !contains(x, y, node.layout.x + offsetX, node.layout.y + offsetY, node.layout.width, node.layout.height)) {
    return null;
  }
  if (node.children !== null && contentContainsNode(node, x, y, offsetX, offsetY)) {
    var childOffsetX = offsetX - node.layout.scrollLeft;
    var childOffsetY = offsetY - node.layout.scrollTop;
    for (var index = node.children.length - 1; index >= 0; index = index - 1) {
      var child = hitScrollTargetNode(node.children[index], x, y, deltaX, deltaY, childOffsetX, childOffsetY);
      if (child !== null) {
        return child;
      }
    }
  }
  if (scrollableForDelta(node, deltaX, deltaY)) {
    return node;
  }
  return null;
}

export function hitTestHtmlScrollbar(document, x, y) {
  for (var index = document.tree.children.length - 1; index >= 0; index = index - 1) {
    var hit = hitScrollbarNode(document.tree.children[index], x, y, 0, 0);
    if (hit !== null) {
      return hit;
    }
  }
  return null;
}

export function hitTestHtmlScrollTarget(document, x, y, deltaX, deltaY) {
  for (var index = document.tree.children.length - 1; index >= 0; index = index - 1) {
    var hit = hitScrollTargetNode(document.tree.children[index], x, y, deltaX, deltaY, 0, 0);
    if (hit !== null) {
      return hit;
    }
  }
  return null;
}

export function scrollHtmlNodeTo(node, left, top) {
  if (node === null) {
    return false;
  }
  var maxLeft = 0;
  var maxTop = 0;
  if (node.layout !== null) {
    maxLeft = maxValue(0, node.layout.scrollWidth - node.layout.clientWidth);
    maxTop = maxValue(0, node.layout.scrollHeight - node.layout.clientHeight);
  }
  node.scrollLeft = clamp(left, maxLeft);
  node.scrollTop = clamp(top, maxTop);
  if (node.layout !== null) {
    node.layout.scrollLeft = node.scrollLeft;
    node.layout.scrollTop = node.scrollTop;
  }
  return true;
}

export function scrollHtmlNodeBy(node, deltaLeft, deltaTop) {
  var left = node.scrollLeft === null ? 0 : node.scrollLeft;
  var top = node.scrollTop === null ? 0 : node.scrollTop;
  return scrollHtmlNodeTo(node, left + deltaLeft, top + deltaTop);
}

export function scrollHtmlTo(document, id, left, top) {
  var node = findNodeById(document.tree, id);
  if (node === null) {
    return false;
  }
  return scrollHtmlNodeTo(node, left, top);
}
